import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'

/**
 * Lightweight fixed starfield rendered behind all page content.
 * Used as a permanent background once the BlackHole canvas fades out.
 */
export default function StarField() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <Canvas camera={{ position: [0, 0, 1], fov: 60 }} gl={{ antialias: false }}>
        <Stars
          radius={120}
          depth={60}
          count={4000}
          factor={4}
          saturation={0}
          fade
          speed={0.3}
        />
      </Canvas>
    </div>
  )
}
