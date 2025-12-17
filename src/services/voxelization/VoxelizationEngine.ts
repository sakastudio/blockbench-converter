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

      // 6方向からレイキャスト（全方向チェックして色を収集）
      const allColors: Color[] = []

      for (const dir of directions) {
        raycaster.set(origin, dir)

        for (const mesh of preparedMeshes) {
          const intersects = raycaster.intersectObject(mesh)

          if (intersects.length > 0) {
            const intersection = intersects[0]
            const distance = intersection.distance

            // ボクセル内の距離かチェック
            if (distance <= voxelSize) {
              const sampledColor = this.sampleColorFromIntersection(mesh, intersection)
              allColors.push(sampledColor)
              break // このメッシュでヒットしたら次の方向へ
            }
          }
        }
      }

      // ヒットした色の平均を計算
      const hit = allColors.length > 0
      const color: Color = hit
        ? this.averageColors(allColors)
        : { r: 255, g: 255, b: 255 }

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
    // マテリアルを取得（配列の場合はfaceのmaterialIndexを使用）
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
    const vertexColor = this.sampleVertexColor(mesh, intersection)
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
      // マテリアル配列の場合、faceのmaterialIndexを使用
      const materialIndex = intersection.face?.materialIndex ?? 0
      return material[materialIndex] || material[0]
    }

    return material
  }

  /**
   * 頂点カラーをサンプリング
   */
  private sampleVertexColor(
    mesh: THREE.Mesh,
    intersection: THREE.Intersection
  ): Color | null {
    const geometry = mesh.geometry
    const colorAttribute = geometry.getAttribute('color')

    if (!colorAttribute || !intersection.face) {
      return null
    }

    const face = intersection.face
    const { a, b, c } = face

    // 重心座標を使用して頂点カラーを補間
    // intersection.point から重心座標を計算
    const barycoord = this.computeBarycentricCoordinates(mesh, intersection)
    if (!barycoord) {
      // 重心座標が計算できない場合は最初の頂点の色を使用
      return {
        r: Math.round(colorAttribute.getX(a) * 255),
        g: Math.round(colorAttribute.getY(a) * 255),
        b: Math.round(colorAttribute.getZ(a) * 255),
      }
    }

    // 3頂点の色を取得
    const colorA = new THREE.Color(
      colorAttribute.getX(a),
      colorAttribute.getY(a),
      colorAttribute.getZ(a)
    )
    const colorB = new THREE.Color(
      colorAttribute.getX(b),
      colorAttribute.getY(b),
      colorAttribute.getZ(b)
    )
    const colorC = new THREE.Color(
      colorAttribute.getX(c),
      colorAttribute.getY(c),
      colorAttribute.getZ(c)
    )

    // 重心座標で補間
    const interpolatedColor = new THREE.Color()
    interpolatedColor.r = colorA.r * barycoord.x + colorB.r * barycoord.y + colorC.r * barycoord.z
    interpolatedColor.g = colorA.g * barycoord.x + colorB.g * barycoord.y + colorC.g * barycoord.z
    interpolatedColor.b = colorA.b * barycoord.x + colorB.b * barycoord.y + colorC.b * barycoord.z

    return this.colorSampler.threeColorToColor(interpolatedColor)
  }

  /**
   * 重心座標を計算
   */
  private computeBarycentricCoordinates(
    mesh: THREE.Mesh,
    intersection: THREE.Intersection
  ): THREE.Vector3 | null {
    if (!intersection.face) {
      return null
    }

    const geometry = mesh.geometry
    const position = geometry.getAttribute('position')
    const face = intersection.face

    // 頂点座標を取得
    const vA = new THREE.Vector3().fromBufferAttribute(position, face.a)
    const vB = new THREE.Vector3().fromBufferAttribute(position, face.b)
    const vC = new THREE.Vector3().fromBufferAttribute(position, face.c)

    // ワールド座標に変換
    vA.applyMatrix4(mesh.matrixWorld)
    vB.applyMatrix4(mesh.matrixWorld)
    vC.applyMatrix4(mesh.matrixWorld)

    // 交差点
    const point = intersection.point

    // 重心座標を計算
    const barycoord = new THREE.Vector3()
    THREE.Triangle.getBarycoord(point, vA, vB, vC, barycoord)

    return barycoord
  }

  /**
   * 複数の色の平均を計算
   */
  private averageColors(colors: Color[]): Color {
    if (colors.length === 0) {
      return { r: 255, g: 255, b: 255 }
    }

    if (colors.length === 1) {
      return colors[0]
    }

    let totalR = 0
    let totalG = 0
    let totalB = 0

    for (const color of colors) {
      totalR += color.r
      totalG += color.g
      totalB += color.b
    }

    return {
      r: Math.round(totalR / colors.length),
      g: Math.round(totalG / colors.length),
      b: Math.round(totalB / colors.length),
    }
  }
}
