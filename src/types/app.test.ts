import { describe, it, expect } from 'vitest'
import type { AppState, AppAction } from './app'
import type { VoxelGrid } from './voxel'

describe('App Types', () => {
  describe('AppState', () => {
    it('should have status, loadedModel, voxelGrid, options, error, and progress', () => {
      const state: AppState = {
        status: 'idle',
        loadedModel: null,
        voxelGrid: null,
        options: {
          resolution: 16,
          fillInterior: false,
          colorSamplingMode: 'average',
        },
        error: null,
        progress: 0,
      }
      expect(state.status).toBe('idle')
      expect(state.loadedModel).toBeNull()
      expect(state.voxelGrid).toBeNull()
      expect(state.options.resolution).toBe(16)
      expect(state.error).toBeNull()
      expect(state.progress).toBe(0)
    })

    it('should allow different status values', () => {
      const statuses: AppState['status'][] = ['idle', 'loading', 'processing', 'ready', 'error']
      statuses.forEach((status) => {
        const state: AppState = {
          status,
          loadedModel: null,
          voxelGrid: null,
          options: { resolution: 16, fillInterior: false, colorSamplingMode: 'average' },
          error: null,
          progress: 0,
        }
        expect(state.status).toBe(status)
      })
    })
  })

  describe('AppAction', () => {
    it('should support LOAD_MODEL_START action', () => {
      const action: AppAction = { type: 'LOAD_MODEL_START' }
      expect(action.type).toBe('LOAD_MODEL_START')
    })

    it('should support LOAD_MODEL_SUCCESS action with payload', () => {
      // Using null as placeholder since THREE.Group is not available in test
      const action: AppAction = { type: 'LOAD_MODEL_SUCCESS', payload: null as never }
      expect(action.type).toBe('LOAD_MODEL_SUCCESS')
    })

    it('should support LOAD_MODEL_ERROR action with string payload', () => {
      const action: AppAction = { type: 'LOAD_MODEL_ERROR', payload: 'File not found' }
      expect(action.type).toBe('LOAD_MODEL_ERROR')
      expect(action.payload).toBe('File not found')
    })

    it('should support VOXELIZE_START action', () => {
      const action: AppAction = { type: 'VOXELIZE_START' }
      expect(action.type).toBe('VOXELIZE_START')
    })

    it('should support VOXELIZE_PROGRESS action with number payload', () => {
      const action: AppAction = { type: 'VOXELIZE_PROGRESS', payload: 50 }
      expect(action.type).toBe('VOXELIZE_PROGRESS')
      expect(action.payload).toBe(50)
    })

    it('should support VOXELIZE_SUCCESS action with VoxelGrid payload', () => {
      const voxelGrid: VoxelGrid = {
        resolution: 16,
        voxels: [],
        boundingBox: { min: { x: 0, y: 0, z: 0 }, max: { x: 16, y: 16, z: 16 } },
      }
      const action: AppAction = { type: 'VOXELIZE_SUCCESS', payload: voxelGrid }
      expect(action.type).toBe('VOXELIZE_SUCCESS')
      expect(action.payload).toBe(voxelGrid)
    })

    it('should support VOXELIZE_ERROR action with string payload', () => {
      const action: AppAction = { type: 'VOXELIZE_ERROR', payload: 'Voxelization failed' }
      expect(action.type).toBe('VOXELIZE_ERROR')
      expect(action.payload).toBe('Voxelization failed')
    })

    it('should support UPDATE_OPTIONS action with partial options', () => {
      const action: AppAction = { type: 'UPDATE_OPTIONS', payload: { resolution: 32 } }
      expect(action.type).toBe('UPDATE_OPTIONS')
      expect(action.payload.resolution).toBe(32)
    })

    it('should support RESET action', () => {
      const action: AppAction = { type: 'RESET' }
      expect(action.type).toBe('RESET')
    })
  })
})
