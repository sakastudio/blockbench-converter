import * as THREE from 'three'
import type { Color } from '../../types/voxel'

/**
 * メッシュ表面の色をサンプリングするクラス
 */
export class ColorSampler {
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
    const image = texture.image

    if (!image) {
      return { r: 255, g: 255, b: 255 }
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
    } else {
      return { r: 255, g: 255, b: 255 }
    }

    if (!ctx) {
      return { r: 255, g: 255, b: 255 }
    }

    // UV座標をピクセル座標に変換
    const x = Math.floor(uv.x * canvas.width) % canvas.width
    const y = Math.floor((1 - uv.y) * canvas.height) % canvas.height // Y軸反転

    const imageData = ctx.getImageData(x, y, 1, 1)
    const data = imageData.data

    return {
      r: data[0],
      g: data[1],
      b: data[2],
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
