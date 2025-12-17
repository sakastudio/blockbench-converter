import * as THREE from 'three'
import type { VoxelGrid, VoxelizationOptions, Color, Vector3 } from '../../types/voxel'
import { MeshProcessor } from './MeshProcessor'
import { GridBuilder } from './GridBuilder'
import { ColorSampler } from './ColorSampler'

/** レイキャスト結果 */
interface HitResult {
  hit: boolean
  color: Color
}

/** 6方向のレイキャスト方向 */
const RAY_DIRECTIONS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
] as const

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
    const reportProgress = this.createProgressReporter(onProgress)

    reportProgress(0)

    // メッシュを抽出・準備
    const meshes = this.prepareMeshes(model)
    if (meshes.length === 0) {
      return this.createEmptyGrid(options.resolution)
    }

    reportProgress(10)

    // メッシュを準備（BVH構築）
    const preparedMeshes = meshes.map((mesh) => this.meshProcessor.prepareMesh(mesh))

    reportProgress(20)

    // バウンディングボックスとグリッドを生成
    const boundingBox = this.computeBoundingBox(model)
    const { positions, voxelSize } = this.gridBuilder.createGrid(boundingBox, options.resolution)

    reportProgress(30)

    // レイキャストで各位置をテスト
    const hitResults = this.castRaysAndCollectHits(
      preparedMeshes,
      positions,
      voxelSize,
      reportProgress
    )

    reportProgress(90)

    // ボクセルを生成
    const voxels = this.gridBuilder.buildVoxels(positions, hitResults)

    reportProgress(100)

    return this.buildResult(options.resolution, voxels, boundingBox)
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
   * モデルからメッシュを抽出
   */
  private prepareMeshes(model: THREE.Mesh | THREE.Group): THREE.Mesh[] {
    if (model instanceof THREE.Mesh) {
      return [model]
    }
    return this.meshProcessor.extractMeshes(model)
  }

  /**
   * 6方向レイキャストで交差判定と色収集
   */
  private castRaysAndCollectHits(
    meshes: THREE.Mesh[],
    positions: Vector3[],
    voxelSize: number,
    reportProgress: (value: number) => void
  ): Map<string, HitResult> {
    const hitResults = new Map<string, HitResult>()
    const raycaster = new THREE.Raycaster()
    raycaster.firstHitOnly = true

    const totalPositions = positions.length

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      const key = this.gridBuilder.positionToKey(pos)
      const result = this.castRaysAtPosition(raycaster, meshes, pos, voxelSize)
      hitResults.set(key, result)

      // 進捗更新（30-90%の範囲）
      if (i % 100 === 0) {
        reportProgress(30 + (i / totalPositions) * 60)
      }
    }

    return hitResults
  }

  /**
   * 特定位置で6方向レイキャストを実行
   */
  private castRaysAtPosition(
    raycaster: THREE.Raycaster,
    meshes: THREE.Mesh[],
    pos: Vector3,
    voxelSize: number
  ): HitResult {
    const origin = new THREE.Vector3(pos.x, pos.y, pos.z)
    const allColors: Color[] = []

    for (const dir of RAY_DIRECTIONS) {
      raycaster.set(origin, dir)

      for (const mesh of meshes) {
        const intersects = raycaster.intersectObject(mesh)

        if (intersects.length > 0 && intersects[0].distance <= voxelSize) {
          const sampledColor = this.sampleColorFromIntersection(mesh, intersects[0])
          allColors.push(sampledColor)
          break // このメッシュでヒットしたら次の方向へ
        }
      }
    }

    return {
      hit: allColors.length > 0,
      color: allColors.length > 0
        ? this.colorSampler.averageColors(allColors)
        : { r: 255, g: 255, b: 255 },
    }
  }

  /**
   * 交差点から色をサンプリング
   */
  private sampleColorFromIntersection(
    mesh: THREE.Mesh,
    intersection: THREE.Intersection
  ): Color {
    const material = this.getMaterialForFace(mesh, intersection)

    // 1. テクスチャがある場合はUVから色を取得
    if (
      intersection.uv &&
      material &&
      'map' in material &&
      material.map instanceof THREE.Texture
    ) {
      return this.colorSampler.sampleTextureColor(material.map, {
        x: intersection.uv.x,
        y: intersection.uv.y,
      })
    }

    // 2. 頂点カラーがある場合はサンプリング
    const vertexColor = this.colorSampler.sampleVertexColor(mesh, intersection)
    if (vertexColor) {
      return vertexColor
    }

    // 3. マテリアルの色を使用
    return this.colorSampler.sampleMaterialColor(material)
  }

  /**
   * 交差した面に対応するマテリアルを取得
   */
  private getMaterialForFace(
    mesh: THREE.Mesh,
    intersection: THREE.Intersection
  ): THREE.Material {
    const material = mesh.material

    if (Array.isArray(material)) {
      const materialIndex = intersection.face?.materialIndex ?? 0
      return material[materialIndex] || material[0]
    }

    return material
  }

  /**
   * 進捗報告関数を生成
   */
  private createProgressReporter(
    onProgress?: (progress: number) => void
  ): (value: number) => void {
    return (value: number) => {
      if (onProgress) {
        onProgress(Math.min(100, Math.max(0, value)))
      }
    }
  }

  /**
   * 空のボクセルグリッドを生成
   */
  private createEmptyGrid(resolution: number): VoxelGrid {
    return {
      resolution,
      voxels: [],
      boundingBox: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      },
    }
  }

  /**
   * 最終結果を構築
   */
  private buildResult(
    resolution: number,
    voxels: { position: Vector3; color: Color }[],
    boundingBox: THREE.Box3
  ): VoxelGrid {
    return {
      resolution,
      voxels,
      boundingBox: {
        min: { x: boundingBox.min.x, y: boundingBox.min.y, z: boundingBox.min.z },
        max: { x: boundingBox.max.x, y: boundingBox.max.y, z: boundingBox.max.z },
      },
    }
  }
}
