import * as THREE from 'three'
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from 'three-mesh-bvh'

// Extend THREE.BufferGeometry with BVH methods
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
THREE.Mesh.prototype.raycast = acceleratedRaycast

/**
 * メッシュ処理ユーティリティ
 * GLTFモデルからメッシュを抽出し、BVH構造を構築する
 */
export class MeshProcessor {
  /**
   * メッシュからBVH構造を構築し、レイキャスト用に最適化
   */
  prepareMesh(mesh: THREE.Mesh): THREE.Mesh {
    // Compute BVH for faster raycasting
    if (!mesh.geometry.boundsTree) {
      mesh.geometry.computeBoundsTree()
    }
    return mesh
  }

  /**
   * Groupから全メッシュを抽出
   */
  extractMeshes(group: THREE.Group): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = []

    group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        meshes.push(object)
      }
    })

    return meshes
  }

  /**
   * リソースを解放
   */
  disposeMesh(mesh: THREE.Mesh): void {
    if (mesh.geometry.boundsTree) {
      mesh.geometry.disposeBoundsTree()
    }
  }
}
