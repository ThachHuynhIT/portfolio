/**
 * GLSL for the black hole scene (ported from the black-hole-404 reference
 * project, https://D:/WorkSpace/black-hole-404 — same raymarched Schwarzschild
 * geodesic renderer used for both the 404 page and the Hero background accent).
 *
 * Physics notes (units: Schwarzschild radius r_s = 1, c = 1):
 * - Photon paths are null geodesics of the Schwarzschild metric, integrated
 *   as a = -1.5 * h^2 * p / r^5, where h = |p x v| is the conserved specific
 *   angular momentum of the ray. Photon sphere (1.5 r_s) and the photon ring
 *   emerge from this term — they are not painted on.
 * - Accretion disk: thin disk crossing the equatorial plane, temperature
 *   profile T ~ r^(-3/4), relativistic Doppler beaming of Keplerian orbital
 *   motion and gravitational redshift sqrt(1 - r_s/r) applied to the apparent
 *   temperature before a blackbody colour ramp.
 * - Particles (see particles.ts) integrate Newtonian gravity a = -GM r / r^3
 *   with GM = r_s / 2, and the shader-side disk pattern rotates with the same
 *   angular velocity omega(r) = SIM_SPEED * sqrt(GM / r^3) so gas and
 *   particles co-rotate coherently.
 *
 * uTint/uBrightness are additions on top of the source shader (not present
 * upstream) so the same renderer can be recolored/dimmed for the Hero's
 * background-accent use without touching the physics.
 */

/** Shared blackbody-ish colour ramp. t = 1 ~ warm white, t < 1 red/orange, t > 1 blue-white. */
export const BLACKBODY_GLSL = /* glsl */ `
vec3 blackbody(float t) {
  t = clamp(t, 0.05, 2.6);
  float r = 1.0;
  float g = clamp(0.42 * log(t) + 0.78, 0.0, 1.0);
  if (t > 1.0) g *= 1.0 - 0.16 * (t - 1.0);
  float b = clamp(0.72 * log(t) + 0.72, 0.0, 1.0);
  return vec3(r, g, b);
}
`;

/** Clip-space fullscreen quad (PlaneGeometry 2x2). Ignores the camera entirely. */
export const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const RAYMARCH_FRAG = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform vec3 uCamPos;
uniform mat3 uCamBasis;
uniform float uTanFov;
uniform float uAspect;
uniform float uTime;   // simulation time (seconds, speed-scaled)
uniform int uSteps;
uniform vec3 uTint;
uniform float uBrightness;

const float RS       = 1.0;
const float DISK_IN  = 3.0;   // ISCO
const float DISK_OUT = 14.0;
const float R_ESCAPE = 42.0;
const int   MAX_STEPS = 260;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.55;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = p * 2.02 + 17.13;
    a *= 0.5;
  }
  return s;
}

vec2 rot2(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c) * v;
}

${BLACKBODY_GLSL}

vec3 stars(vec3 d) {
  vec3 col = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    float scale = (layer == 0) ? 26.0 : 54.0;
    vec3 p = d * scale;
    vec3 id = floor(p);
    vec3 rnd = vec3(hash13(id + 3.1), hash13(id + 57.7), hash13(id + 113.3));
    vec3 sp = id + 0.25 + 0.5 * rnd;
    float dist = length(p - sp);
    float mag = pow(hash13(id + 211.7), 9.0);
    float star = exp(-dist * dist * ((layer == 0) ? 10.0 : 20.0)) * mag
               * ((layer == 0) ? 1.15 : 0.5);
    float tint = hash13(id + 7.7);
    col += star * mix(vec3(1.0, 0.84, 0.64), vec3(0.68, 0.78, 1.0), tint);
  }
  // faint galactic dust band
  float band = exp(-abs(dot(d, normalize(vec3(0.32, 1.0, 0.18)))) * 4.5);
  float neb = fbm(d.xy * 3.0 + d.z * 2.0);
  col += band * neb * vec3(0.034, 0.045, 0.078);
  col += vec3(0.007, 0.008, 0.012) * neb;
  return col;
}

vec3 diskContribution(vec3 hit, vec3 v, out float alpha) {
  alpha = 0.0;
  float r = length(hit.xz);
  if (r < DISK_IN || r > DISK_OUT) return vec3(0.0);

  // thin-disk temperature profile, normalized to 1 at the inner edge
  float tProfile = pow(DISK_IN / r, 0.75);

  // differential rotation — same omega(r) the particle sim uses
  float omega = 4.243 * pow(r, -1.5);
  float n1 = fbm(rot2(hit.xz, omega * uTime) * 1.35);
  float n2 = fbm(rot2(hit.xz, omega * 1.35 * uTime) * 3.4 + 11.0);
  float density = 0.38 + 0.62 * pow(clamp(n1 * 0.72 + n2 * 0.42, 0.0, 1.0), 1.6);
  density *= smoothstep(DISK_IN - 0.25, DISK_IN + 0.9, r)
           * (1.0 - smoothstep(DISK_OUT * 0.55, DISK_OUT, r));

  // relativistic shifts
  float beta = min(sqrt(RS / (2.0 * max(r - RS, 0.35))), 0.72); // Keplerian v/c
  vec3 tangent = normalize(vec3(hit.z, 0.0, -hit.x));
  vec3 toObs = -normalize(v);
  float gamma = 1.0 / sqrt(max(1.0 - beta * beta, 0.02));
  float doppler = 1.0 / (gamma * (1.0 - beta * dot(tangent, toObs)));
  float gGrav = sqrt(clamp(1.0 - RS / r, 0.02, 1.0));
  float gCam = sqrt(clamp(1.0 - RS / length(uCamPos), 0.3, 1.0));
  float shift = clamp(doppler * gGrav * gCam, 0.25, 2.6);

  float tApp = clamp(tProfile * shift, 0.04, 3.2);
  vec3 emit = blackbody(tApp);
  float bright = pow(tProfile, 1.7) * pow(shift, 1.8) * density;

  alpha = clamp(density * 0.85, 0.0, 1.0);
  return emit * bright * 2.4;
}

void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec3 rd = normalize(uCamBasis * vec3(ndc.x * uAspect * uTanFov, ndc.y * uTanFov, 1.0));

  vec3 p = uCamPos;
  vec3 v = rd;
  vec3 col = vec3(0.0);
  float trans = 1.0;
  bool captured = false;
  bool escaped = false;

  vec3 h = cross(p, v);
  float h2 = dot(h, h);

  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= uSteps) break;
    float r2 = dot(p, p);
    float r = sqrt(r2);

    if (r < RS) { captured = true; break; }
    if (r > R_ESCAPE && dot(p, v) > 0.0) { escaped = true; break; }

    float dt = clamp(r * 0.16, 0.03, 0.85);
    if (r < 4.5) dt *= 0.45;

    // Schwarzschild null geodesic bending
    vec3 acc = -1.5 * h2 * p / (r2 * r2 * r);
    v += acc * dt;
    v = normalize(v);
    vec3 pPrev = p;
    p += v * dt;

    // accretion disk plane crossing (y = 0), sampled analytically
    if (pPrev.y * p.y < 0.0) {
      float t = pPrev.y / (pPrev.y - p.y);
      vec3 hit = mix(pPrev, p, t);
      float a;
      vec3 c = diskContribution(hit, v, a);
      col += c * trans;
      trans *= (1.0 - a * 0.75);
      if (trans < 0.02) break;
    }
  }

  if (escaped) col += stars(normalize(v)) * trans;
  // captured or budget-exhausted rays stay black: the shadow is real

  gl_FragColor = vec4(col * uTint * uBrightness, 1.0);
}
`;

/** Particle vertex shader — world-space positions, horizon occlusion, thermal colouring. */
export const PARTICLE_VERT = /* glsl */ `
attribute float aSeed;
attribute float aSize;

uniform vec3 uCamPos;
uniform float uPixelScale;

varying vec3 vColor;
varying float vFade;

${BLACKBODY_GLSL}

void main() {
  vec3 P = position;
  float r = length(P);

  // occlusion by the shadow DISC: a particle is hidden when the straight
  // sightline to it passes through the shadow's apparent disc — behind the
  // hole its light is captured by the photon sphere; in front of it, the
  // analytic band in the raymarcher already carries that emission, and sparse
  // sprites there read as dirt on the black core. Test the particle's
  // perpendicular distance from the camera->center axis (its projected
  // distance from the shadow centre), NOT the impact parameter of its own
  // sightline: near-side gas at r ~ 3-6 projects INSIDE the disc while its
  // own sightline misses the hole completely.
  vec3 toP = P - uCamPos;
  float L = length(toP);
  float r0 = length(uCamPos);
  vec3 axis = -uCamPos / max(r0, 1e-4);
  float tca = dot(toP, axis);
  float dAxis = length(toP - axis * tca);
  // apparent shadow radius: b_crit/sqrt(1 - rs/r0) at the observer, as a tangent
  float tanShadow = 2.6 / (sqrt(max(1.0 - 1.0 / r0, 0.05)) * r0);
  float inDisc = 1.0 - smoothstep(tanShadow * 0.72, tanShadow * 1.0, dAxis / max(tca, 0.6));
  float fade = 1.0 - inDisc;

  float temp = clamp(0.9 * pow(3.0 / max(r, 1.3), 0.75), 0.0, 1.5);
  float bright = mix(1.7, 0.45, clamp((r - 1.0) / 13.0, 0.0, 1.0));

  vec4 mv = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(-mv.z, 0.4);
  gl_PointSize = clamp(aSize * uPixelScale / dist, 1.0, 4.5);

  vColor = blackbody(temp) * bright;
  vFade = fade * (0.35 + 0.65 * aSeed);
}
`;

export const PARTICLE_FRAG = /* glsl */ `
precision highp float;

varying vec3 vColor;
varying float vFade;

uniform vec3 uTint;
uniform float uBrightness;

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float a = exp(-dot(d, d) * 14.0) * vFade;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * uTint * uBrightness * a, 1.0);
}
`;

/** Post scene fullscreen triangle: uv derived from position (no uv attribute needed). */
export const POST_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** Post scene: upscale the low-res raymarch target + subtle chromatic aberration + vignette. */
export const POST_FRAG = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform sampler2D uTex;
uniform float uCA;

void main() {
  vec2 c = vUv - 0.5;
  float r2 = dot(c, c);
  vec2 off = c * (uCA * r2);
  vec3 col;
  col.r = texture2D(uTex, vUv + off).r;
  col.g = texture2D(uTex, vUv).g;
  col.b = texture2D(uTex, vUv - off).b;
  float vig = 1.0 - smoothstep(0.18, 0.62, r2) * 0.42;
  gl_FragColor = vec4(col * vig, 1.0);
}
`;

/** Final pass over the composer buffer: animated film grain, stronger in shadows. */
export const GRAIN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const GRAIN_FRAG = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uAmount;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  float lum = clamp(dot(c.rgb, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
  float n = hash12(gl_FragCoord.xy + vec2(fract(uTime * 0.731) * 913.0, fract(uTime * 1.163) * 517.0));
  // gate grain to non-black pixels: the shadow core and the dark lane between
  // the photon ring and the band must stay clean, grain there reads as
  // orange "fireflies" inside the horizon
  float gate = smoothstep(0.015, 0.07, lum);
  float grain = (n - 0.5) * uAmount * (1.0 - 0.65 * lum) * gate;
  gl_FragColor = vec4(max(c.rgb + grain, 0.0), 1.0);
}
`;
