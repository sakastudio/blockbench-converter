import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { ColorSampler } from './ColorSampler'

describe('ColorSampler', () => {
  describe('sampleMaterialColor', () => {
    it('should extract color from MeshBasicMaterial', () => {
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })

      const sampler = new ColorSampler()
      const color = sampler.sampleMaterialColor(material)

      expect(color.r).toBe(255)
      expect(color.g).toBe(0)
      expect(color.b).toBe(0)
    })

    it('should extract color from MeshStandardMaterial', () => {
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })

      const sampler = new ColorSampler()
      const color = sampler.sampleMaterialColor(material)

      expect(color.r).toBe(0)
      expect(color.g).toBe(255)
      expect(color.b).toBe(0)
    })

    it('should return white for materials without color property', () => {
      // Create a material without a standard color property
      const material = new THREE.ShaderMaterial()

      const sampler = new ColorSampler()
      const color = sampler.sampleMaterialColor(material)

      expect(color.r).toBe(255)
      expect(color.g).toBe(255)
      expect(color.b).toBe(255)
    })

    it('should handle array of materials', () => {
      const materials = [
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
      ]

      const sampler = new ColorSampler()
      const color = sampler.sampleMaterialColor(materials)

      // Should return color from first material
      expect(color.r).toBe(255)
      expect(color.g).toBe(0)
      expect(color.b).toBe(0)
    })
  })

  describe('sampleTextureColor', () => {
    // Note: Canvas-based texture tests require actual canvas implementation
    // jsdom doesn't fully support canvas 2D context
    it('should return default color when texture has no image', () => {
      const texture = new THREE.Texture()

      const sampler = new ColorSampler()
      const color = sampler.sampleTextureColor(texture, { x: 0, y: 0 })

      // Should return white as fallback
      expect(color.r).toBe(255)
      expect(color.g).toBe(255)
      expect(color.b).toBe(255)
    })
  })

  describe('colorToKey', () => {
    it('should generate unique keys for colors', () => {
      const sampler = new ColorSampler()

      expect(sampler.colorToKey({ r: 255, g: 0, b: 0 })).toBe('255,0,0')
      expect(sampler.colorToKey({ r: 0, g: 255, b: 0 })).toBe('0,255,0')
      expect(sampler.colorToKey({ r: 128, g: 128, b: 128 })).toBe('128,128,128')
    })
  })
})
