// AbortControllerのポリフィル（古いブラウザ対応）
if (typeof AbortController === 'undefined') {
  (global as any).AbortController = class AbortController {
    signal: { aborted: boolean };
    constructor() {
      this.signal = { aborted: false };
    }
    abort() {
      this.signal.aborted = true;
    }
  };
}

// ストリーミング制御のためのヘルパークラス
class StreamController {
  private _aborted: boolean = false;
  private _abortController?: AbortController;

  constructor() {
    try {
      this._abortController = new AbortController();
    } catch (error) {
      console.warn('AbortController not available, using fallback');
    }
  }

  get signal(): AbortSignal | undefined {
    return this._abortController?.signal;
  }

  abort() {
    this._aborted = true;
    if (this._abortController && typeof this._abortController.abort === 'function') {
      try {
        this._abortController.abort();
      } catch (error) {
        console.warn('Error calling AbortController.abort:', error);
      }
    }
  }

  get aborted() {
    return this._aborted || this._abortController?.signal?.aborted || false;
  }
}

import {
  Agent,
  Session,
  CreateSessionRequest,
  CreateAgentRequest,
  UpdateAgentRequest,
  ImportAgentRequest,
  ImportAgentResponse,
  ExportAgentsResponse,
  PullAgentRequest,
  PushAgentRequest,
  PushAgentResponse,
  DeleteAgentRequest,
  ExecuteAgentRequest,
  APIResponse,
  CreateDesktopTokenResponse,
  OAuthStartRequest,
  OAuthCodeRequest,
  AgentConfig
} from './types';

class CagentAPI {
  private baseUrl: string;
  
  constructor(baseUrl: string = process.env.CAGENT_API_BASE_URL || 'http://localhost:8080/api') {
    this.baseUrl = baseUrl;
  }

  // ヘルパーメソッド
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      };
    }
  }

  // ヘルスチェック
  async ping(): Promise<APIResponse<{ status: string }>> {
    return this.request('/ping');
  }

  // エージェント管理
  async getAgents(): Promise<APIResponse<Agent[]>> {
    return this.request('/agents');
  }

  async getAgent(id: string): Promise<APIResponse<AgentConfig>> {
    return this.request(`/agents/${encodeURIComponent(id)}`);
  }

  async getAgentYAML(id: string): Promise<APIResponse<string>> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${encodeURIComponent(id)}/yaml`);

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData}`,
        };
      }

      const yamlContent = await response.text();
      return {
        success: true,
        data: yamlContent,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      };
    }
  }

  async updateAgentYAML(id: string, yamlContent: string): Promise<APIResponse<string>> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${encodeURIComponent(id)}/yaml`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: yamlContent,
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData}`,
        };
      }

      const updatedYaml = await response.text();
      return {
        success: true,
        data: updatedYaml,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      };
    }
  }

  async createAgent(agent: CreateAgentRequest): Promise<APIResponse<{ filepath: string }>> {
    return this.request('/agents/config', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(agent: UpdateAgentRequest): Promise<APIResponse<any>> {
    return this.request('/agents/config', {
      method: 'PUT',
      body: JSON.stringify(agent),
    });
  }

  async createAgentWithAI(prompt: string): Promise<APIResponse<{ path: string; out: string }>> {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async importAgent(file: File): Promise<APIResponse<ImportAgentResponse>> {
    try {
      // Step 1: Next.jsサーバーにファイルをアップロード
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        return {
          success: false,
          error: `Upload failed: ${errorData.error || 'Unknown error'}`,
        };
      }

      const uploadData = await uploadResponse.json();
      const filePath = uploadData.filePath;

      console.log('File uploaded to:', filePath);

      // Step 2: Cagent APIにファイルパスを送信してImport実行
      const importResponse = await fetch(`${this.baseUrl}/agents/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath,
        }),
      });

      if (!importResponse.ok) {
        const errorData = await importResponse.text();
        return {
          success: false,
          error: `HTTP ${importResponse.status}: ${errorData}`,
        };
      }

      const data = await importResponse.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      };
    }
  }

  async exportAgents(): Promise<APIResponse<ExportAgentsResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData}`,
        };
      }

      const data: ExportAgentsResponse = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      };
    }
  }

  async pullAgent(request: PullAgentRequest): Promise<APIResponse<Agent>> {
    return this.request('/agents/pull', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async pushAgent(request: PushAgentRequest): Promise<APIResponse<PushAgentResponse>> {
    return this.request('/agents/push', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async deleteAgent(request: DeleteAgentRequest): Promise<APIResponse<{ filePath: string }>> {
    return this.request('/agents', {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
  }

  // セッション管理
  async getSessions(): Promise<APIResponse<Session[]>> {
    return this.request('/sessions');
  }

  async getSessionsByAgent(agentId: string): Promise<APIResponse<Session[]>> {
    return this.request(`/sessions/agent/${encodeURIComponent(agentId)}`);
  }

  async getSession(id: string): Promise<APIResponse<Session>> {
    return this.request(`/sessions/${encodeURIComponent(id)}`);
  }

  async createSession(request: CreateSessionRequest): Promise<APIResponse<Session>> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async resumeSession(id: string, resumeType: 'approve' | 'approve-session' | 'reject' = 'approve'): Promise<APIResponse<{ message: string }>> {
    return this.request(`/sessions/${encodeURIComponent(id)}/resume`, {
      method: 'POST',
      body: JSON.stringify({ 
        confirmation: resumeType
      }),
    });
  }

  async deleteSession(id: string): Promise<APIResponse<{ message: string }>> {
    return this.request(`/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // ツール承認（Cagentの実際の仕組みに合わせて修正）
  async approveTools(sessionId: string): Promise<APIResponse<{ message: string }>> {
    console.log('Cagentではツール承認はセッション作成時に決定されます');
    console.log('現在のセッションでは動的承認はサポートされていません');
    
    // UIのためのダミー応答（実際の処理はしない）
    return { 
      success: true, 
      data: { message: 'ツール承認の UI表示を非表示にします（Cagentは動的承認未サポート）' } 
    };
  }

  async denyTools(sessionId: string): Promise<APIResponse<{ message: string }>> {
    console.log('ツールを拒否しました。ストリーミングを停止します。');
    
    // ツール拒否時はストリーミング停止で代替
    return { 
      success: true, 
      data: { message: 'ツールが拒否されました。処理を停止します。' } 
    };
  }

  // エージェント実行 (POST with Streaming Response)
  executeAgent(
    sessionId: string,
    agentName: string,
    request: ExecuteAgentRequest,
    subAgentName?: string,
    onMessage?: (data: any) => void,
    onError?: (error: string) => void,
    onComplete?: () => void
  ): StreamController {
    const endpoint = subAgentName 
      ? `/sessions/${encodeURIComponent(sessionId)}/agent/${encodeURIComponent(agentName)}/${encodeURIComponent(subAgentName)}`
      : `/sessions/${encodeURIComponent(sessionId)}/agent/${encodeURIComponent(agentName)}`;

    const streamController = new StreamController();
    console.log('Created StreamController:', streamController, 'has abort method:', typeof streamController.abort);

    // 非同期でストリーミングを開始
    const startStreaming = async () => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify([request]),
          signal: streamController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        // ストリーミングレスポンスを処理
        let buffer = '';
        
        while (!streamController.aborted) {
          const { done, value } = await reader.read();
          
          if (done) {
            onComplete?.();
            break;
          }

          if (streamController.aborted) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 最後の不完全な行をバッファに保持

          for (const line of lines) {
            if (streamController.aborted) break;
            
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
              try {
                const jsonData = trimmedLine.slice(6); // 'data: ' を除去
                if (jsonData === '[DONE]') {
                  onComplete?.();
                  return;
                }
                
                const parsedData = JSON.parse(jsonData);
                onMessage?.(parsedData);
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', trimmedLine, parseError);
              }
            }
          }
        }
      } catch (error) {
        if (streamController.aborted || (error instanceof Error && error.name === 'AbortError')) {
          // ユーザーによる中断は正常な処理
          onComplete?.();
        } else {
          onError?.(error instanceof Error ? error.message : '不明なエラーが発生しました');
        }
      }
    };

    // 非同期でストリーミングを開始
    startStreaming();

    // StreamControllerをすぐに返す
    return streamController;
  }

  // デスクトップ統合
  async getDesktopToken(): Promise<APIResponse<CreateDesktopTokenResponse>> {
    return this.request('/desktop/token');
  }

  // OAuth / Elicitation
  async resumeElicitation(sessionId: string, action: 'accept' | 'decline' | 'cancel', content?: Record<string, any>): Promise<APIResponse<{ message: string }>> {
    return this.request(`/sessions/${encodeURIComponent(sessionId)}/elicitation`, {
      method: 'POST',
      body: JSON.stringify({ action, content: content || {} }),
    });
  }

  async startOAuth(sessionId: string, confirmation: boolean): Promise<APIResponse<{ message: string }>> {
    return this.request(`/${encodeURIComponent(sessionId)}/resumeStartOauth`, {
      method: 'POST',
      body: JSON.stringify({ confirmation }),
    });
  }

  async submitOAuthCode(request: OAuthCodeRequest): Promise<APIResponse<{ message: string }>> {
    return this.request('/resumeCodeReceivedOauth', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// シングルトンインスタンス
export const cagentAPI = new CagentAPI();
export default CagentAPI;
