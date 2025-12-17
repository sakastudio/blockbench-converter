import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from './appReducer'
import type { AppState, AppAction } from '../types/app'
import type { VoxelGrid } from '../types/voxel'

describe('appReducer', () => {
  describe('initialState', () => {
    it('should have correct default values', () => {
      expect(initialState.status).toBe('idle')
      expect(initialState.loadedModel).toBeNull()
      expect(initialState.voxelGrid).toBeNull()
      expect(initialState.options.resolution).toBe(16)
      expect(initialState.options.fillInterior).toBe(false)
      expect(initialState.options.colorSamplingMode).toBe('average')
      expect(initialState.error).toBeNull()
      expect(initialState.progress).toBe(0)
    })
  })

  describe('LOAD_MODEL_START', () => {
    it('should set status to loading and clear error', () => {
      const state: AppState = { ...initialState, error: 'previous error' }
      const action: AppAction = { type: 'LOAD_MODEL_START' }

      const newState = appReducer(state, action)

      expect(newState.status).toBe('loading')
      expect(newState.error).toBeNull()
      expect(newState.progress).toBe(0)
    })
  })

  describe('LOAD_MODEL_SUCCESS', () => {
    it('should set loadedModel and status to ready', () => {
      const state: AppState = { ...initialState, status: 'loading' }
      // Mock THREE.Group as null for testing
      const action: AppAction = { type: 'LOAD_MODEL_SUCCESS', payload: null as never }

      const newState = appReducer(state, action)

      expect(newState.status).toBe('ready')
      expect(newState.loadedModel).toBeNull() // would be the Group in real usage
    })
  })

  describe('LOAD_MODEL_ERROR', () => {
    it('should set error and status to error', () => {
      const state: AppState = { ...initialState, status: 'loading' }
      const action: AppAction = { type: 'LOAD_MODEL_ERROR', payload: 'Load failed' }

      const newState = appReducer(state, action)

      expect(newState.status).toBe('error')
      expect(newState.error).toBe('Load failed')
    })
  })

  describe('VOXELIZE_START', () => {
    it('should set status to processing', () => {
      const state: AppState = { ...initialState, status: 'ready' }
      const action: AppAction = { type: 'VOXELIZE_START' }

      const newState = appReducer(state, action)

      expect(newState.status).toBe('processing')
      expect(newState.progress).toBe(0)
    })
  })

  describe('VOXELIZE_PROGRESS', () => {
    it('should update progress', () => {
      const state: AppState = { ...initialState, status: 'processing', progress: 0 }
      const action: AppAction = { type: 'VOXELIZE_PROGRESS', payload: 50 }

      const newState = appReducer(state, action)

      expect(newState.progress).toBe(50)
    })
  })

  describe('VOXELIZE_SUCCESS', () => {
    it('should set voxelGrid and status to ready', () => {
      const state: AppState = { ...initialState, status: 'processing' }
      const voxelGrid: VoxelGrid = {
        resolution: 16,
        voxels: [],
        boundingBox: { min: { x: 0, y: 0, z: 0 }, max: { x: 16, y: 16, z: 16 } },
      }
      const action: AppAction = { type: 'VOXELIZE_SUCCESS', payload: voxelGrid }

      const newState = appReducer(state, action)

      expect(newState.status).toBe('ready')
      expect(newState.voxelGrid).toBe(voxelGrid)
      expect(newState.progress).toBe(100)
    })
  })

  describe('VOXELIZE_ERROR', () => {
    it('should set error and status to error', () => {
      const state: AppState = { ...initialState, status: 'processing' }
      const action: AppAction = { type: 'VOXELIZE_ERROR', payload: 'Voxelization failed' }

      const newState = appReducer(state, action)

      expect(newState.status).toBe('error')
      expect(newState.error).toBe('Voxelization failed')
    })
  })

  describe('UPDATE_OPTIONS', () => {
    it('should merge partial options', () => {
      const state: AppState = { ...initialState }
      const action: AppAction = { type: 'UPDATE_OPTIONS', payload: { resolution: 32 } }

      const newState = appReducer(state, action)

      expect(newState.options.resolution).toBe(32)
      expect(newState.options.fillInterior).toBe(false) // unchanged
    })

    it('should handle multiple option updates', () => {
      const state: AppState = { ...initialState }
      const action: AppAction = {
        type: 'UPDATE_OPTIONS',
        payload: { resolution: 64, colorSamplingMode: 'dominant' },
      }

      const newState = appReducer(state, action)

      expect(newState.options.resolution).toBe(64)
      expect(newState.options.colorSamplingMode).toBe('dominant')
    })
  })

  describe('RESET', () => {
    it('should reset to initial state', () => {
      const state: AppState = {
        status: 'ready',
        loadedModel: null as never,
        voxelGrid: {
          resolution: 16,
          voxels: [],
          boundingBox: { min: { x: 0, y: 0, z: 0 }, max: { x: 16, y: 16, z: 16 } },
        },
        options: { resolution: 32, fillInterior: true, colorSamplingMode: 'dominant' },
        error: null,
        progress: 100,
      }
      const action: AppAction = { type: 'RESET' }

      const newState = appReducer(state, action)

      expect(newState).toEqual(initialState)
    })
  })
})
