import { describe, it, expect } from 'vitest'
import type { BlockbenchFace, BlockbenchElement, BlockbenchModel } from './blockbench'

describe('Blockbench Types', () => {
  describe('BlockbenchFace', () => {
    it('should have uv array and texture reference', () => {
      const face: BlockbenchFace = {
        uv: [0, 0, 16, 16],
        texture: '#all',
      }
      expect(face.uv).toEqual([0, 0, 16, 16])
      expect(face.texture).toBe('#all')
    })

    it('should allow optional cullface and rotation', () => {
      const face: BlockbenchFace = {
        uv: [0, 0, 16, 16],
        texture: '#all',
        cullface: 'north',
        rotation: 90,
      }
      expect(face.cullface).toBe('north')
      expect(face.rotation).toBe(90)
    })
  })

  describe('BlockbenchElement', () => {
    it('should have from, to coordinates and faces', () => {
      const element: BlockbenchElement = {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faces: {
          down: { uv: [0, 0, 16, 16], texture: '#all' },
          up: { uv: [0, 0, 16, 16], texture: '#all' },
          north: { uv: [0, 0, 16, 16], texture: '#all' },
          south: { uv: [0, 0, 16, 16], texture: '#all' },
          west: { uv: [0, 0, 16, 16], texture: '#all' },
          east: { uv: [0, 0, 16, 16], texture: '#all' },
        },
      }
      expect(element.from).toEqual([0, 0, 0])
      expect(element.to).toEqual([16, 16, 16])
      expect(element.faces.north?.texture).toBe('#all')
    })

    it('should allow partial faces', () => {
      const element: BlockbenchElement = {
        from: [0, 0, 0],
        to: [8, 8, 8],
        faces: {
          up: { uv: [0, 0, 8, 8], texture: '#top' },
        },
      }
      expect(element.faces.up).toBeDefined()
      expect(element.faces.down).toBeUndefined()
    })
  })

  describe('BlockbenchModel', () => {
    it('should have textures and elements', () => {
      const model: BlockbenchModel = {
        textures: {
          all: 'minecraft:block/stone',
        },
        elements: [
          {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: {
              down: { uv: [0, 0, 16, 16], texture: '#all' },
            },
          },
        ],
      }
      expect(model.textures.all).toBe('minecraft:block/stone')
      expect(model.elements).toHaveLength(1)
    })

    it('should allow optional credit and display settings', () => {
      const model: BlockbenchModel = {
        credit: 'Created with Blockbench Converter',
        textures: { all: 'texture.png' },
        elements: [],
        display: {
          gui: {
            rotation: [30, 225, 0],
            translation: [0, 0, 0],
            scale: [0.625, 0.625, 0.625],
          },
        },
      }
      expect(model.credit).toBe('Created with Blockbench Converter')
      expect(model.display?.gui?.rotation).toEqual([30, 225, 0])
    })
  })
})
