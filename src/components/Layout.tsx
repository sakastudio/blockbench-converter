import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="layout-header">
        <h1 className="layout-title">GLTF to Voxel Converter</h1>
        <p className="layout-subtitle">GLB/GLTFをボクセル化してBlockbench形式で出力</p>
      </header>
      <main className="layout-main">{children}</main>
      <footer className="layout-footer">
        <p>すべての処理はクライアントサイドで完結します</p>
      </footer>
    </div>
  )
}
