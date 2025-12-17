# 技術調査ログ: gltf-voxel-converter

## 概要

本プロジェクトはGLB/GLTF形式の3Dモデルをボクセル化し、Blockbench用Minecraft形式で出力するサーバーレスWebアプリケーションである。新規プロジェクト（グリーンフィールド）として、フルディスカバリープロセスを実施した。

---

## 調査ログ

### 1. 3Dレンダリング・モデルローディング

**調査対象**: React環境での3Dモデル表示とGLTF読み込み

**調査結果**:
- **three.js**: WebGL 3Dライブラリのデファクトスタンダード
- **@react-three/fiber**: three.jsのReactレンダラー
  - React 18対応: v8.x
  - React 19対応: v9.x
  - 最新版: 9.4.2
- **@react-three/drei**: 便利なヘルパーコンポーネント集
  - 最新版: 10.7.7
  - `useGLTF`フック: Dracoデコーダー対応のGLTFローダー
- **GLTFLoader**: three.jsのGLTF/GLBパーサー
  - `three/addons/loaders/GLTFLoader.js`からインポート
  - テクスチャ、マテリアル、メッシュを自動解析

**決定**: React 18環境では `@react-three/fiber@8` + `@react-three/drei` を使用

**出典**:
- [React Three Fiber Documentation](https://r3f.docs.pmnd.rs/)
- [Loading Models - R3F](https://r3f.docs.pmnd.rs/tutorials/loading-models)
- [@react-three/fiber npm](https://www.npmjs.com/package/@react-three/fiber)

---

### 2. ボクセル化アルゴリズム

**調査対象**: 3Dメッシュをボクセルグリッドに変換する手法

**調査結果**:

**アプローチ比較**:
| 手法 | 説明 | 適用性 |
|------|------|--------|
| レイキャスト法 | グリッド各点から光線を飛ばしメッシュ交差判定 | 汎用的、実装容易 |
| サーフェスボクセル化 | メッシュ表面のみをボクセル化 | 高速、見た目重視 |
| ボリュームボクセル化 | 内部も含めて充填 | 完全性重視 |

**three-mesh-bvh**:
- BVH（Bounding Volume Hierarchy）によるレイキャスト高速化
- 80,000ポリゴンモデルに対して60fpsで500レイキャスト可能
- 最新版: 0.9.1
- three.js >= 0.159.0 が必要
- MITライセンス

**voxelizerライブラリ**:
- three.jsベースのボクセル化エンジン
- `Sampler`クラスでレイキャスト法を実装
- オプション: `fill`（内部充填）、`color`（色情報保持）
- 出力形式: BINVOX、XML、ndarray

**決定**: カスタム実装 + three-mesh-bvhによるレイキャスト高速化を採用

**理由**:
- voxelizerは依存関係が古く、最新three.jsとの互換性に懸念
- three-mesh-bvhは活発にメンテナンスされている
- Blockbench形式への変換に特化したカスタムロジックが必要

**出典**:
- [three-mesh-bvh GitHub](https://github.com/gkjohnson/three-mesh-bvh)
- [voxelizer npm](https://www.npmjs.com/package/voxelizer)

---

### 3. ZIP生成

**調査対象**: クライアントサイドでのZIPファイル生成

**調査結果**:
- **JSZip**: ブラウザ内ZIP生成のデファクトスタンダード
- 最新版: 3.10.x
- 機能:
  - ファイル/フォルダ追加
  - Blob生成によるダウンロード
  - 圧縮レベル指定
- TypeScript型定義: `@types/jszip`

```typescript
const zip = new JSZip();
zip.file("model.json", jsonContent);
zip.file("texture.png", pngBlob);
const blob = await zip.generateAsync({ type: "blob" });
```

**決定**: JSZipを採用

**出典**:
- [JSZip Documentation](https://stuk.github.io/jszip/)

---

### 4. テクスチャ生成

**調査対象**: ボクセル色情報をテクスチャ画像として出力

**調査結果**:
- Canvas APIを使用してPNG生成可能
- 色パレットをテクスチャアトラスとして配置
- Minecraft形式では16x16ピクセル単位が標準
- `canvas.toBlob()`でPNG出力

**アプローチ**:
1. ユニークな色を収集
2. 色パレットテクスチャを生成（例: 16x16のグリッド）
3. 各ボクセル面のUVを対応する色位置に設定

**決定**: Canvas APIによるカスタムテクスチャ生成

---

### 5. アーキテクチャパターン評価

**候補パターン**:

| パターン | 説明 | 評価 |
|----------|------|------|
| レイヤードアーキテクチャ | UI/ビジネス/データの層分離 | シンプルで適切 |
| クリーンアーキテクチャ | 依存性逆転原則による層分離 | 小規模プロジェクトには過剰 |
| イベント駆動 | 非同期イベントによる疎結合 | 不要な複雑さ |

**決定**: レイヤードアーキテクチャを採用

**構成**:
- **UIレイヤー**: Reactコンポーネント
- **ドメインレイヤー**: ボクセル化・変換ロジック
- **ユーティリティレイヤー**: ファイルI/O、ZIP生成

---

## 設計上の決定事項

### DD-1: 3Dライブラリ選定
- **決定**: three.js + @react-three/fiber + @react-three/drei
- **根拠**: Reactとの統合が容易、GLTFサポートが充実、活発なコミュニティ

### DD-2: ボクセル化エンジン
- **決定**: カスタム実装 + three-mesh-bvhによる高速化
- **根拠**: Blockbench形式への最適化、依存関係の最小化

### DD-3: 状態管理
- **決定**: React Context + useReducer
- **根拠**: 外部ライブラリ不要、シンプルなデータフロー

### DD-4: ZIP生成
- **決定**: JSZip
- **根拠**: 成熟したライブラリ、TypeScript対応、クライアントサイド完結

---

## リスクと軽減策

| リスク | 影響 | 軽減策 |
|--------|------|--------|
| 大規模モデルでのパフォーマンス低下 | 中 | Web Worker活用、解像度制限（最大64） |
| メモリ不足 | 中 | 段階的処理、不要オブジェクトの即時解放 |
| ブラウザ互換性 | 低 | WebGL2対応ブラウザを前提、フォールバック表示 |
| テクスチャ解像度制限 | 低 | 色数を256色以内に量子化 |

---

## 並列化の考慮事項

タスク生成フェーズ向けの依存関係分析:

**独立タスク（並列実行可能）**:
- ファイルアップロードUI
- 3Dプレビューコンポーネント
- 設定パネルUI

**依存タスク（順次実行）**:
1. プロジェクト初期化 → 2. コア型定義 → 3. ボクセル化エンジン → 4. エクスポーター → 5. UI統合
