import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Axolotl3D — cute 3D axolotl mascot
 * Props: phaseColor, darkPhaseColor, glowColor, state, reaction, phaseIndex
 */
export default function Axolotl3D({ phaseColor, darkPhaseColor, glowColor, state, reaction, phaseIndex }) {
  const rootRef = useRef()
  const waveRef = useRef()
  const timeRef = useRef(0)

  // Material refs for color lerp
  const bodyMatRef = useRef()
  const headMatRef = useRef()
  const tailMatRef = useRef()
  const legMatRef = useRef()

  // Color interpolation
  const bodyColorRef = useRef(new THREE.Color(phaseColor))
  const darkColorRef = useRef(new THREE.Color(darkPhaseColor))

  const sleeping = state === 'sleeping'
  const eyeScaleY = sleeping ? 0.15 : 1

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (!rootRef.current) return

    // Smooth color lerp
    bodyColorRef.current.lerp(new THREE.Color(phaseColor), 0.05)
    darkColorRef.current.lerp(new THREE.Color(darkPhaseColor), 0.05)
    if (bodyMatRef.current) bodyMatRef.current.color.copy(bodyColorRef.current)
    if (headMatRef.current) headMatRef.current.color.copy(bodyColorRef.current)
    if (tailMatRef.current) tailMatRef.current.color.copy(darkColorRef.current)
    if (legMatRef.current) legMatRef.current.color.copy(darkColorRef.current)

    if (reaction === 'dancing') {
      rootRef.current.position.y = Math.abs(Math.sin(t * 5.5)) * 0.24
      rootRef.current.rotation.y = Math.sin(t * 3.8) * 0.5
      rootRef.current.rotation.z = Math.sin(t * 5.5) * 0.09
    } else if (reaction === 'waving') {
      rootRef.current.position.y = Math.sin(t * 3) * 0.08
      rootRef.current.rotation.y = 0
      rootRef.current.rotation.z = 0
      if (waveRef.current) waveRef.current.rotation.z = Math.sin(t * 8) * 0.75 - 0.25
    } else {
      // idle / sleeping
      const speed = sleeping ? 0.65 : 1.1
      const amp = sleeping ? 0.032 : 0.075
      rootRef.current.position.y = Math.sin(t * speed) * amp
      rootRef.current.rotation.z = Math.sin(t * speed) * 0.02
      rootRef.current.rotation.y += (0 - rootRef.current.rotation.y) * 0.05
    }
  })

  // Branquia helper: 3 ramas per side
  const branchiaColor = '#FF9EBB'
  function Gill({ posX, posZ, flip }) {
    const angles = [-0.3, 0, 0.3]
    const heights = [0.38, 0.46, 0.38]
    const xOff = [-0.1, 0, 0.1]
    return (
      <group position={[posX, 0.38, posZ]}>
        {angles.map((angle, i) => (
          <group key={i} position={[xOff[i] * (flip ? -1 : 1), 0, 0]} rotation={[0, 0, angle * (flip ? -1 : 1)]}>
            <mesh>
              <cylinderGeometry args={[0.035, 0.025, heights[i], 6]} />
              <meshStandardMaterial color={branchiaColor} roughness={0.3} metalness={0.0} />
            </mesh>
            <mesh position={[0, heights[i] / 2 + 0.06, 0]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color={branchiaColor} roughness={0.25} metalness={0.0} emissive={branchiaColor} emissiveIntensity={0.35} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }

  function PhaseAccessory() {
    if (phaseIndex === 0) {
      return (
        <group position={[0.65, 0.72, 0]}>
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
        <mesh position={[0.65, 0.88, 0]}>
          <coneGeometry args={[0.11, 0.3, 8]} />
          <meshStandardMaterial color="#FCD34D" emissive="#F97316" emissiveIntensity={0.6} roughness={0.1} />
        </mesh>
      )
    }
    if (phaseIndex === 3) {
      return (
        <group position={[0.5, -0.7, 0]}>
          <mesh><boxGeometry args={[0.07, 0.32, 0.05]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} /></mesh>
          <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.07, 0.32, 0.05]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} /></mesh>
        </group>
      )
    }
    if (phaseIndex === 4) {
      return (
        <mesh position={[0.65, 0.88, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.028, 8, 32]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.9} roughness={0.1} />
        </mesh>
      )
    }
    return null
  }

  return (
    <group ref={rootRef} rotation={[0, -0.3, 0]}>
      {/* Cuerpo */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.36, 1.0, 8, 16]} />
        <meshStandardMaterial ref={bodyMatRef} color={phaseColor} roughness={0.38} metalness={0.0} emissive={phaseColor} emissiveIntensity={0.08} />
      </mesh>

      {/* Cabeza */}
      <mesh position={[0.68, 0.1, 0]}>
        <sphereGeometry args={[0.44, 20, 20]} />
        <meshStandardMaterial ref={headMatRef} color={phaseColor} roughness={0.38} metalness={0.0} emissive={phaseColor} emissiveIntensity={0.11} />
      </mesh>

      {/* Branquias izquierda */}
      <Gill posX={0.52} posZ={-0.3} flip={false} />
      {/* Branquias derecha */}
      <Gill posX={0.52} posZ={0.3} flip={true} />

      {/* Pata delantera izquierda — waveRef */}
      <mesh ref={waveRef} position={[0.42, -0.44, -0.32]} rotation={[0.3, 0, 0.45]}>
        <capsuleGeometry args={[0.075, 0.28, 5, 8]} />
        <meshStandardMaterial ref={legMatRef} color={darkPhaseColor} roughness={0.45} metalness={0.0} />
      </mesh>
      {/* Pata delantera derecha */}
      <mesh position={[0.42, -0.44, 0.32]} rotation={[-0.3, 0, 0.45]}>
        <capsuleGeometry args={[0.075, 0.28, 5, 8]} />
        <meshStandardMaterial color={darkPhaseColor} roughness={0.45} metalness={0.0} />
      </mesh>
      {/* Pata trasera izquierda */}
      <mesh position={[-0.42, -0.44, -0.3]} rotation={[0.3, 0, -0.4]}>
        <capsuleGeometry args={[0.075, 0.25, 5, 8]} />
        <meshStandardMaterial color={darkPhaseColor} roughness={0.45} metalness={0.0} />
      </mesh>
      {/* Pata trasera derecha */}
      <mesh position={[-0.42, -0.44, 0.3]} rotation={[-0.3, 0, -0.4]}>
        <capsuleGeometry args={[0.075, 0.25, 5, 8]} />
        <meshStandardMaterial color={darkPhaseColor} roughness={0.45} metalness={0.0} />
      </mesh>

      {/* Cola */}
      <mesh position={[-1.0, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.55, 0.6]}>
        <coneGeometry args={[0.3, 0.6, 10]} />
        <meshStandardMaterial ref={tailMatRef} color={darkPhaseColor} roughness={0.45} metalness={0.0} />
      </mesh>

      {/* Ojo izquierdo */}
      <group position={[1.0, 0.22, -0.22]} scale={[1, eyeScaleY, 1]}>
        <mesh>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color="white" roughness={0.06} metalness={0.0} />
        </mesh>
        <mesh position={[0.07, 0, 0]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial color="#1f2937" roughness={0.04} metalness={0.0} />
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
      <group position={[1.0, 0.22, 0.22]} scale={[1, eyeScaleY, 1]}>
        <mesh>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color="white" roughness={0.06} metalness={0.0} />
        </mesh>
        <mesh position={[0.07, 0, 0]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial color="#1f2937" roughness={0.04} metalness={0.0} />
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
