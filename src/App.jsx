import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'

// Clasifica cada parte del auto por su nombre
function getMeshZone(meshName) {
  const n = meshName.toLowerCase()
  if (n.includes('glass') || n.includes('window') || n.includes('windshield') ||
      n.includes('wind') || n.includes('crystal') || n.includes('screen') ||
      n.includes('vidr') || n.includes('luna') || n.includes('vidrio')) return 'glass'
  if (n.includes('wheel') || n.includes('tire') || n.includes('tyre') ||
      n.includes('rim') || n.includes('brake') || n.includes('llanta') ||
      n.includes('rueda') || n.includes('aro')) return 'wheel'
  if (n.includes('light') || n.includes('lamp') || n.includes('headlight') ||
      n.includes('taillight') || n.includes('lens') || n.includes('faro')) return 'light'
  if (n.includes('interior') || n.includes('seat') || n.includes('dashboard') ||
      n.includes('cabin') || n.includes('console') || n.includes('steering') ||
      n.includes('asiento') || n.includes('tablero')) return 'interior'
  return 'body'
}

// Materiales base del auto (como se ve sin ningún servicio)
function getBaseMaterial(zone) {
  switch (zone) {
    case 'glass':
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1a2a3a'),
        roughness: 0.05,
        metalness: 0.1,
        transparent: true,
        opacity: 0.6,
      })
    case 'wheel':
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1a1a1a'),
        roughness: 0.7,
        metalness: 0.5,
      })
    case 'light':
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffe8c0'),
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.9,
      })
    case 'interior':
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#2a2a2a'),
        roughness: 0.9,
        metalness: 0.1,
      })
    case 'body':
    default:
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#7a7a7a'),
        roughness: 0.4,
        metalness: 0.6,
      })
  }
}

// Lista de servicios con efecto por zona
const SERVICES = [
  // PPF
  {
    id: 'ppf-transparente',
    name: 'Transparente',
    category: 'PPF',
    getMaterial: (zone) => {
      if (zone !== 'body') return null
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#c8dce8'),
        roughness: 0.05,
        metalness: 0.5,
        transparent: true,
        opacity: 0.95,
      })
    }
  },
  {
    id: 'ppf-negro',
    name: 'Negro Mate',
    category: 'PPF',
    getMaterial: (zone) => {
      if (zone !== 'body') return null
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#111111'),
        roughness: 0.8,
        metalness: 0.05,
      })
    }
  },
  {
    id: 'ppf-gris',
    name: 'Gris',
    category: 'PPF',
    getMaterial: (zone) => {
      if (zone !== 'body') return null
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#555555'),
        roughness: 0.3,
        metalness: 0.7,
      })
    }
  },
  {
    id: 'ppf-azul',
    name: 'Azul Oscuro',
    category: 'PPF',
    getMaterial: (zone) => {
      if (zone !== 'body') return null
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0a1628'),
        roughness: 0.2,
        metalness: 0.8,
      })
    }
  },
  {
    id: 'ppf-rojo',
    name: 'Rojo',
    category: 'PPF',
    getMaterial: (zone) => {
      if (zone !== 'body') return null
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#8b0000'),
        roughness: 0.2,
        metalness: 0.8,
      })
    }
  },
  // Polarizado
  {
    id: 'polarizado-medio',
    name: 'Medio (35%)',
    category: 'Polarizado',
    getMaterial: (zone) => {
      if (zone !== 'glass') return null
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0a0a0a'),
        roughness: 0.0,
        metalness: 0.3,
        transparent: true,
        opacity: 0.75,
      })
    }
  },
  {
    id: 'polarizado-oscuro',
    name: 'Oscuro (20%)',
    category: 'Polarizado',
    getMaterial: (zone) => {
      if (zone !== 'glass') return null
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#050505'),
        roughness: 0.0,
        metalness: 0.3,
        transparent: true,
        opacity: 0.9,
      })
    }
  },
  {
    id: 'polarizado-total',
    name: 'Total (5%)',
    category: 'Polarizado',
    getMaterial: (zone) => {
      if (zone !== 'glass') return null
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#020202'),
        roughness: 0.0,
        metalness: 0.3,
        transparent: true,
        opacity: 0.97,
      })
    }
  },
  // Lavada
  {
    id: 'lavada-basica',
    name: 'Lavada Básica',
    category: 'Lavada',
    getMaterial: (zone) => {
      if (zone === 'interior') return null
      if (zone === 'body') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#8a8a8a'),
          roughness: 0.15,
          metalness: 0.8,
        })
      }
      return null
    }
  },
  {
    id: 'lavada-premium',
    name: 'Premium + Cera',
    category: 'Lavada',
    getMaterial: (zone) => {
      if (zone === 'interior') return null
      if (zone === 'body') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#9a9a9a'),
          roughness: 0.03,
          metalness: 0.95,
          envMapIntensity: 2,
        })
      }
      if (zone === 'glass') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#1a2a3a'),
          roughness: 0.01,
          metalness: 0.1,
          transparent: true,
          opacity: 0.6,
        })
      }
      if (zone === 'wheel') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#2a2a2a'),
          roughness: 0.3,
          metalness: 0.8,
        })
      }
      return null
    }
  },
]

const CATEGORIES = ['PPF', 'Polarizado', 'Lavada']

function CarModel({ service, showOriginal }) {
  const { scene: gltfScene } = useGLTF('/2014_toyota_corolla_e180_eu_with_interior.glb')
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene])

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        const zone = getMeshZone(child.name)
        if (showOriginal || !service) {
          child.material = getBaseMaterial(zone)
        } else {
          const serviceMat = service.getMaterial(zone)
          child.material = serviceMat || getBaseMaterial(zone)
        }
      }
    })
  }, [scene, service, showOriginal])

  return <primitive object={scene} scale={1} />
}

function SceneCanvas({ service, showOriginal }) {
  return (
    <Canvas camera={{ position: [5, 3, 8], fov: 45 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={2} />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={1} />
      <CarModel service={service} showOriginal={showOriginal} />
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={11} maxPolarAngle={1.4} />
      <Environment preset="city" />
    </Canvas>
  )
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState('PPF')
  const [selectedService, setSelectedService] = useState(SERVICES[0])
  const [compareMode, setCompareMode] = useState(false)

  const filteredServices = SERVICES.filter(s => s.category === activeCategory)

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      overflowX: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #222',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            Visualizador Detailing — Toyota Corolla
          </h1>
          <p style={{ color: '#666', margin: '2px 0 0', fontSize: '11px' }}>
            Arrastra para rotar • Scroll para zoom
          </p>
        </div>
        <button
          onClick={() => setCompareMode(!compareMode)}
          style={{
            padding: '8px 16px',
            background: compareMode ? '#00b4d8' : '#222',
            color: 'white',
            border: `1px solid ${compareMode ? '#00b4d8' : '#444'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
          }}
        >
          {compareMode ? '← Vista simple' : '⟺ Antes / Después'}
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {compareMode ? (
          <>
            <div style={{ flex: 1, position: 'relative', borderRight: '2px solid #00b4d8' }}>
              <div style={{
                position: 'absolute', top: '10px', left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)',
                color: '#aaa',
                padding: '3px 12px',
                borderRadius: '20px',
                zIndex: 10,
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid #444',
                whiteSpace: 'nowrap',
              }}>
                ANTES
              </div>
              <SceneCanvas service={null} showOriginal={true} />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '10px', left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,180,216,0.85)',
                color: 'white',
                padding: '3px 12px',
                borderRadius: '20px',
                zIndex: 10,
                fontSize: '12px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}>
                DESPUÉS • {selectedService.name}
              </div>
              <SceneCanvas service={selectedService} showOriginal={false} />
            </div>
          </>
        ) : (
          <SceneCanvas service={selectedService} showOriginal={false} />
        )}
      </div>

      {/* Selección de servicio */}
      <div style={{
        borderTop: '1px solid #222',
        background: '#0f0f0f',
        padding: '12px 20px',
      }}>
        {/* Tabs de categoría */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat)
                const first = SERVICES.find(s => s.category === cat)
                if (first) setSelectedService(first)
              }}
              style={{
                padding: '6px 18px',
                background: activeCategory === cat ? '#00b4d8' : '#1a1a1a',
                color: 'white',
                border: `1px solid ${activeCategory === cat ? '#00b4d8' : '#333'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Opciones del servicio */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {filteredServices.map(service => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              style={{
                padding: '8px 16px',
                background: selectedService.id === service.id ? '#00b4d8' : '#1a1a1a',
                color: 'white',
                border: `2px solid ${selectedService.id === service.id ? '#00b4d8' : '#333'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
            >
              {service.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
