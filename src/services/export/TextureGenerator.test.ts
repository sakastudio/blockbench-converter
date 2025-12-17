import { describe, it, expect } from 'vitest'
import { TextureGenerator } from './TextureGenerator'
import type { Color } from '../../types/voxel'

describe('TextureGenerator', () => {
  describe('generateTexture', () => {
    it('should create colorMap with indices for unique colors', async () => {
      const colors: Color[] = [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
      ]

      const generator = new TextureGenerator()
      const result = await generator.generateTexture(colors)

      expect(result.colorMap.size).toBe(3)
      expect(result.colorMap.get('255,0,0')).toBe(0)
      expect(result.colorMap.get('0,255,0')).toBe(1)
      expect(result.colorMap.get('0,0,255')).toBe(2)
    })

    it('should deduplicate identical colors', async () => {
      const colors: Color[] = [
        { r: 255, g: 0, b: 0 },
        { r: 255, g: 0, b: 0 }, // duplicate
        { r: 0, g: 255, b: 0 },
      ]

      const generator = new TextureGenerator()
      const result = await generator.generateTexture(colors)

      expect(result.colorMap.size).toBe(2) // Only 2 unique colors
    })

    it('should generate uvMap for each color index', async () => {
      const colors: Color[] = [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
      ]

      const generator = new TextureGenerator()
      const result = await generator.generateTexture(colors)

      expect(result.uvMap.size).toBe(2)
      // Each UV should be a [x1, y1, x2, y2] tuple
      const uv0 = result.uvMap.get(0)
      expect(uv0).toBeDefined()
      expect(uv0).toHaveLength(4)
    })

    it('should return a Blob', async () => {
      const colors: Color[] = [{ r: 255, g: 0, b: 0 }]

      const generator = new TextureGenerator()
      const result = await generator.generateTexture(colors)

      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('should handle empty color array', async () => {
      const colors: Color[] = []

      const generator = new TextureGenerator()
      const result = await generator.generateTexture(colors)

      expect(result.colorMap.size).toBe(0)
      expect(result.uvMap.size).toBe(0)
    })
  })

  describe('colorToKey', () => {
    it('should generate unique keys', () => {
      const generator = new TextureGenerator()

      expect(generator.colorToKey({ r: 255, g: 128, b: 64 })).toBe('255,128,64')
    })
  })
})
