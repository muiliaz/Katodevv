/* eslint-disable react-hooks/exhaustive-deps */
import { Suspense, useRef, useMemo, useEffect } from 'react'
import './BlackHole.css'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  wrapEffect,
} from '@react-three/postprocessing'
import { Effect } from 'postprocessing'
import {
  Uniform, Vector2, Vector3,
  AdditiveBlending, DoubleSide, BackSide,
  BoxGeometry, EdgesGeometry,
} from 'three'

// ─── shared module-level state ───────────────────────────────────────────────
const _mouse        = new Vector2(0.5, 0.5)
const _vignetteInst = { current: null }

let _updateCard = null   // (i, x, y, opacity) → direct DOM update, no setState

// ─── HTML card data rendered after morph ─────────────────────────────────────
const CUBE_CARD_DATA = [
  { icon: '🌐', title: 'Web Development', desc: 'Modern, fast websites from landing pages to full apps.'     },
  { icon: '📱', title: 'Mobile Apps',     desc: 'Android & iOS with clean UX and smooth performance.'        },
  { icon: '⚙️', title: 'Automation',      desc: 'Workflow systems that save you hours every day.'             },
  { icon: '🤖', title: 'AI Bots',         desc: 'Smart bots for Telegram and WhatsApp — 24/7 support.'       },
]

// ═════════════════════════════════════════════════════════════════════════════
//  GRAVITATIONAL LENS  — bends star UV around the event horizon
// ═════════════════════════════════════════════════════════════════════════════
const LENS_FRAG = /* glsl */`
  uniform vec2  uCenter;
  uniform float uStrength;
  uniform float uRadius;
  uniform vec2  uMouse;

  void mainUv(inout vec2 uv) {
    vec2  d    = uv - uCenter;
    float dist = length(d);
    float infl = uRadius * 3.5;

    if (dist > 0.001 && dist < infl) {
      float bend = uStrength * uRadius * uRadius / max(dist * dist, 1e-5);
      bend *= smoothstep(infl, uRadius * 0.28, dist);
      uv -= normalize(d) * clamp(bend, 0.0, 0.34);
    }

    // Subtle mouse warp
    vec2  md = uv - uMouse;
    float md_len = length(md);
    if (md_len > 0.001 && md_len < 0.11) {
      uv += normalize(md) * 0.012 * (1.0 - md_len / 0.11);
    }
  }
`

class GravitationalLensImpl extends Effect {
  constructor() {
    super('GravitationalLensEffect', LENS_FRAG, {
      uniforms: new Map([
        ['uCenter',   new Uniform(new Vector2(0.5, 0.5))],
        ['uStrength', new Uniform(0.24)],
        ['uRadius',   new Uniform(0.13)],
        ['uMouse',    new Uniform(new Vector2(0.5, 0.5))],
      ]),
    })
  }
  update(_r, _i, _d) { this.uniforms.get('uMouse').value.copy(_mouse) }
}

const GravitationalLens = wrapEffect(GravitationalLensImpl)

// ═════════════════════════════════════════════════════════════════════════════
//  FILM GRAIN  — subtle cinematic noise applied to final image
// ═════════════════════════════════════════════════════════════════════════════
const GRAIN_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uIntensity;

  float rnd(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 seed = uv + vec2(fract(uTime * 0.047), fract(uTime * 0.073));
    float g = (rnd(seed) - 0.5) * uIntensity;
    outputColor = vec4(inputColor.rgb + g, inputColor.a);
  }
`

class FilmGrainImpl extends Effect {
  constructor() {
    super('FilmGrainEffect', GRAIN_FRAG, {
      uniforms: new Map([
        ['uTime',      new Uniform(0.0)],
        ['uIntensity', new Uniform(0.030)],
      ]),
    })
  }
  update(_r, _i, dt) { this.uniforms.get('uTime').value += dt }
}

const FilmGrain = wrapEffect(FilmGrainImpl)

// ═════════════════════════════════════════════════════════════════════════════
//  NEBULA BACKGROUND  — faint dark blue-grey wisps on the inner sky sphere
// ═════════════════════════════════════════════════════════════════════════════
const NEBULA_VERT = /* glsl */`
  varying vec3 vPos;
  void main() {
    vPos        = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const NEBULA_FRAG = /* glsl */`
  uniform float uTime;
  varying vec3 vPos;

  float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash2(i),            hash2(i+vec2(1,0)), f.x),
      mix(hash2(i+vec2(0,1)),  hash2(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise2(p);
      p  = p * 2.1 + vec2(5.3 * float(i), 1.7 * float(i));
      a *= 0.48;
    }
    return v;
  }

  void main() {
    vec3 n  = normalize(vPos);
    vec2 uv = vec2(atan(n.x, n.z) * 0.18, n.y * 0.55 + 0.5);

    float w1 = fbm(uv * 2.8 + uTime * 0.002);
    float w2 = fbm(uv * 6.0 - uTime * 0.0015 + vec2(4.2, 1.7));
    float w  = pow(w1, 2.2) * 0.65 + pow(w2, 2.8) * 0.35;

    // Dark blue-grey wisps — very low alpha so they're barely visible
    vec3 col = mix(vec3(0.00, 0.00, 0.008), vec3(0.025, 0.04, 0.10), w);
    gl_FragColor = vec4(col, w * 0.45);
  }
`

function NebulaBackground() {
  const mat      = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame(({ clock }) => {
    if (mat.current) mat.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh renderOrder={-100}>
      <sphereGeometry args={[80, 32, 32]} />
      <shaderMaterial
        ref={mat}
        vertexShader={NEBULA_VERT}
        fragmentShader={NEBULA_FRAG}
        uniforms={uniforms}
        side={BackSide}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  BLACK HOLE SPHERE  — sharp black core, thin white photon ring, silver glow
// ═════════════════════════════════════════════════════════════════════════════
const BH_VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv     = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const BH_FRAG = /* glsl */`
  uniform float uTime;
  uniform vec2  uMouse;
  varying vec2  vUv;
  varying vec3  vNormal;

  void main() {
    vec2 center = vec2(0.5);

    // Subtle UV warp near mouse
    vec2  md   = vUv - uMouse;
    float warp = smoothstep(0.45, 0.0, length(md)) * 0.025;
    vec2  uv   = vUv + normalize(md + 0.0001) * warp;

    float dist = distance(uv, center);

    // ── SHARP black event horizon ────────────────────────────────────────────
    float horizon = smoothstep(0.447, 0.458, dist);

    // ── PRIMARY photon ring (#e8eaff cool white, very thin) ──────────────────
    float ring = smoothstep(0.447, 0.454, dist)
               * (1.0 - smoothstep(0.454, 0.465, dist))
               * (0.92 + 0.08 * sin(uTime * 6.0 + dist * 90.0));

    // ── SECONDARY lensed ring (dimmer, tighter) ───────────────────────────────
    float ring2 = smoothstep(0.372, 0.380, dist)
                * (1.0 - smoothstep(0.380, 0.390, dist)) * 0.25;

    // ── Outer glow — steep falloff stays close to ring ────────────────────────
    float glow = pow(max(0.0, smoothstep(0.55, 0.456, dist)), 4.0) * 0.18;

    // Silver-white palette
    vec3 ringCol = vec3(0.90, 0.92, 1.00);   // #e8eaff cool white
    vec3 glowCol = vec3(0.58, 0.62, 0.75);   // soft silver-blue

    vec3 color = ringCol * (ring + ring2 * 0.55) + glowCol * glow;

    float rim = pow(1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 7.0);
    color += vec3(0.72, 0.76, 0.90) * rim * 0.14;

    float alpha = (1.0 - smoothstep(0.490, 0.505, dist))
                * mix(1.0, max(0.0, 1.0 - horizon * 0.98), 1.0 - ring);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`

// ═════════════════════════════════════════════════════════════════════════════
//  ACCRETION DISK  — flat ring at 15° from edge-on, FBM turbulence, Doppler
// ═════════════════════════════════════════════════════════════════════════════
const DISK_VERT = /* glsl */`
  varying float vRadius;
  varying float vAngle;

  void main() {
    float r = length(position.xy);
    vRadius = clamp((r - 1.7) / 2.3, 0.0, 1.0);
    vAngle  = atan(position.y, position.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const DISK_FRAG = /* glsl */`
  uniform float uTime;
  varying float vRadius;
  varying float vAngle;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noiseV(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),           hash(i+vec2(1,0)), f.x),
      mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
    for (int i = 0; i < 5; i++) {
      v += a * noiseV(p);
      p  = rot * p * 2.1 + vec2(1.7, 9.2);
      a *= 0.48;
    }
    return v;
  }

  void main() {
    vec3 innerColor = vec3(1.00, 1.00, 1.00);
    vec3 midColor   = vec3(0.76, 0.82, 0.96);
    vec3 outerColor = vec3(0.35, 0.42, 0.65);

    vec3 col = mix(innerColor, midColor,   smoothstep(0.0, 0.38, vRadius));
    col       = mix(col,       outerColor, smoothstep(0.38, 1.0,  vRadius));

    vec2 noiseCoord = vec2(vAngle * 1.6 + uTime * 0.06, vRadius * 3.5);
    float t1 = fbm(noiseCoord);
    float t2 = fbm(noiseCoord * 2.2 + vec2(4.8, 1.1));
    float turb = t1 * 0.68 + t2 * 0.32;

    col *= 0.65 + turb * 0.70;

    float doppler = 1.0 + 0.55 * cos(vAngle);
    doppler = clamp(doppler, 0.22, 1.75);
    col *= doppler;

    float alpha = smoothstep(0.0,  0.05, vRadius)
                * (1.0 - smoothstep(0.85, 1.0, vRadius))
                * clamp(0.35 + turb * 0.65, 0.0, 1.0)
                * doppler * 0.72;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`

// ═════════════════════════════════════════════════════════════════════════════
//  FLOATING GLASS CUBES
//
//  Phase 0   (scrollProgress 0.00 → 0.15): invisible, behind scene
//  Phase 1   (scrollProgress 0.15 → 0.75): fly from startPos → endPos,
//            easeInOutCubic, per-cube stagger of i*0.05, free rotation
//  Phase 2   (scrollProgress 0.75 → 1.00): cubes at endPos, rotation slows,
//            float amplitude shrinks from 0.15 → 0.04
//
//  Float is always active (never stops), additive on top of lerped base pos.
// ═════════════════════════════════════════════════════════════════════════════

// Shared geometry — created once at module level, never re-created
const _cubeGeo  = new BoxGeometry(1.2, 1.2, 1.2)
const _edgesGeo = new EdgesGeometry(_cubeGeo)

function _easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Per-cube config — deterministic, no Math.random at render time
const GLASS_CUBES = [
  { floatOffset: 0.0, floatSpeed: 0.40, rotSpeedX: 0.008, rotSpeedY: 0.012, rotSpeedZ: 0.006,
    startPos: [-7,  6, -4],  endPos: [-2.00, -0.5, 0] },
  { floatOffset: 1.6, floatSpeed: 0.35, rotSpeedX: 0.010, rotSpeedY: 0.007, rotSpeedZ: 0.011,
    startPos: [-2,  8, -6],  endPos: [-0.67, -0.5, 0] },
  { floatOffset: 3.2, floatSpeed: 0.55, rotSpeedX: 0.006, rotSpeedY: 0.010, rotSpeedZ: 0.009,
    startPos: [ 3,  7, -5],  endPos: [ 0.67, -0.5, 0] },
  { floatOffset: 4.8, floatSpeed: 0.45, rotSpeedX: 0.009, rotSpeedY: 0.005, rotSpeedZ: 0.012,
    startPos: [ 8,  5, -3],  endPos: [ 2.00, -0.5, 0] },
]

function FloatingCubes() {
  const groups    = useRef([])
  const glassMats = useRef([])
  const edgeMats  = useRef([])
  const { camera } = useThree()
  const projVec    = useMemo(() => new Vector3(), [])

  useFrame(({ clock }) => {
    const t    = clock.elapsedTime
    const rawP = Math.min(1, Math.max(0, window.__scrollProgress || 0))

    GLASS_CUBES.forEach((cfg, i) => {
      const group    = groups.current[i]
      const glassMat = glassMats.current[i]
      const edgeMat  = edgeMats.current[i]
      if (!group) return

      // ── Per-cube staggered progress ──────────────────────────────────────
      const p = Math.min(1, Math.max(0, rawP - i * 0.05))

      // Fly phase: 0.15 → 0.75
      const flyT = Math.min(1, Math.max(0, (p - 0.15) / 0.60))
      const flyE = _easeInOutCubic(flyT)

      // Landing phase: 0.75 → 1.0
      const landT = Math.min(1, Math.max(0, (p - 0.75) / 0.25))
      const landE = landT * landT * (3 - 2 * landT)   // smoothstep

      // Morph phase: 0.85 → 1.0 (stagger 0.01 per cube), fully reversible
      const morphRaw = Math.min(1, Math.max(0, rawP - i * 0.01))
      const morphT   = Math.min(1, Math.max(0, (morphRaw - 0.85) / 0.14))
      const morphE   = morphT * morphT * (3 - 2 * morphT)   // smoothstep

      // ── Opacity: 0 before 0.15, fade in 0.15→0.25 ───────────────────────
      const opT     = Math.min(1, Math.max(0, (p - 0.15) / 0.10))
      const opacity = opT * 0.35
      if (glassMat) glassMat.opacity = opacity
      if (edgeMat)  edgeMat.opacity  = Math.min(0.20, opacity)

      // ── Float: always active, amplitude lerps 0.15 → 0.04 on landing ─────
      const floatAmp = 0.15 + (0.04 - 0.15) * landE
      const floatY   = Math.sin(t * cfg.floatSpeed       + cfg.floatOffset) * floatAmp
      const floatX   = Math.cos(t * cfg.floatSpeed * 0.6 + cfg.floatOffset) * floatAmp * 0.3

      // ── Base position: lerp startPos → endPos via easing ─────────────────
      group.position.x = cfg.startPos[0] + (cfg.endPos[0] - cfg.startPos[0]) * flyE + floatX
      group.position.y = cfg.startPos[1] + (cfg.endPos[1] - cfg.startPos[1]) * flyE + floatY
      group.position.z = cfg.startPos[2] + (cfg.endPos[2] - cfg.startPos[2]) * flyE

      // ── Rotation: slows on landing, stops on morph ───────────────────────
      const rotFactor = (1 - landE * 0.95) * (1 - morphE)
      group.rotation.x = t * cfg.rotSpeedX * rotFactor
      group.rotation.y = t * cfg.rotSpeedY * rotFactor
      group.rotation.z = t * cfg.rotSpeedZ * rotFactor

      // ── Morph scale: scroll-driven lerp — reverses when scrolling back ────
      group.scale.x = 1.0 + (1.1  - 1.0) * morphE
      group.scale.y = 1.0 + (1.3  - 1.0) * morphE
      group.scale.z = 1.0 + (0.05 - 1.0) * morphE

      // ── Card overlay: project world pos → screen %, update DOM directly ──
      projVec.copy(group.position)
      projVec.project(camera)
      const sx = ( projVec.x *  0.5 + 0.5) * 100
      const sy = (-projVec.y *  0.5 + 0.5) * 100
      const cardOpacity = Math.max(0, Math.min(1, (morphE - 0.75) / 0.25))
      if (_updateCard) _updateCard(i, sx, sy, cardOpacity)
    })
  })

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0,  6,  4]} intensity={3}   color="#ffffff" />
      <pointLight position={[-5,-2,  2]} intensity={1.5} color="#aaaaff" />

      {GLASS_CUBES.map((cfg, i) => (
        <group
          key={i}
          ref={el => { groups.current[i] = el }}
          position={cfg.startPos}
        >
          <mesh renderOrder={10}>
            <boxGeometry args={[1.2, 1.2, 1.2]} />
            <meshPhysicalMaterial
              ref={el => { glassMats.current[i] = el }}
              color="#c8c8d8"
              transmission={0.85}
              roughness={0.08}
              metalness={0.15}
              thickness={0.6}
              transparent
              opacity={0}
              side={DoubleSide}
              clearcoat={1.0}
              clearcoatRoughness={0.0}
            />
          </mesh>
          <lineSegments geometry={_edgesGeo} renderOrder={10}>
            <lineBasicMaterial
              ref={el => { edgeMats.current[i] = el }}
              color="#ffffff"
              transparent
              opacity={0}
            />
          </lineSegments>
        </group>
      ))}
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  SCROLL EFFECTS — per-frame camera zoom + postprocessing driven by scroll
//  Reads from module-level _vignetteInst — no Three.js objects
//  are ever passed as React props, avoiding circular-ref serialisation errors.
// ═════════════════════════════════════════════════════════════════════════════
function ScrollEffects() {
  const { camera } = useThree()

  useFrame(() => {
    const raw   = window.__scrollProgress || 0
    const p     = Math.min(1, Math.max(0, raw))
    const eased = p * p * (3 - 2 * p)

    // Camera zoom: z 10 → 4.2, slight y drop
    const targetZ = 10  - eased * 5.8
    const targetY = 0.5 - eased * 0.4
    camera.position.z += (targetZ - camera.position.z) * 0.07
    camera.position.y += (targetY - camera.position.y) * 0.07

    // Vignette darkness: 0.90 → 1.0 at full scroll
    if (_vignetteInst.current) {
      try { _vignetteInst.current.darkness = 0.90 + eased * 0.10 } catch (_e) {}
    }
  })

  return null
}

// ═════════════════════════════════════════════════════════════════════════════
//  REACT OBJECTS
// ═════════════════════════════════════════════════════════════════════════════

function BlackHoleCore({ mouseRef }) {
  const mesh     = useRef()
  const mat      = useRef()
  const uniforms = useMemo(() => ({
    uTime:  { value: 0 },
    uMouse: { value: new Vector2(0.5, 0.5) },
  }), [])

  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = clock.elapsedTime
      mat.current.uniforms.uMouse.value.copy(mouseRef.current)
    }
    if (mesh.current) {
      mesh.current.position.x += ((mouseRef.current.x - 0.5) * 0.35 - mesh.current.position.x) * 0.04
      mesh.current.position.y += ((mouseRef.current.y - 0.5) * 0.22 - mesh.current.position.y) * 0.04
    }
  })

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1.55, 128, 128]} />
      <shaderMaterial
        ref={mat}
        vertexShader={BH_VERT}
        fragmentShader={BH_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

function AccretionDisk({ mouseRef }) {
  const mesh     = useRef()
  const mat      = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  const BASE_X   = -(Math.PI / 2 - Math.PI * 15 / 180)

  useFrame(({ clock }) => {
    if (mesh.current) {
      mesh.current.rotation.y = clock.elapsedTime * 0.07
      const tx = BASE_X + (mouseRef.current.y - 0.5) * 0.06
      mesh.current.rotation.x += (tx - mesh.current.rotation.x) * 0.025
    }
    if (mat.current) mat.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh ref={mesh} rotation={[BASE_X, 0, 0]}>
      <ringGeometry args={[1.7, 4.0, 200, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={DISK_VERT}
        fragmentShader={DISK_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
      />
    </mesh>
  )
}

function MouseTracker() {
  useEffect(() => {
    const fn = (e) => _mouse.set(
      e.clientX  / window.innerWidth,
      1.0 - e.clientY / window.innerHeight
    )
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [])
  return null
}

function Scene({ mouseRef }) {
  return (
    <>
      <color attach="background" args={['#00000a']} />

      <Stars
        radius={100}
        depth={60}
        count={6000}
        factor={5.5}
        saturation={0.08}
        fade
        speed={0.15}
      />

      <NebulaBackground />
      <BlackHoleCore mouseRef={mouseRef} />
      <AccretionDisk mouseRef={mouseRef} />
      <FloatingCubes />
      <MouseTracker />

      <ScrollEffects />

      <EffectComposer multisampling={0}>
        <GravitationalLens />
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.82}
          mipmapBlur
        />
        <Vignette
          ref={(el) => { _vignetteInst.current = el }}
          eskil={false}
          offset={0.14}
          darkness={0.90}
        />
        <FilmGrain />
      </EffectComposer>
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  EXPORT — wrapper div (.bh-canvas-wrapper) lets ScrollJourney fade the canvas
// ═════════════════════════════════════════════════════════════════════════════
export default function BlackHole() {
  const mouseRef  = useRef(new Vector2(0.5, 0.5))
  const cardRefs  = useRef([])

  // Wire up direct-DOM updater — no setState, no re-renders every frame
  useEffect(() => {
    _updateCard = (i, x, y, opacity) => {
      const el = cardRefs.current[i]
      if (!el) return
      el.style.left    = `${x}%`
      el.style.top     = `${y}%`
      el.style.opacity = opacity
    }
    return () => { _updateCard = null }
  }, [])

  return (
    <div className="bh-canvas-wrapper">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0.5, 10], fov: 40 }}
          gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
          dpr={[1, 1.5]}
        >
          <Scene mouseRef={mouseRef} />
        </Canvas>
      </Suspense>

      {/* Card overlays — wrapped in bh-cards-layer so they can be faded independently from the canvas */}
      <div className="bh-cards-layer">
        {CUBE_CARD_DATA.map((data, i) => (
          <div
            key={i}
            ref={el => { cardRefs.current[i] = el }}
            className="cube-card-overlay"
            style={{ opacity: 0 }}
          >
            <div className="cube-card-icon">{data.icon}</div>
            <div className="cube-card-title">{data.title}</div>
            <div className="cube-card-desc">{data.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
