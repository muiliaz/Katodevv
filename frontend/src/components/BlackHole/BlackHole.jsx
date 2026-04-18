/* eslint-disable react-hooks/exhaustive-deps */
import { Suspense, useRef, useMemo, useEffect } from 'react'
import './BlackHole.css'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import {
  EffectComposer,
  Vignette,
  ChromaticAberration,
  Bloom,
  wrapEffect,
} from '@react-three/postprocessing'
import { Effect } from 'postprocessing'
import {
  Uniform, Vector2, Vector3,
  DoubleSide, BackSide,
  BoxGeometry, EdgesGeometry, PlaneGeometry,
} from 'three'

const _mouse        = new Vector2(0.5, 0.5)
const _vignetteInst = { current: null }
let _updateCard = null

const CUBE_CARD_DATA = [
  { icon: '🌐', title: 'Web Development', desc: 'Modern, fast websites from landing pages to full apps.'  },
  { icon: '📱', title: 'Mobile Apps',     desc: 'Android & iOS with clean UX and smooth performance.'     },
  { icon: '⚙️', title: 'Automation',      desc: 'Workflow systems that save you hours every day.'          },
  { icon: '🤖', title: 'AI Bots',         desc: 'Smart bots for Telegram and WhatsApp — 24/7 support.'    },
]

// ─── Film Grain ───────────────────────────────────────────────────────────────
const GRAIN_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uIntensity;
  float rnd(vec2 co){return fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453);}
  void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){
    vec2 seed=uv+vec2(fract(uTime*0.047),fract(uTime*0.073));
    float g=(rnd(seed)-0.5)*uIntensity;
    outputColor=vec4(inputColor.rgb+g,inputColor.a);
  }
`
class FilmGrainImpl extends Effect {
  constructor(){
    super('FilmGrainEffect',GRAIN_FRAG,{
      uniforms:new Map([['uTime',new Uniform(0.0)],['uIntensity',new Uniform(0.02)]])
    })
  }
  update(_r,_i,dt){this.uniforms.get('uTime').value+=dt}
}
const FilmGrain = wrapEffect(FilmGrainImpl)

// ─── Nebula Background ───────────────────────────────────────────────────────
const NEBULA_VERT = /* glsl */`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const NEBULA_FRAG = /* glsl */`
  uniform float uTime; varying vec3 vPos;
  float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*n2(p);p=p*2.1+vec2(5.3*float(i),1.7*float(i));a*=0.48;}return v;}
  void main(){
    vec3 n=normalize(vPos);
    vec2 uv=vec2(atan(n.x,n.z)*0.18,n.y*0.55+0.5);
    float w=pow(fbm(uv*2.8+uTime*0.002),2.2)*0.65+pow(fbm(uv*6.0-uTime*0.0015+vec2(4.2,1.7)),2.8)*0.35;
    vec3 col=mix(vec3(0.0,0.0,0.008),vec3(0.02,0.03,0.08),w);
    gl_FragColor=vec4(col,w*0.4);
  }
`
function NebulaBackground(){
  const mat = useRef()
  const uniforms = useMemo(()=>({uTime:{value:0}}),[])
  useFrame(({clock})=>{if(mat.current)mat.current.uniforms.uTime.value=clock.elapsedTime})
  return(
    <mesh renderOrder={-100}>
      <sphereGeometry args={[80,32,32]}/>
      <shaderMaterial ref={mat} vertexShader={NEBULA_VERT} fragmentShader={NEBULA_FRAG}
        uniforms={uniforms} side={BackSide} transparent depthWrite={false} depthTest={false}/>
    </mesh>
  )
}

// ─── Black Hole Shader (Interstellar-accurate) ───────────────────────────────
const BH_VERT = /* glsl */`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`

const BH_FRAG = /* glsl */`
precision highp float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec3  uCamPos;
uniform vec3  uCamTarget;
uniform float uCamFov;

varying vec2 vUv;

#define PI      3.14159265359
#define TWO_PI  6.28318530718

// Schwarzschild radius and key radii
#define RS      1.0
#define PHOTON_SPHERE (1.5 * RS)
#define ISCO    (3.0 * RS)

// Disk parameters — Interstellar style
#define DISK_IN   (ISCO * 0.9)
#define DISK_OUT  10.0
#define DISK_HALF_THICKNESS 0.05

// Raymarching
#define MAX_STEPS 350
#define MAX_DIST  80.0

// ─── Noise for disk turbulence ───
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(
    mix(hash(i),          hash(i+vec2(1,0)), f.x),
    mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)), f.x),
    f.y
  );
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0; i<5; i++){
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

// ─── Disk color — cold white-blue palette matching the Interstellar reference ───
vec4 sampleDisk(vec3 p, float r){
  float t = clamp((r - DISK_IN) / (DISK_OUT - DISK_IN), 0.0, 1.0);

  // Color palette from the reference image:
  // Inner: pure blazing white, Mid: cool white-blue, Outer: steel grey with subtle warm tint at very edge
  vec3 hot     = vec3(1.0, 1.0, 1.0);       // pure white (innermost)
  vec3 bright  = vec3(0.95, 0.97, 1.0);     // slightly cool white
  vec3 mid     = vec3(0.75, 0.82, 0.95);    // soft blue-white
  vec3 steel   = vec3(0.45, 0.50, 0.60);    // steel blue-grey
  vec3 outer   = vec3(0.18, 0.15, 0.13);    // dark with very subtle warm brown at edges

  vec3 col;
  if(t < 0.1)       col = mix(hot, bright, t / 0.1);
  else if(t < 0.3)  col = mix(bright, mid, (t - 0.1) / 0.2);
  else if(t < 0.6)  col = mix(mid, steel, (t - 0.3) / 0.3);
  else              col = mix(steel, outer, (t - 0.6) / 0.4);

  float ang = atan(p.z, p.x);

  // ─── ORBITAL ROTATION — gas physically orbits the black hole ───
  // Kepler velocity: faster closer to BH (v ∝ 1/√r)
  float orbitalSpeed = 0.12 / sqrt(max(r, DISK_IN));
  float rotatedAng = ang + uTime * orbitalSpeed;

  // ─── Doppler beaming — strong asymmetry ───
  // Approaching side brighter, receding dimmer
  float doppler = 0.5 + 0.5 * cos(rotatedAng + PI * 0.25);
  
  // Doppler color shift — approaching side shifts slightly whiter
  col = mix(col, col * vec3(1.0, 1.0, 1.05), doppler * 0.3);
  col *= (0.5 + doppler * 0.9);

  // ─── TURBULENT GAS PHYSICS — swirling, alive ───
  // Layer 1: large-scale density waves (slowly rotating)
  float swirl1 = fbm(vec2(
    rotatedAng * 1.5 + sin(r * 0.8 + uTime * 0.04) * 0.5,
    r * 1.8 - uTime * 0.025
  ));
  
  // Layer 2: fine turbulence (chaotic, fast)
  float swirl2 = fbm(vec2(
    rotatedAng * 4.0 - uTime * 0.06 + cos(r * 2.0) * 0.3,
    r * 3.0 + uTime * 0.035
  ));
  
  // Layer 3: radial infall streaks — matter spiraling inward
  float infall = fbm(vec2(
    rotatedAng * 2.5 + r * 3.0 - uTime * 0.08,
    r * 0.8 + sin(rotatedAng * 2.0 + uTime * 0.03) * 0.4
  ));

  // Combine: large structures + fine detail + infall
  float gasDetail = swirl1 * 0.45 + swirl2 * 0.3 + infall * 0.25;
  float gasDensity = 0.55 + gasDetail * 0.45;
  
  // ─── SPIRAL ARMS — density waves in the disk ───
  float spiralArm1 = sin(rotatedAng * 2.0 - r * 2.0 + uTime * 0.02) * 0.5 + 0.5;
  float spiralArm2 = sin(rotatedAng * 3.0 + r * 1.5 - uTime * 0.035) * 0.5 + 0.5;
  float spiralDensity = 0.75 + 0.25 * (spiralArm1 * 0.6 + spiralArm2 * 0.4);

  col *= gasDensity * spiralDensity;

  // ─── PULSATION — breathing effect, very subtle ───
  float pulse = 1.0 + 0.04 * sin(uTime * 0.3 + r * 1.2);
  col *= pulse;

  // ─── HOT SPOTS — random bright clumps of gas ───
  float hotSpot = pow(fbm(vec2(rotatedAng * 5.0 + uTime * 0.015, r * 4.0)), 3.0);
  col += vec3(0.3, 0.32, 0.35) * hotSpot * 2.0 * (1.0 - t);

  // Brightness falloff — intense inner glow
  float brightness = 3.0 / (r * r * 0.08 + 0.12);
  brightness *= smoothstep(DISK_OUT, DISK_OUT - 4.5, r);   // soft outer fade
  brightness *= smoothstep(DISK_IN - 0.5, DISK_IN + 0.3, r); // soft inner edge

  // Vertical density — razor thin disk
  float vertDensity = exp(-abs(p.y) * abs(p.y) / (DISK_HALF_THICKNESS * DISK_HALF_THICKNESS));

  float alpha = clamp(brightness * vertDensity * 1.3, 0.0, 1.0);

  return vec4(col * brightness, alpha);
}

void main(){
  vec2 uv = vUv * 2.0 - 1.0;
  float aspect = uResolution.x / uResolution.y;
  uv.x *= aspect;

  // Camera setup
  vec3 fwd    = normalize(uCamTarget - uCamPos);
  vec3 worldUp = abs(fwd.y) < 0.92 ? vec3(0.0,1.0,0.0) : vec3(0.0,0.0,1.0);
  vec3 right  = normalize(cross(fwd, worldUp));
  vec3 up     = cross(right, fwd);
  float fov   = tan(uCamFov * 0.5 * PI / 180.0);

  vec3 rd  = normalize(fwd + uv.x * right * fov + uv.y * up * fov);
  vec3 pos = uCamPos;

  // ─── Geodesic raymarching (Schwarzschild metric) ───
  vec3  accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float prevY = pos.y;
  float minR = 999.0;
  bool  hitHorizon = false;

  // Track multiple disk crossings for lensing effect
  int diskCrossings = 0;

  for(int i = 0; i < MAX_STEPS; i++){
    float r = length(pos);
    minR = min(minR, r);

    // Event horizon — absorbed
    if(r < RS * 0.5){
      hitHorizon = true;
      break;
    }

    // Escaped
    if(r > MAX_DIST) break;

    // Adaptive step size — much finer near BH for accurate lensing
    float stepSize;
    if(r < RS * 1.5)       stepSize = 0.008;
    else if(r < RS * 2.5)  stepSize = 0.02;
    else if(r < RS * 4.0)  stepSize = 0.04;
    else if(r < RS * 8.0)  stepSize = 0.1;
    else                    stepSize = 0.25;

    // ─── Gravitational ray deflection ───
    // Schwarzschild geodesic deflection
    float r2 = r * r;
    float deflectionStrength = 1.5 * RS * RS / (r2 * r2 + 0.0001);

    vec3 toCenter = -pos / r;
    rd = normalize(rd + toCenter * deflectionStrength * stepSize * r);

    // Step
    vec3 newPos = pos + rd * stepSize;

    // ─── Disk intersection — detect plane crossing at y=0 ───
    float newY = newPos.y;
    if(prevY * newY < 0.0 && diskCrossings < 4){
      // Precise intersection point
      float tHit = -pos.y / (rd.y + sign(rd.y) * 1e-8);
      if(tHit > 0.0){
        vec3 hitP = pos + rd * tHit;
        float hitR = length(vec2(hitP.x, hitP.z));

        if(hitR > DISK_IN * 0.7 && hitR < DISK_OUT * 1.2){
          vec4 diskSample = sampleDisk(hitP, hitR);

          // Gravitational redshift
          float redshift = sqrt(max(0.0, 1.0 - RS / max(hitR, RS * 1.01)));
          diskSample.rgb *= redshift;

          // Lensed light — rays that crossed the disk multiple times are brighter
          float lensBoost = 1.0 + float(diskCrossings) * 0.6;
          diskSample.rgb *= lensBoost;

          // Back-side light (lensed over/under) is the key Interstellar feature
          // Light from behind the BH that bends around it
          if(diskCrossings > 0){
            diskSample.rgb *= 1.3; // lensed light appears brighter
            diskSample.a = min(1.0, diskSample.a * 1.4);
          }

          float a = diskSample.a * (1.0 - accumAlpha);
          accumColor += diskSample.rgb * a;
          accumAlpha += a;
          diskCrossings++;
        }
      }
    }
    prevY = newPos.y;
    pos = newPos;

    if(accumAlpha > 0.97) break;
  }

  // ─── Photon ring — bright thin ring at the photon sphere ───
  float photonRingDist = abs(minR - PHOTON_SPHERE);
  float photonRing = exp(-photonRingDist * photonRingDist / 0.0008);
  
  // Photon ring color — cold pure white (matching reference)
  vec3 ringColor = vec3(1.0, 1.0, 1.0) * photonRing * 5.5;
  
  // Second, thinner ring slightly inside — subtle blue tint
  float innerRingDist = abs(minR - PHOTON_SPHERE * 0.92);
  float innerRing = exp(-innerRingDist * innerRingDist / 0.0003);
  ringColor += vec3(0.9, 0.93, 1.0) * innerRing * 3.5;

  accumColor += ringColor * (1.0 - accumAlpha * 0.3);
  accumAlpha = max(accumAlpha, max(photonRing, innerRing) * 0.95);

  // ─── Einstein ring glow — cold blue-white glow around the shadow ───
  float einsteinGlow = exp(-(minR - RS * 1.8) * (minR - RS * 1.8) / 0.8);
  accumColor += vec3(0.3, 0.33, 0.4) * einsteinGlow * 0.18 * (1.0 - accumAlpha);

  // ─── Shadow (gravitational darkening) ───
  float shadowEdge = smoothstep(RS * 2.5, RS * 0.8, minR);
  accumColor *= 1.0 - shadowEdge * 0.9;

  // Event horizon: pure black
  if(hitHorizon){
    accumColor = vec3(0.0);
    accumAlpha = 1.0;
  }

  // Tone mapping (ACES-like filmic for cinematic look)
  accumColor *= 1.2; // exposure boost
  vec3 x = accumColor;
  accumColor = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  accumColor = pow(accumColor, vec3(0.95)); // gamma

  gl_FragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));
}
`

const _quad = new PlaneGeometry(2,2)

function RaymarchedBlackHole({mouseRef}){
  const mat = useRef()
  const {size} = useThree()
  const uniforms = useMemo(()=>({
    uTime:       {value:0},
    uResolution: {value:new Vector2(size.width,size.height)},
    uMouse:      {value:new Vector2(0.5,0.5)},
    uCamPos:     {value:new Vector3(0,2.5,9)},
    uCamTarget:  {value:new Vector3(0,0,0)},
    uCamFov:     {value:38.0},
  }),[])

  useFrame(({clock,camera})=>{
    if(!mat.current) return
    const u = mat.current.uniforms
    u.uTime.value      = clock.elapsedTime
    u.uResolution.value.set(size.width, size.height)
    u.uMouse.value.copy(mouseRef.current)
    u.uCamPos.value.copy(camera.position)
    u.uCamTarget.value.set(0,0,0)
    u.uCamFov.value    = camera.fov || 38
  })

  return(
    <mesh renderOrder={5} frustumCulled={false} geometry={_quad}>
      <shaderMaterial ref={mat} vertexShader={BH_VERT} fragmentShader={BH_FRAG}
        uniforms={uniforms} transparent depthWrite={false} depthTest={false}/>
    </mesh>
  )
}

// ─── Glass Cubes ──────────────────────────────────────────────────────────────
const _cubeGeo  = new BoxGeometry(1.2,1.2,1.2)
const _edgesGeo = new EdgesGeometry(_cubeGeo)
function _ease(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
const GLASS_CUBES=[
  {floatOffset:0.0,floatSpeed:0.40,rotSpeedX:0.008,rotSpeedY:0.012,rotSpeedZ:0.006,startPos:[-7,6,-4], endPos:[-2.00,-0.5,0]},
  {floatOffset:1.6,floatSpeed:0.35,rotSpeedX:0.010,rotSpeedY:0.007,rotSpeedZ:0.011,startPos:[-2,8,-6], endPos:[-0.67,-0.5,0]},
  {floatOffset:3.2,floatSpeed:0.55,rotSpeedX:0.006,rotSpeedY:0.010,rotSpeedZ:0.009,startPos:[ 3,7,-5], endPos:[ 0.67,-0.5,0]},
  {floatOffset:4.8,floatSpeed:0.45,rotSpeedX:0.009,rotSpeedY:0.005,rotSpeedZ:0.012,startPos:[ 8,5,-3], endPos:[ 2.00,-0.5,0]},
]

function FloatingCubes(){
  const groups    = useRef([])
  const glassMats = useRef([])
  const edgeMats  = useRef([])
  const {camera}  = useThree()
  const pv        = useMemo(()=>new Vector3(),[])

  useFrame(({clock})=>{
    const t    = clock.elapsedTime
    const rawP = Math.min(1,Math.max(0,window.__scrollProgress||0))
    GLASS_CUBES.forEach((cfg,i)=>{
      const g=groups.current[i],gm=glassMats.current[i],em=edgeMats.current[i]
      if(!g) return
      const p     = Math.min(1,Math.max(0,rawP-i*0.05))
      const flyE  = _ease(Math.min(1,Math.max(0,(p-0.15)/0.60)))
      const landE = (t2=>t2*t2*(3-2*t2))(Math.min(1,Math.max(0,(p-0.75)/0.25)))
      const morphRaw = Math.min(1,Math.max(0,rawP-i*0.01))
      const morphE   = (m=>m*m*(3-2*m))(Math.min(1,Math.max(0,(morphRaw-0.85)/0.14)))
      const opacity  = Math.min(1,Math.max(0,(p-0.15)/0.10))*0.35
      if(gm) gm.opacity = opacity
      if(em) em.opacity = Math.min(0.20,opacity)
      const fa = 0.15+(0.04-0.15)*landE
      const fy = Math.sin(t*cfg.floatSpeed+cfg.floatOffset)*fa
      const fx = Math.cos(t*cfg.floatSpeed*0.6+cfg.floatOffset)*fa*0.3
      g.position.x = cfg.startPos[0]+(cfg.endPos[0]-cfg.startPos[0])*flyE+fx
      g.position.y = cfg.startPos[1]+(cfg.endPos[1]-cfg.startPos[1])*flyE+fy
      g.position.z = cfg.startPos[2]+(cfg.endPos[2]-cfg.startPos[2])*flyE
      const rf = (1-landE*0.95)*(1-morphE)
      g.rotation.x = t*cfg.rotSpeedX*rf
      g.rotation.y = t*cfg.rotSpeedY*rf
      g.rotation.z = t*cfg.rotSpeedZ*rf
      g.scale.set(1+(1.1-1)*morphE,1+(1.3-1)*morphE,1+(0.05-1)*morphE)
      pv.copy(g.position).project(camera)
      if(_updateCard) _updateCard(i,(pv.x*0.5+0.5)*100,(-pv.y*0.5+0.5)*100,Math.max(0,Math.min(1,(morphE-0.75)/0.25)))
    })
  })

  return(
    <>
      <ambientLight intensity={0.15}/>
      <pointLight position={[0,6,4]}  intensity={3}   color="#ffffff"/>
      <pointLight position={[-5,-2,2]} intensity={1.5} color="#aaaaff"/>
      {GLASS_CUBES.map((cfg,i)=>(
        <group key={i} ref={el=>{groups.current[i]=el}} position={cfg.startPos}>
          <mesh renderOrder={10}>
            <boxGeometry args={[1.2,1.2,1.2]}/>
            <meshPhysicalMaterial ref={el=>{glassMats.current[i]=el}}
              color="#c8c8d8" transmission={0.85} roughness={0.08} metalness={0.15}
              thickness={0.6} transparent opacity={0} side={DoubleSide}
              clearcoat={1.0} clearcoatRoughness={0.0}/>
          </mesh>
          <lineSegments geometry={_edgesGeo} renderOrder={10}>
            <lineBasicMaterial ref={el=>{edgeMats.current[i]=el}} color="#ffffff" transparent opacity={0}/>
          </lineSegments>
        </group>
      ))}
    </>
  )
}

function ScrollEffects(){
  const {camera} = useThree()
  const mob = typeof window!=='undefined' && window.innerWidth<768

  useFrame(({clock})=>{
    const t = clock.elapsedTime
    const p = Math.min(1,Math.max(0,window.__scrollProgress||0))
    // Static until 8% scroll, then smoothstep over the remainder
    const pShifted = Math.max(0, (p - 0.08) / (1 - 0.08))
    const e = pShifted*pShifted*(3-2*pShifted)

    // Camera: lower angle to see the disk edge-on (Interstellar look)
    const sz = mob ? 14 : 12
    const ez = mob ? 10 : 8
    const sy = mob ? 3.5 : 3.0
    const ey = mob ? 2.5 : 2.0

    camera.position.z += (sz - e*(sz-ez) - camera.position.z) * 0.07
    camera.position.y += (sy - e*(sy-ey) - camera.position.y) * 0.07

    // Subtle breathing
    camera.position.x += Math.sin(t*0.15) * 0.0015
    camera.position.y += Math.sin(t*0.22) * 0.0008

    camera.lookAt(Math.sin(t*0.15)*0.2, 0, 0)

    if(_vignetteInst.current){
      try{ _vignetteInst.current.darkness = 0.90+e*0.10 }catch(_){}
    }
  })
  return null
}

function MouseTracker(){
  useEffect(()=>{
    const fn = (e)=>_mouse.set(e.clientX/window.innerWidth, 1-e.clientY/window.innerHeight)
    window.addEventListener('mousemove',fn)
    return ()=>window.removeEventListener('mousemove',fn)
  },[])
  return null
}

function Scene({mouseRef}){
  return(
    <>
      <color attach="background" args={['#000005']}/>
      <Stars radius={100} depth={60} count={8000} factor={5.5} saturation={0.12} fade speed={0.12}/>
      <NebulaBackground/>
      <RaymarchedBlackHole mouseRef={mouseRef}/>
      <FloatingCubes/>
      <MouseTracker/>
      <ScrollEffects/>
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.8} luminanceThreshold={0.2} luminanceSmoothing={0.95} mipmapBlur/>
        <ChromaticAberration offset={new Vector2(0.0003,0.0003)}/>
        <Vignette eskil={false} offset={0.12} darkness={0.92}/>
        <FilmGrain/>
      </EffectComposer>
    </>
  )
}

export default function BlackHole(){
  const mouseRef      = useRef(new Vector2(0.5,0.5))
  const cardRefs      = useRef([])
  const scrollHintRef = useRef(null)
  const mob = typeof window!=='undefined' && window.innerWidth<768

  useEffect(()=>{
    let raf
    const check = ()=>{
      if(scrollHintRef.current)
        scrollHintRef.current.classList.toggle('bh-scroll-hint--hidden',(window.__scrollProgress||0)>0.05)
      raf = requestAnimationFrame(check)
    }
    raf = requestAnimationFrame(check)
    return ()=>cancelAnimationFrame(raf)
  },[])

  useEffect(()=>{
    _updateCard = (i,x,y,o)=>{
      const el = cardRefs.current[i]
      if(!el) return
      el.style.left    = `${x}%`
      el.style.top     = `${y}%`
      el.style.opacity = o
    }
    return ()=>{ _updateCard = null }
  },[])

  return(
    <div className="bh-canvas-wrapper">
      <Suspense fallback={null}>
        <Canvas
          camera={{position:[0, 3.0, 12], fov:38}}
          gl={{antialias:true, powerPreference:'high-performance', preserveDrawingBuffer:true}}
          dpr={[1, mob?1:1.5]}
        >
          <Scene mouseRef={mouseRef}/>
        </Canvas>
      </Suspense>
      <div className="bh-scroll-hint" ref={scrollHintRef}>↓</div>
      <div className="bh-cards-layer">
        {CUBE_CARD_DATA.map((data,i)=>(
          <div key={i} ref={el=>{cardRefs.current[i]=el}} className="cube-card-overlay" style={{opacity:0}}>
            <div className="cube-card-icon">{data.icon}</div>
            <div className="cube-card-title">{data.title}</div>
            <div className="cube-card-desc">{data.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
