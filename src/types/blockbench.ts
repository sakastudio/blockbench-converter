/** Blockbench要素の面定義 */
export interface BlockbenchFace {
  uv: [number, number, number, number] // [x1, y1, x2, y2]
  texture: string // "#texture_name"
  cullface?: 'down' | 'up' | 'north' | 'south' | 'west' | 'east'
  rotation?: 0 | 90 | 180 | 270
}

// =====================================
// BBModel形式（.bbmodel）用の型定義
// =====================================

/** BBModel メタ情報 */
export interface BBModelMeta {
  format_version: string // "5.0"
  model_format: string // "java_block" | "free" など
  box_uv: boolean
}

/** BBModel テクスチャ（Base64内蔵） */
export interface BBModelTexture {
  uuid: string
  id: string // "0", "1", ...
  name: string
  source: string // "data:image/png;base64,..."
  mode: 'bitmap' | 'link'
  visible: boolean
  width?: number
  height?: number
  uv_width?: number
  uv_height?: number
}

/** BBModel 面定義（数値インデックス） */
export interface BBModelFace {
  uv: [number, number, number, number]
  texture: number | null // テクスチャインデックス（数値）
}

/** BBModel 要素（UUID付き） */
export interface BBModelElement {
  uuid: string
  name: string
  box_uv: boolean
  from: [number, number, number]
  to: [number, number, number]
  faces: {
    north?: BBModelFace
    south?: BBModelFace
    east?: BBModelFace
    west?: BBModelFace
    up?: BBModelFace
    down?: BBModelFace
  }
}

/** Display設定 */
export interface DisplayConfig {
  rotation?: [number, number, number]
  translation?: [number, number, number]
  scale?: [number, number, number]
}

/** BBModel 形式（.bbmodel） */
export interface BBModel {
  meta: BBModelMeta
  name: string
  resolution: { width: number; height: number }
  elements: BBModelElement[]
  outliner: string[] // element UUIDs
  textures: BBModelTexture[]
  display?: Record<string, DisplayConfig>
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
