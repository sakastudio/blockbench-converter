import * as THREE from 'three'
import type { Vector3, Voxel, Color } from '../../types/voxel'

/**
 * ボクセルグリッドの構築
 */
export class GridBuilder {
  /**
   * バウンディングボックスからボクセルグリッドを初期化
   */
  createGrid(
    boundingBox: THREE.Box3,
    resolution: number
  ): { positions: Vector3[]; voxelSize: number } {
    const size = new THREE.Vector3()
    boundingBox.getSize(size)

    // 最大の軸に合わせてボクセルサイズを決定
    const maxDimension = Math.max(size.x, size.y, size.z)
    const voxelSize = maxDimension / resolution

    const positions: Vector3[] = []

    // 各軸のボクセル数を計算
    const countX = Math.ceil(size.x / voxelSize) || 1
    const countY = Math.ceil(size.y / voxelSize) || 1
    const countZ = Math.ceil(size.z / voxelSize) || 1

    // グリッド座標を生成（中心位置）
    for (let x = 0; x < countX; x++) {
      for (let y = 0; y < countY; y++) {
        for (let z = 0; z < countZ; z++) {
          positions.push({
            x: boundingBox.min.x + (x + 0.5) * voxelSize,
            y: boundingBox.min.y + (y + 0.5) * voxelSize,
            z: boundingBox.min.z + (z + 0.5) * voxelSize,
          })
        }
      }
    }

    return { positions, voxelSize }
  }

  /**
   * レイキャスト結果からボクセルを生成
   */
  buildVoxels(
    positions: Vector3[],
    hitResults: Map<string, { hit: boolean; color: Color }>
  ): Voxel[] {
    const voxels: Voxel[] = []

    for (const position of positions) {
      const key = this.positionToKey(position)
      const result = hitResults.get(key)

      if (result?.hit) {
        voxels.push({
          position,
          color: result.color,
        })
      }
    }

    return voxels
  }

  /**
   * 位置座標をマップキーに変換
   */
  positionToKey(position: Vector3): string {
    return `${position.x},${position.y},${position.z}`
  }
}
