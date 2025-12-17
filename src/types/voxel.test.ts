import { describe, it, expect } from 'vitest'
import type { Vector3, Color, Voxel, VoxelGrid, VoxelizationOptions } from './voxel'

describe('Voxel Types', () => {
  describe('Vector3', () => {
    it('should have x, y, z number properties', () => {
      const v: Vector3 = { x: 1, y: 2, z: 3 }
      expect(v.x).toBe(1)
      expect(v.y).toBe(2)
      expect(v.z).toBe(3)
    })
  })

  describe('Color', () => {
    it('should have r, g, b number properties (0-255)', () => {
      const c: Color = { r: 255, g: 128, b: 0 }
      expect(c.r).toBe(255)
      expect(c.g).toBe(128)
      expect(c.b).toBe(0)
    })
  })

  describe('Voxel', () => {
    it('should have position and color', () => {
      const voxel: Voxel = {
        position: { x: 0, y: 1, z: 2 },
        color: { r: 255, g: 0, b: 0 },
      }
      expect(voxel.position.x).toBe(0)
      expect(voxel.color.r).toBe(255)
    })
  })

  describe('VoxelGrid', () => {
    it('should have resolution, voxels array, and boundingBox', () => {
      const grid: VoxelGrid = {
        resolution: 16,
        voxels: [
          { position: { x: 0, y: 0, z: 0 }, color: { r: 255, g: 255, b: 255 } },
        ],
        boundingBox: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 16, y: 16, z: 16 },
        },
      }
      expect(grid.resolution).toBe(16)
      expect(grid.voxels).toHaveLength(1)
      expect(grid.boundingBox.min.x).toBe(0)
      expect(grid.boundingBox.max.x).toBe(16)
    })
  })

  describe('VoxelizationOptions', () => {
    it('should have resolution, fillInterior, and colorSamplingMode', () => {
      const options: VoxelizationOptions = {
        resolution: 16,
        fillInterior: false,
        colorSamplingMode: 'average',
      }
      expect(options.resolution).toBe(16)
      expect(options.fillInterior).toBe(false)
      expect(options.colorSamplingMode).toBe('average')
    })

    it('should allow different color sampling modes', () => {
      const modes: VoxelizationOptions['colorSamplingMode'][] = ['average', 'dominant', 'nearest']
      modes.forEach((mode) => {
        const options: VoxelizationOptions = {
          resolution: 8,
          fillInterior: true,
          colorSamplingMode: mode,
        }
        expect(options.colorSamplingMode).toBe(mode)
      })
    })
  })
})
