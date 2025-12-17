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

  /**
   * 頂点カラーをサンプリング
   */
  sampleVertexColor(
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

    return this.threeColorToColor(interpolatedColor)
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
  averageColors(colors: Color[]): Color {
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
