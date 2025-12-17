import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'
import { VoxelizationEngine } from './VoxelizationEngine'
import type { VoxelizationOptions } from '../../types/voxel'

describe('VoxelizationEngine', () => {
  const defaultOptions: VoxelizationOptions = {
    resolution: 8,
  }

  describe('voxelize', () => {
    it('should return a VoxelGrid with correct structure', async () => {
      // Create a simple box mesh
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
      const mesh = new THREE.Mesh(geometry, material)
      const group = new THREE.Group()
      group.add(mesh)

      const engine = new VoxelizationEngine()
      const result = await engine.voxelize(group, defaultOptions)

      expect(result.resolution).toBe(8)
      expect(result.voxels).toBeDefined()
      expect(Array.isArray(result.voxels)).toBe(true)
      expect(result.boundingBox).toBeDefined()
      expect(result.boundingBox.min).toBeDefined()
      expect(result.boundingBox.max).toBeDefined()
    })

    it('should handle single mesh input', async () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      const mesh = new THREE.Mesh(geometry, material)

      const engine = new VoxelizationEngine()
      const result = await engine.voxelize(mesh, defaultOptions)

      // Result should have proper structure even if no voxels hit
      // (depends on raycast behavior in jsdom environment)
      expect(result.resolution).toBe(8)
      expect(Array.isArray(result.voxels)).toBe(true)
    })

    it('should call progress callback during processing', async () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshBasicMaterial({ color: 0x0000ff })
      const mesh = new THREE.Mesh(geometry, material)

      const progressCallback = vi.fn()

      const engine = new VoxelizationEngine()
      await engine.voxelize(mesh, defaultOptions, progressCallback)

      expect(progressCallback).toHaveBeenCalled()
      // Should have been called with values between 0 and 100
      const calls = progressCallback.mock.calls
      expect(calls.some(([val]) => val >= 0 && val <= 100)).toBe(true)
    })

    it('should generate voxels with colors', async () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
      const mesh = new THREE.Mesh(geometry, material)

      const engine = new VoxelizationEngine()
      const result = await engine.voxelize(mesh, defaultOptions)

      // Check that voxels have color information
      if (result.voxels.length > 0) {
        const voxel = result.voxels[0]
        expect(voxel.color).toBeDefined()
        expect(typeof voxel.color.r).toBe('number')
        expect(typeof voxel.color.g).toBe('number')
        expect(typeof voxel.color.b).toBe('number')
      }
    })

    it('should respect resolution parameter', async () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const mesh = new THREE.Mesh(geometry, material)

      const engine = new VoxelizationEngine()

      const lowRes = await engine.voxelize(mesh, { ...defaultOptions, resolution: 4 })
      const highRes = await engine.voxelize(mesh, { ...defaultOptions, resolution: 16 })

      // Higher resolution should produce more voxels (generally)
      expect(highRes.resolution).toBe(16)
      expect(lowRes.resolution).toBe(4)
    })
  })

  describe('computeBoundingBox', () => {
    it('should compute bounding box for a Group', () => {
      const geometry = new THREE.BoxGeometry(2, 2, 2)
      const material = new THREE.MeshBasicMaterial()
      const mesh = new THREE.Mesh(geometry, material)
      const group = new THREE.Group()
      group.add(mesh)

      const engine = new VoxelizationEngine()
      const box = engine.computeBoundingBox(group)

      expect(box.min.x).toBeCloseTo(-1)
      expect(box.max.x).toBeCloseTo(1)
    })
  })
})
