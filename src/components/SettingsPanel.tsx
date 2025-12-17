import { useCallback, type ChangeEvent } from 'react'
import type { VoxelizationOptions } from '../types/voxel'

interface SettingsPanelProps {
  options: VoxelizationOptions
  onOptionsChange: (options: VoxelizationOptions) => void
  disabled?: boolean
}

export function SettingsPanel({
  options,
  onOptionsChange,
  disabled = false,
}: SettingsPanelProps) {
  const handleResolutionChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10)
      if (value >= 8 && value <= 64) {
        onOptionsChange({ ...options, resolution: value })
      }
    },
    [options, onOptionsChange]
  )

  const handleFillInteriorChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onOptionsChange({ ...options, fillInterior: e.target.checked })
    },
    [options, onOptionsChange]
  )

  const handleColorModeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onOptionsChange({
        ...options,
        colorSamplingMode: e.target.value as VoxelizationOptions['colorSamplingMode'],
      })
    },
    [options, onOptionsChange]
  )

  return (
    <div className={`settings-panel ${disabled ? 'disabled' : ''}`}>
      <h3 className="settings-title">設定</h3>

      <div className="settings-group">
        <label className="settings-label">
          解像度: {options.resolution}
        </label>
        <input
          type="range"
          min="8"
          max="64"
          step="1"
          value={options.resolution}
          onChange={handleResolutionChange}
          disabled={disabled}
          className="settings-slider"
        />
        <div className="settings-range-labels">
          <span>8</span>
          <span>64</span>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">
          <input
            type="checkbox"
            checked={options.fillInterior}
            onChange={handleFillInteriorChange}
            disabled={disabled}
          />
          内部を塗りつぶす
        </label>
      </div>

      <div className="settings-group">
        <label className="settings-label">色サンプリング</label>
        <select
          value={options.colorSamplingMode}
          onChange={handleColorModeChange}
          disabled={disabled}
          className="settings-select"
        >
          <option value="average">平均</option>
          <option value="dominant">最頻</option>
          <option value="nearest">最近傍</option>
        </select>
      </div>
    </div>
  )
}
