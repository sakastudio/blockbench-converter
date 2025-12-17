import { describe, it, expect } from 'vitest'
import { ModelGenerator } from './ModelGenerator'
import type { Voxel, VoxelGrid } from '../../types/voxel'

describe('ModelGenerator', () => {
  describe('generateElements', () => {
    it('should create BlockbenchElement for each voxel', () => {
      const voxels: Voxel[] = [
        { position: { x: 0, y: 0, z: 0 }, color: { r: 255, g: 0, b: 0 } },
        { position: { x: 1, y: 0, z: 0 }, color: { r: 0, g: 255, b: 0 } },
      ]

      const colorMap = new Map<string, number>([
        ['255,0,0', 0],
        ['0,255,0', 1],
      ])

      const uvMap = new Map<number, [number, number, number, number]>([
        [0, [0, 0, 1, 1]],
        [1, [1, 0, 2, 1]],
      ])

      const generator = new ModelGenerator()
      const elements = generator.generateElements(voxels, colorMap, uvMap, 1)

      expect(elements).toHaveLength(2)
    })

    it('should set from and to coordinates correctly', () => {
      const voxels: Voxel[] = [
        { position: { x: 0.5, y: 0.5, z: 0.5 }, color: { r: 255, g: 255, b: 255 } },
      ]

      const colorMap = new Map<string, number>([['255,255,255', 0]])
      const uvMap = new Map<number, [number, number, number, number]>([
        [0, [0, 0, 16, 16]],
      ])

      const generator = new ModelGenerator()
      const elements = generator.generateElements(voxels, colorMap, uvMap, 1)

      const element = elements[0]
      // Should create a 1x1x1 cube centered at position
      expect(element.from[0]).toBeLessThan(element.to[0])
      expect(element.from[1]).toBeLessThan(element.to[1])
      expect(element.from[2]).toBeLessThan(element.to[2])
    })

    it('should set faces with correct UV coordinates', () => {
      const voxels: Voxel[] = [
        { position: { x: 0, y: 0, z: 0 }, color: { r: 128, g: 128, b: 128 } },
      ]

      const colorMap = new Map<string, number>([['128,128,128', 0]])
      const uvMap = new Map<number, [number, number, number, number]>([
        [0, [0, 0, 4, 4]],
      ])

      const generator = new ModelGenerator()
      const elements = generator.generateElements(voxels, colorMap, uvMap, 1)

      const element = elements[0]
      expect(element.faces.north).toBeDefined()
      expect(element.faces.north?.uv).toEqual([0, 0, 4, 4])
      expect(element.faces.north?.texture).toBe('#texture')
    })

    it('should have all 6 faces', () => {
      const voxels: Voxel[] = [
        { position: { x: 0, y: 0, z: 0 }, color: { r: 255, g: 0, b: 0 } },
      ]

      const colorMap = new Map<string, number>([['255,0,0', 0]])
      const uvMap = new Map<number, [number, number, number, number]>([
        [0, [0, 0, 16, 16]],
      ])

      const generator = new ModelGenerator()
      const elements = generator.generateElements(voxels, colorMap, uvMap, 1)

      const element = elements[0]
      expect(element.faces.down).toBeDefined()
      expect(element.faces.up).toBeDefined()
      expect(element.faces.north).toBeDefined()
      expect(element.faces.south).toBeDefined()
      expect(element.faces.west).toBeDefined()
      expect(element.faces.east).toBeDefined()
    })
  })

  describe('normalizeCoordinates', () => {
    it('should normalize coordinates to -16 to 32 range', () => {
      const generator = new ModelGenerator()

      const grid: VoxelGrid = {
        resolution: 16,
        voxels: [],
        boundingBox: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 16, y: 16, z: 16 },
        },
      }

      const result = generator.normalizeCoordinates(
        { x: 8, y: 8, z: 8 },
        1,
        grid
      )

      // Should be within -16 to 32 range
      expect(result.from[0]).toBeGreaterThanOrEqual(-16)
      expect(result.to[0]).toBeLessThanOrEqual(32)
    })
  })
})
