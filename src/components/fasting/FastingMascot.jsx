import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { FASTING_PHASES } from './fastingPhases'
import Axolotl3D from './mascots/Axolotl3D'
import Capybara3D from './mascots/Capybara3D'

/**
 * FastingMascot — 3D mascot (axolotl or capybara)
 * Props: phaseIndex, reaction (idle|dancing|waving), sleeping, mascotType (axolotl|capybara)
 */
export default function FastingMascot({
  phaseIndex = 0,
  reaction = 'idle',
  sleeping = false,
  mascotType = 'axolotl',
}) {
  const phase = FASTING_PHASES[phaseIndex] ?? FASTING_PHASES[0]
  const state = sleeping ? 'sleeping' : phase.mascotState
  const glowColor = phase.glow

  // Fallback: legacy 'cat'/'dog' values from localStorage → axolotl
  const effectiveMascot = mascotType === 'capybara' ? 'capybara' : 'axolotl'

  const mascotProps = {
    phaseColor: phase.primary,
    darkPhaseColor: phase.darkPrimary ?? phase.primary,
    glowColor,
    state,
    reaction,
    phaseIndex,
  }

  return (
    <div
      className="flex items-center justify-center relative"
      style={{ width: 220, height: 220 }}
    >
      {/* Glow aura CSS */}
      <div
        className="absolute rounded-full transition-all duration-1000"
        style={{
          width: 160, height: 160,
          background: `radial-gradient(circle, ${glowColor}88 0%, transparent 70%)`,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0.3, 0.8, 5.2], fov: 28 }}
        style={{ width: 220, height: 220, background: 'transparent', position: 'relative', zIndex: 1 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        {/* Iluminación cinematográfica de 3 puntos */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[3, 4, 2]} intensity={1.8} color="#FFF8F0" />
        <directionalLight position={[-3, 1, 1]} intensity={0.45} color="#E8F4FF" />
        <directionalLight position={[-1, 3, -4]} intensity={1.1} color="#FFFFFF" />
        <pointLight position={[0, -1, 2]} intensity={0.6} color={glowColor} distance={4} decay={2} />
        <Suspense fallback={null}>
          <Environment preset="studio" />
          {/* Shadow blob debajo de la mascota */}
          <mesh position={[0, -1.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.8, 1.2]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.10} depthWrite={false} />
          </mesh>
          {effectiveMascot === 'capybara'
            ? <Capybara3D {...mascotProps} />
            : <Axolotl3D {...mascotProps} />
          }
        </Suspense>
      </Canvas>

      {/* ZZZ sleeping — HTML superpuesto */}
      {state === 'sleeping' && (
        <div
          className="animate-float-zz absolute"
          style={{ top: 6, right: 14, zIndex: 2, pointerEvents: 'none', display: 'flex', gap: 2, alignItems: 'flex-end' }}
        >
          <span style={{ fontSize: 11, color: 'white', fontWeight: 700, opacity: 0.9 }}>z</span>
          <span style={{ fontSize: 9, color: 'white', fontWeight: 700, opacity: 0.65 }}>z</span>
          <span style={{ fontSize: 7, color: 'white', fontWeight: 700, opacity: 0.4 }}>z</span>
        </div>
      )}
    </div>
  )
}
