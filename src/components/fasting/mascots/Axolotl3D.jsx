import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * CatFace — gatito estilo Animoji
 * Props: phaseColor, darkPhaseColor, glowColor, state, reaction, phaseIndex
 *
 * Estados por fase:
 *  neutral  (0-4h)  → cara normal, ojos abiertos
 *  tired    (4-8h)  → ojos medio cerrados, movimiento lento
 *  energized(8-14h) → ojos grandes, animación más viva
 *  radiant (14-20h) → brillo, expresivo
 *  cosmic  (20h+)  → máxima animación
 */
export default function Axolotl3D({ phaseColor, darkPhaseColor, glowColor, state, reaction }) {
  const rootRef    = useRef()
  const timeRef    = useRef(0)
  const headMatRef = useRef()
  const earLMatRef = useRef()
  const earRMatRef = useRef()
  const leftEyeRef  = useRef()
  const rightEyeRef = useRef()
  const eyeScaleRef = useRef(1)
  const blinkTimer  = useRef(0)
  const blinkInterval = useRef(3 + Math.random() * 2)

  const bodyColorRef = useRef(new THREE.Color(phaseColor))

  const sleeping = state === 'sleeping'

  // Escala de ojos objetivo según estado
  const eyeTargetScale = sleeping ? 0.10
    : state === 'tired'     ? 0.48
    : state === 'energized' ? 1.12
    : state === 'radiant'   ? 1.10
    : 1.0

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (!rootRef.current) return

    // Color lerp suave
    bodyColorRef.current.lerp(new THREE.Color(phaseColor), 0.05)
    if (headMatRef.current) {
      headMatRef.current.color.copy(bodyColorRef.current)
      headMatRef.current.emissive.copy(bodyColorRef.current)
    }
    if (earLMatRef.current) earLMatRef.current.color.copy(bodyColorRef.current)
    if (earRMatRef.current) earRMatRef.current.color.copy(bodyColorRef.current)

    // Parpadeo periódico
    blinkTimer.current += delta
    let eyeTarget = eyeTargetScale
    if (blinkTimer.current < 0.12 && !sleeping) {
      const b = Math.sin((blinkTimer.current / 0.12) * Math.PI)
      eyeTarget = eyeTargetScale * (1 - b * 0.88)
    } else if (blinkTimer.current > blinkInterval.current) {
      blinkTimer.current = 0
      blinkInterval.current = 2.5 + Math.random() * 2.5
    }
    eyeScaleRef.current += (eyeTarget - eyeScaleRef.current) * 0.14
    if (leftEyeRef.current)  leftEyeRef.current.scale.y  = eyeScaleRef.current
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleRef.current

    // Movimiento según reacción
    const pos = rootRef.current.position
    const rot = rootRef.current.rotation

    if (reaction === 'dancing') {
      pos.y = Math.abs(Math.sin(t * 5.5)) * 0.15
      rot.y = Math.sin(t * 4.0) * 0.42
      rot.z = Math.sin(t * 5.5) * 0.08
    } else if (reaction === 'waving') {
      pos.y = Math.sin(t * 3) * 0.07
      rot.z = Math.sin(t * 2.8) * 0.14
      rot.y = Math.sin(t * 2.0) * 0.10
    } else {
      const speed = sleeping ? 0.55 : state === 'tired' ? 0.75 : state === 'energized' ? 1.4 : 1.1
      const amp   = sleeping ? 0.016 : state === 'tired' ? 0.025 : state === 'energized' ? 0.055 : 0.038
      pos.y = Math.sin(t * speed) * amp
      rot.z = Math.sin(t * speed) * 0.014
      // Estado tired: cabeza ligeramente caída
      const targetRX = (state === 'tired' || sleeping) ? 0.10 : 0
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
          roughness={0.22}
          metalness={0}
          clearcoat={0.35}
          clearcoatRoughness={0.08}
          emissive={phaseColor}
          emissiveIntensity={0.07}
        />
      </mesh>

      {/* ── Orejas puntiagudas ── */}
      {/* Oreja izquierda exterior */}
      <mesh position={[-0.50, 0.76, 0.18]} rotation={[0.05, 0, -0.22]}>
        <coneGeometry args={[0.21, 0.40, 4]} />
        <meshStandardMaterial ref={earLMatRef} color={phaseColor} roughness={0.3} />
      </mesh>
      {/* Oreja izquierda interior (rosa) */}
      <mesh position={[-0.50, 0.80, 0.26]} rotation={[0.05, 0, -0.22]}>
        <coneGeometry args={[0.11, 0.26, 4]} />
        <meshStandardMaterial color="#FFB6C1" roughness={0.25} emissive="#FFB6C1" emissiveIntensity={0.15} />
      </mesh>
      {/* Oreja derecha exterior */}
      <mesh position={[0.50, 0.76, 0.18]} rotation={[0.05, 0, 0.22]}>
        <coneGeometry args={[0.21, 0.40, 4]} />
        <meshStandardMaterial ref={earRMatRef} color={phaseColor} roughness={0.3} />
      </mesh>
      {/* Oreja derecha interior */}
      <mesh position={[0.50, 0.80, 0.26]} rotation={[0.05, 0, 0.22]}>
        <coneGeometry args={[0.11, 0.26, 4]} />
        <meshStandardMaterial color="#FFB6C1" roughness={0.25} emissive="#FFB6C1" emissiveIntensity={0.15} />
      </mesh>

      {/* ── Ojos (almendrados, pupila ranura vertical) ── */}
      <group ref={leftEyeRef} position={[-0.32, 0.12, 0.72]} scale={[0.88, 1, 1]}>
        <mesh>
          <sphereGeometry args={[0.20, 16, 16]} />
          <meshStandardMaterial color="white" roughness={0.05} />
        </mesh>
        {/* Iris ámbar */}
        <mesh position={[0, 0, 0.09]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color="#d97706" roughness={0.04} />
        </mesh>
        {/* Pupila ranura */}
        <mesh position={[0, 0, 0.17]}>
          <boxGeometry args={[0.025, 0.105, 0.015]} />
          <meshStandardMaterial color="#0f0500" />
        </mesh>
        {/* Catchlights */}
        <mesh position={[0.04, 0.05, 0.17]}>
          <sphereGeometry args={[0.040, 8, 8]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0.03, 0.03, 0.13]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.4} />
        </mesh>
      </group>

      <group ref={rightEyeRef} position={[0.32, 0.12, 0.72]} scale={[0.88, 1, 1]}>
        <mesh>
          <sphereGeometry args={[0.20, 16, 16]} />
          <meshStandardMaterial color="white" roughness={0.05} />
        </mesh>
        <mesh position={[0, 0, 0.09]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color="#d97706" roughness={0.04} />
        </mesh>
        <mesh position={[0, 0, 0.17]}>
          <boxGeometry args={[0.025, 0.105, 0.015]} />
          <meshStandardMaterial color="#0f0500" />
        </mesh>
        <mesh position={[0.04, 0.05, 0.17]}>
          <sphereGeometry args={[0.040, 8, 8]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0.03, 0.03, 0.13]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* ── Nariz (triángulo pequeño) ── */}
      <mesh position={[0, -0.20, 0.85]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.07, 0.08, 3]} />
        <meshStandardMaterial color="#FFB6C1" roughness={0.3} emissive="#FFB6C1" emissiveIntensity={0.2} />
      </mesh>

      {/* ── Bigotes (6 cilindros delgados) ── */}
      {/* Izquierda superior */}
      <mesh position={[-0.52, -0.12, 0.76]} rotation={[0.07, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.010, 0.010, 0.42, 4]} />
        <meshStandardMaterial color="white" roughness={0.1} />
      </mesh>
      {/* Izquierda media */}
      <mesh position={[-0.52, -0.18, 0.77]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.010, 0.010, 0.46, 4]} />
        <meshStandardMaterial color="white" roughness={0.1} />
      </mesh>
      {/* Izquierda inferior */}
      <mesh position={[-0.52, -0.25, 0.75]} rotation={[-0.07, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.010, 0.010, 0.40, 4]} />
        <meshStandardMaterial color="white" roughness={0.1} />
      </mesh>
      {/* Derecha superior */}
      <mesh position={[0.52, -0.12, 0.76]} rotation={[0.07, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.010, 0.010, 0.42, 4]} />
        <meshStandardMaterial color="white" roughness={0.1} />
      </mesh>
      {/* Derecha media */}
      <mesh position={[0.52, -0.18, 0.77]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.010, 0.010, 0.46, 4]} />
        <meshStandardMaterial color="white" roughness={0.1} />
      </mesh>
      {/* Derecha inferior */}
      <mesh position={[0.52, -0.25, 0.75]} rotation={[-0.07, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.010, 0.010, 0.40, 4]} />
        <meshStandardMaterial color="white" roughness={0.1} />
      </mesh>

      {/* ── Boca — arco de gato (W pequeña) ── */}
      {/* Línea central vertical */}
      <mesh position={[0, -0.28, 0.84]}>
        <cylinderGeometry args={[0.012, 0.012, 0.10, 4]} />
        <meshStandardMaterial color="#2d1b05" roughness={0.3} />
      </mesh>
      {/* Arco izquierdo */}
      <mesh key={`ml-${state}`} position={[-0.10, -0.34, 0.82]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.09, 0.022, 6, 14, Math.PI * 0.72]} />
        <meshStandardMaterial color="#2d1b05" roughness={0.3} />
      </mesh>
      {/* Arco derecho */}
      <mesh key={`mr-${state}`} position={[0.10, -0.34, 0.82]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.09, 0.022, 6, 14, Math.PI * 0.72]} />
        <meshStandardMaterial color="#2d1b05" roughness={0.3} />
      </mesh>

      {/* Destello cósmico halo (solo fase 4) */}
      {state === 'cosmic' && (
        <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.030, 8, 32]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.0} roughness={0.1} />
        </mesh>
      )}
    </group>
  )
}
