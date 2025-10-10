// Cagent API型定義

export interface Agent {
  name: string;
  description: string;
  multi: boolean;
}

export interface AgentConfig {
  version: string;
  agents: Record<string, AgentDefinition>;
  models?: Record<string, ModelConfig>;
}

export interface AgentDefinition {
  model: string;
  description: string;
  instruction: string;
  sub_agents?: string[];
  toolsets?: ToolsetConfig[];
}

export interface ModelConfig {
  provider: string;
  model: string;
  max_tokens: number;
  base_url?: string;
  provider_opts?: Record<string, any>;
}

export interface ToolsetConfig {
  type: string;
  ref?: string;
  command?: string;
  args?: string[];
  tools?: string[];
  env?: string[];
  transport?: 'http' | 'sse';
  url?: string;
  path?: string;
}

export interface Session {
  id: string;
  title?: string;
  created_at?: string;
  createdAt?: string;
  numMessages?: number;
  num_messages?: number;
  inputTokens?: number;
  outputTokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  getMostRecentAgentFilename?: string;
  most_recent_agent_filename?: string;
  workingDir?: string;
  messages?: Message[];
  tools_approved?: boolean;
}

export interface MessageContentPart {
  type: 'reasoning' | 'choice' | 'normal';
  content: string;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  contentParts?: MessageContentPart[];
  timestamp: string;
  messageType?: 'normal' | 'tool_result';
  toolName?: string;
  agentName?: string;
  toolCall?: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  };
  tokens?: {
    input?: number;
    output?: number;
  };
}

export interface CreateSessionRequest {
  maxIterations?: number;
  workingDir?: string;
  tools_approved?: boolean;
}

export interface CreateAgentRequest {
  filename: string;
  model: string;
  description: string;
  instruction: string;
}

export interface UpdateAgentRequest {
  filename: string;
  agent_config: AgentConfig;
}

export interface ImportAgentRequest {
  file_path: string;
}

export interface ImportAgentResponse {
  originalPath: string;
  targetPath: string;
  description: string;
}

export interface ExportAgentsResponse {
  zipPath: string;
  zipFile: string;
  zipDirectory: string;
  agentsDir: string;
  createdAt: string;
}

export interface PullAgentRequest {
  name: string;
}

export interface PushAgentRequest {
  filepath: string;
  tag: string;
}

export interface PushAgentResponse {
  filepath: string;
  tag: string;
  digest: string;
}

export interface DeleteAgentRequest {
  file_path: string;
}

export interface ExecuteAgentRequest {
  content: string;
}

export interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
}

export interface ChatState {
  sessions: Session[];
  agents: Agent[];
  currentSession: Session | null;
  currentAgent: Agent | null;
  isLoading: boolean;
  error: string | null;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateDesktopTokenResponse {
  token: string;
}

export interface OAuthStartRequest {
  confirmation: boolean;
}

export interface OAuthCodeRequest {
  code: string;
  state: string;
}

export interface AIProvider {
  id: string;
  name: string;
  models: string[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-sonnet-4-0', 'claude-opus-3', 'claude-haiku-3']
  },
  {
    id: 'google',
    name: 'Google',
    models: ['gemini-pro', 'gemini-flash', 'gemini-1.5-pro']
  },
  {
    id: 'dmr',
    name: 'Docker Model Runner',
    models: ['ai/qwen3', 'ai/llama3', 'ai/mistral']
  }
];

export const TOOLSET_TYPES = [
  'filesystem',
  'shell',
  'mcp',
  'todo',
  'memory',
  'think'
] as const;

export type ToolsetType = typeof TOOLSET_TYPES[number];
