# Hydra Browser

## 1. システム概要

Hydra Browserは、複数の役割・デバイスサイズで同一システムを同時テストするための開発者向けブラウザです。

### 主な機能

- **マルチペインブラウジング**: 複数のブラウザペインを同時に表示
- **デバイスエミュレーション**: 様々なデバイス解像度をシミュレーション
- **セッション分離**: 26種類の独立したセッションパーティション（A-Z）
- **ワークスペース管理**: ペイン構成の保存・復元
- **ダウンロード管理**: 組み込みダウンロードマネージャー
- **コンソール監視**: コンソールの警告/エラーを視覚的に表示

### 技術スタック

- **フレームワーク**: Electron
- **レンダリングエンジン**: Chromium (WebContentsView使用)
- **フロントエンド**: React, TypeScript, MUI v7
- **状態管理**: Zustand
- **国際化**: i18next

## 2. 対応OS

- Windows 10/11 (x64, arm64)
- macOS 10.15+ (x64, arm64)
- Linux (Debian系/RHEL系) (x64, arm64)

注記: 本プロジェクトは Windows ではコード署名を行っていません。SmartScreen が警告を表示する場合は「詳細情報」→「実行」を選択してください。

## 3. 開発者向けリファレンス

### 開発ルール

- 開発者の参照するドキュメントは`README.md`、`README-ja.md`を除き`Documents`に配置すること。
- 対応後は必ずリンターで確認を行い適切な修正を行うこと。故意にリンターエラーを許容する際は、その旨をコメントで明記すること。 **ビルドはリリース時に行うものでデバックには不要なのでリンターまでで十分**
- モデルの実装時は、テーブル単位でファイルを配置すること。
- 部品化するものは`modules`にファイルを作成して実装すること。
- 一時的なスクリプトなど（例:調査用スクリプト）は`scripts`ディレクトリに配置すること。
- モデルを作成および変更を加えた場合は、`Documents/テーブル定義.md`を更新すること。テーブル定義はテーブルごとに表で表現し、カラム名や型およびリレーションを表内で表現すること。
- システムの動作などに変更があった場合は、`Documents/システム仕様.md`を更新すること。

### 必要要件

- Node.js 22.x以上
- yarn 4
- Git

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd hydra-browser

# 依存関係のインストール
yarn install

# 開発起動
yarn dev
```

開発時のDevTools:

- DevTools はデタッチ表示で自動的に開きます
- F12 または Ctrl+Shift+I（macOSは Cmd+Option+I）でトグル可能

### ビルド/配布

- 全プラットフォーム: `yarn dist`
- Windows: `yarn dist:win`
- macOS: `yarn dist:mac`
- Linux: `yarn dist:linux`

開発時は BrowserRouter で `<http://localhost:3001>` を、配布ビルドでは HashRouter で `dist/renderer/index.html` を読み込みます。

### Windows 事前準備: 開発者モード

Windows で署名なしのローカルビルド/配布物を実行・テストする場合は、OSの開発者モードを有効にしてください。

1. 設定 → プライバシーとセキュリティ → 開発者向け
2. 「開発者モード」をオンにする
3. OSを再起動

### プロジェクト構造

```text
src/
├── main/                  # Electron メイン: IPC/各種サービス
│   ├── index.ts           # 起動・ウィンドウ生成・サービス初期化
│   ├── ipc/               # IPCハンドラ
│   ├── services/          # 各種サービス
│   │   ├── storage-service.ts    # データ永続化
│   │   ├── session-service.ts    # セッション/パーティション管理
│   │   ├── pane-service.ts       # ペイン(WebContentsView)管理
│   │   ├── workspace-service.ts  # ワークスペース管理
│   │   └── download-service.ts   # ダウンロード管理
│   └── utils/             # 各種ユーティリティ
├── preload/               # renderer へ安全にAPIをブリッジ
├── renderer/              # React + MUI UI
│   ├── components/        # UIコンポーネント
│   ├── stores/            # Zustand状態管理
│   ├── i18n/              # 多言語対応
│   └── constants.ts       # 定数定義
├── shared/                # 型定義・定数(Default設定/保存パス)
│   ├── types.ts           # 型定義
│   ├── constants.ts       # 定数
│   └── ipc.ts             # IPC型定義
└── public/                # アイコン等
```

### 使用技術

- **Electron 38**
- **React 19 (MUI v7)**
- **TypeScript 5**
- **Zustand**
- **i18next**
- **Vite 7**

### Windows用アイコンの作成

```exec
magick public/icon.png -define icon:auto-resize=256,128,96,64,48,32,24,16 public/icon.ico
```

## 4. 機能詳細

### 4.1 ペイン管理

- ツールバーから新規ペインを追加
- 解像度プリセット（Mobile/Tablet/Desktop）またはカスタム入力
- 表示スケール（10-200%）の設定
- パーティション（A-Z）の選択

### 4.2 解像度プリセット

| カテゴリ | デバイス名 | 解像度 |
|----------|------------|--------|
| Mobile | iPhone SE | 375x667 |
| Mobile | iPhone 14 | 390x844 |
| Mobile | iPhone 14 Pro Max | 430x932 |
| Mobile | Pixel 7 | 412x915 |
| Mobile | Galaxy S20 | 360x800 |
| Tablet | iPad Mini | 768x1024 |
| Tablet | iPad Air | 820x1180 |
| Tablet | iPad Pro 12.9 | 1024x1366 |
| Desktop | Laptop | 1366x768 |
| Desktop | Desktop | 1920x1080 |
| Desktop | Desktop Large | 2560x1440 |

### 4.3 セッション分離

同一パーティションはCookieを共有、異なるパーティションは完全分離。

| データ種別 | 分離/共有 |
|-----------|----------|
| Cookie | パーティションごとに分離 |
| localStorage | パーティションごとに分離 |
| sessionStorage | パーティションごとに分離 |
| IndexedDB | パーティションごとに分離 |
| オートコンプリート | 全パーティション共有 |

### 4.4 ワークスペース

- 新規作成/削除/リネーム
- ペイン構成の自動保存
- 起動時に前回のワークスペースを復元

### 4.5 コンソール状態表示

| 状態 | タイトルバー背景色 |
|------|-------------------|
| 通常 | デフォルト色 |
| Warning検出 | 黄色系 |
| Error検出 | 赤系 |

ページ移動時にリセット。Error > Warning の優先順位。

### 4.6 データ保存先

| OS | パス |
|----|------|
| Windows | %APPDATA%\Hydra\ |
| macOS | ~/Library/Application Support/Hydra/ |
| Linux | $XDG_CONFIG_HOME/Hydra/ または ~/.config/Hydra/ |
