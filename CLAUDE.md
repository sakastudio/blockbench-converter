# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

GLB/GLTF形式の3DモデルをボクセルデータへVariableし、Blockbench用Minecraftリソースパック形式（Java Block/Item Model .json）で出力するサーバーレスWebアプリケーション。すべての処理はクライアントサイド（ブラウザ内）で完結する。

## コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド（TypeScriptコンパイル + Viteビルド）
npm run build

# リント
npm run lint

# テスト実行
npm run test

# テスト（ウォッチモード）
npm run test:watch
```

## アーキテクチャ

3層レイヤード構造を採用：

### UIレイヤー (`src/components/`)
- `FileUploader`: GLB/GLTFファイルのドラッグ&ドロップ・選択
- `SettingsPanel`: ボクセル解像度（8-64）などのパラメータ設定
- `PreviewCanvas`: React Three Fiberによる3Dプレビュー
- `ExportButton`: Blockbench形式へのエクスポート
- `Layout`, `ProgressIndicator`, `ErrorDisplay`: 共通UI

### ドメインレイヤー (`src/services/`)
- **voxelization/**
  - `VoxelizationEngine`: ボクセル化のメインエントリポイント
  - `MeshProcessor`: メッシュ抽出とBVH構築（three-mesh-bvhによる高速レイキャスト）
  - `ColorSampler`: テクスチャ/マテリアルからの色サンプリング
  - `GridBuilder`: ボクセルグリッド生成とレイキャスト判定
- **export/**
  - `BlockbenchExporter`: VoxelGrid → Blockbench形式変換の統合
  - `ModelGenerator`: ボクセルをBlockbench elements配列へ変換（座標を-16〜32に正規化）
  - `TextureGenerator`: ユニークな色からテクスチャアトラス（PNG）生成

### ユーティリティレイヤー (`src/utils/`)
- `gltfLoader`: Three.js GLTFLoaderのラッパー
- `zipBuilder`: JSZipによるZIPアーカイブ生成
- `fileDownloader`: Blobのダウンロード処理

### 状態管理 (`src/context/`)
- `AppContext`: React Contextによるグローバル状態管理
- `appReducer`: 状態遷移（idle → loading → processing → ready/error）

### 型定義 (`src/types/`)
- `voxel.ts`: Vector3, Color, Voxel, VoxelGrid, VoxelizationOptions
- `blockbench.ts`: BlockbenchFace, BlockbenchElement, BlockbenchModel
- `app.ts`: AppState, AppAction

## データフロー

```
ファイル入力 → GLTFパース → メッシュ抽出 → BVH構築 → レイキャストでボクセル化
    → 色サンプリング → VoxelGrid生成 → プレビュー表示
    → Blockbench形式変換 → テクスチャ生成 → ZIP生成 → ダウンロード
```

## 技術スタック

- **3D**: three.js, @react-three/fiber, @react-three/drei
- **レイキャスト最適化**: three-mesh-bvh（BVHによるO(log n)交差判定）
- **ZIP生成**: jszip
- **テスト**: vitest + @testing-library/react + jsdom

## Blockbench出力形式

- 各ボクセルは1つのelement（立方体）として出力
- 座標範囲: -16〜32（Minecraft制約）
- テクスチャはPNGアトラスとして生成し、各面のUVが対応する色を参照
