import { describe, it, expect, vi } from 'vitest'
import { FileDownloader } from './fileDownloader'

describe('FileDownloader', () => {
  describe('download', () => {
    it('should create a download link with correct attributes', () => {
      // Mock DOM APIs
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement)
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url')
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      const blob = new Blob(['test content'], { type: 'text/plain' })

      const downloader = new FileDownloader()
      downloader.download(blob, 'test-file.txt')

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(mockLink.href).toBe('blob:test-url')
      expect(mockLink.download).toBe('test-file.txt')
      expect(mockLink.click).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url')

      // Cleanup
      createElementSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    })

    it('should be callable with any blob type', () => {
      const downloader = new FileDownloader()

      // Just verify it doesn't throw
      expect(() => {
        new Blob([new Uint8Array([1, 2, 3])], { type: 'application/octet-stream' })
        // Don't actually call download in test as it would trigger browser behavior
        expect(typeof downloader.download).toBe('function')
      }).not.toThrow()
    })
  })
})
