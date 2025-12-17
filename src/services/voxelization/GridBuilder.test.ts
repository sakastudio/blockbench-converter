import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { GridBuilder } from './GridBuilder'
import type { Color } from '../../types/voxel'

describe('GridBuilder', () => {
  describe('createGrid', () => {
    it('should create grid positions from bounding box', () => {
      const box = new THREE.Box3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(16, 16, 16)
      )

      const builder = new GridBuilder()
      const result = builder.createGrid(box, 4) // 4x4x4 = 64 positions

      expect(result.positions).toHaveLength(64)
      expect(result.voxelSize).toBe(4) // 16 / 4 = 4
    })

    it('should handle non-uniform bounding boxes', () => {
      const box = new THREE.Box3(
        new THREE.Vector3(-8, 0, -4),
        new THREE.Vector3(8, 16, 12)
      )

      const builder = new GridBuilder()
      const result = builder.createGrid(box, 4)

      // Should use the largest dimension for voxel size
      // max dimension is 16, so voxelSize = 16/4 = 4
      expect(result.voxelSize).toBe(4)
    })

    it('should position voxels at grid centers', () => {
      const box = new THREE.Box3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(4, 4, 4)
      )

      const builder = new GridBuilder()
      const result = builder.createGrid(box, 2) // 2x2x2 grid

      // First voxel should be at center of first cell: (0.5, 0.5, 0.5) * voxelSize
      const voxelSize = result.voxelSize
      const firstPos = result.positions[0]
      expect(firstPos.x).toBeCloseTo(voxelSize / 2)
      expect(firstPos.y).toBeCloseTo(voxelSize / 2)
      expect(firstPos.z).toBeCloseTo(voxelSize / 2)
    })
  })

  describe('buildVoxels', () => {
    it('should create voxels from hit results', () => {
      const positions = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
      ]

      const hitResults = new Map<string, { hit: boolean; color: Color }>([
        ['0,0,0', { hit: true, color: { r: 255, g: 0, b: 0 } }],
        ['1,0,0', { hit: false, color: { r: 0, g: 0, b: 0 } }],
        ['2,0,0', { hit: true, color: { r: 0, g: 255, b: 0 } }],
      ])

      const builder = new GridBuilder()
      const voxels = builder.buildVoxels(positions, hitResults)

      // Only hit positions should become voxels
      expect(voxels).toHaveLength(2)
      expect(voxels[0].color.r).toBe(255)
      expect(voxels[1].color.g).toBe(255)
    })

    it('should return empty array when no hits', () => {
      const positions = [{ x: 0, y: 0, z: 0 }]
      const hitResults = new Map<string, { hit: boolean; color: Color }>([
        ['0,0,0', { hit: false, color: { r: 0, g: 0, b: 0 } }],
      ])

      const builder = new GridBuilder()
      const voxels = builder.buildVoxels(positions, hitResults)

      expect(voxels).toHaveLength(0)
    })
  })

  describe('positionToKey', () => {
    it('should generate unique keys for positions', () => {
      const builder = new GridBuilder()

      expect(builder.positionToKey({ x: 0, y: 0, z: 0 })).toBe('0,0,0')
      expect(builder.positionToKey({ x: 1, y: 2, z: 3 })).toBe('1,2,3')
      expect(builder.positionToKey({ x: -1, y: -2, z: -3 })).toBe('-1,-2,-3')
    })
  })
})
