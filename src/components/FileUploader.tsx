import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react'

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  acceptedFormats: string[]
  disabled?: boolean
}

export function FileUploader({
  onFileSelect,
  acceptedFormats,
  disabled = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
        if (acceptedFormats.includes(ext)) {
          onFileSelect(file)
        }
      }
    },
    [disabled, acceptedFormats, onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        onFileSelect(files[0])
      }
      // Reset input value to allow selecting the same file again
      e.target.value = ''
    },
    [onFileSelect]
  )

  return (
    <div
      className={`file-uploader ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="file-uploader-content">
        <svg
          className="file-uploader-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="file-uploader-text">
          GLB/GLTFファイルをドラッグ&ドロップ
        </p>
        <p className="file-uploader-subtext">または</p>
        <label className="file-uploader-button">
          ファイルを選択
          <input
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInput}
            disabled={disabled}
            hidden
          />
        </label>
      </div>
    </div>
  )
}
