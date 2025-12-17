import { useCallback, useState } from 'react'
import { AppProvider, useApp } from './context'
import { Layout } from './components/Layout'
import {
  FileUploader,
  SettingsPanel,
  PreviewCanvas,
  ExportButton,
  ProgressIndicator,
  ErrorDisplay,
} from './components'
import './App.css'

function AppContent() {
  const { state, actions } = useApp()
  const [showOriginal, setShowOriginal] = useState(false)

  const handleFileSelect = useCallback(
    async (file: File) => {
      await actions.loadModel(file)
    },
    [actions]
  )

  const handleVoxelize = useCallback(async () => {
    await actions.voxelize()
  }, [actions])

  const handleExport = useCallback(
    async (filename: string) => {
      await actions.exportModel(filename)
    },
    [actions]
  )

  const handleReset = useCallback(() => {
    actions.reset()
  }, [actions])

  const isProcessing = state.status === 'loading' || state.status === 'processing'
  const hasModel = state.loadedModel !== null
  const hasVoxels = state.voxelGrid !== null && state.voxelGrid.voxels.length > 0

  return (
    <Layout>
      <div className="app-container">
        <div className="sidebar">
          <FileUploader
            onFileSelect={handleFileSelect}
            acceptedFormats={['.glb', '.gltf']}
            disabled={isProcessing}
          />

          {hasModel && (
            <>
              <SettingsPanel
                options={state.options}
                onOptionsChange={actions.updateOptions}
                disabled={isProcessing}
              />

              <div className="action-buttons">
                <button
                  onClick={handleVoxelize}
                  disabled={isProcessing}
                  className="voxelize-button"
                >
                  {state.status === 'processing' ? 'ボクセル化中...' : 'ボクセル化'}
                </button>

                <label className="show-original-label">
                  <input
                    type="checkbox"
                    checked={showOriginal}
                    onChange={(e) => setShowOriginal(e.target.checked)}
                    disabled={isProcessing}
                  />
                  オリジナルモデルを表示
                </label>
              </div>
            </>
          )}

          {hasVoxels && (
            <ExportButton
              voxelGrid={state.voxelGrid}
              onExport={handleExport}
              disabled={isProcessing}
            />
          )}

          {hasModel && (
            <button onClick={handleReset} className="reset-button">
              リセット
            </button>
          )}
        </div>

        <div className="main-content">
          {isProcessing && (
            <div className="processing-overlay">
              <ProgressIndicator
                progress={state.progress}
                message={
                  state.status === 'loading' ? 'モデルを読み込み中...' : 'ボクセル化処理中...'
                }
              />
            </div>
          )}

          <PreviewCanvas
            voxelGrid={state.voxelGrid}
            originalModel={state.loadedModel}
            showOriginal={showOriginal}
          />

          <ErrorDisplay
            error={state.error}
            onRetry={hasModel ? handleVoxelize : undefined}
            onDismiss={handleReset}
          />
        </div>
      </div>
    </Layout>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
