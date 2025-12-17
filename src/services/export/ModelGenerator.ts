import type { BlockbenchElement, BlockbenchFace } from '../../types/blockbench'
import type { Voxel, VoxelGrid, Vector3 } from '../../types/voxel'

/**
 * ボクセル配列をBlockbench elements配列に変換
 */
export class ModelGenerator {
  /**
   * ボクセル配列をBlockbench要素に変換
   */
  generateElements(
    voxels: Voxel[],
    colorMap: Map<string, number>,
    uvMap: Map<number, [number, number, number, number]>,
    voxelSize: number,
    grid?: VoxelGrid
  ): BlockbenchElement[] {
    const elements: BlockbenchElement[] = []

    for (const voxel of voxels) {
      const colorKey = this.colorToKey(voxel.color)
      const colorIndex = colorMap.get(colorKey) ?? 0
      const uv = uvMap.get(colorIndex) ?? [0, 0, 16, 16]

      const { from, to } = grid
        ? this.normalizeCoordinates(voxel.position, voxelSize, grid)
        : this.calculateBounds(voxel.position, voxelSize)

      const face: BlockbenchFace = {
        uv: uv,
        texture: '#texture',
      }

      elements.push({
        from,
        to,
        faces: {
          down: { ...face },
          up: { ...face },
          north: { ...face },
          south: { ...face },
          west: { ...face },
          east: { ...face },
        },
      })
    }

    return elements
  }

  /**
   * 座標を-16〜32の範囲に正規化
   */
  normalizeCoordinates(
    position: Vector3,
    voxelSize: number,
    grid: VoxelGrid
  ): { from: [number, number, number]; to: [number, number, number] } {
    // グリッドのサイズを計算
    const gridSize = {
      x: grid.boundingBox.max.x - grid.boundingBox.min.x,
      y: grid.boundingBox.max.y - grid.boundingBox.min.y,
      z: grid.boundingBox.max.z - grid.boundingBox.min.z,
    }

    // Minecraftの座標範囲（-16〜32、合計48ユニット）に収める
    // モデルを0-16の範囲に収めるのが標準
    const maxGridDim = Math.max(gridSize.x, gridSize.y, gridSize.z) || 1
    const scale = 16 / maxGridDim

    // 正規化された位置（0-16範囲）
    const normalizedX = (position.x - grid.boundingBox.min.x) * scale
    const normalizedY = (position.y - grid.boundingBox.min.y) * scale
    const normalizedZ = (position.z - grid.boundingBox.min.z) * scale

    // ボクセルサイズも正規化
    const normalizedVoxelSize = voxelSize * scale

    // from/to座標
    const halfSize = normalizedVoxelSize / 2

    return {
      from: [
        Math.round((normalizedX - halfSize) * 100) / 100,
        Math.round((normalizedY - halfSize) * 100) / 100,
        Math.round((normalizedZ - halfSize) * 100) / 100,
      ],
      to: [
        Math.round((normalizedX + halfSize) * 100) / 100,
        Math.round((normalizedY + halfSize) * 100) / 100,
        Math.round((normalizedZ + halfSize) * 100) / 100,
      ],
    }
  }

  /**
   * 単純な境界計算（正規化なし）
   */
  private calculateBounds(
    position: Vector3,
    voxelSize: number
  ): { from: [number, number, number]; to: [number, number, number] } {
    const halfSize = voxelSize / 2

    return {
      from: [
        position.x - halfSize,
        position.y - halfSize,
        position.z - halfSize,
      ],
      to: [
        position.x + halfSize,
        position.y + halfSize,
        position.z + halfSize,
      ],
    }
  }

  /**
   * 色をキーに変換
   */
  private colorToKey(color: { r: number; g: number; b: number }): string {
    return `${color.r},${color.g},${color.b}`
  }
}
