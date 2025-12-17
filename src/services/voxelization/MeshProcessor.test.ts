import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { MeshProcessor } from './MeshProcessor'

describe('MeshProcessor', () => {
  describe('prepareMesh', () => {
    it('should return a mesh with BVH acceleration structure', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshBasicMaterial()
      const mesh = new THREE.Mesh(geometry, material)

      const processor = new MeshProcessor()
      const prepared = processor.prepareMesh(mesh)

      expect(prepared).toBeInstanceOf(THREE.Mesh)
      // BVH should be computed
      expect(prepared.geometry.boundsTree).toBeDefined()
    })

    it('should preserve original mesh properties', () => {
      const geometry = new THREE.BoxGeometry(2, 2, 2)
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(1, 2, 3)

      const processor = new MeshProcessor()
      const prepared = processor.prepareMesh(mesh)

      expect(prepared.position.x).toBe(1)
      expect(prepared.position.y).toBe(2)
      expect(prepared.position.z).toBe(3)
    })
  })

  describe('extractMeshes', () => {
    it('should extract all meshes from a Group', () => {
      const group = new THREE.Group()
      const mesh1 = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
      const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial())
      group.add(mesh1)
      group.add(mesh2)

      const processor = new MeshProcessor()
      const meshes = processor.extractMeshes(group)

      expect(meshes).toHaveLength(2)
    })

    it('should extract meshes from nested Groups', () => {
      const rootGroup = new THREE.Group()
      const childGroup = new THREE.Group()
      const mesh1 = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
      const mesh2 = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())

      childGroup.add(mesh2)
      rootGroup.add(mesh1)
      rootGroup.add(childGroup)

      const processor = new MeshProcessor()
      const meshes = processor.extractMeshes(rootGroup)

      expect(meshes).toHaveLength(2)
    })

    it('should return empty array for empty Group', () => {
      const group = new THREE.Group()

      const processor = new MeshProcessor()
      const meshes = processor.extractMeshes(group)

      expect(meshes).toHaveLength(0)
    })

    it('should ignore non-mesh objects', () => {
      const group = new THREE.Group()
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
      const light = new THREE.PointLight()
      group.add(mesh)
      group.add(light)

      const processor = new MeshProcessor()
      const meshes = processor.extractMeshes(group)

      expect(meshes).toHaveLength(1)
      expect(meshes[0]).toBeInstanceOf(THREE.Mesh)
    })
  })
})
