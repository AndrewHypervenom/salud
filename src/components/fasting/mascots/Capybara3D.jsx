import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * DogFace — perrito estilo Animoji
 * Props: phaseColor, darkPhaseColor, glowColor, state, reaction, phaseIndex
 *
 * Estados por fase:
 *  neutral  (0-4h)  → cara normal, alegre
 *  tired    (4-8h)  → ojos medio cerrados, lento
 *  energized(8-14h) → lengua afuera, muy movido
 *  radiant (14-20h) → ojos brillantes
 *  cosmic  (20h+)  → máxima expresión
 */
export default function Capybara3D({ phaseColor, darkPhaseColor, glowColor, state, reaction }) {
  const rootRef     = useRef()
  const timeRef     = useRef(0)
  const headMatRef  = useRef()
  const earLMatRef  = useRef()
  const earRMatRef  = useRef()
  const leftEyeRef  = useRef()
  const rightEyeRef = useRef()
  const eyeScaleRef = useRef(1)
  const blinkTimer  = useRef(0)
  const blinkInterval = useRef(3 + Math.random() * 2)

  const bodyColorRef = useRef(new THREE.Color(phaseColor))
  const darkColorRef = useRef(new THREE.Color(darkPhaseColor))

  const sleeping = state === 'sleeping'
  const happy    = state === 'energized' || state === 'radiant' || state === 'cosmic'

  const eyeTargetScale = sleeping ? 0.10
    : state === 'tired'     ? 0.50
    : state === 'energized' ? 1.15
    : state === 'radiant'   ? 1.12
    : 1.0

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (!rootRef.current) return

    // Color lerp
    bodyColorRef.current.lerp(new THREE.Color(phaseColor), 0.05)
    darkColorRef.current.lerp(new THREE.Color(darkPhaseColor), 0.05)
    if (headMatRef.current) {
      headMatRef.current.color.copy(bodyColorRef.current)
      headMatRef.current.emissive.copy(bodyColorRef.current)
    }
    if (earLMatRef.current) earLMatRef.current.color.copy(darkColorRef.current)
    if (earRMatRef.current) earRMatRef.current.color.copy(darkColorRef.current)

    // Parpadeo periódico
    blinkTimer.current += delta
    let eyeTarget = eyeTargetScale
    if (blinkTimer.current < 0.12 && !sleeping) {
      const b = Math.sin((blinkTimer.current / 0.12) * Math.PI)
      eyeTarget = eyeTargetScale * (1 - b * 0.88)
    } else if (blinkTimer.current > blinkInterval.current) {
      blinkTimer.current = 0
      blinkInterval.current = 2.5 + Math.random() * 2
    }
    eyeScaleRef.current += (eyeTarget - eyeScaleRef.current) * 0.14
    if (leftEyeRef.current)  leftEyeRef.current.scale.y  = eyeScaleRef.current
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleRef.current

    // Movimiento
    const pos = rootRef.current.position
    const rot = rootRef.current.rotation

    if (reaction === 'dancing') {
      pos.y = Math.abs(Math.sin(t * 5.2)) * 0.16
      rot.y = Math.sin(t * 3.6) * 0.44
      rot.z = Math.sin(t * 5.2) * 0.08
    } else if (reaction === 'waving') {
      pos.y = Math.sin(t * 3) * 0.07
      rot.z = Math.sin(t * 2.6) * 0.13
      rot.y = Math.sin(t * 1.9) * 0.10
    } else {
      const speed = sleeping ? 0.55 : state === 'tired' ? 0.72 : happy ? 1.45 : 1.0
      const amp   = sleeping ? 0.016 : state === 'tired' ? 0.022 : happy ? 0.06 : 0.040
      pos.y = Math.sin(t * speed) * amp
      rot.z = Math.sin(t * speed) * 0.013
      // Estado tired → cabeza ligeramente caída
      const targetRX = (state === 'tired' || sleeping) ? 0.08 : 0
      rot.x += (targetRX - rot.x) * 0.04
      rot.y += (0 - rot.y) * 0.05
    }
  })

  return (
    <group ref={rootRef}>
      {/* ── Cara principal ── */}
      <mesh>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshPhysicalMaterial
          ref={headMatRef}
          color={phaseColor}
          roughness={0.24}
          metalness={0}
          clearcoat={0.28}
          clearcoatRoughness={0.10}
          emissive={phaseColor}
          emissiveIntensity={0.07}
        />
      </mesh>

      {/* ── Orejas floppy ── */}
      <mesh ref={/* ear anchor */ null} position={[-0.82, 0.14, 0]} rotation={[0.12, 0, 0.28]} scale={[0.55, 1.0, 0.42]}>
        <capsuleGeometry args={[0.15, 0.50, 4, 8]} />
        <meshStandardMaterial ref={earLMatRef} color={darkPhaseColor} roughness={0.42} />
      </mesh>
      <mesh position={[0.82, 0.14, 0]} rotation={[0.12, 0, -0.28]} scale={[0.55, 1.0, 0.42]}>
        <capsuleGeometry args={[0.15, 0.50, 4, 8]} />
        <meshStandardMaterial ref={earRMatRef} color={darkPhaseColor} roughness={0.42} />
      </mesh>

      {/* ── Ojos redondos y cálidos ── */}
      <group ref={leftEyeRef} position={[-0.36, 0.10, 0.70]}>
        <mesh>
          <sphereGeometry args={[0.21, 16, 16]} />
          <meshStandardMaterial color="white" roughness={0.05} />
        </mesh>
        {/* Iris marrón cálido */}
        <mesh position={[0, 0, 0.09]}>
          <sphereGeometry args={[0.135, 14, 14]} />
          <meshStandardMaterial color="#92400e" roughness={0.04} />
        </mesh>
        {/* Pupila redonda */}
        <mesh position={[0, 0, 0.16]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial color="#0a0500" roughness={0.02} />
        </mesh>
        {/* Catchlights */}
        <mesh position={[0.04, 0.05, 0.18]}>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0.03, 0.03, 0.14]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.4} />
        </mesh>
      </group>

      <group ref={rightEyeRef} position={[0.36, 0.10, 0.70]}>
        <mesh>
          <sphereGeometry args={[0.21, 16, 16]} />
          <meshStandardMaterial color="white" roughness={0.05} />
        </mesh>
        <mesh position={[0, 0, 0.09]}>
          <sphereGeometry args={[0.135, 14, 14]} />
          <meshStandardMaterial color="#92400e" roughness={0.04} />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial color="#0a0500" roughness={0.02} />
        </mesh>
        <mesh position={[0.04, 0.05, 0.18]}>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0.03, 0.03, 0.14]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* ── Hocico pequeño ── */}
      <mesh position={[0, -0.24, 0.82]} scale={[1, 0.72, 0.55]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color={darkPhaseColor} roughness={0.45} />
      </mesh>

      {/* ── Nariz grande y oscura ── */}
      <mesh position={[0, -0.14, 0.98]} scale={[1.3, 0.85, 0.65]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#0f0500" roughness={0.25} />
      </mesh>
      {/* Brillo nariz */}
      <mesh position={[0.04, -0.10, 1.06]}>
        <sphereGeometry args={[0.030, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>

      {/* ── Boca ── */}
      <mesh key={`mouth-${state}`} position={[0, -0.35, 0.82]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={happy ? [0.18, 0.030, 8, 24, Math.PI] : [0.12, 0.025, 8, 18, Math.PI]} />
        <meshStandardMaterial color="#2d1b05" roughness={0.3} />
      </mesh>

      {/* ── Lengua (solo estados felices) ── */}
      {happy && (
        <mesh position={[0, -0.54, 0.80]} scale={[1.0, 0.55, 0.45]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#f472b6" roughness={0.35} emissive="#f472b6" emissiveIntensity={0.15} />
        </mesh>
      )}

      {/* Destello cósmico halo (solo fase cosmic) */}
      {state === 'cosmic' && (
        <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.030, 8, 32]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.0} roughness={0.1} />
        </mesh>
      )}
    </group>
  )
}
