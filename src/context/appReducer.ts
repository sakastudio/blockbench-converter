import type { AppState, AppAction } from '../types/app'

/**
 * アプリケーション初期状態
 */
export const initialState: AppState = {
  status: 'idle',
  loadedModel: null,
  voxelGrid: null,
  options: {
    resolution: 16,
  },
  error: null,
  progress: 0,
}

/**
 * アプリケーション状態を管理するReducer
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_MODEL_START':
      return {
        ...state,
        status: 'loading',
        error: null,
        progress: 0,
      }

    case 'LOAD_MODEL_SUCCESS':
      return {
        ...state,
        status: 'ready',
        loadedModel: action.payload,
        voxelGrid: null, // Reset voxel grid when new model is loaded
      }

    case 'LOAD_MODEL_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
        loadedModel: null,
      }

    case 'VOXELIZE_START':
      return {
        ...state,
        status: 'processing',
        progress: 0,
        error: null,
      }

    case 'VOXELIZE_PROGRESS':
      return {
        ...state,
        progress: action.payload,
      }

    case 'VOXELIZE_SUCCESS':
      return {
        ...state,
        status: 'ready',
        voxelGrid: action.payload,
        progress: 100,
      }

    case 'VOXELIZE_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
      }

    case 'UPDATE_OPTIONS':
      return {
        ...state,
        options: {
          ...state.options,
          ...action.payload,
        },
      }

    case 'RESET':
      return initialState

    default:
      return state
  }
}
