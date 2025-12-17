/** 3次元座標 */
export interface Vector3 {
  x: number
  y: number
  z: number
}

/** RGB色情報 (0-255) */
export interface Color {
  r: number
  g: number
  b: number
}

/** 単一ボクセル */
export interface Voxel {
  position: Vector3
  color: Color
}

/** ボクセルグリッド */
export interface VoxelGrid {
  resolution: number
  voxels: Voxel[]
  boundingBox: {
    min: Vector3
    max: Vector3
  }
}

/** ボクセル化設定 */
export interface VoxelizationOptions {
  resolution: number // 8-64
  fillInterior: boolean
  colorSamplingMode: 'average' | 'dominant' | 'nearest'
}
