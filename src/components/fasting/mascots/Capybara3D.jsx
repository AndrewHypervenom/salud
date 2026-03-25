import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Capybara3D — cute 3D capybara mascot
 * Props: phaseColor, darkPhaseColor, glowColor, state, reaction, phaseIndex
 */
export default function Capybara3D({ phaseColor, darkPhaseColor, glowColor, state, reaction, phaseIndex }) {
  const rootRef = useRef()
  const waveRef = useRef()
  const timeRef = useRef(0)

  const bodyMatRef = useRef()
  const headMatRef = useRef()
  const muzzleMatRef = useRef()
  const legMatRef = useRef()
  const earMatRef = useRef()

  const bodyColorRef = useRef(new THREE.Color(phaseColor))
  const darkColorRef = useRef(new THREE.Color(darkPhaseColor))

  const sleeping = state === 'sleeping'
  const eyeScaleY = sleeping ? 0.15 : 1

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (!rootRef.current) return

    bodyColorRef.current.lerp(new THREE.Color(phaseColor), 0.05)
    darkColorRef.current.lerp(new THREE.Color(darkPhaseColor), 0.05)
    if (bodyMatRef.current) bodyMatRef.current.color.copy(bodyColorRef.current)
    if (headMatRef.current) headMatRef.current.color.copy(bodyColorRef.current)
    if (muzzleMatRef.current) muzzleMatRef.current.color.copy(darkColorRef.current)
    if (legMatRef.current) legMatRef.current.color.copy(darkColorRef.current)
    if (earMatRef.current) earMatRef.current.color.copy(bodyColorRef.current)

    if (reaction === 'dancing') {
      rootRef.current.position.y = Math.abs(Math.sin(t * 5.5)) * 0.22
      rootRef.current.rotation.y = Math.sin(t * 3.5) * 0.48
      rootRef.current.rotation.z = Math.sin(t * 5.5) * 0.09
    } else if (reaction === 'waving') {
      rootRef.current.position.y = Math.sin(t * 3) * 0.08
      rootRef.current.rotation.y = 0
      rootRef.current.rotation.z = 0
      if (waveRef.current) waveRef.current.rotation.z = Math.sin(t * 7) * 0.75 - 0.25
    } else {
      const speed = sleeping ? 0.65 : 1.1
      const amp = sleeping ? 0.032 : 0.075
      rootRef.current.position.y = Math.sin(t * speed) * amp
      rootRef.current.rotation.z = Math.sin(t * speed) * 0.018
      rootRef.current.rotation.y += (0 - rootRef.current.rotation.y) * 0.05
    }
  })

  function PhaseAccessory() {
    if (phaseIndex === 0) {
      return (
        <group position={[0.7, 0.82, 0]}>
          {[-0.07, 0, 0.07].map((z, i) => (
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
        <mesh position={[0.7, 0.92, 0]}>
          <coneGeometry args={[0.11, 0.3, 8]} />
          <meshStandardMaterial color="#FCD34D" emissive="#F97316" emissiveIntensity={0.6} roughness={0.1} />
        </mesh>
      )
    }
    if (phaseIndex === 3) {
      return (
        <group position={[0.55, -0.78, 0]}>
          <mesh><boxGeometry args={[0.07, 0.32, 0.05]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} /></mesh>
          <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.07, 0.32, 0.05]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} /></mesh>
        </group>
      )
    }
    if (phaseIndex === 4) {
      return (
        <mesh position={[0.7, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.028, 8, 32]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.9} roughness={0.1} />
        </mesh>
      )
    }
    return null
  }

  return (
    <group ref={rootRef} rotation={[0, -0.25, 0]}>
      {/* Cuerpo — gordo y redondeado */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.52, 0.88, 8, 16]} />
        <meshStandardMaterial ref={bodyMatRef} color={phaseColor} roughness={0.38} metalness={0.0} emissive={phaseColor} emissiveIntensity={0.08} />
      </mesh>

      {/* Cabeza — esfera aplastada */}
      <mesh position={[0.75, 0.16, 0]} scale={[1.0, 0.88, 0.96]}>
        <sphereGeometry args={[0.44, 20, 20]} />
        <meshStandardMaterial ref={headMatRef} color={phaseColor} roughness={0.38} metalness={0.0} emissive={phaseColor} emissiveIntensity={0.11} />
      </mesh>

      {/* Hocico cuadrado — lo icónico del capibara */}
      <mesh position={[1.12, -0.02, 0]} scale={[0.9, 0.7, 0.85]}>
        <boxGeometry args={[0.4, 0.35, 0.5]} />
        <meshStandardMaterial ref={muzzleMatRef} color={darkPhaseColor} roughness={0.55} metalness={0.0} />
      </mesh>

      {/* Nariz */}
      <mesh position={[1.24, 0.1, 0]}>
        <sphereGeometry args={[0.085, 10, 10]} />
        <meshStandardMaterial color="#2d1b05" roughness={0.4} />
      </mesh>

      {/* Orejas — pequeñas y redondeadas */}
      <mesh position={[0.62, 0.6, -0.3]} scale={[0.7, 1.0, 0.7]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial ref={earMatRef} color={phaseColor} roughness={0.38} metalness={0.0} />
      </mesh>
      <mesh position={[0.62, 0.6, 0.3]} scale={[0.7, 1.0, 0.7]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color={phaseColor} roughness={0.38} metalness={0.0} />
      </mesh>

      {/* Pata delantera izquierda — waveRef */}
      <mesh ref={waveRef} position={[0.46, -0.56, -0.4]} rotation={[0.2, 0, 0.3]}>
        <capsuleGeometry args={[0.095, 0.24, 5, 8]} />
        <meshStandardMaterial ref={legMatRef} color={darkPhaseColor} roughness={0.45} metalness={0.0} />
      </mesh>
      {/* Pata delantera derecha */}
      <mesh position={[0.46, -0.56, 0.4]} rotation={[-0.2, 0, 0.3]}>
        <capsuleGeometry args={[0.095, 0.24, 5, 8]} />
        <meshStandardMaterial color={darkPhaseColor} roughness={0.45} metalness={0.0} />
      </mesh>
      {/* Pata trasera izquierda */}
      <mesh position={[-0.44, -0.56, -0.38]} rotation={[0.2, 0, -0.3]}>
        <capsuleGeometry args={[0.095, 0.22, 5, 8]} />
        <meshStandardMaterial color={darkPhaseColor} roughness={0.45} metalness={0.0} />
      </mesh>
      {/* Pata trasera derecha */}
      <mesh position={[-0.44, -0.56, 0.38]} rotation={[-0.2, 0, -0.3]}>
        <capsuleGeometry args={[0.095, 0.22, 5, 8]} />
        <meshStandardMaterial color={darkPhaseColor} roughness={0.45} metalness={0.0} />
      </mesh>

      {/* Ojo izquierdo */}
      <group position={[1.02, 0.3, -0.26]} scale={[1, eyeScaleY, 1]}>
        <mesh>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color="white" roughness={0.06} metalness={0.0} />
        </mesh>
        <mesh position={[0.07, 0, 0]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial color="#2d1b05" roughness={0.04} metalness={0.0} />
        </mesh>
        <mesh position={[0.1, 0.04, 0.04]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="white" roughness={0.0} metalness={0.0} emissive="white" emissiveIntensity={0.4} />
            </mesh>
            {/* Segundo catchlight — detalle Pixar */}
            <mesh position={[0.09, 0.03, -0.03]}>
              <sphereGeometry args={[0.016, 6, 6]} />
              <meshStandardMaterial color="white" roughness={0.0} metalness={0.0} emissive="white" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Ojo derecho */}
      <group position={[1.02, 0.3, 0.26]} scale={[1, eyeScaleY, 1]}>
        <mesh>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color="white" roughness={0.06} metalness={0.0} />
        </mesh>
        <mesh position={[0.07, 0, 0]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial color="#2d1b05" roughness={0.04} metalness={0.0} />
        </mesh>
        <mesh position={[0.1, 0.04, 0.04]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="white" roughness={0.0} metalness={0.0} emissive="white" emissiveIntensity={0.4} />
            </mesh>
            {/* Segundo catchlight — detalle Pixar */}
            <mesh position={[0.09, 0.03, -0.03]}>
              <sphereGeometry args={[0.016, 6, 6]} />
              <meshStandardMaterial color="white" roughness={0.0} metalness={0.0} emissive="white" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Accesorio de fase */}
      <PhaseAccessory />
    </group>
  )
}
