import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import {
  FULLSCREEN_VERT,
  RAYMARCH_FRAG,
  POST_VERT,
  POST_FRAG,
  GRAIN_VERT,
  GRAIN_FRAG,
} from "./shaders";
import { ParticleSystem } from "./particles";

export interface EngineStats {
  fps: number;
  observerR: number;
  quality: number;
  consumed: number;
  particles: number;
}

export interface BlackHoleEngineOptions {
  reducedMotion?: boolean;
  onStats?: (s: EngineStats) => void;
  onReady?: () => void;
  onInteract?: () => void;
  /** Element to size the canvas against instead of the window — for a
   * non-fullscreen (e.g. Hero background) instance. */
  container?: HTMLElement;
  /** Drag-to-orbit / scroll-to-zoom. Off for decorative/background use so the
   * canvas doesn't steal page scroll or pointer drags. Default true. */
  interactive?: boolean;
  /** Multiplies the final render color — dims the render for a background
   * accent role. Default 1 (matches upstream brightness). */
  brightness?: number;
  /** Multiplies the particle sprites' color independently of `brightness` —
   * lets the accretion particles sit a bit dimmer than the disk/lensing
   * render. Default: same as `brightness`. */
  particleBrightness?: number;
  /** Tints the final render color (hex). Default "#ffffff" (no tint). */
  tint?: string;
}

const SIM_SPEED = 6; // simulation seconds per real second (matches shader disk omega)
const FOV = 50;

// Default (scroll progress 0) and end (scroll progress 1) camera pose for
// setScrollProgress() — eases from the upstream equatorial framing to a
// near-overhead view while zooming out, matching the initial cur/tgt below.
const PHI_HORIZONTAL = 1.36;
const PHI_TOP = 0.32; // not 0: a perfectly overhead view degenerates camera.lookAt's up vector
const RADIUS_NEAR = 13.5;
const RADIUS_FAR = 24;

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

export class BlackHoleEngine {
  static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const c = document.createElement("canvas");
      return !!c.getContext("webgl2");
    } catch {
      return false;
    }
  }

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private postScene = new THREE.Scene();
  private postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private composer: EffectComposer;
  private grainPass: ShaderPass;
  private rtLow: THREE.WebGLRenderTarget;
  private raymarchMat: THREE.ShaderMaterial;
  private quad: THREE.Mesh;
  private particles: ParticleSystem;

  private canvas: HTMLCanvasElement;
  private opts: BlackHoleEngineOptions;
  private interactive: boolean;
  private raf = 0;
  private disposed = false;
  private last = performance.now();
  private simTime = 0;
  private accum = 0;
  private fpsEma = 60;
  private lastStats = 0;
  private lastQuality = 0;
  private readySent = false;
  private composerFailed = false;
  private scale: number;
  private steps: number;
  private count: number;
  private elapsed = 0;
  private resizeObserver: ResizeObserver | null = null;

  // camera state (spherical around origin)
  private cur = { theta: 0.7, phi: PHI_HORIZONTAL, radius: RADIUS_NEAR };
  private tgt = { theta: 0.7, phi: PHI_HORIZONTAL, radius: RADIUS_NEAR };
  private spinVel = 0;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private pointer = { x: 0, y: 0 };
  private pointerSmooth = { x: 0, y: 0 };
  private autoSpin: number;

  private basis = new THREE.Matrix3();

  constructor(canvas: HTMLCanvasElement, opts: BlackHoleEngineOptions = {}) {
    this.canvas = canvas;
    this.opts = opts;
    this.interactive = opts.interactive ?? true;
    this.autoSpin = opts.reducedMotion ? 0 : this.interactive ? 0.05 : 0.018;

    const coarse =
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);
    this.count = coarse ? 3200 : 7000;
    this.steps = coarse ? 110 : 190;
    this.scale = coarse ? 0.5 : 0.6;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setClearColor(0x000000, 1);

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);

    const tint = new THREE.Color(opts.tint ?? "#ffffff");
    const brightness = opts.brightness ?? 1;
    const particleBrightness = opts.particleBrightness ?? brightness;

    // --- raymarch scene: fullscreen quad + particles ---
    this.raymarchMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: RAYMARCH_FRAG,
      uniforms: {
        uCamPos: { value: new THREE.Vector3() },
        uCamBasis: { value: this.basis },
        uTanFov: { value: Math.tan(THREE.MathUtils.degToRad(FOV) / 2) },
        uAspect: { value: 1 },
        uTime: { value: 0 },
        uSteps: { value: this.steps },
        uTint: { value: tint },
        uBrightness: { value: brightness },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.raymarchMat);
    this.quad.frustumCulled = false;
    this.quad.renderOrder = 0;
    this.scene.add(this.quad);

    this.particles = new ParticleSystem(this.count, tint, particleBrightness);
    this.scene.add(this.particles.points);

    // --- low-res raymarch target ---
    this.rtLow = new THREE.WebGLRenderTarget(2, 2, {
      type: THREE.HalfFloatType,
      samples: 4, // MSAA on the raymarch target: kills stair-stepping on the
                  // shadow edge, worst at the bottom where the front band
                  // meets the ring at a grazing angle
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });

    // --- post scene: upscale + CA + vignette (rendered by the composer) ---
    const postMat = new THREE.ShaderMaterial({
      vertexShader: POST_VERT,
      fragmentShader: POST_FRAG,
      uniforms: {
        uTex: { value: this.rtLow.texture },
        uCA: { value: opts.reducedMotion ? 0.002 : 0.0032 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const postGeo = new THREE.BufferGeometry();
    postGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
        3,
      ),
    );
    const postTri = new THREE.Mesh(postGeo, postMat);
    postTri.frustumCulled = false;
    this.postScene.add(postTri);

    // --- composer: post -> bloom -> grain -> output ---
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.postScene, this.postCam));
    this.composer.addPass(
      new UnrealBloomPass(new THREE.Vector2(2, 2), 0.72, 0.7, 0.6),
    );
    this.grainPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uAmount: { value: opts.reducedMotion ? 0.008 : 0.016 },
      },
      vertexShader: GRAIN_VERT,
      fragmentShader: GRAIN_FRAG,
    });
    this.composer.addPass(this.grainPass);
    this.composer.addPass(new OutputPass());

    // --- listeners ---
    if (opts.container) {
      this.resizeObserver = new ResizeObserver(this.onResize);
      this.resizeObserver.observe(opts.container);
    } else {
      window.addEventListener("resize", this.onResize);
    }
    if (this.interactive) {
      window.addEventListener("pointermove", this.onPointerMove);
      window.addEventListener("pointerup", this.onPointerUp);
      canvas.addEventListener("pointerdown", this.onPointerDown);
      canvas.addEventListener("wheel", this.onWheel, { passive: false });
    }

    this.onResize();

    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__bh = this;
    }
  }

  // --- sizing & adaptive quality ---

  private size(): { w: number; h: number } {
    if (this.opts.container) {
      const rect = this.opts.container.getBoundingClientRect();
      return { w: Math.max(1, Math.round(rect.width)), h: Math.max(1, Math.round(rect.height)) };
    }
    return { w: Math.max(1, window.innerWidth), h: Math.max(1, window.innerHeight) };
  }

  private onResize = () => {
    if (this.disposed) return;
    const { w, h } = this.size();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.applyQuality();
  };

  private applyQuality() {
    const dpr = this.renderer.getPixelRatio();
    const { w: cw, h: ch } = this.size();
    const w = Math.max(2, Math.floor(cw * dpr * this.scale));
    const h = Math.max(2, Math.floor(ch * dpr * this.scale));
    this.rtLow.setSize(w, h);
    this.raymarchMat.uniforms.uAspect.value = this.camera.aspect;
    this.particles.setPixelScale(h * 0.045);
  }

  // --- input ---

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.spinVel = 0;
    this.opts.onInteract?.();
  };

  private onPointerMove = (e: PointerEvent) => {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (!this.dragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.tgt.theta -= dx * 0.0045;
    this.tgt.phi = clamp(this.tgt.phi - dy * 0.0045, 0.5, 1.5);
    this.spinVel = -dx * 0.09;
  };

  private onPointerUp = () => {
    this.dragging = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.tgt.radius = clamp(this.tgt.radius * Math.exp(e.deltaY * 0.0011), 6.8, 27);
    this.opts.onInteract?.();
  };

  /**
   * Drives the camera from page scroll instead of drag/wheel input: eases
   * from the default equatorial framing (t=0) toward a near-overhead view
   * while zooming out (t=1), reusing the existing tgt/cur damping in loop()
   * for the actual easing — so callers can push this every scroll frame
   * without needing their own smoothing. Independent of `interactive`.
   */
  setScrollProgress(t: number) {
    const p = clamp(t, 0, 1);
    this.tgt.phi = PHI_HORIZONTAL + (PHI_TOP - PHI_HORIZONTAL) * p;
    this.tgt.radius = RADIUS_NEAR + (RADIUS_FAR - RADIUS_NEAR) * p;
  }

  // --- frame loop ---

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);

    const now = performance.now();
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (document.hidden) return;
    dt = clamp(dt, 0.0001, 0.05);
    this.elapsed += dt;

    // fps EMA + adaptive resolution
    this.fpsEma += (1 / dt - this.fpsEma) * 0.05;
    if (now - this.lastQuality > 700) {
      this.lastQuality = now;
      if (this.fpsEma > 56 && this.scale < 0.85) {
        this.scale = Math.min(0.85, this.scale + 0.04);
        this.applyQuality();
      } else if (this.fpsEma < 36 && this.scale > 0.5) {
        this.scale = Math.max(0.5, this.scale - 0.05);
        this.applyQuality();
      }
    }

    // particle physics with fixed-ish substeps
    this.accum = Math.min(this.accum + dt * SIM_SPEED, 0.6);
    let n = 0;
    while (this.accum > 0.0001 && n < 4) {
      const s = Math.min(this.accum, 0.12);
      this.particles.step(s);
      this.simTime += s;
      this.accum -= s;
      n++;
    }
    if (n === 4) this.accum = 0;

    // camera
    if (!this.dragging) {
      this.tgt.theta += this.autoSpin * dt + this.spinVel * dt;
      this.spinVel *= Math.pow(0.05, dt);
    } else {
      this.spinVel = 0;
    }
    const k = 1 - Math.pow(0.002, dt);
    this.cur.theta += (this.tgt.theta - this.cur.theta) * k;
    this.cur.phi += (this.tgt.phi - this.cur.phi) * k;
    this.cur.radius += (this.tgt.radius - this.cur.radius) * k;
    const kp = this.opts.reducedMotion || !this.interactive ? 0 : 1 - Math.pow(0.05, dt);
    this.pointerSmooth.x += (this.pointer.x - this.pointerSmooth.x) * kp;
    this.pointerSmooth.y += (this.pointer.y - this.pointerSmooth.y) * kp;

    this.camera.position.setFromSphericalCoords(
      this.cur.radius,
      clamp(this.cur.phi + this.pointerSmooth.y * 0.05, 0.2, 1.53),
      this.cur.theta + this.pointerSmooth.x * 0.07,
    );
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();

    const e = this.camera.matrixWorld.elements;
    // columns: right, up, forward(-z) — row-major args to Matrix3.set
    this.basis.set(
      e[0], e[4], -e[8],
      e[1], e[5], -e[9],
      e[2], e[6], -e[10],
    );

    (this.raymarchMat.uniforms.uCamPos.value as THREE.Vector3).copy(this.camera.position);
    this.raymarchMat.uniforms.uTime.value = this.simTime;
    this.particles.setCamPos(this.camera.position);
    this.grainPass.uniforms.uTime.value = this.elapsed;

    // low-res raymarch + particles, then post chain at display resolution.
    // If the post pipeline is unsupported on the current GPU (some SwiftShader
    // / half-float combos throw), degrade to a direct postScene render so the
    // scene still shows and stats keep flowing.
    try {
      this.renderer.setRenderTarget(this.rtLow);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
      if (this.composerFailed) {
        this.renderer.render(this.postScene, this.postCam);
      } else {
        this.composer.render();
      }
    } catch (err) {
      if (!this.composerFailed) {
        this.composerFailed = true;
        console.error("[blackhole] post pipeline failed, using direct render", err);
      }
      try {
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.postScene, this.postCam);
      } catch {
        /* give up on this frame */
      }
    }

    if (!this.readySent) {
      this.readySent = true;
      this.opts.onReady?.();
    }

    if (now - this.lastStats > 500) {
      this.lastStats = now;
      this.opts.onStats?.({
        fps: this.fpsEma,
        observerR: this.cur.radius,
        quality: this.scale,
        consumed: this.particles.consumed,
        particles: this.count,
      });
    }
  };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.particles.dispose();
    this.quad.geometry.dispose();
    this.raymarchMat.dispose();
    this.rtLow.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
