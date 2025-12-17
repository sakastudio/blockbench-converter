import type * as THREE from 'three'
import type { VoxelGrid, VoxelizationOptions } from './voxel'

/** アプリケーション状態 */
export interface AppState {
  status: 'idle' | 'loading' | 'processing' | 'ready' | 'error'
  loadedModel: THREE.Group | null
  voxelGrid: VoxelGrid | null
  options: VoxelizationOptions
  error: string | null
  progress: number // 0-100
}

/** アプリケーションアクション */
export type AppAction =
  | { type: 'LOAD_MODEL_START' }
  | { type: 'LOAD_MODEL_SUCCESS'; payload: THREE.Group }
  | { type: 'LOAD_MODEL_ERROR'; payload: string }
  | { type: 'VOXELIZE_START' }
  | { type: 'VOXELIZE_PROGRESS'; payload: number }
  | { type: 'VOXELIZE_SUCCESS'; payload: VoxelGrid }
  | { type: 'VOXELIZE_ERROR'; payload: string }
  | { type: 'UPDATE_OPTIONS'; payload: Partial<VoxelizationOptions> }
  | { type: 'RESET' }
