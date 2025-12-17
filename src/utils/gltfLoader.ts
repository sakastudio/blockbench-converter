import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

const VALID_EXTENSIONS = ['.glb', '.gltf']
const VALID_MIME_TYPES = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']

/**
 * ファイル形式を検証
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

  if (!VALID_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `対応していないファイル形式です。GLBまたはGLTFファイルを選択してください。`,
    }
  }

  // MIMEタイプのチェック（ただし拡張子が正しければ許容）
  if (!VALID_MIME_TYPES.includes(file.type) && file.type !== '') {
    // 拡張子が正しければMIMEタイプは無視
    if (!VALID_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `対応していないファイル形式です。GLBまたはGLTFファイルを選択してください。`,
      }
    }
  }

  return { valid: true }
}

/**
 * FileオブジェクトからGLTF/GLBをパース
 */
export async function loadFromFile(file: File): Promise<THREE.Group> {
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    const reader = new FileReader()

    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer
      if (!arrayBuffer) {
        reject(new Error('ファイルの読み込みに失敗しました'))
        return
      }

      loader.parse(
        arrayBuffer,
        '',
        (gltf: GLTF) => {
          resolve(gltf.scene)
        },
        (error: unknown) => {
          const message = error instanceof Error ? error.message : 'GLTFのパースに失敗しました'
          reject(new Error(message))
        }
      )
    }

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'))
    }

    reader.readAsArrayBuffer(file)
  })
}
