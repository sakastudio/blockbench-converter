import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { VoxelGrid } from '../types/voxel'

interface PreviewCanvasProps {
  voxelGrid: VoxelGrid | null
  originalModel: THREE.Group | null
  showOriginal?: boolean
}

function VoxelMesh({ voxelGrid }: { voxelGrid: VoxelGrid }) {
  const { geometry } = useMemo(() => {
    const positions: number[] = []
    const colorArray: number[] = []
    const indices: number[] = []

    const gridSize = {
      x: voxelGrid.boundingBox.max.x - voxelGrid.boundingBox.min.x,
      y: voxelGrid.boundingBox.max.y - voxelGrid.boundingBox.min.y,
      z: voxelGrid.boundingBox.max.z - voxelGrid.boundingBox.min.z,
    }
    const maxDim = Math.max(gridSize.x, gridSize.y, gridSize.z) || 1
    const scale = 10 / maxDim // Normalize to fit in view
    const voxelSize = (maxDim / voxelGrid.resolution) * scale

    const centerX = (voxelGrid.boundingBox.min.x + voxelGrid.boundingBox.max.x) / 2
    const centerY = (voxelGrid.boundingBox.min.y + voxelGrid.boundingBox.max.y) / 2
    const centerZ = (voxelGrid.boundingBox.min.z + voxelGrid.boundingBox.max.z) / 2

    // Create a simple cube for each voxel
    voxelGrid.voxels.forEach((voxel) => {
      const x = (voxel.position.x - centerX) * scale
      const y = (voxel.position.y - centerY) * scale
      const z = (voxel.position.z - centerZ) * scale

      const half = voxelSize / 2

      // 8 vertices of a cube
      const baseIndex = positions.length / 3
      const cubeVertices = [
        [x - half, y - half, z - half],
        [x + half, y - half, z - half],
        [x + half, y + half, z - half],
        [x - half, y + half, z - half],
        [x - half, y - half, z + half],
        [x + half, y - half, z + half],
        [x + half, y + half, z + half],
        [x - half, y + half, z + half],
      ]

      cubeVertices.forEach((v) => {
        positions.push(...v)
        colorArray.push(voxel.color.r / 255, voxel.color.g / 255, voxel.color.b / 255)
      })

      // 12 triangles (6 faces * 2 triangles)
      const cubeIndices = [
        0, 1, 2, 0, 2, 3, // front
        1, 5, 6, 1, 6, 2, // right
        5, 4, 7, 5, 7, 6, // back
        4, 0, 3, 4, 3, 7, // left
        3, 2, 6, 3, 6, 7, // top
        4, 5, 1, 4, 1, 0, // bottom
      ]

      cubeIndices.forEach((idx) => {
        indices.push(baseIndex + idx)
      })
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return { geometry: geo, colors: colorArray }
  }, [voxelGrid])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors />
    </mesh>
  )
}

function OriginalModel({ model }: { model: THREE.Group }) {
  const clonedModel = useMemo(() => {
    const clone = model.clone()
    // Center and scale
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 10 / maxDim

    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
    clone.scale.setScalar(scale)

    return clone
  }, [model])

  return <primitive object={clonedModel} />
}

export function PreviewCanvas({
  voxelGrid,
  originalModel,
  showOriginal = false,
}: PreviewCanvasProps) {
  if (!voxelGrid && !originalModel) {
    return (
      <div className="preview-canvas-empty">
        <p>モデルを読み込んでください</p>
      </div>
    )
  }

  return (
    <div className="preview-canvas">
      <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} />

        {voxelGrid && voxelGrid.voxels.length > 0 && (
          <VoxelMesh voxelGrid={voxelGrid} />
        )}

        {showOriginal && originalModel && (
          <OriginalModel model={originalModel} />
        )}

        <OrbitControls />
        <gridHelper args={[20, 20, 0x888888, 0x444444]} />
      </Canvas>
    </div>
  )
}
