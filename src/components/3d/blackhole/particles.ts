import * as THREE from "three";
import { PARTICLE_VERT, PARTICLE_FRAG } from "./shaders";

/**
 * N-body-ish accretion particles. Central mass with GM = r_s / 2 = 0.5
 * (Newtonian limit of the Schwarzschild geometry used by the raymarcher).
 * Orbits decay through a small viscous drag term (stronger inside the ISCO),
 * particles that cross the horizon are consumed and respawned at the outer
 * edge — a continuous accretion flow, not a looping animation.
 *
 * 12% spawn sub-circular (plunging) orbits that dive through the ISCO.
 */

const GM = 0.5;
const HORIZON = 1.06;
const RESPAWN_R_MIN = 9.5;
const RESPAWN_R_MAX = 14.0;
const EJECT_R = 22.0;

export class ParticleSystem {
  readonly points: THREE.Points;
  readonly count: number;
  consumed = 0;

  private pos: Float32Array;
  private vel: Float32Array;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;

  constructor(count: number, tint: THREE.Color, brightness: number) {
    this.count = count;
    this.pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);

    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      sizes[i] = 0.5 + Math.random() * 0.9;
      this.spawn(i, true);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage),
    );
    this.geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    this.geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      uniforms: {
        uCamPos: { value: new THREE.Vector3() },
        uPixelScale: { value: 40 },
        uTint: { value: tint },
        uBrightness: { value: brightness },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 1;
  }

  private spawn(i: number, initial: boolean) {
    const i3 = i * 3;
    const r = initial
      ? 3.3 + Math.pow(Math.random(), 0.8) * 10.5
      : RESPAWN_R_MIN + Math.random() * (RESPAWN_R_MAX - RESPAWN_R_MIN);
    const az = Math.random() * Math.PI * 2;
    const x = Math.cos(az) * r;
    const z = Math.sin(az) * r;
    const y = (Math.random() - 0.5) * 0.6 * (r / 14.0);
    this.pos[i3] = x;
    this.pos[i3 + 1] = y;
    this.pos[i3 + 2] = z;

    const vc = Math.sqrt(GM / r);
    // tangential direction matching the shader disk rotation (azimuth decreases)
    const plunge = Math.random() < 0.12 ? 0.55 : 0.97 + Math.random() * 0.08;
    const speed = vc * plunge;
    this.vel[i3] = Math.sin(az) * speed;
    this.vel[i3 + 1] = (Math.random() - 0.5) * vc * 0.12;
    this.vel[i3 + 2] = -Math.cos(az) * speed;
  }

  /** Advance the simulation by dt (simulation seconds, already speed-scaled). */
  step(dt: number) {
    const p = this.pos;
    const v = this.vel;
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const x = p[i3];
      const y = p[i3 + 1];
      const z = p[i3 + 2];
      const r2 = x * x + y * y + z * z;
      const r = Math.sqrt(r2);

      if (r < HORIZON) {
        this.consumed++;
        this.spawn(i, false);
        continue;
      }
      if (r > EJECT_R) {
        this.spawn(i, false);
        continue;
      }

      const inv = -GM / (r2 * r);
      // viscous drag: faint everywhere (accretion), strong inside the ISCO
      const drag = (r < 3.2 ? (0.55 * (3.2 - r)) / 3.2 : 0.0) + 0.012;
      const damp = Math.max(0.0, 1.0 - drag * dt);

      v[i3] = (v[i3] + x * inv * dt) * damp;
      v[i3 + 1] = (v[i3 + 1] + y * inv * dt) * damp;
      v[i3 + 2] = (v[i3 + 2] + z * inv * dt) * damp;

      p[i3] = x + v[i3] * dt;
      p[i3 + 1] = y + v[i3 + 1] * dt;
      p[i3 + 2] = z + v[i3 + 2] * dt;
    }
    (this.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  }

  setCamPos(v: THREE.Vector3) {
    (this.material.uniforms.uCamPos.value as THREE.Vector3).copy(v);
  }

  setPixelScale(s: number) {
    this.material.uniforms.uPixelScale.value = s;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
