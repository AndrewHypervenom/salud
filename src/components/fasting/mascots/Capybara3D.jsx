import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Capybara3D — cara estilo Apple Animoji
 * Props: phaseColor, darkPhaseColor, glowColor, state, reaction, phaseIndex
 */
export default function Capybara3D({ phaseColor, darkPhaseColor, glowColor, state, reaction, phaseIndex }) {
  const rootRef = useRef()
  const timeRef = useRef(0)

  // Material refs para color lerp
  const headMatRef = useRef()
  const muzzleMatRef = useRef()
  const earMatRef = useRef()
  const earMatRef2 = useRef()

  // Refs para ojos (parpadeo dinámico)
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()
  const blinkTimerRef = useRef(0)
  const blinkIntervalRef = useRef(3 + Math.random() * 2)

  // Color interpolation
  const bodyColorRef = useRef(new THREE.Color(phaseColor))
  const darkColorRef = useRef(new THREE.Color(darkPhaseColor))

  const sleeping = state === 'sleeping'

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (!rootRef.current) return

    // Smooth color lerp
    bodyColorRef.current.lerp(new THREE.Color(phaseColor), 0.05)
    darkColorRef.current.lerp(new THREE.Color(darkPhaseColor), 0.05)
    if (headMatRef.current)   headMatRef.current.color.copy(bodyColorRef.current)
    if (headMatRef.current)   headMatRef.current.emissive.copy(bodyColorRef.current)
    if (muzzleMatRef.current) muzzleMatRef.current.color.copy(darkColorRef.current)
    if (earMatRef.current)    earMatRef.current.color.copy(bodyColorRef.current)
    if (earMatRef2.current)   earMatRef2.current.color.copy(bodyColorRef.current)

    // Parpadeo periódico
    blinkTimerRef.current += delta
    const blinkDuration = 0.12
    if (blinkTimerRef.current < blinkDuration) {
      const blink = Math.sin((blinkTimerRef.current / blinkDuration) * Math.PI)
      const sy = sleeping ? 0.12 : (1 - blink * 0.88)
      if (leftEyeRef.current)  leftEyeRef.current.scale.y = sy
      if (rightEyeRef.current) rightEyeRef.current.scale.y = sy
    } else {
      const targetY = sleeping ? 0.12 : 1
      if (leftEyeRef.current)  leftEyeRef.current.scale.y += (targetY - leftEyeRef.current.scale.y) * 0.15
      if (rightEyeRef.current) rightEyeRef.current.scale.y += (targetY - rightEyeRef.current.scale.y) * 0.15
      if (blinkTimerRef.current > blinkIntervalRef.current) {
        blinkTimerRef.current = 0
        blinkIntervalRef.current = 3 + Math.random() * 2
      }
    }

    const pos = rootRef.current.position
    const rot = rootRef.current.rotation

    if (reaction === 'dancing') {
      pos.y = Math.abs(Math.sin(t * 5.5)) * 0.14
      rot.y = Math.sin(t * 3.5) * 0.4
      rot.z = Math.sin(t * 5.5) * 0.07
    } else if (reaction === 'waving') {
      pos.y = Math.sin(t * 3) * 0.06
      rot.z = Math.sin(t * 2.5) * 0.12
      rot.y = Math.sin(t * 1.8) * 0.08
    } else {
      // idle / sleeping
      const speed = sleeping ? 0.65 : 1.1
      const amp = sleeping ? 0.018 : 0.04
      pos.y = Math.sin(t * speed) * amp
      rot.z = Math.sin(t * speed) * 0.015
      rot.y += (0 - rot.y) * 0.05
    }
  })

  // Expresión de boca según estado
  function getMouthShape() {
    if (state === 'energized' || state === 'radiant' || state === 'cosmic') {
      return [0.17, 0.03, 8, 24, Math.PI]
    }
    if (state === 'tired') {
      return [0.10, 0.022, 8, 14, Math.PI]
    }
    return [0.11, 0.025, 8, 16, Math.PI] // neutral / sleeping
  }

  function PhaseAccessory() {
    if (phaseIndex === 0) {
      return (
        <group position={[0, 1.0, 0]}>
          {[-0.09, 0, 0.09].map((z, i) => (
            <mesh key={i} position={[0, 0, z]}>
              <cylinderGeometry args={[0.02, 0.02, 0.22, 5]} />
              <meshStandardMaterial color="white" roughness={0.1} />
            </mesh>
          ))}
        </group>
      )
    }
    if (phaseIndex === 2) {
      return (
        <mesh position={[0, 0.97, 0]}>
          <coneGeometry args={[0.13, 0.38, 8]} />
          <meshStandardMaterial color="#FCD34D" emissive="#F97316" emissiveIntensity={0.6} roughness={0.1} />
        </mesh>
      )
    }
    if (phaseIndex === 3) {
      return (
        <>
          {/* Ojos X — izquierdo */}
          <group position={[-0.35, 0.12, 0.78]}>
            <mesh><boxGeometry args={[0.28, 0.06, 0.04]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} /></mesh>
            <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.28, 0.06, 0.04]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} /></mesh>
          </group>
          {/* Ojos X — derecho */}
          <group position={[0.35, 0.12, 0.78]}>
            <mesh><boxGeometry args={[0.28, 0.06, 0.04]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} /></mesh>
            <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.28, 0.06, 0.04]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} /></mesh>
          </group>
        </>
      )
    }
    if (phaseIndex === 4) {
      return (
        <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.40, 0.032, 8, 32]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.9} roughness={0.1} />
        </mesh>
      )
    }
    return null
  }

  const mouthArgs = getMouthShape()

  return (
    <group ref={rootRef} rotation={[0, 0, 0]}>
      {/* Cara — cabeza grande estilo Animoji */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshPhysicalMaterial
          ref={headMatRef}
          color={phaseColor}
          roughness={0.25}
          metalness={0}
          clearcoat={0.3}
          clearcoatRoughness={0.1}
          emissive={phaseColor}
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* Orejas — pequeñas y redondeadas en la parte superior */}
      <mesh position={[-0.52, 0.72, -0.48]} scale={[0.7, 1.0, 0.7]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial ref={earMatRef} color={phaseColor} roughness={0.38} metalness={0.0} />
      </mesh>
      <mesh position={[-0.52, 0.72, 0.48]} scale={[0.7, 1.0, 0.7]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial ref={earMatRef2} color={phaseColor} roughness={0.38} metalness={0.0} />
      </mesh>

      {/* Hocico cuadrado — lo icónico del capibara */}
      <mesh position={[0, -0.28, 0.88]} scale={[0.9, 0.7, 0.85]}>
        <boxGeometry args={[0.32, 0.28, 0.22]} />
        <meshStandardMaterial ref={muzzleMatRef} color={darkPhaseColor} roughness={0.55} metalness={0.0} />
      </mesh>

      {/* Nariz */}
      <mesh position={[0, -0.15, 1.02]}>
        <sphereGeometry args={[0.085, 10, 10]} />
        <meshStandardMaterial color="#2d1b05" roughness={0.4} />
      </mesh>

      {/* Ojo izquierdo */}
      <group ref={leftEyeRef} position={[-0.35, 0.12, 0.72]}>
        <mesh>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="white" roughness={0.06} metalness={0.0} />
        </mesh>
        <mesh position={[0, 0, 0.10]}>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshStandardMaterial color="#2d1b05" roughness={0.04} metalness={0.0} />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color="#000000" roughness={0.02} metalness={0.0} />
        </mesh>
        <mesh position={[0.04, 0.06, 0.18]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="white" roughness={0.0} metalness={0.0} emissive="white" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.03, 0.03, 0.14]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="white" roughness={0.0} metalness={0.0} emissive="white" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Ojo derecho */}
      <group ref={rightEyeRef} position={[0.35, 0.12, 0.72]}>
        <mesh>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="white" roughness={0.06} metalness={0.0} />
        </mesh>
        <mesh position={[0, 0, 0.10]}>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshStandardMaterial color="#2d1b05" roughness={0.04} metalness={0.0} />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color="#000000" roughness={0.02} metalness={0.0} />
        </mesh>
        <mesh position={[0.04, 0.06, 0.18]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="white" roughness={0.0} metalness={0.0} emissive="white" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.03, 0.03, 0.14]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="white" roughness={0.0} metalness={0.0} emissive="white" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Boca — arco de sonrisa */}
      <mesh key={state} position={[0, -0.32, 0.80]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={mouthArgs} />
        <meshStandardMaterial color="#2d1b05" roughness={0.3} />
      </mesh>

      {/* Accesorio de fase */}
      <PhaseAccessory />
    </group>
  )
}
