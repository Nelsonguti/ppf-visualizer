import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'

function getMeshZone(meshName) {
  const n = meshName.toLowerCase()

  if (n.includes('glass') || n.includes('window') || n.includes('wind') ||
      n.includes('crystal') || n.includes('screen') || n.includes('vidr') ||
      n.includes('luna') || n.includes('vidrio') || n.includes('luneta') ||
      n.includes('windscr') || n.includes('pare') || n.includes('vitre')) return 'glass'

  if (n.includes('light') || n.includes('lamp') || n.includes('lens') ||
      n.includes('headl') || n.includes('taill') || n.includes('tail_l') ||
      n.includes('head_l') || n.includes('faro') || n.includes('focos') ||
      n.includes('phare') || n.includes('blink') || n.includes('signal') ||
      n.includes('indica') || n.includes('reflec') || n.includes('luz_') ||
      n.includes('bulb') || n.includes('brakelight') || n.includes('stoplight') ||
      n.includes('reverse') || n.includes('turning')) return 'light'

  if (n.includes('wheel') || n.includes('tire') || n.includes('tyre') ||
      n.includes('rim') || n.includes('brake') || n.includes('llanta') ||
      n.includes('rueda') || n.includes('aro') || n.includes('disc') ||
      n.includes('roue') || n.includes('pneum') || n.includes('caliper')) return 'wheel'

  if (n.includes('interior') || n.includes('seat') || n.includes('dashboard') ||
      n.includes('cabin') || n.includes('console') || n.includes('steering') ||
      n.includes('asiento') || n.includes('tablero') || n.includes('dash') ||
      n.includes('pillar') || n.includes('headliner') || n.includes('carpet') ||
      n.includes('floor') || n.includes('door_in') || n.includes('trim_in') ||
      n.includes('inner') || n.includes('inside') || n.includes('volante') ||
      n.includes('cockpit') || n.includes('panel_i') || n.includes('armrest') ||
      n.includes('handle_in') || n.includes('silla') || n.includes('pedal')) return 'interior'

  return 'body'
}

// Pintura de auto realista — sin metalness, con clearcoat para laca
function paint(hex, roughness = 0.45, clearcoat = 0.7, clearcoatRoughness = 0.2) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    roughness,
    metalness: 0.0,
    clearcoat,
    clearcoatRoughness,
    envMapIntensity: 0.3,
  })
}

function getDefaultMaterial(zone) {
  switch (zone) {
    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#2a3a4a'), roughness: 0.05, metalness: 0,
        transparent: true, opacity: 0.38, envMapIntensity: 0.4,
      })
    case 'wheel':
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#111111'), roughness: 0.55, metalness: 0.55,
        envMapIntensity: 0.35,
      })
    case 'light':
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffdd88'), roughness: 0.1, metalness: 0,
        transparent: true, opacity: 0.85, envMapIntensity: 0.25,
      })
    case 'interior':
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1c1c1c'), roughness: 0.88, metalness: 0,
        envMapIntensity: 0.08,
      })
    default:
      return paint('#888888', 0.45, 0.7, 0.2)
  }
}

const SERVICES = [
  {
    id: 'ppf-transparente', name: 'Transparente', category: 'PPF',
    getAntes:   (z) => z === 'body' ? paint('#888888', 0.45, 0.5, 0.28) : null,
    getDespues: (z) => z === 'body' ? paint('#9a9a9a', 0.09, 1.0, 0.03) : null,
  },
  {
    id: 'ppf-negro-mate', name: 'Negro Mate', category: 'PPF',
    getAntes:   (z) => z === 'body' ? paint('#222222', 0.45, 0.5, 0.28) : null,
    getDespues: (z) => z === 'body' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0d0d0d'), roughness: 0.93, metalness: 0,
      envMapIntensity: 0.04,
    }) : null,
  },
  {
    id: 'ppf-negro-brillante', name: 'Negro Brillante', category: 'PPF',
    getAntes:   (z) => z === 'body' ? paint('#222222', 0.45, 0.5, 0.28) : null,
    getDespues: (z) => z === 'body' ? paint('#080808', 0.04, 1.0, 0.02) : null,
  },
  {
    id: 'ppf-gris', name: 'Gris', category: 'PPF',
    getAntes:   (z) => z === 'body' ? paint('#6a6a6a', 0.45, 0.5, 0.28) : null,
    getDespues: (z) => z === 'body' ? paint('#505050', 0.1, 1.0, 0.04) : null,
  },
  {
    id: 'ppf-azul', name: 'Azul', category: 'PPF',
    getAntes:   (z) => z === 'body' ? paint('#0e2540', 0.45, 0.5, 0.28) : null,
    getDespues: (z) => z === 'body' ? paint('#0a1628', 0.1, 1.0, 0.04) : null,
  },
  {
    id: 'ppf-rojo', name: 'Rojo', category: 'PPF',
    getAntes:   (z) => z === 'body' ? paint('#a01010', 0.45, 0.5, 0.28) : null,
    getDespues: (z) => z === 'body' ? paint('#8b0000', 0.1, 1.0, 0.04) : null,
  },
  {
    id: 'pol-35', name: 'Medio (35%)', category: 'Polarizado',
    getAntes: (z) => z === 'glass' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#2a3a4a'), roughness: 0.05, metalness: 0,
      transparent: true, opacity: 0.38, envMapIntensity: 0.3,
    }) : null,
    getDespues: (z) => z === 'glass' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#050505'), roughness: 0.02, metalness: 0,
      transparent: true, opacity: 0.72, envMapIntensity: 0.3,
    }) : null,
  },
  {
    id: 'pol-20', name: 'Oscuro (20%)', category: 'Polarizado',
    getAntes: (z) => z === 'glass' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#2a3a4a'), roughness: 0.05, metalness: 0,
      transparent: true, opacity: 0.38, envMapIntensity: 0.3,
    }) : null,
    getDespues: (z) => z === 'glass' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#030303'), roughness: 0.02, metalness: 0,
      transparent: true, opacity: 0.89, envMapIntensity: 0.3,
    }) : null,
  },
  {
    id: 'pol-5', name: 'Total (5%)', category: 'Polarizado',
    getAntes: (z) => z === 'glass' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#2a3a4a'), roughness: 0.05, metalness: 0,
      transparent: true, opacity: 0.38, envMapIntensity: 0.3,
    }) : null,
    getDespues: (z) => z === 'glass' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#010101'), roughness: 0.02, metalness: 0,
      transparent: true, opacity: 0.97, envMapIntensity: 0.3,
    }) : null,
  },
  {
    id: 'lavada-basica', name: 'Lavada Básica', category: 'Lavada',
    getAntes: (z) => z === 'body' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#4a4a4a'), roughness: 0.8, metalness: 0,
      envMapIntensity: 0.06,
    }) : null,
    getDespues: (z) => z === 'body' ? paint('#7a7a7a', 0.28, 0.7, 0.18) : null,
  },
  {
    id: 'lavada-premium', name: 'Premium + Cera', category: 'Lavada',
    getAntes: (z) => z === 'body' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#383838'), roughness: 0.85, metalness: 0,
      envMapIntensity: 0.04,
    }) : null,
    getDespues: (z) => {
      if (z === 'body') return paint('#8a8a8a', 0.06, 1.0, 0.03)
      if (z === 'wheel') return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#181818'), roughness: 0.25, metalness: 0.78,
        envMapIntensity: 0.45,
      })
      return null
    },
  },
]

const CATEGORIES = ['PPF', 'Polarizado', 'Lavada']

function CarModel({ service, showAntes }) {
  const { scene: gltfScene } = useGLTF('/2014_toyota_corolla_e180_eu_with_interior.glb')
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene])

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        const zone = getMeshZone(child.name)
        let mat = null
        if (service) {
          mat = showAntes ? service.getAntes(zone) : service.getDespues(zone)
        }
        child.material = mat || getDefaultMaterial(zone)
      }
    })
  }, [scene, service, showAntes])

  return <primitive object={scene} scale={1} />
}

function SceneCanvas({ service, showAntes }) {
  return (
    <Canvas camera={{ position: [5, 3, 8], fov: 45 }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <directionalLight position={[-8, 6, -5]} intensity={0.4} />
      <directionalLight position={[0, -3, 3]} intensity={0.15} />
      <CarModel service={service} showAntes={showAntes} />
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
      width: '100vw', height: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', overflowX: 'hidden',
    }}>
      <div style={{
        padding: '12px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid #222',
        flexWrap: 'wrap', gap: '10px',
      }}>
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            Visualizador Detailing — Toyota Corolla
          </h1>
          <p style={{ color: '#666', margin: '2px 0 0', fontSize: '11px' }}>
            Arrastra para rotar • Scroll para zoom
          </p>
        </div>
        <button onClick={() => setCompareMode(!compareMode)} style={{
          padding: '8px 16px', background: compareMode ? '#00b4d8' : '#222',
          color: 'white', border: `1px solid ${compareMode ? '#00b4d8' : '#444'}`,
          borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
        }}>
          {compareMode ? '← Vista simple' : '⟺ Antes / Después'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {compareMode ? (
          <>
            <div style={{ flex: 1, position: 'relative', borderRight: '2px solid #00b4d8' }}>
              <div style={{
                position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)', color: '#aaa', padding: '3px 12px',
                borderRadius: '20px', zIndex: 10, fontSize: '12px', fontWeight: 'bold',
                border: '1px solid #444', whiteSpace: 'nowrap',
              }}>ANTES</div>
              <SceneCanvas service={selectedService} showAntes={true} />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,180,216,0.85)', color: 'white', padding: '3px 12px',
                borderRadius: '20px', zIndex: 10, fontSize: '12px', fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}>DESPUÉS • {selectedService.name}</div>
              <SceneCanvas service={selectedService} showAntes={false} />
            </div>
          </>
        ) : (
          <SceneCanvas service={selectedService} showAntes={false} />
        )}
      </div>

      <div style={{ borderTop: '1px solid #222', background: '#0f0f0f', padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => {
              setActiveCategory(cat)
              const first = SERVICES.find(s => s.category === cat)
              if (first) setSelectedService(first)
            }} style={{
              padding: '6px 18px', background: activeCategory === cat ? '#00b4d8' : '#1a1a1a',
              color: 'white', border: `1px solid ${activeCategory === cat ? '#00b4d8' : '#333'}`,
              borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
            }}>{cat}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {filteredServices.map(service => (
            <button key={service.id} onClick={() => setSelectedService(service)} style={{
              padding: '8px 16px',
              background: selectedService.id === service.id ? '#00b4d8' : '#1a1a1a',
              color: 'white',
              border: `2px solid ${selectedService.id === service.id ? '#00b4d8' : '#333'}`,
              borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
            }}>{service.name}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
