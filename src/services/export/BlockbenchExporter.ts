import type { BlockbenchModel, BBModel, DisplayConfig } from '../../types/blockbench'
import type { VoxelGrid } from '../../types/voxel'
import { TextureGenerator } from './TextureGenerator'
import { ModelGenerator } from './ModelGenerator'

export interface ExportResult {
  modelJson: BlockbenchModel
  textureData: Blob
  textureName: string
}

export interface BBModelExportResult {
  bbmodel: BBModel
  jsonString: string
}

/**
 * ボクセルグリッドをBlockbench形式に変換
 */
export class BlockbenchExporter {
  private textureGenerator: TextureGenerator
  private modelGenerator: ModelGenerator

  constructor() {
    this.textureGenerator = new TextureGenerator()
    this.modelGenerator = new ModelGenerator()
  }

  /**
   * ボクセルグリッドをBlockbench形式に変換
   */
  async export(voxelGrid: VoxelGrid): Promise<ExportResult> {
    // 色を抽出
    const colors = voxelGrid.voxels.map((v) => v.color)

    // テクスチャを生成
    const { blob, colorMap, uvMap } = await this.textureGenerator.generateTexture(colors)

    // ボクセルサイズを計算
    const gridSize = {
      x: voxelGrid.boundingBox.max.x - voxelGrid.boundingBox.min.x,
      y: voxelGrid.boundingBox.max.y - voxelGrid.boundingBox.min.y,
      z: voxelGrid.boundingBox.max.z - voxelGrid.boundingBox.min.z,
    }
    const maxDim = Math.max(gridSize.x, gridSize.y, gridSize.z) || 1
    const voxelSize = maxDim / voxelGrid.resolution

    // 要素を生成
    const elements = this.modelGenerator.generateElements(
      voxelGrid.voxels,
      colorMap,
      uvMap,
      voxelSize,
      voxelGrid
    )

    // モデルJSONを構築
    const modelJson: BlockbenchModel = {
      credit: 'Created with Blockbench Converter',
      textures: {
        texture: 'texture.png',
      },
      elements,
      display: {
        gui: {
          rotation: [30, 225, 0],
          translation: [0, 0, 0],
          scale: [0.625, 0.625, 0.625],
        },
        ground: {
          rotation: [0, 0, 0],
          translation: [0, 3, 0],
          scale: [0.25, 0.25, 0.25],
        },
        fixed: {
          rotation: [0, 0, 0],
          translation: [0, 0, 0],
          scale: [0.5, 0.5, 0.5],
        },
        thirdperson_righthand: {
          rotation: [75, 45, 0],
          translation: [0, 2.5, 0],
          scale: [0.375, 0.375, 0.375],
        },
        firstperson_righthand: {
          rotation: [0, 45, 0],
          translation: [0, 0, 0],
          scale: [0.4, 0.4, 0.4],
        },
      },
    }

    return {
      modelJson,
      textureData: blob,
      textureName: 'texture.png',
    }
  }

  /**
   * ボクセルグリッドをBBModel形式（.bbmodel）でエクスポート
   * テクスチャはBase64で内蔵
   */
  async exportAsBBModel(voxelGrid: VoxelGrid, modelName = 'model'): Promise<BBModelExportResult> {
    // 色を抽出
    const colors = voxelGrid.voxels.map((v) => v.color)

    // テクスチャをBase64で生成
    const { base64DataUri, colorMap, uvMap, width, height } =
      await this.textureGenerator.generateTextureAsBase64(colors)

    // ボクセルサイズを計算
    const gridSize = {
      x: voxelGrid.boundingBox.max.x - voxelGrid.boundingBox.min.x,
      y: voxelGrid.boundingBox.max.y - voxelGrid.boundingBox.min.y,
      z: voxelGrid.boundingBox.max.z - voxelGrid.boundingBox.min.z,
    }
    const maxDim = Math.max(gridSize.x, gridSize.y, gridSize.z) || 1
    const voxelSize = maxDim / voxelGrid.resolution

    // BBModel形式の要素を生成
    const elements = this.modelGenerator.generateBBModelElements(
      voxelGrid.voxels,
      colorMap,
      uvMap,
      voxelSize,
      voxelGrid
    )

    // テクスチャUUID生成
    const textureUuid = this.generateUUID()

    // Display設定
    const display: Record<string, DisplayConfig> = {
      gui: {
        rotation: [30, 225, 0],
        translation: [0, 0, 0],
        scale: [0.625, 0.625, 0.625],
      },
      ground: {
        rotation: [0, 0, 0],
        translation: [0, 3, 0],
        scale: [0.25, 0.25, 0.25],
      },
      fixed: {
        rotation: [0, 0, 0],
        translation: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
      },
      thirdperson_righthand: {
        rotation: [75, 45, 0],
        translation: [0, 2.5, 0],
        scale: [0.375, 0.375, 0.375],
      },
      firstperson_righthand: {
        rotation: [0, 45, 0],
        translation: [0, 0, 0],
        scale: [0.4, 0.4, 0.4],
      },
    }

    // BBModelオブジェクトを構築
    const bbmodel: BBModel = {
      meta: {
        format_version: '5.0',
        model_format: 'java_block',
        box_uv: false,
      },
      name: modelName,
      resolution: {
        width: width,
        height: height,
      },
      elements,
      outliner: elements.map((e) => e.uuid),
      textures: [
        {
          uuid: textureUuid,
          id: '0',
          name: 'texture',
          source: base64DataUri,
          mode: 'bitmap',
          visible: true,
          width: width,
          height: height,
          uv_width: width,
          uv_height: height,
        },
      ],
      display,
    }

    return {
      bbmodel,
      jsonString: JSON.stringify(bbmodel, null, 2),
    }
  }

  /**
   * UUID生成
   */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // フォールバック実装
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
}
