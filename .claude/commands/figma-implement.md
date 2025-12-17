---
description: FigmaデザインをMantineを使ったReactコンポーネントとして実装
allowed-tools: mcp__figma__get_figma_data, mcp__figma__download_figma_images, Read, Edit, Write, Bash, Glob, Grep
argument-hint: <figma-url> <target-file-path>
---

# Figmaデザイン実装コマンド

FigmaのデザインをReactコンポーネントとして実装します。

## 入力引数

- Figma URL: $1
- 編集対象ファイルパス: $2

## 実装手順

### 1. Figmaデザインデータの取得
- 引数で渡された Figma URL（$1）からfileKeyとnodeIdを抽出
- `mcp__figma__get_figma_data`を使用してデザインデータを取得
- レイアウト構造、テキスト、色、サイズ、ギャップなどを確認

### 2. 画像アセットのダウンロード（必要な場合）
- `mcp__figma__download_figma_images`を使用
- `abelia-app/src/applications/[アプリ名]/assets/`に保存
- SVGまたはPNG形式でダウンロード

### 3. 編集対象ファイルの確認
- 引数で渡されたファイルパス（$2）を Read で読み込む
- 既存のコード構造を理解する
- 既存のインポート文を確認する

### 4. コンポーネント実装の制約

#### 使用可能なMantineコンポーネント（これらのみ）
- `Group` - 水平レイアウト
- `Stack` - 垂直レイアウト
- `Image` - 画像表示
- `Text` - テキスト表示

#### 使用可能なMantineのprops（これらのみ）
- `gap` - 要素間のギャップ
- `pl` - padding-left
- `pt` - padding-top
- `ff` - フォントファミリー
- `fw` - フォントウェイト（"bold"など、テキストのみ）
- `w` - 幅（画像のみ）
- `h` - 高さ（画像のみ）

**重要: `style={{}}`、`bg`、`c`、`size`、`width`、`height`などのその他のpropsは使用しない**

#### プロジェクト固有のコンポーネント
既存のコードで定義されているもの：
- `LabeledInputFields` - ラベル付き入力フィールド
- `CommonButton` - ボタン
- `CommonSelect` - セレクトボックス
- `CommonRadioButton` - ラジオボタン
など

### 5. 階層構造の再現
**重要: Figmaの階層構造とReactコンポーネントの階層構造を一致させる**

- Figmaで`Frame`や`Group`でネストされている場合、Reactでも`Group`や`Stack`でネストする
- 各要素を適切に`Group`で囲む
- `pl`、`pt`で位置調整

例：
```tsx
<Group gap={22}>
  <Stack gap={10}>
    <Group>
      <LabeledInputFields label="職業" values={["ああ"]} widths={[199]} />
    </Group>
    <Group>
      <LabeledInputFields label="役職" values={["ああ"]} widths={[199]} />
    </Group>
  </Stack>
</Group>
```

### 6. 実装パターン

#### 基本的な入力フィールド
```tsx
<Group>
  <LabeledInputFields label="ラベル名" values={["値"]} widths={[幅]} />
</Group>
```

#### 複数入力フィールドの並列配置
```tsx
<Group gap={21}>
  <LabeledInputFields label="電話番号" values={["ああ"]} widths={[199]} />
  <LabeledInputFields label="FAX" values={["ああ"]} widths={[200]} />
</Group>
```

#### ラジオボタン（位置調整付き）
```tsx
<Group gap={36} pl={98}>
  <CommonRadioButton label={"個人"} readOnly/>
  <CommonRadioButton label={"法人"} readOnly/>
</Group>
```

#### テキスト表示

- フォントを正しく設定すること。
- 適切にボールドを設定すること。

**使用可能なフォント:**
- `JF-Dot-Shinonome12` - 通常 & ボールド
- `JF-Dot-Shinonome14` - 通常 & ボールド
- `JF-Dot-Shinonome16` - 通常 & ボールド
- `JF-Dot-ShinonomeMaru12` - 通常 & ボールド（丸ゴシック）
- `JF-Dot-ShinonomeMin12` - 通常 & ボールド（明朝）
- `JF-Dot-ShinonomeMin14` - 通常 & ボールド（明朝）
- `JF-Dot-ShinonomeMin16` - 通常 & ボールド（明朝）

```tsx
<Text ff='JF-Dot-Shinonome14'>
  表示テキスト
</Text>

{/* ボールドの場合 */}
<Text ff='JF-Dot-Shinonome14' fw="bold">
  太字テキスト
</Text>
```

#### 画像表示
```tsx
<Image src={importした画像} alt="説明" w={幅} h={高さ} />
```

### 7. ビルドチェック
実装後は必ず以下を実行：
```bash
cd abelia-app && npm run build
```

TypeScriptエラーがある場合は必ず修正してから次に進む。

## 8. 実装時の最終チェック
- [ ] Figmaデザインデータを取得した
- [ ] 必要な画像をダウンロードした
- [ ] 階層構造をFigmaと一致させた
- [ ] 使用可能なprops（gap, pl, pt, ff, w, h）のみを使用した（pb, prは使用禁止。）
- [ ] 使用可能なMantineコンポーネント（Group, Stack, Image, Text）のみを使用した
- [ ] 正しいフォント、ボールドを設定した。
- [ ] `style={{}}`を使用していない
- [ ] 画像は`w`と`h`を使用（`width`と`height`ではない）
- [ ] 既存のプロジェクト固有コンポーネントを適切に使用した
- [ ] `npm run build`でエラーがないことを確認した

## 実装例
詳細は以下のファイルを参照：
- `abelia-app/src/applications/SupportCenter/index.tsx` - 顧客管理画面
- `abelia-app/src/applications/Mail/MailHeader.tsx` - メールヘッダー
