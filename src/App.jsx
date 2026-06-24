import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { useState } from 'react'
import * as THREE from 'three'

const PPF_COLORS = [
  { name: 'Transparente', hex: null },
  { name: 'Negro Mate', hex: '#1a1a1a' },
  { name: 'Azul Oscuro', hex: '#0a1628' },
  { name: 'Rojo', hex: '#8b0000' },
  { name: 'Gris', hex: '#4a4a4a' },
]

function CarModel({ ppfHex }) {
  const { scene } = useGLTF('/2014_toyota_corolla_e180_eu_with_interior.glb')

  scene.traverse((child) => {
    if (child.isMesh) {
      if (ppfHex) {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(ppfHex),
          roughness: 0.3,
          metalness: 0.7,
        })
      } else {
        child.material.color.set('#ffffff')
      }
    }
  })

  return <primitive object={scene} scale={1} />
}

export default function App() {
  const [selectedColor, setSelectedColor] = useState(PPF_COLORS[0])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
          Visualizador PPF - Toyota Corolla
        </h1>
        <p style={{ color: '#aaa', margin: '5px 0' }}>
          Arrastra para rotar • Scroll para zoom
        </p>
      </div>

      <div style={{ flex: 1 }}>
        <Canvas camera={{ position: [5, 3, 8], fov: 50 }}>
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <CarModel ppfHex={selectedColor.hex} />
          <OrbitControls />
          <Environment preset="city" />
        </Canvas>
      </div>

      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {PPF_COLORS.map((item) => (
          <button
            key={item.name}
            onClick={() => setSelectedColor(item)}
            style={{
              padding: '10px 20px',
              background: selectedColor.name === item.name ? '#fff' : '#333',
              color: selectedColor.name === item.name ? '#000' : '#fff',
              border: '2px solid #555',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  )
}