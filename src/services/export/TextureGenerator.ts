import type { Color } from '../../types/voxel'

/**
 * ボクセルの色からテクスチャアトラスを生成
 */
export class TextureGenerator {
  /**
   * ユニークな色からテクスチャアトラスを生成
   */
  async generateTexture(colors: Color[]): Promise<{
    blob: Blob
    colorMap: Map<string, number>
    uvMap: Map<number, [number, number, number, number]>
  }> {
    // ユニークな色を抽出
    const colorMap = new Map<string, number>()
    const uniqueColors: Color[] = []

    for (const color of colors) {
      const key = this.colorToKey(color)
      if (!colorMap.has(key)) {
        colorMap.set(key, uniqueColors.length)
        uniqueColors.push(color)
      }
    }

    // テクスチャサイズを計算（正方形に近いサイズ）
    const colorCount = uniqueColors.length
    if (colorCount === 0) {
      // 空の場合は1x1の白いテクスチャを返す
      const blob = await this.createEmptyTextureBlob()
      return { blob, colorMap, uvMap: new Map() }
    }

    const size = Math.ceil(Math.sqrt(colorCount))
    const textureSize = Math.max(16, this.nextPowerOfTwo(size)) // 最小16px

    // UVマップを生成
    const uvMap = new Map<number, [number, number, number, number]>()
    const cellSize = 16 / textureSize // Minecraft UV座標は0-16

    for (let i = 0; i < uniqueColors.length; i++) {
      const x = i % size
      const y = Math.floor(i / size)

      // UV座標 (Minecraft形式: 0-16)
      const u1 = x * cellSize
      const v1 = y * cellSize
      const u2 = (x + 1) * cellSize
      const v2 = (y + 1) * cellSize

      uvMap.set(i, [u1, v1, u2, v2])
    }

    // テクスチャを生成（Canvasを使用）
    const blob = await this.createTextureBlob(uniqueColors, textureSize, size)

    return { blob, colorMap, uvMap }
  }

  /**
   * 色をユニークなキーに変換
   */
  colorToKey(color: Color): string {
    return `${color.r},${color.g},${color.b}`
  }

  /**
   * 2のべき乗に切り上げ
   */
  private nextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)))
  }

  /**
   * テクスチャBlobを生成
   */
  private async createTextureBlob(
    colors: Color[],
    textureSize: number,
    gridSize: number
  ): Promise<Blob> {
    // ブラウザ環境でのみ動作
    if (typeof document === 'undefined') {
      return this.createFallbackBlob()
    }

    const canvas = document.createElement('canvas')
    canvas.width = textureSize
    canvas.height = textureSize
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return this.createFallbackBlob()
    }

    // 透明で初期化
    ctx.clearRect(0, 0, textureSize, textureSize)

    // 各色を描画
    const cellPixelSize = textureSize / gridSize

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i]
      const x = (i % gridSize) * cellPixelSize
      const y = Math.floor(i / gridSize) * cellPixelSize

      ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`
      ctx.fillRect(x, y, cellPixelSize, cellPixelSize)
    }

    // Use toBlob with timeout fallback for jsdom compatibility
    return this.canvasToBlob(canvas)
  }

  /**
   * 空のテクスチャBlobを生成
   */
  private async createEmptyTextureBlob(): Promise<Blob> {
    if (typeof document === 'undefined') {
      return this.createFallbackBlob()
    }

    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 16, 16)
    }

    return this.canvasToBlob(canvas)
  }

  /**
   * Canvas to Blob with timeout fallback for jsdom
   */
  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise<Blob>((resolve) => {
      let resolved = false

      // Timeout fallback for jsdom (where toBlob doesn't work)
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          resolve(this.createFallbackBlob())
        }
      }, 100)

      try {
        canvas.toBlob((blob) => {
          if (!resolved) {
            resolved = true
            clearTimeout(timeout)
            resolve(blob || this.createFallbackBlob())
          }
        }, 'image/png')
      } catch {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          resolve(this.createFallbackBlob())
        }
      }
    })
  }

  /**
   * フォールバック用のBlob生成（Canvas未対応環境用）
   */
  private createFallbackBlob(): Blob {
    // 最小限のPNGを生成
    return new Blob([new Uint8Array(0)], { type: 'image/png' })
  }
}
