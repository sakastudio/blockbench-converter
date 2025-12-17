interface ErrorDisplayProps {
  error: string | null
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
}: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="error-display">
      <div className="error-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="error-content">
        <p className="error-message">{error}</p>
        <div className="error-actions">
          {onRetry && (
            <button onClick={onRetry} className="error-button retry">
              再試行
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="error-button dismiss">
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
