/** Blockbench要素の面定義 */
export interface BlockbenchFace {
  uv: [number, number, number, number] // [x1, y1, x2, y2]
  texture: string // "#texture_name"
  cullface?: 'down' | 'up' | 'north' | 'south' | 'west' | 'east'
  rotation?: 0 | 90 | 180 | 270
}

/** Blockbench要素（立方体） */
export interface BlockbenchElement {
  from: [number, number, number]
  to: [number, number, number]
  faces: {
    down?: BlockbenchFace
    up?: BlockbenchFace
    north?: BlockbenchFace
    south?: BlockbenchFace
    west?: BlockbenchFace
    east?: BlockbenchFace
  }
}

/** Blockbenchモデル形式 */
export interface BlockbenchModel {
  credit?: string
  textures: Record<string, string>
  elements: BlockbenchElement[]
  display?: Record<
    string,
    {
      rotation?: [number, number, number]
      translation?: [number, number, number]
      scale?: [number, number, number]
    }
  >
}
