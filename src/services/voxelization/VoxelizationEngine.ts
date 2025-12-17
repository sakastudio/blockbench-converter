import * as THREE from 'three'
import type { VoxelGrid, VoxelizationOptions, Color } from '../../types/voxel'
import { MeshProcessor } from './MeshProcessor'
import { GridBuilder } from './GridBuilder'
import { ColorSampler } from './ColorSampler'

/**
 * 3DメッシュをボクセルグリッドVolに変換するエンジン
 */
export class VoxelizationEngine {
  private meshProcessor: MeshProcessor
  private gridBuilder: GridBuilder
  private colorSampler: ColorSampler

  constructor() {
    this.meshProcessor = new MeshProcessor()
    this.gridBuilder = new GridBuilder()
    this.colorSampler = new ColorSampler()
  }

  /**
   * 3Dメッシュをボクセルグリッドに変換する
   */
  async voxelize(
    model: THREE.Mesh | THREE.Group,
    options: VoxelizationOptions,
    onProgress?: (progress: number) => void
  ): Promise<VoxelGrid> {
    // 進捗報告
    const reportProgress = (value: number) => {
      if (onProgress) {
        onProgress(Math.min(100, Math.max(0, value)))
      }
    }

    reportProgress(0)

    // メッシュを抽出
    let meshes: THREE.Mesh[]
    if (model instanceof THREE.Mesh) {
      meshes = [model]
    } else {
      meshes = this.meshProcessor.extractMeshes(model)
    }

    if (meshes.length === 0) {
      return {
        resolution: options.resolution,
        voxels: [],
        boundingBox: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 },
        },
      }
    }

    reportProgress(10)

    // メッシュを準備（BVH構築）
    const preparedMeshes = meshes.map((mesh) => this.meshProcessor.prepareMesh(mesh))

    reportProgress(20)

    // バウンディングボックスを計算
    const boundingBox = this.computeBoundingBox(model)

    // グリッド座標を生成
    const { positions, voxelSize } = this.gridBuilder.createGrid(
      boundingBox,
      options.resolution
    )

    reportProgress(30)

    // レイキャストで各位置をテスト
    const hitResults = new Map<string, { hit: boolean; color: Color }>()
    const raycaster = new THREE.Raycaster()
    raycaster.firstHitOnly = true

    const totalPositions = positions.length
    const directions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ]

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      const key = this.gridBuilder.positionToKey(pos)
      const origin = new THREE.Vector3(pos.x, pos.y, pos.z)

      let hit = false
      let color: Color = { r: 255, g: 255, b: 255 }

      // 6方向からレイキャスト
      for (const dir of directions) {
        raycaster.set(origin, dir)

        for (const mesh of preparedMeshes) {
          const intersects = raycaster.intersectObject(mesh)

          if (intersects.length > 0) {
            const intersection = intersects[0]
            const distance = intersection.distance

            // ボクセル内の距離かチェック
            if (distance <= voxelSize) {
              hit = true
              color = this.sampleColorFromIntersection(mesh, intersection)
              break
            }
          }
        }

        if (hit) break
      }

      hitResults.set(key, { hit, color })

      // 進捗更新（30-90%の範囲）
      if (i % 100 === 0) {
        reportProgress(30 + (i / totalPositions) * 60)
      }
    }

    reportProgress(90)

    // ボクセルを生成
    const voxels = this.gridBuilder.buildVoxels(positions, hitResults)

    reportProgress(100)

    return {
      resolution: options.resolution,
      voxels,
      boundingBox: {
        min: { x: boundingBox.min.x, y: boundingBox.min.y, z: boundingBox.min.z },
        max: { x: boundingBox.max.x, y: boundingBox.max.y, z: boundingBox.max.z },
      },
    }
  }

  /**
   * モデルのバウンディングボックスを計算
   */
  computeBoundingBox(model: THREE.Object3D): THREE.Box3 {
    const box = new THREE.Box3()
    box.setFromObject(model)
    return box
  }

  /**
   * 交差点から色をサンプリング
   */
  private sampleColorFromIntersection(
    mesh: THREE.Mesh,
    intersection: THREE.Intersection
  ): Color {
    const material = mesh.material

    // テクスチャがある場合はUVから色を取得
    if (
      intersection.uv &&
      material &&
      !Array.isArray(material) &&
      'map' in material &&
      material.map instanceof THREE.Texture
    ) {
      return this.colorSampler.sampleTextureColor(material.map, {
        x: intersection.uv.x,
        y: intersection.uv.y,
      })
    }

    // マテリアルの色を使用
    return this.colorSampler.sampleMaterialColor(material)
  }
}
