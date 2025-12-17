import { describe, it, expect } from 'vitest'
import { ZipBuilder, type ZipFile } from './zipBuilder'
import JSZip from 'jszip'

describe('ZipBuilder', () => {
  describe('build', () => {
    it('should create a ZIP blob from files', async () => {
      const files: ZipFile[] = [
        { name: 'test.txt', content: 'Hello World' },
      ]

      const builder = new ZipBuilder()
      const blob = await builder.build(files)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/zip')
    })

    it('should include all provided files', async () => {
      const files: ZipFile[] = [
        { name: 'file1.txt', content: 'Content 1' },
        { name: 'file2.txt', content: 'Content 2' },
        { name: 'folder/file3.txt', content: 'Content 3' },
      ]

      const builder = new ZipBuilder()
      const blob = await builder.build(files)

      // Verify by reading back the ZIP
      const zip = await JSZip.loadAsync(blob)
      expect(Object.keys(zip.files)).toContain('file1.txt')
      expect(Object.keys(zip.files)).toContain('file2.txt')
      expect(Object.keys(zip.files)).toContain('folder/file3.txt')
    })

    it('should handle Blob content', async () => {
      const blobContent = new Blob(['binary data'], { type: 'application/octet-stream' })
      const files: ZipFile[] = [
        { name: 'data.bin', content: blobContent },
      ]

      const builder = new ZipBuilder()
      const blob = await builder.build(files)

      const zip = await JSZip.loadAsync(blob)
      expect(Object.keys(zip.files)).toContain('data.bin')
    })

    it('should handle Uint8Array content', async () => {
      const uint8Content = new Uint8Array([0x00, 0x01, 0x02, 0x03])
      const files: ZipFile[] = [
        { name: 'binary.dat', content: uint8Content },
      ]

      const builder = new ZipBuilder()
      const blob = await builder.build(files)

      const zip = await JSZip.loadAsync(blob)
      expect(Object.keys(zip.files)).toContain('binary.dat')
    })

    it('should return empty ZIP for empty file list', async () => {
      const files: ZipFile[] = []

      const builder = new ZipBuilder()
      const blob = await builder.build(files)

      expect(blob).toBeInstanceOf(Blob)
    })
  })
})
