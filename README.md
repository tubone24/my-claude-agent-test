## Installation

```bash
curl -L -o cagent https://github.com/docker/cagent/releases/latest/download/cagent-darwin-arm64

chmod +x cagent

sudo mv cagent /usr/local/bin/
```

## Usage

### Basic Usage

```bash
cagent run basic_claude_agent.yaml
```

### API Mode + Playground

You can start Cagent in API mode and interact with agents through the Web UI Playground.

#### 1. Start Cagent in API Mode

```bash
cagent api agents -l :8080
```

This command starts Cagent as an API server on port 8080.

#### 2. Start the Playground

In a separate terminal, run:

```bash
cd chat-ui
npm install  # First time only
npm run dev
```

Once the playground starts, open your browser and navigate to `http://localhost:3000`.

#### 3. Environment Configuration (Optional)

By default, the Playground connects to the Cagent API server at `http://localhost:8080/api`. If you need to use a different port or host, create a `chat-ui/.env.local` file:

```bash
# chat-ui/.env.local
CAGENT_API_BASE_URL=http://localhost:8080/api
```

### Playground Features

This Playground is a web-based chat UI for interacting with Cagent agents. It provides the following features:

#### Main Features

- **Agent List Display**: View available agents in the sidebar
- **Agent Switching**: Select and switch between agents (automatically creates a new session)
- **Real-time Streaming**: Display agent responses in real-time
- **Reasoning Visualization**: Separate display of agent reasoning and final choices
- **Markdown Support**: Messages are rendered in Markdown format (GFM supported)
- **Tool Execution Visualization**: Dedicated UI for tool calls and their results
- **Token Usage Display**: Shows input/output token counts in the header
- **Session Management**: Displays session titles
- **Streaming Control**: Ability to stop ongoing responses

#### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Markdown**: react-markdown + remark-gfm

#### UI Components

- `components/ui/`: Reusable UI components (Button, Card, Textarea, etc.)
- `lib/store.ts`: State management with Zustand
- `lib/cagent-api.ts`: Cagent API client
- `lib/types.ts`: TypeScript type definitions

## Deploy on Startup

```bash
cagent push ./basic_claude_agent.yaml username/my-claude-agent
```
