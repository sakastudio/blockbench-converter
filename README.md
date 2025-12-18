# Blockbench Converter

GLB/GLTF形式の3DモデルをボクセルデータへVariableし、Blockbench用Minecraftリソースパック形式（Java Block/Item Model .json）で出力するWebアプリケーション。

すべての処理はクライアントサイド（ブラウザ内）で完結します。

## Demo

https://sakastudio.github.io/blockbench-converter/

## 機能

- GLB/GLTFファイルのドラッグ&ドロップ・選択
- ボクセル解像度の設定（8-64）
- 3Dプレビュー表示
- Blockbench形式（.json）へのエクスポート
- テクスチャアトラス（PNG）の自動生成
- ZIPファイルでのダウンロード

## 技術スタック

- React + TypeScript + Vite
- Three.js / React Three Fiber
- three-mesh-bvh（BVHによる高速レイキャスト）
- JSZip

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# リント
npm run lint

# テスト
npm run test
```

## ライセンス

MIT
