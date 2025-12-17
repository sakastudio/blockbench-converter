interface ProgressIndicatorProps {
  progress: number // 0-100
  message?: string
}

export function ProgressIndicator({
  progress,
  message = '処理中...',
}: ProgressIndicatorProps) {
  return (
    <div className="progress-indicator">
      <div className="progress-message">{message}</div>
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="progress-percentage">{Math.round(progress)}%</div>
    </div>
  )
}
