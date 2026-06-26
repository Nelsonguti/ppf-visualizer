import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'

const PPF_COLORS = [
  { name: 'Transparente', hex: null },
  { name: 'Negro Mate', hex: '#1a1a1a' },
  { name: 'Azul Oscuro', hex: '#0a1628' },
  { name: 'Rojo', hex: '#8b0000' },
  { name: 'Gris', hex: '#4a4a4a' },
]

function CarModel({ ppfHex }) {
  const { scene: gltfScene } = useGLTF('/2014_toyota_corolla_e180_eu_with_interior.glb')
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene])

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        if (ppfHex) {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(ppfHex),
            roughness: 0.2,
            metalness: 0.8,
            envMapIntensity: 1.5,
          })
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#cccccc'),
            roughness: 0.6,
            metalness: 0.2,
          })
        }
      }
    })
  }, [scene, ppfHex])

  return <primitive object={scene} scale={1} />
}

function SceneCanvas({ ppfHex }) {
  return (
    <Canvas camera={{ position: [5, 3, 8], fov: 45 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={2} />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={1} />
      <CarModel ppfHex={ppfHex} />
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={7} maxDistance={11} maxPolarAngle={1.4} />
      <Environment preset="city" />
    </Canvas>
  )
}

export default function App() {
  const [selectedColor, setSelectedColor] = useState(PPF_COLORS[0])
  const [compareMode, setCompareMode] = useState(false)

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a', overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #222'
      }}>
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            Visualizador PPF - Toyota Corolla
          </h1>
          <p style={{ color: '#666', margin: '2px 0 0', fontSize: '12px' }}>
            Arrastra para rotar • Scroll para zoom
          </p>
        </div>
        <button
          onClick={() => setCompareMode(!compareMode)}
          style={{
            padding: '10px 20px',
            background: compareMode ? '#00b4d8' : '#222',
            color: 'white',
            border: `1px solid ${compareMode ? '#00b4d8' : '#444'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          {compareMode ? '← Vista simple' : '⟺ Comparar antes/después'}
        </button>
      </div>

      {/* Vista principal */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {compareMode ? (
          <>
            {/* Panel SIN PPF */}
            <div style={{ flex: 1, position: 'relative', borderRight: '2px solid #00b4d8' }}>
              <div style={{
                position: 'absolute', top: '12px', left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)',
                color: '#aaa',
                padding: '4px 14px',
                borderRadius: '20px',
                zIndex: 10,
                fontSize: '13px',
                fontWeight: 'bold',
                border: '1px solid #444',
                whiteSpace: 'nowrap'
              }}>
                SIN PPF
              </div>
              <SceneCanvas ppfHex={null} />
            </div>

            {/* Panel CON PPF */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '12px', left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,180,216,0.85)',
                color: 'white',
                padding: '4px 14px',
                borderRadius: '20px',
                zIndex: 10,
                fontSize: '13px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>
                CON PPF • {selectedColor.name}
              </div>
              <SceneCanvas ppfHex={selectedColor.hex || '#e8e8e8'} />
            </div>
          </>
        ) : (
          <SceneCanvas ppfHex={selectedColor.hex} />
        )}
      </div>

      {/* Botones de color */}
      <div style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        borderTop: '1px solid #222',
        background: '#0f0f0f'
      }}>
        {PPF_COLORS.map((item) => (
          <button
            key={item.name}
            onClick={() => setSelectedColor(item)}
            style={{
              padding: '10px 20px',
              background: selectedColor.name === item.name ? '#00b4d8' : '#1a1a1a',
              color: 'white',
              border: `2px solid ${selectedColor.name === item.name ? '#00b4d8' : '#333'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  )
}
