import JSZip from 'jszip'

export interface ZipFile {
  name: string
  content: string | Blob | Uint8Array
}

/**
 * 複数ファイルをZIPアーカイブにまとめる
 */
export class ZipBuilder {
  /**
   * 複数ファイルをZIPアーカイブにまとめる
   */
  async build(files: ZipFile[]): Promise<Blob> {
    const zip = new JSZip()

    for (const file of files) {
      zip.file(file.name, file.content)
    }

    return zip.generateAsync({ type: 'blob' })
  }
}
