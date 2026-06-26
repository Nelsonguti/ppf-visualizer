import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'

// Clasificación usando propiedades REALES del material original del GLB
function getMeshZone(child) {
  const mat = Array.isArray(child.material) ? child.material[0] : child.material
  const n = ((child.name || '') + ' ' + (mat?.name || '')).toLowerCase()

  // VIDRIO: detectado por transparencia real del material (no por nombre)
  if (mat?.transparent && mat?.opacity < 0.7) return 'glass'
  if (n.includes('glass') || n.includes('window') || n.includes('wind') || n.includes('vidr')) return 'glass'

  // LUCES: detectado por color emisivo real del material
  if (mat?.emissive) {
    const { r, g, b } = mat.emissive
    if (r + g + b > 0.1) return 'light'
  }
  if (n.includes('light') || n.includes('lamp') || n.includes('lens') || n.includes('faro')) return 'light'

  // RUEDAS: material oscuro tipo caucho
  if (n.includes('wheel') || n.includes('tire') || n.includes('rim') || n.includes('llanta')) return 'wheel'
  if (mat?.color) {
    const br = (mat.color.r + mat.color.g + mat.color.b) / 3
    if (br < 0.06 && (mat?.roughness || 0) > 0.7 && !mat?.transparent) return 'wheel'
  }

  // INTERIOR: palabras clave del mesh o material
  if (n.includes('interior') || n.includes('seat') || n.includes('dash') || n.includes('cabin') ||
      n.includes('console') || n.includes('steering') || n.includes('carpet') || n.includes('floor') ||
      n.includes('headliner') || n.includes('asiento') || n.includes('tablero') || n.includes('volante') ||
      n.includes('pillar') || n.includes('armrest') || n.includes('upholstery') || n.includes('fabric')) return 'interior'

  return 'body'
}

function carPaint(hex, roughness = 0.4, clearcoat = 0.85, ccRough = 0.12) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex), roughness, metalness: 0,
    clearcoat, clearcoatRoughness: ccRough, envMapIntensity: 0.28,
  })
}

const SERVICES = [
  { id: 'ppf-transp',    name: 'Transparente',    category: 'PPF',
    apply: (z) => z === 'body' ? carPaint('#aac8d8', 0.06, 1.0, 0.03) : null },
  { id: 'ppf-negro-mate', name: 'Negro Mate',     category: 'PPF',
    apply: (z) => z === 'body' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0d0d0d'), roughness: 0.93, metalness: 0, envMapIntensity: 0.03 }) : null },
  { id: 'ppf-negro-bri', name: 'Negro Brillante', category: 'PPF',
    apply: (z) => z === 'body' ? carPaint('#080808', 0.04, 1.0, 0.02) : null },
  { id: 'ppf-gris',     name: 'Gris',             category: 'PPF',
    apply: (z) => z === 'body' ? carPaint('#505050', 0.12, 1.0, 0.04) : null },
  { id: 'ppf-azul',     name: 'Azul',             category: 'PPF',
    apply: (z) => z === 'body' ? carPaint('#0a1628', 0.1,  1.0, 0.04) : null },
  { id: 'ppf-rojo',     name: 'Rojo',             category: 'PPF',
    apply: (z) => z === 'body' ? carPaint('#8b0000', 0.1,  1.0, 0.04) : null },
  { id: 'pol-35', name: 'Medio (35%)',  category: 'Polarizado',
    apply: (z) => z === 'glass' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#040404'), roughness: 0.02, metalness: 0,
      transparent: true, opacity: 0.72, envMapIntensity: 0.2 }) : null },
  { id: 'pol-20', name: 'Oscuro (20%)', category: 'Polarizado',
    apply: (z) => z === 'glass' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#020202'), roughness: 0.02, metalness: 0,
      transparent: true, opacity: 0.88, envMapIntensity: 0.2 }) : null },
  { id: 'pol-5',  name: 'Total (5%)',   category: 'Polarizado',
    apply: (z) => z === 'glass' ? new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#010101'), roughness: 0.02, metalness: 0,
      transparent: true, opacity: 0.97, envMapIntensity: 0.15 }) : null },
  { id: 'lav-bas', name: 'Lavada Básica',   category: 'Lavada',
    apply: (z) => z === 'body' ? carPaint('#a0a0a0', 0.22, 0.75, 0.14) : null },
  { id: 'lav-prm', name: 'Premium + Cera', category: 'Lavada',
    apply: (z) => {
      if (z === 'body')  return carPaint('#b0b0b0', 0.05, 1.0, 0.03)
      if (z === 'wheel') return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#181818'), roughness: 0.25, metalness: 0.78, envMapIntensity: 0.4 })
      return null
    }},
]

const CATEGORIES = ['PPF', 'Polarizado', 'Lavada']

// ANTES: auto 100% original, sin modificar nada
function CarOriginal() {
  const { scene: s } = useGLTF('/2014_toyota_corolla_e180_eu_with_interior.glb')
  const scene = useMemo(() => s.clone(true), [s])
  return <primitive object={scene} scale={1} />
}

// DESPUÉS: preserva materiales originales, solo aplica el servicio donde corresponde
function CarWithService({ service }) {
  const { scene: s } = useGLTF('/2014_toyota_corolla_e180_eu_with_interior.glb')
  const scene = useMemo(() => s.clone(true), [s])

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        const zone = getMeshZone(child)
        const newMat = service?.apply(zone)
        if (newMat) child.material = newMat
        // Sin newMat → mantiene el material ORIGINAL del GLB
      }
    })
  }, [scene, service])

  return <primitive object={scene} scale={1} />
}

function View({ original, service }) {
  return (
    <Canvas camera={{ position: [5, 3, 8], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <directionalLight position={[-8, 6, -5]} intensity={0.4} />
      <directionalLight position={[0, -3, 3]} intensity={0.15} />
      {original ? <CarOriginal /> : <CarWithService service={service} />}
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={11} maxPolarAngle={1.4} />
      <Environment preset="city" />
    </Canvas>
  )
}

export default function App() {
  const [cat, setCat] = useState('PPF')
  const [svc, setSvc] = useState(SERVICES[0])
  const [compare, setCompare] = useState(false)
  const list = SERVICES.filter(s => s.category === cat)

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#0a0a0a', display:'flex', flexDirection:'column', fontFamily:'sans-serif', overflowX:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #222', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ color:'white', margin:0, fontSize:'18px', fontWeight:'bold' }}>Visualizador Detailing — Toyota Corolla</h1>
          <p style={{ color:'#555', margin:'2px 0 0', fontSize:'11px' }}>Arrastra para rotar • Scroll para zoom</p>
        </div>
        <button onClick={() => setCompare(!compare)} style={{ padding:'8px 16px', background: compare ? '#00b4d8' : '#222', color:'white', border:`1px solid ${compare ? '#00b4d8' : '#444'}`, borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'13px' }}>
          {compare ? '← Vista simple' : '⟺ Antes / Después'}
        </button>
      </div>

      {/* Vistas */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {compare ? (
          <>
            <div style={{ flex:1, position:'relative', borderRight:'2px solid #00b4d8' }}>
              <span style={{ position:'absolute', top:'10px', left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.75)', color:'#aaa', padding:'3px 12px', borderRadius:'20px', zIndex:10, fontSize:'12px', fontWeight:'bold', border:'1px solid #444', whiteSpace:'nowrap' }}>ANTES</span>
              <View original={true} service={null} />
            </div>
            <div style={{ flex:1, position:'relative' }}>
              <span style={{ position:'absolute', top:'10px', left:'50%', transform:'translateX(-50%)', background:'rgba(0,180,216,0.85)', color:'white', padding:'3px 12px', borderRadius:'20px', zIndex:10, fontSize:'12px', fontWeight:'bold', whiteSpace:'nowrap' }}>DESPUÉS • {svc.name}</span>
              <View original={false} service={svc} />
            </div>
          </>
        ) : (
          <View original={false} service={svc} />
        )}
      </div>

      {/* Controles */}
      <div style={{ borderTop:'1px solid #222', background:'#0f0f0f', padding:'12px 20px' }}>
        <div style={{ display:'flex', gap:'8px', marginBottom:'12px', justifyContent:'center' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCat(c); const f=SERVICES.find(s=>s.category===c); if(f) setSvc(f) }} style={{ padding:'6px 18px', background: cat===c ? '#00b4d8' : '#1a1a1a', color:'white', border:`1px solid ${cat===c ? '#00b4d8' : '#333'}`, borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'13px' }}>{c}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
          {list.map(s => (
            <button key={s.id} onClick={() => setSvc(s)} style={{ padding:'8px 16px', background: svc.id===s.id ? '#00b4d8' : '#1a1a1a', color:'white', border:`2px solid ${svc.id===s.id ? '#00b4d8' : '#333'}`, borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'13px' }}>{s.name}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
