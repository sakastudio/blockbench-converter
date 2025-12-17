import { describe, it, expect } from 'vitest'
import { validateFile, loadFromFile } from './gltfLoader'

describe('gltfLoader', () => {
  describe('validateFile', () => {
    it('should accept .glb files', () => {
      const file = new File([''], 'test.glb', { type: 'model/gltf-binary' })
      const result = validateFile(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept .gltf files', () => {
      const file = new File([''], 'test.gltf', { type: 'model/gltf+json' })
      const result = validateFile(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept files with application/octet-stream MIME type but correct extension', () => {
      const file = new File([''], 'test.glb', { type: 'application/octet-stream' })
      const result = validateFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject files without .glb or .gltf extension', () => {
      const file = new File([''], 'test.obj', { type: 'model/obj' })
      const result = validateFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject files with wrong extension', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })
      const result = validateFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('GLB')
    })

    it('should be case insensitive for extensions', () => {
      const file = new File([''], 'test.GLB', { type: 'application/octet-stream' })
      const result = validateFile(file)
      expect(result.valid).toBe(true)
    })
  })

  describe('loadFromFile', () => {
    it('should reject invalid files before parsing', async () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })
      await expect(loadFromFile(file)).rejects.toThrow()
    })

    // Note: Testing actual GLB parsing requires a real browser environment
    // The GLTFLoader.parse() function doesn't work correctly in jsdom
    it('should be exported and callable', () => {
      expect(typeof loadFromFile).toBe('function')
    })
  })
})
