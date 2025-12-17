# 技術設計書: gltf-voxel-converter

## 1. アーキテクチャパターン & 境界マップ

### 1.1 アーキテクチャ概要

本システムはレイヤードアーキテクチャを採用し、以下の3層で構成する。

```
┌─────────────────────────────────────────────────────────────┐
│                      UIレイヤー                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │FileUploader │ │SettingsPanel│ │    PreviewCanvas        ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    ExportButton                         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ドメインレイヤー                          │
│  ┌─────────────────────┐ ┌─────────────────────────────────┐│
│  │   VoxelizationEngine│ │     BlockbenchExporter         ││
│  │   ├─ MeshProcessor  │ │     ├─ ModelGenerator          ││
│  │   ├─ ColorSampler   │ │     └─ TextureGenerator        ││
│  │   └─ GridBuilder    │ │                                 ││
│  └─────────────────────┘ └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  ユーティリティレイヤー                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ GLTFLoader  │ │  ZipBuilder │ │     FileDownloader      ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 1.2 データフロー

```
[ファイル入力] → [GLTFパース] → [メッシュ抽出] → [ボクセル化]
                                                      │
                                                      ▼
[ZIPダウンロード] ← [ZIP生成] ← [Blockbench形式変換] ← [プレビュー表示]
```

---

## 2. 技術スタック & 整合性

### 2.1 コア技術

| カテゴリ | 技術 | バージョン | 用途 |
|----------|------|-----------|------|
| フレームワーク | React | 18.x | UIコンポーネント |
| 言語 | TypeScript | 5.x | 型安全な開発 |
| ビルドツール | Vite | 5.x | 高速開発サーバー・ビルド |
| テスト | Vitest | 2.x | ユニットテスト |
| 3Dレンダリング | three.js | >=0.159.0 | WebGL 3D描画 |
| React 3D統合 | @react-three/fiber | 8.x | React用three.jsレンダラー |
| 3Dヘルパー | @react-three/drei | 10.x | 便利なコンポーネント・フック |
| レイキャスト高速化 | three-mesh-bvh | 0.9.x | BVHによる高速レイキャスト |
| ZIP生成 | jszip | 3.x | クライアントサイドZIP作成 |

### 2.2 開発依存関係

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| @types/three | latest | three.js型定義 |
| @types/react | 18.x | React型定義 |

---

## 3. コンポーネント & インターフェース契約

### 3.1 型定義

```typescript
// src/types/voxel.ts

/** 3次元座標 */
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** RGB色情報 */
interface Color {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/** 単一ボクセル */
interface Voxel {
  position: Vector3;
  color: Color;
}

/** ボクセルグリッド */
interface VoxelGrid {
  resolution: number;
  voxels: Voxel[];
  boundingBox: {
    min: Vector3;
    max: Vector3;
  };
}

/** ボクセル化設定 */
interface VoxelizationOptions {
  resolution: number; // 8-64
  fillInterior: boolean;
  colorSamplingMode: 'average' | 'dominant' | 'nearest';
}
```

```typescript
// src/types/blockbench.ts

/** Blockbench要素の面定義 */
interface BlockbenchFace {
  uv: [number, number, number, number]; // [x1, y1, x2, y2]
  texture: string; // "#texture_name"
  cullface?: 'down' | 'up' | 'north' | 'south' | 'west' | 'east';
  rotation?: 0 | 90 | 180 | 270;
}

/** Blockbench要素（立方体） */
interface BlockbenchElement {
  from: [number, number, number];
  to: [number, number, number];
  faces: {
    down?: BlockbenchFace;
    up?: BlockbenchFace;
    north?: BlockbenchFace;
    south?: BlockbenchFace;
    west?: BlockbenchFace;
    east?: BlockbenchFace;
  };
}

/** Blockbenchモデル形式 */
interface BlockbenchModel {
  credit?: string;
  textures: Record<string, string>;
  elements: BlockbenchElement[];
  display?: Record<string, {
    rotation?: [number, number, number];
    translation?: [number, number, number];
    scale?: [number, number, number];
  }>;
}
```

```typescript
// src/types/app.ts

/** アプリケーション状態 */
interface AppState {
  status: 'idle' | 'loading' | 'processing' | 'ready' | 'error';
  loadedModel: THREE.Group | null;
  voxelGrid: VoxelGrid | null;
  options: VoxelizationOptions;
  error: string | null;
  progress: number; // 0-100
}

/** アプリケーションアクション */
type AppAction =
  | { type: 'LOAD_MODEL_START' }
  | { type: 'LOAD_MODEL_SUCCESS'; payload: THREE.Group }
  | { type: 'LOAD_MODEL_ERROR'; payload: string }
  | { type: 'VOXELIZE_START' }
  | { type: 'VOXELIZE_PROGRESS'; payload: number }
  | { type: 'VOXELIZE_SUCCESS'; payload: VoxelGrid }
  | { type: 'VOXELIZE_ERROR'; payload: string }
  | { type: 'UPDATE_OPTIONS'; payload: Partial<VoxelizationOptions> }
  | { type: 'RESET' };
```

### 3.2 UIコンポーネント

#### FileUploader
**要件トレース**: FR-1.1, FR-1.2

```typescript
// src/components/FileUploader.tsx

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[]; // ['.glb', '.gltf']
  disabled?: boolean;
}

/**
 * ドラッグ&ドロップおよびファイル選択ダイアログによる
 * GLB/GLTFファイルの入力を受け付けるコンポーネント
 */
declare function FileUploader(props: FileUploaderProps): JSX.Element;
```

#### SettingsPanel
**要件トレース**: FR-2.1

```typescript
// src/components/SettingsPanel.tsx

interface SettingsPanelProps {
  options: VoxelizationOptions;
  onOptionsChange: (options: VoxelizationOptions) => void;
  disabled?: boolean;
}

/**
 * ボクセル解像度およびその他のパラメータを設定するパネル
 */
declare function SettingsPanel(props: SettingsPanelProps): JSX.Element;
```

#### PreviewCanvas
**要件トレース**: FR-3.1, FR-3.2

```typescript
// src/components/PreviewCanvas.tsx

interface PreviewCanvasProps {
  voxelGrid: VoxelGrid | null;
  originalModel: THREE.Group | null;
  showOriginal?: boolean;
}

/**
 * ボクセル化結果を3Dプレビュー表示するキャンバス
 * OrbitControlsによる回転・ズーム操作をサポート
 */
declare function PreviewCanvas(props: PreviewCanvasProps): JSX.Element;
```

#### ExportButton
**要件トレース**: FR-4.1, FR-4.2, FR-4.3

```typescript
// src/components/ExportButton.tsx

interface ExportButtonProps {
  voxelGrid: VoxelGrid | null;
  filename?: string;
  disabled?: boolean;
}

/**
 * ボクセルデータをBlockbench形式に変換し、
 * ZIPファイルとしてダウンロードするボタン
 */
declare function ExportButton(props: ExportButtonProps): JSX.Element;
```

### 3.3 ドメインサービス

#### VoxelizationEngine
**要件トレース**: FR-2.2, FR-2.3, NFR-6.1, NFR-6.2

```typescript
// src/services/voxelization/VoxelizationEngine.ts

interface VoxelizationEngine {
  /**
   * 3Dメッシュをボクセルグリッドに変換する
   * @param mesh - three.jsのMeshまたはGroup
   * @param options - ボクセル化設定
   * @param onProgress - 進捗コールバック (0-100)
   * @returns ボクセルグリッド
   */
  voxelize(
    mesh: THREE.Mesh | THREE.Group,
    options: VoxelizationOptions,
    onProgress?: (progress: number) => void
  ): Promise<VoxelGrid>;
}
```

**内部モジュール**:

```typescript
// src/services/voxelization/MeshProcessor.ts

interface MeshProcessor {
  /**
   * メッシュからBVH構造を構築し、レイキャスト用に最適化
   */
  prepareMesh(mesh: THREE.Mesh): THREE.Mesh;

  /**
   * Groupから全メッシュを抽出
   */
  extractMeshes(group: THREE.Group): THREE.Mesh[];
}
```

```typescript
// src/services/voxelization/ColorSampler.ts

interface ColorSampler {
  /**
   * 指定位置のメッシュ表面色をサンプリング
   */
  sampleColor(
    mesh: THREE.Mesh,
    position: Vector3,
    normal: Vector3
  ): Color;

  /**
   * テクスチャからUV座標で色を取得
   */
  sampleTextureColor(
    texture: THREE.Texture,
    uv: { x: number; y: number }
  ): Color;
}
```

```typescript
// src/services/voxelization/GridBuilder.ts

interface GridBuilder {
  /**
   * バウンディングボックスからボクセルグリッドを初期化
   */
  createGrid(
    boundingBox: THREE.Box3,
    resolution: number
  ): { positions: Vector3[]; voxelSize: number };

  /**
   * レイキャスト結果からボクセルを生成
   */
  buildVoxels(
    positions: Vector3[],
    hitResults: Map<string, { hit: boolean; color: Color }>
  ): Voxel[];
}
```

#### BlockbenchExporter
**要件トレース**: FR-4.1, FR-4.2

```typescript
// src/services/export/BlockbenchExporter.ts

interface ExportResult {
  modelJson: BlockbenchModel;
  textureData: Blob; // PNG画像
  textureName: string;
}

interface BlockbenchExporter {
  /**
   * ボクセルグリッドをBlockbench形式に変換
   */
  export(voxelGrid: VoxelGrid): Promise<ExportResult>;
}
```

**内部モジュール**:

```typescript
// src/services/export/ModelGenerator.ts

interface ModelGenerator {
  /**
   * ボクセル配列をBlockbench要素配列に変換
   * 座標を-16〜32範囲に正規化
   */
  generateElements(
    voxels: Voxel[],
    colorMap: Map<string, number> // colorKey -> textureIndex
  ): BlockbenchElement[];
}
```

```typescript
// src/services/export/TextureGenerator.ts

interface TextureGenerator {
  /**
   * ユニークな色からテクスチャアトラスを生成
   */
  generateTexture(colors: Color[]): {
    blob: Blob;
    colorMap: Map<string, number>; // colorKey -> index
    uvMap: Map<number, [number, number, number, number]>; // index -> UV座標
  };
}
```

### 3.4 ユーティリティ

#### GLTFLoaderUtil
**要件トレース**: FR-1.1

```typescript
// src/utils/gltfLoader.ts

interface GLTFLoaderUtil {
  /**
   * FileオブジェクトからGLTF/GLBをパース
   */
  loadFromFile(file: File): Promise<THREE.Group>;

  /**
   * ファイル形式を検証
   */
  validateFile(file: File): { valid: boolean; error?: string };
}
```

#### ZipBuilder
**要件トレース**: FR-4.3

```typescript
// src/utils/zipBuilder.ts

interface ZipFile {
  name: string;
  content: string | Blob | Uint8Array;
}

interface ZipBuilder {
  /**
   * 複数ファイルをZIPアーカイブにまとめる
   */
  build(files: ZipFile[]): Promise<Blob>;
}
```

#### FileDownloader
**要件トレース**: FR-4.3

```typescript
// src/utils/fileDownloader.ts

interface FileDownloader {
  /**
   * Blobをファイルとしてダウンロードさせる
   */
  download(blob: Blob, filename: string): void;
}
```

---

## 4. 状態管理

### 4.1 Context & Reducer

```typescript
// src/context/AppContext.tsx

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    loadModel: (file: File) => Promise<void>;
    voxelize: () => Promise<void>;
    exportModel: (filename?: string) => Promise<void>;
    updateOptions: (options: Partial<VoxelizationOptions>) => void;
    reset: () => void;
  };
}

declare const AppContext: React.Context<AppContextValue>;
declare function AppProvider(props: { children: React.ReactNode }): JSX.Element;
declare function useApp(): AppContextValue;
```

### 4.2 状態遷移図

```
        ┌─────────────────────────────────────────┐
        │                                         │
        ▼                                         │
    ┌───────┐    LOAD_MODEL_START    ┌─────────┐  │
    │ idle  │───────────────────────▶│ loading │  │
    └───────┘                        └─────────┘  │
        ▲                                │        │
        │                    ┌───────────┴────────┤
        │                    ▼                    │
        │             ┌────────────┐              │
        │             │   error    │──── RESET ───┤
        │             └────────────┘              │
        │                    ▲                    │
        │                    │                    │
        │         LOAD_MODEL_ERROR                │
        │         VOXELIZE_ERROR                  │
        │                    │                    │
    ┌───────┐   LOAD_MODEL_SUCCESS   ┌────────────┴─┐
    │ ready │◀──────────────────────│  processing  │
    └───────┘                        └──────────────┘
        │                                   ▲
        │         VOXELIZE_START           │
        └──────────────────────────────────┘
              VOXELIZE_SUCCESS
```

---

## 5. ディレクトリ構造

```
src/
├── components/
│   ├── FileUploader.tsx
│   ├── SettingsPanel.tsx
│   ├── PreviewCanvas.tsx
│   ├── ExportButton.tsx
│   ├── ProgressIndicator.tsx
│   ├── ErrorDisplay.tsx
│   └── Layout.tsx
├── context/
│   ├── AppContext.tsx
│   └── appReducer.ts
├── services/
│   ├── voxelization/
│   │   ├── VoxelizationEngine.ts
│   │   ├── MeshProcessor.ts
│   │   ├── ColorSampler.ts
│   │   └── GridBuilder.ts
│   └── export/
│       ├── BlockbenchExporter.ts
│       ├── ModelGenerator.ts
│       └── TextureGenerator.ts
├── utils/
│   ├── gltfLoader.ts
│   ├── zipBuilder.ts
│   └── fileDownloader.ts
├── types/
│   ├── voxel.ts
│   ├── blockbench.ts
│   └── app.ts
├── hooks/
│   └── useApp.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## 6. 要件トレーサビリティマトリクス

| 要件ID | 要件名 | 対応コンポーネント |
|--------|--------|-------------------|
| FR-1.1 | GLB/GLTFファイル読み込み | FileUploader, GLTFLoaderUtil |
| FR-1.2 | サーバーレス処理 | 全コンポーネント（クライアントサイド） |
| FR-2.1 | ボクセル解像度設定 | SettingsPanel |
| FR-2.2 | テクスチャからの色抽出 | ColorSampler |
| FR-2.3 | ジオメトリのボクセル化 | VoxelizationEngine, GridBuilder |
| FR-3.1 | 3Dプレビュー表示 | PreviewCanvas |
| FR-3.2 | リアルタイムパラメータ調整 | SettingsPanel, AppContext |
| FR-4.1 | Blockbench形式出力 | BlockbenchExporter, ModelGenerator |
| FR-4.2 | テクスチャ出力 | TextureGenerator |
| FR-4.3 | ファイルダウンロード | ZipBuilder, FileDownloader, ExportButton |
| FR-5.1 | レスポンシブデザイン | Layout, CSS |
| FR-5.2 | エラーハンドリング | ErrorDisplay, AppContext |
| NFR-6.1 | 変換速度 | three-mesh-bvh, VoxelizationEngine |
| NFR-6.2 | メモリ使用量 | VoxelizationEngine（段階的処理） |

---

## 7. パフォーマンス考慮事項

### 7.1 レイキャスト最適化
- **three-mesh-bvh**によるBVH構造でO(log n)の交差判定
- `firstHitOnly`オプションで早期終了

### 7.2 メモリ管理
- 大規模モデルの段階的処理
- 不要な中間データの即時解放
- `dispose()`による明示的なリソース解放

### 7.3 UI応答性
- 非同期処理によるUIブロッキング回避
- 進捗表示による体感速度の向上
- 将来的なWeb Worker導入の余地

---

## 8. セキュリティ考慮事項

### 8.1 入力検証
- ファイル拡張子とMIMEタイプの検証
- 最大ファイルサイズ制限（推奨: 50MB）
- 不正なGLTF構造の検出とエラー処理

### 8.2 クライアントサイド完結
- 外部サーバーへのデータ送信なし
- ローカルファイルシステムへの直接アクセスなし
- オフライン動作対応

---

## 9. 出典・参考資料

- [React Three Fiber Documentation](https://r3f.docs.pmnd.rs/)
- [three-mesh-bvh GitHub](https://github.com/gkjohnson/three-mesh-bvh)
- [JSZip Documentation](https://stuk.github.io/jszip/)
- [Minecraft Wiki - Model](https://minecraft.wiki/w/Model)
- 詳細な技術調査: `research.md`
