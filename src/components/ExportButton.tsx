import { useCallback, useState } from 'react'
import type { VoxelGrid } from '../types/voxel'

interface ExportButtonProps {
  voxelGrid: VoxelGrid | null
  onExport: (filename: string) => Promise<void>
  disabled?: boolean
}

export function ExportButton({
  voxelGrid,
  onExport,
  disabled = false,
}: ExportButtonProps) {
  const [filename, setFilename] = useState('model')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    if (!voxelGrid || isExporting) return

    setIsExporting(true)
    try {
      await onExport(filename)
    } finally {
      setIsExporting(false)
    }
  }, [voxelGrid, isExporting, filename, onExport])

  const isDisabled = disabled || !voxelGrid || voxelGrid.voxels.length === 0 || isExporting

  return (
    <div className="export-section">
      <div className="export-filename">
        <label htmlFor="filename">ファイル名:</label>
        <input
          id="filename"
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          disabled={disabled}
          className="export-input"
        />
        <span className="export-extension">.zip</span>
      </div>
      <button
        onClick={handleExport}
        disabled={isDisabled}
        className="export-button"
      >
        {isExporting ? 'エクスポート中...' : 'Blockbench形式でエクスポート'}
      </button>
      {voxelGrid && (
        <p className="export-info">
          {voxelGrid.voxels.length} ボクセル
        </p>
      )}
    </div>
  )
}
