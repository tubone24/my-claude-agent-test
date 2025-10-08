# Cagent チャットUI

Docker Cagent AIエージェントランタイムのためのモダンなWebチャットインターフェースです。Next.js、TypeScript、Tailwind CSSを使用して構築されています。

## 機能

- 🤖 **マルチエージェント対応**: 複数のAIエージェントを管理・実行
- 💬 **リアルタイムチャット**: Server-Sent Events (SSE) によるストリーミング応答
- 📊 **セッション管理**: セッションの作成、保存、再開
- ⚙️ **エージェント管理**: GUI経由でのエージェント作成・編集・削除
- 🎨 **モダンUI**: Tailwind CSSによる美しいデザイン
- 📱 **レスポンシブ**: デスクトップ・モバイル対応

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **言語**: TypeScript
- **UIコンポーネント**: Radix UI (部分実装)

## 前提条件

1. Node.js 18+ がインストールされていること
2. Cagent APIサーバーが起動していること（デフォルト: `http://localhost:8080`）

## セットアップ

### 1. プロジェクトのセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

### 2. 環境変数設定

必要に応じて `.env.local` ファイルを作成し、Cagent APIサーバーのURLを設定してください：

```env
CAGENT_API_BASE_URL=http://localhost:8080/api
```

### 3. Cagent APIサーバーの起動

この UIは Docker Cagent APIサーバーと連携して動作します。

```bash
# Cagentをインストール (Go環境が必要)
go install github.com/docker/cagent@latest

# APIサーバーモードで起動
cagent serve --port 8080 --agents-dir ./agents
```

または、Docker を使用:

```bash
docker run -p 8080:8080 -v $(pwd)/agents:/agents cagent:latest serve
```

## 使用方法

### 1. エージェントの準備

Cagentサーバーのエージェントディレクトリに、以下のようなYAMLファイルを配置してください：

```yaml
#!/usr/bin/env cagent run
version: "2"

agents:
  root:
    model: anthropic/claude-sonnet-4-0
    description: "汎用AIアシスタント"
    instruction: |
      あなたは親切で知識豊富なAIアシスタントです。
      ユーザーの質問に正確で役立つ回答を提供してください。
    toolsets:
      - type: filesystem
      - type: memory
        path: "./assistant_memory.db"

models:
  anthropic/claude-sonnet-4-0:
    provider: anthropic
    model: claude-sonnet-4-0
    max_tokens: 64000
```

### 2. チャットの開始

1. ブラウザでアプリケーションを開く
2. サイドバーからエージェントを選択
3. メッセージを入力して送信
4. エージェントからのリアルタイム応答を確認

## プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # レイアウトコンポーネント
│   └── page.tsx           # メインページ
├── components/            # Reactコンポーネント
│   └── ui/               # UI基本コンポーネント
├── lib/                  # ユーティリティとロジック
│   ├── types.ts          # TypeScript型定義
│   ├── cagent-api.ts     # API通信クライアント
│   ├── store.ts          # Zustand状態管理
│   └── utils.ts          # ヘルパー関数
└── 設定ファイル群
```

## API連携

このUIは以下のCagent APIエンドポイントと連携します：

- `GET /api/ping` - ヘルスチェック
- `GET /api/agents` - エージェント一覧取得
- `GET /api/sessions` - セッション一覧取得
- `POST /api/sessions` - セッション作成
- `POST /api/sessions/:id/agent/:agent` - エージェント実行（SSE）

## ビルドとデプロイ

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

## トラブルシューティング

### Cagent APIサーバーに接続できない

1. Cagentサーバーが起動していることを確認
2. APIのURL設定を確認（デフォルト: `http://localhost:8080/api`）
3. CORS設定がされていることを確認

### エージェントが表示されない

1. エージェント設定のYAMLファイルが正しい場所にあるか確認
2. YAML構文にエラーがないか確認
3. Cagentサーバーのログを確認

### ストリーミング停止ボタンでエラーが発生する

このUIは独自の `StreamController` クラスを使用してブラウザ互換性を確保しています：

- ✅ 現代ブラウザでは標準の `AbortController` を使用
- ✅ 古いブラウザでは自動的にフォールバック実装に切り替え
- ✅ デバッグ情報をコンソールに出力（F12キーでコンソールを確認）

エラーが続く場合は、ブラウザのコンソールログを確認してください。

### SSE接続が405エラーになる

CagentはPOSTリクエストでのストリーミングを期待します：

- ❌ `EventSource` (GET リクエスト) - 非対応
- ✅ `fetch` + POST リクエスト - 対応済み

この実装では正しくPOSTリクエストを使用しています。

## ライセンス

MIT License

## コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

Docker Cagentで、AIエージェントとの対話を楽しんでください！ 🚀
