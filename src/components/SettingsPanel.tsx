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

    </div>
  )
}
