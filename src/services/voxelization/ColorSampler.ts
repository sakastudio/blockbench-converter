import * as THREE from 'three'
import type { Color } from '../../types/voxel'

/**
 * メッシュ表面の色をサンプリングするクラス
 */
export class ColorSampler {
  // テクスチャのImageDataをキャッシュ
  private textureCache = new Map<THREE.Texture, { data: Uint8ClampedArray; width: number; height: number }>()

  /**
   * マテリアルから色を取得
   */
  sampleMaterialColor(material: THREE.Material | THREE.Material[]): Color {
    // 配列の場合は最初の要素を使用
    const mat = Array.isArray(material) ? material[0] : material

    // colorプロパティを持つマテリアルの場合
    if ('color' in mat && mat.color instanceof THREE.Color) {
      return this.threeColorToColor(mat.color)
    }

    // デフォルトは白
    return { r: 255, g: 255, b: 255 }
  }

  /**
   * テクスチャからUV座標で色を取得
   */
  sampleTextureColor(
    texture: THREE.Texture,
    uv: { x: number; y: number }
  ): Color {
    // キャッシュからImageDataを取得、なければ作成
    let cached = this.textureCache.get(texture)
    if (!cached) {
      const extracted = this.extractTextureData(texture)
      if (extracted) {
        this.textureCache.set(texture, extracted)
        cached = extracted
      } else {
        return { r: 255, g: 255, b: 255 }
      }
    }

    const { data, width, height } = cached

    // UV座標をピクセル座標に変換
    let x = Math.floor(uv.x * width) % width
    // flipYの設定に基づいてY座標を計算
    // flipY=true（デフォルト）: (1 - uv.y) で反転
    // flipY=false（GLTF）: uv.y をそのまま使用（画像は反転されていない）
    let y: number
    if (texture.flipY) {
      y = Math.floor((1 - uv.y) * height) % height
    } else {
      // GLTFLoaderはflipY=falseで読み込む
      // この場合、uv.y=0が画像の上端、uv.y=1が画像の下端に対応
      y = Math.floor(uv.y * height) % height
    }

    // 負の値の処理
    if (x < 0) x += width
    if (y < 0) y += height

    // ピクセルインデックスを計算
    const pixelIndex = (y * width + x) * 4

    return {
      r: data[pixelIndex],
      g: data[pixelIndex + 1],
      b: data[pixelIndex + 2],
    }
  }

  /**
   * テクスチャからImageDataを抽出
   */
  private extractTextureData(texture: THREE.Texture): { data: Uint8ClampedArray; width: number; height: number } | null {
    const image = texture.image

    if (!image) {
      return null
    }

    // Canvas経由でピクセルデータを取得
    let canvas: HTMLCanvasElement
    let ctx: CanvasRenderingContext2D | null

    if (image instanceof HTMLCanvasElement) {
      canvas = image
      ctx = canvas.getContext('2d')
    } else if (image instanceof HTMLImageElement) {
      canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(image, 0, 0)
      }
    } else if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
      // GLBファイルのテクスチャはImageBitmapとして読み込まれることが多い
      canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(image, 0, 0)
      }
    } else {
      return null
    }

    if (!ctx) {
      return null
    }

    // 全ピクセルデータを一度に取得してキャッシュ
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return {
      data: imageData.data,
      width: canvas.width,
      height: canvas.height,
    }
  }

  /**
   * THREE.Colorを独自のColor型に変換
   */
  threeColorToColor(threeColor: THREE.Color): Color {
    return {
      r: Math.round(threeColor.r * 255),
      g: Math.round(threeColor.g * 255),
      b: Math.round(threeColor.b * 255),
    }
  }

  /**
   * 色をユニークなキー文字列に変換
   */
  colorToKey(color: Color): string {
    return `${color.r},${color.g},${color.b}`
  }
}
