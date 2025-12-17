import { describe, it, expect } from 'vitest'
import { BlockbenchExporter } from './BlockbenchExporter'
import type { VoxelGrid } from '../../types/voxel'

describe('BlockbenchExporter', () => {
  describe('export', () => {
    it('should return modelJson with elements and textures', async () => {
      const grid: VoxelGrid = {
        resolution: 8,
        voxels: [
          { position: { x: 0, y: 0, z: 0 }, color: { r: 255, g: 0, b: 0 } },
        ],
        boundingBox: {
          min: { x: -1, y: -1, z: -1 },
          max: { x: 1, y: 1, z: 1 },
        },
      }

      const exporter = new BlockbenchExporter()
      const result = await exporter.export(grid)

      expect(result.modelJson).toBeDefined()
      expect(result.modelJson.elements).toHaveLength(1)
      expect(result.modelJson.textures).toBeDefined()
      expect(result.modelJson.textures.texture).toBeDefined()
    })

    it('should return textureData as Blob', async () => {
      const grid: VoxelGrid = {
        resolution: 8,
        voxels: [
          { position: { x: 0, y: 0, z: 0 }, color: { r: 0, g: 255, b: 0 } },
        ],
        boundingBox: {
          min: { x: -1, y: -1, z: -1 },
          max: { x: 1, y: 1, z: 1 },
        },
      }

      const exporter = new BlockbenchExporter()
      const result = await exporter.export(grid)

      expect(result.textureData).toBeInstanceOf(Blob)
    })

    it('should return textureName', async () => {
      const grid: VoxelGrid = {
        resolution: 8,
        voxels: [
          { position: { x: 0, y: 0, z: 0 }, color: { r: 0, g: 0, b: 255 } },
        ],
        boundingBox: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 1, y: 1, z: 1 },
        },
      }

      const exporter = new BlockbenchExporter()
      const result = await exporter.export(grid)

      expect(result.textureName).toBe('texture.png')
    })

    it('should handle empty voxel grid', async () => {
      const grid: VoxelGrid = {
        resolution: 8,
        voxels: [],
        boundingBox: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 },
        },
      }

      const exporter = new BlockbenchExporter()
      const result = await exporter.export(grid)

      expect(result.modelJson.elements).toHaveLength(0)
    })

    it('should include credit in modelJson', async () => {
      const grid: VoxelGrid = {
        resolution: 8,
        voxels: [
          { position: { x: 0, y: 0, z: 0 }, color: { r: 255, g: 255, b: 255 } },
        ],
        boundingBox: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 1, y: 1, z: 1 },
        },
      }

      const exporter = new BlockbenchExporter()
      const result = await exporter.export(grid)

      expect(result.modelJson.credit).toBeDefined()
      expect(result.modelJson.credit).toContain('Blockbench Converter')
    })
  })
})
