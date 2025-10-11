# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Docker Cagent Playgroundは、Docker Cagentエージェントと対話するためのWeb ベースのチャットUIです。Next.js、React、TypeScript、Tailwind CSSで構築されており、Cagent APIサーバーと連携してAIエージェントの管理、セッション管理、リアルタイムストリーミングを提供します。

## Architecture

### Frontend Structure (chat-ui/)

- **Next.js 14 App Router**: `app/` ディレクトリにページコンポーネントを配置
- **状態管理**: Zustandを使用したグローバル状態管理 (`lib/store.ts`)
  - エージェント、セッション、メッセージの状態を一元管理
  - SSEストリーミング、ツール承認、OAuth認証の状態を管理
- **APIクライアント**: `lib/cagent-api.ts` でCagent APIとの通信を抽象化
  - REST APIとServer-Sent Events (SSE) ストリーミングをサポート
  - StreamControllerクラスでストリーミングの中断制御
- **UIコンポーネント**: `components/ui/` にshadcn/uiベースのコンポーネント
- **テーマ管理**: `lib/dark-mode-store.ts` でダークモード状態を管理

### Key Data Flow

1. **エージェント選択**: ユーザーがエージェントを選択 → セッションリストを読み込み → 新規セッション作成またはセッション選択
2. **メッセージ送信**: ユーザーメッセージ → `executeAgent` APIでSSEストリーミング開始 → リアルタイムでアシスタント応答を受信
3. **ツール承認**: エージェントがツールを使用 → `tool_call_confirmation` イベント → ユーザー承認 → `resumeSession` API
4. **OAuth認証**: MCP serverがOAuth要求 → `elicitation_request` イベント → ユーザー承認 → `resumeElicitation` API

### Message Types

- **reasoning**: エージェントの思考プロセス（半透明、イタリック体で表示）
- **choice**: エージェントの最終回答（Markdown形式でレンダリング）
- **tool_result**: ツール実行結果（青いカードで表示）

## Development Commands

### Setup and Development

```bash
# Cagent APIサーバーの起動（別のターミナルで）
cagent api agents -l :8080

# Playgroundの起動
cd chat-ui
npm install
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

### Build and Production

```bash
cd chat-ui
npm run build
npm start
```

### Linting

```bash
cd chat-ui
npm run lint
```

## Environment Variables

`chat-ui/.env.local` でAPIサーバーのURLを設定可能:

```bash
CAGENT_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_DEBUG_MODE=true  # デバッグ情報の表示（デフォルト: false）
```

## Important Files

- `chat-ui/lib/store.ts`: Zustandストア（全状態管理の中心）
- `chat-ui/lib/cagent-api.ts`: Cagent API クライアント
- `chat-ui/lib/types.ts`: TypeScript型定義
- `chat-ui/app/page.tsx`: メインUIコンポーネント
- `chat-ui/components/ui/yaml-editor-dialog.tsx`: YAMLエディターダイアログ
- `agents/*.yaml`: エージェント設定ファイル

## Working with State Management

状態の更新は必ずZustandストアのアクションを通して行う。直接状態を変更しない:

```typescript
// ✓ 良い例
const { setCurrentAgent, createSession } = useChatStore()
setCurrentAgent(agent)

// ✗ 悪い例
currentAgent = agent  // 状態が更新されない
```

## SSE Streaming Events

Cagent APIから受信する主なSSEイベント:

- `stream_started`: ストリーミング開始
- `agent_choice_reasoning`: 思考プロセス（reasoningタイプ）
- `agent_choice`: 最終回答（choiceタイプ）
- `tool_call_confirmation`: ツール使用の確認要求
- `tool_call_response`: ツール実行結果
- `token_usage`: トークン使用量
- `session_title`: セッションタイトル
- `elicitation_request`: OAuth認証リクエスト
- `stream_stopped`: ストリーミング終了

## Tool Approval Flow

1. エージェントがツールを使用しようとすると `tool_call_confirmation` イベントが発火
2. `transfer_task` と `create_todos` は承認不要（自動承認）
3. その他のツールは承認バナーを表示
4. ユーザーは以下を選択可能:
   - "Yes (This request only)": 今回のツールのみ承認
   - "All Accepted": セッション中すべてのツールを承認
   - "No": ツール使用を拒否してストリーミング停止

## OAuth Authentication Flow

1. Remote MCP serverが認証を要求すると `elicitation_request` イベントが発火
2. `meta['cagent/type'] === 'oauth_consent'` を確認
3. OAuth認証バナーを表示
4. ユーザーが承認または拒否
5. `resumeElicitation` APIでアクションを送信

## YAML Agent Configuration

エージェント設定は `agents/*.yaml` に保存され、以下の構造を持つ:

```yaml
version: "2"

models:
  model_name:
    provider: anthropic|openai|google|dmr
    model: model-id
    max_tokens: 4096

agents:
  root:
    model: model_name
    description: "Agent description"
    instruction: |
      Agent instruction
    sub_agents:
      - sub_agent_name
```

## Debugging

`NEXT_PUBLIC_DEBUG_MODE=true` を設定すると、UI上部にデバッグ情報が表示される:
- セッションID、エージェント名
- ローディング状態、ストリーミング状態
- ツール承認待ち、OAuth認証待ち
- トークン使用量
- 現在のツールコール詳細

## Known Issues and Considerations

- ストリーミング中にエージェントを切り替えると、ストリーミングを強制停止する必要がある
- `tools_approved=true` のセッションでは、ツール承認バナーを表示しない
- トークン使用量は差分として受信し、累積値を計算する
- メッセージのcontentPartsは、reasoningとchoiceを分けて表示
- `agent_choice_reasoning` から `agent_choice` に切り替わる時、新しいメッセージを作成
- エージェント名が変わった場合も新しいメッセージを作成（マルチエージェント対応）

## Testing Agent Changes

エージェント設定を変更した場合:

1. YAMLエディターで直接編集するか、ファイルを直接編集
2. Cagent APIサーバーは自動的に変更を検出
3. UI上でエージェントリストをリロード（エージェント選択時に自動）
4. 新しいセッションを作成してテスト
