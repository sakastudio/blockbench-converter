import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { AppState, AppAction } from '../types/app'
import type { VoxelizationOptions } from '../types/voxel'
import { appReducer, initialState } from './appReducer'
import { loadFromFile } from '../utils/gltfLoader'
import { VoxelizationEngine } from '../services/voxelization'
import { BlockbenchExporter } from '../services/export'
import { FileDownloader } from '../utils'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  actions: {
    loadModel: (file: File) => Promise<void>
    voxelize: () => Promise<void>
    exportModel: (filename?: string) => Promise<void>
    updateOptions: (options: Partial<VoxelizationOptions>) => void
    reset: () => void
  }
}

const AppContext = createContext<AppContextValue | null>(null)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const loadModel = useCallback(async (file: File) => {
    dispatch({ type: 'LOAD_MODEL_START' })

    try {
      const model = await loadFromFile(file)
      dispatch({ type: 'LOAD_MODEL_SUCCESS', payload: model })
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラーが発生しました'
      dispatch({ type: 'LOAD_MODEL_ERROR', payload: message })
    }
  }, [])

  const voxelize = useCallback(async () => {
    if (!state.loadedModel) {
      dispatch({ type: 'VOXELIZE_ERROR', payload: 'モデルが読み込まれていません' })
      return
    }

    dispatch({ type: 'VOXELIZE_START' })

    try {
      const engine = new VoxelizationEngine()
      const voxelGrid = await engine.voxelize(
        state.loadedModel,
        state.options,
        (progress) => {
          dispatch({ type: 'VOXELIZE_PROGRESS', payload: progress })
        }
      )
      dispatch({ type: 'VOXELIZE_SUCCESS', payload: voxelGrid })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ボクセル化に失敗しました'
      dispatch({ type: 'VOXELIZE_ERROR', payload: message })
    }
  }, [state.loadedModel, state.options])

  const exportModel = useCallback(async (filename = 'model') => {
    if (!state.voxelGrid) {
      dispatch({ type: 'VOXELIZE_ERROR', payload: 'ボクセルデータがありません' })
      return
    }

    try {
      const exporter = new BlockbenchExporter()
      const result = await exporter.exportAsBBModel(state.voxelGrid, filename)

      // JSON文字列をBlobに変換してダウンロード
      const blob = new Blob([result.jsonString], { type: 'application/json' })

      const downloader = new FileDownloader()
      downloader.download(blob, `${filename}.bbmodel`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'エクスポートに失敗しました'
      dispatch({ type: 'VOXELIZE_ERROR', payload: message })
    }
  }, [state.voxelGrid])

  const updateOptions = useCallback((options: Partial<VoxelizationOptions>) => {
    dispatch({ type: 'UPDATE_OPTIONS', payload: options })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const value: AppContextValue = {
    state,
    dispatch,
    actions: {
      loadModel,
      voxelize,
      exportModel,
      updateOptions,
      reset,
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
