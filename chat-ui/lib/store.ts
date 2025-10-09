import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { cagentAPI } from './cagent-api';
import {
  Agent,
  Session,
  Message,
  MessageContentPart,
  CreateSessionRequest,
  CreateAgentRequest,
  UpdateAgentRequest,
  ExecuteAgentRequest,
} from './types';

interface ChatStore {
  // 状態
  sessions: Session[];
  agents: Agent[];
  currentSession: Session | null;
  currentAgent: Agent | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  streamController: any | null; // StreamController または AbortController
  pendingToolApproval: boolean;
  currentToolCall: any | null;
  currentTokenUsage: { input_tokens?: number; output_tokens?: number; context_length?: number } | null;
  currentSessionTitle: string | null;

  // アクション
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // エージェント関連
  loadAgents: () => Promise<void>;
  createAgent: (agent: CreateAgentRequest) => Promise<boolean>;
  updateAgent: (agent: UpdateAgentRequest) => Promise<boolean>;
  deleteAgent: (filePath: string) => Promise<boolean>;
  setCurrentAgent: (agent: Agent | null) => void;

  // セッション関連
  loadSessions: () => Promise<void>;
  loadSessionsByAgent: (agentName: string) => Promise<void>;
  createSession: (request: CreateSessionRequest) => Promise<boolean>;
  setCurrentSession: (session: Session | null) => void;
  deleteSession: (id: string) => Promise<boolean>;

  // メッセージ関連
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  appendToLastMessage: (content: string) => void;
  appendToLastMessagePart: (content: string, type: 'reasoning' | 'choice', agentName?: string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;

  // ストリーミング関連
  startStreaming: (sessionId: string, agentName: string, message: string) => void;
  stopStreaming: () => void;

  // ツール承認関連
  setPendingToolApproval: (pending: boolean, toolCall?: any) => void;
  approveTools: () => Promise<void>;
  denyTools: () => Promise<void>;

  // YAML管理関連
  getAgentYAML: (agentId: string) => Promise<string | null>;
  updateAgentYAML: (agentId: string, yamlContent: string) => Promise<boolean>;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      // 初期状態
      sessions: [],
      agents: [],
      currentSession: null,
      currentAgent: null,
      messages: [],
      isLoading: false,
      error: null,
      streamController: null,
      pendingToolApproval: false,
      currentToolCall: null,
      currentTokenUsage: null,
      currentSessionTitle: null,

      // 基本アクション
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),

      // エージェント関連アクション
      loadAgents: async () => {
        try {
          set({ isLoading: true, error: null });
          const result = await cagentAPI.getAgents();
          if (result.success && result.data) {
            set({ agents: result.data });
          } else {
            set({ error: result.error || 'エージェントの読み込みに失敗しました' });
          }
        } catch (error) {
          set({ error: 'エージェントの読み込み中にエラーが発生しました' });
        } finally {
          set({ isLoading: false });
        }
      },

      createAgent: async (agent) => {
        try {
          set({ isLoading: true, error: null });
          const result = await cagentAPI.createAgent(agent);
          if (result.success) {
            await get().loadAgents(); // 作成後にリストを更新
            return true;
          } else {
            set({ error: result.error || 'エージェントの作成に失敗しました' });
            return false;
          }
        } catch (error) {
          set({ error: 'エージェントの作成中にエラーが発生しました' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      updateAgent: async (agent) => {
        try {
          set({ isLoading: true, error: null });
          const result = await cagentAPI.updateAgent(agent);
          if (result.success) {
            await get().loadAgents(); // 更新後にリストを更新
            return true;
          } else {
            set({ error: result.error || 'エージェントの更新に失敗しました' });
            return false;
          }
        } catch (error) {
          set({ error: 'エージェントの更新中にエラーが発生しました' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteAgent: async (filePath) => {
        try {
          set({ isLoading: true, error: null });
          const result = await cagentAPI.deleteAgent({ file_path: filePath });
          if (result.success) {
            await get().loadAgents(); // 削除後にリストを更新
            return true;
          } else {
            set({ error: result.error || 'エージェントの削除に失敗しました' });
            return false;
          }
        } catch (error) {
          set({ error: 'エージェントの削除中にエラーが発生しました' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentAgent: (agent) => set({ currentAgent: agent }),

      // セッション関連アクション
      loadSessions: async () => {
        try {
          set({ isLoading: true, error: null });
          const result = await cagentAPI.getSessions();
          if (result.success && result.data) {
            set({ sessions: result.data });
          } else {
            set({ error: result.error || 'セッションの読み込みに失敗しました' });
          }
        } catch (error) {
          set({ error: 'セッションの読み込み中にエラーが発生しました' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadSessionsByAgent: async (agentName: string) => {
        try {
          set({ isLoading: true, error: null });
          const result = await cagentAPI.getSessionsByAgent(agentName);
          if (result.success && result.data) {
            set({ sessions: result.data });
          } else {
            set({ error: result.error || 'エージェント別セッションの読み込みに失敗しました' });
          }
        } catch (error) {
          set({ error: 'エージェント別セッションの読み込み中にエラーが発生しました' });
        } finally {
          set({ isLoading: false });
        }
      },

      createSession: async (request) => {
        try {
          set({ isLoading: true, error: null });
          const result = await cagentAPI.createSession(request);
          if (result.success && result.data) {
            const newSession = result.data;
            set(state => ({
              sessions: [...state.sessions, newSession],
              currentSession: newSession,
              messages: [],
              currentTokenUsage: null,
              currentSessionTitle: null,
            }));
            return true;
          } else {
            set({ error: result.error || 'セッションの作成に失敗しました' });
            return false;
          }
        } catch (error) {
          set({ error: 'セッションの作成中にエラーが発生しました' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentSession: async (session) => {
        set({ currentSession: session, messages: [] });

        // セッションの詳細を読み込む
        if (session) {
          try {
            const result = await cagentAPI.getSession(session.id);
            if (result.success && result.data) {
              console.log('Session data loaded:', result.data);

              // メッセージをCagent APIフォーマットからUI用に変換
              const messages: Message[] = [];
              const rawMessages = result.data.messages || [];

              console.log('Raw messages:', rawMessages);

              for (const item of rawMessages) {
                // Cagent APIのフォーマット: { agentName, agentFilename, message: { role, content, ... } }
                const msg = (item as any).message || item;

                console.log('Processing message:', msg);

                if (msg.role) {
                  let content = '';
                  let contentParts: MessageContentPart[] = [];

                  // assistantメッセージの場合、reasoning_contentとcontentを両方処理
                  if (msg.role === 'assistant') {
                    if (msg.reasoning_content) {
                      contentParts.push({
                        type: 'reasoning',
                        content: msg.reasoning_content
                      });
                      content += msg.reasoning_content;
                    }

                    if (msg.content) {
                      contentParts.push({
                        type: 'choice',
                        content: msg.content
                      });
                      content += msg.content;
                    }
                  }
                  // その他のメッセージはcontentをそのまま使用
                  else if (msg.content) {
                    content = msg.content;
                  }

                  if (content || msg.role === 'tool') {
                    const message: Message = {
                      id: Date.now().toString() + Math.random(),
                      role: msg.role,
                      content: content,
                      contentParts: contentParts.length > 0 ? contentParts : undefined,
                      timestamp: msg.created_at || new Date().toISOString(),
                      agentName: item.agentName || undefined,
                    };

                    // ツールメッセージの場合は追加のフィールドを設定
                    if (msg.role === 'tool') {
                      message.messageType = 'tool_result';
                      message.toolName = msg.name || 'ツール';
                      message.toolCall = msg.tool_call_id ? {
                        id: msg.tool_call_id,
                        type: 'function',
                        function: {
                          name: msg.name || '',
                          arguments: ''
                        }
                      } : undefined;
                    }

                    messages.push(message);
                  }
                }
              }

              console.log('Converted messages:', messages);

              set({
                currentSession: result.data,
                messages: messages
              });
            }
          } catch (error) {
            console.error('セッション詳細の読み込みエラー:', error);
          }
        }
      },

      deleteSession: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const result = await cagentAPI.deleteSession(id);
          if (result.success) {
            set(state => ({
              sessions: state.sessions.filter(s => s.id !== id),
              currentSession: state.currentSession?.id === id ? null : state.currentSession,
              messages: state.currentSession?.id === id ? [] : state.messages,
            }));
            return true;
          } else {
            set({ error: result.error || 'セッションの削除に失敗しました' });
            return false;
          }
        } catch (error) {
          set({ error: 'セッションの削除中にエラーが発生しました' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // メッセージ関連アクション
      addMessage: (message) => {
        set(state => ({
          messages: [...state.messages, message]
        }));
      },

      updateLastMessage: (content) => {
        set(state => ({
          messages: state.messages.map((msg, index) => 
            index === state.messages.length - 1 
              ? { ...msg, content }
              : msg
          )
        }));
      },

      appendToLastMessage: (content) => {
        set(state => ({
          messages: state.messages.map((msg, index) =>
            index === state.messages.length - 1
              ? { ...msg, content: msg.content + content }
              : msg
          )
        }));
      },

      appendToLastMessagePart: (content: string, type: 'reasoning' | 'choice', agentName?: string) => {
        set(state => {
          // 最後のメッセージを確認
          const lastMessage = state.messages[state.messages.length - 1];

          // 最後のメッセージがアシスタントメッセージでない、またはメッセージが存在しない場合
          // 新しいアシスタントメッセージを作成
          if (!lastMessage || lastMessage.role !== 'assistant') {
            const newMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: content,
              contentParts: [{ type, content }],
              timestamp: new Date().toISOString(),
              agentName: agentName,
            };
            return {
              messages: [...state.messages, newMessage]
            };
          }

          // 最後のメッセージがアシスタントメッセージの場合
          const contentParts = lastMessage.contentParts || [];
          const lastPart = contentParts.length > 0 ? contentParts[contentParts.length - 1] : null;

          // reasoningからchoiceに切り替わる場合は新しいメッセージを作成
          if (lastPart && lastPart.type === 'reasoning' && type === 'choice') {
            const newMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: content,
              contentParts: [{ type, content }],
              timestamp: new Date().toISOString(),
              agentName: agentName,
            };
            return {
              messages: [...state.messages, newMessage]
            };
          }

          // エージェント名が変わった場合も新しいメッセージを作成
          if (agentName && lastMessage.agentName && agentName !== lastMessage.agentName) {
            const newMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: content,
              contentParts: [{ type, content }],
              timestamp: new Date().toISOString(),
              agentName: agentName,
            };
            return {
              messages: [...state.messages, newMessage]
            };
          }

          // 既存のメッセージを更新
          return {
            messages: state.messages.map((msg, index) => {
              if (index !== state.messages.length - 1) return msg;

              let updatedContentParts;
              if (lastPart && lastPart.type === type) {
                // 同じタイプの最後のパートに追加
                updatedContentParts = [
                  ...contentParts.slice(0, -1),
                  { ...lastPart, content: lastPart.content + content }
                ];
              } else {
                // 新しいパートを追加
                updatedContentParts = [...contentParts, { type, content }];
              }

              // contentPartsの全ての内容をcontentフィールドに連結
              const fullContent = updatedContentParts.map(part => part.content).join('');

              return {
                ...msg,
                content: fullContent,
                contentParts: updatedContentParts,
                agentName: agentName || msg.agentName,
              };
            })
          };
        });
      },

      sendMessage: async (content: string) => {
        const { currentSession, currentAgent, addMessage, startStreaming } = get();
        
        if (!currentSession || !currentAgent) {
          set({ error: 'セッションまたはエージェントが選択されていません' });
          return;
        }

        // ユーザーメッセージを追加
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        };
        addMessage(userMessage);

        // アシスタントメッセージのプレースホルダーを追加
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        };
        addMessage(assistantMessage);

        // ストリーミングを開始
        startStreaming(currentSession.id, currentAgent.name, content);
      },

      clearMessages: () => set({ messages: [] }),

      // ストリーミング関連アクション
      startStreaming: (sessionId: string, agentName: string, message: string) => {
        const { streamController, stopStreaming, appendToLastMessage, appendToLastMessagePart, setError } = get();
        
        // 既存のストリームがあれば停止
        if (streamController) {
          stopStreaming();
        }

        try {
          set({ isLoading: true });

          const executeRequest: ExecuteAgentRequest = { content: message };

          // ストリーミング終了フラグ
          let streamingStopped = false;

          // executeAgentから直接AbortControllerを取得
          const controller = cagentAPI.executeAgent(
            sessionId,
            agentName,
            executeRequest,
            undefined,
            // onMessage callback
            (data) => {
              try {
                switch (data.type) {
                  case 'user_message':
                    // ユーザーメッセージは既に追加済み
                    break;
                    
                  case 'stream_started':
                    console.log('Stream started:', data);
                    break;
                    
                  case 'agent_choice_reasoning':
                    // エージェントの思考過程をアシスタントメッセージに追加（reasoning タイプ）
                    if (data.content) {
                      appendToLastMessagePart(data.content, 'reasoning', data.agent_name);
                    }
                    break;

                  case 'agent_choice':
                    // エージェントの最終回答をアシスタントメッセージに追加（choice タイプ）
                    if (data.content) {
                      appendToLastMessagePart(data.content, 'choice', data.agent_name);
                    }
                    break;

                  case 'partial_tool_call':
                    // ツール呼び出しの進行状況
                    console.log('Tool call progress:', data);
                    
                    // フォールバック: もしtool_call_confirmationが来ない場合のための検出
                    if (data.tool_call && data.tool_call.function) {
                      console.log('Detected tool call via partial_tool_call event');
                      const { pendingToolApproval, setPendingToolApproval } = get();
                      
                      // まだ承認待ちでない場合のみ設定
                      if (!pendingToolApproval) {
                        console.log('Setting pending approval via fallback mechanism');
                        setPendingToolApproval(true, data.tool_call);
                      }
                    }
                    break;
                    
                  case 'tool_call_confirmation':
                    // ツール呼び出しが確認された - 手動承認が必要
                    console.log('🔧 Tool call confirmed - showing approval banner:', data);
                    
                    if (data.tool_call) {
                      const { setPendingToolApproval } = get();
                      console.log('Setting pending tool approval to true');
                      setPendingToolApproval(true, data.tool_call);
                      
                      // 追加のデバッグ情報
                      console.log('Tool call details:', {
                        id: data.tool_call.id,
                        function: data.tool_call.function?.name,
                        arguments: data.tool_call.function?.arguments
                      });
                    } else {
                      console.warn('tool_call_confirmation received but no tool_call data found');
                    }
                    break;
                    
                  case 'tools_approved_required':
                    // ツール承認が明示的に要求された
                    console.log('Tool approval required:', data);
                    const { setPendingToolApproval } = get();
                    setPendingToolApproval(true, data.tool_call || data);
                    break;
                    
                  case 'waiting_for_approval':
                    // 承認待ち状態
                    console.log('Waiting for tool approval:', data);
                    const { setPendingToolApproval: setPending } = get();
                    setPending(true, data.tool_call || data);
                    break;
                    
                  case 'tool_call_response':
                    // ツール呼び出しの結果を別のメッセージとして追加
                    console.log('Tool call response:', data);
                    if (data.response) {
                      const { addMessage } = get();
                      const toolMessage: Message = {
                        id: Date.now().toString(),
                        role: 'tool',
                        content: data.response,
                        timestamp: new Date().toISOString(),
                        messageType: 'tool_result',
                        toolName: data.tool_call?.function?.name || 'ツール',
                        toolCall: data.tool_call,
                        agentName: data.agent_name,
                      };
                      addMessage(toolMessage);
                    }
                    break;

                  case 'stream_stopped':
                    // ストリーミング終了 - ローディング状態を確実に解除
                    console.log('Stream stopped:', data);
                    streamingStopped = true;
                    set({
                      isLoading: false,
                      streamController: null,
                      pendingToolApproval: false,
                      currentToolCall: null
                    });
                    break;

                  case 'token_usage':
                    // トークン使用量を保存
                    console.log('Token usage:', data);
                    if (data.usage) {
                      set({
                        currentTokenUsage: {
                          input_tokens: data.usage.input_tokens,
                          output_tokens: data.usage.output_tokens,
                          context_length: data.usage.context_length
                        }
                      });
                    }
                    // ストリーミング終了後はローディング状態を維持しない
                    if (streamingStopped) {
                      console.log('Token usage received after stream_stopped, ensuring loading is false');
                      set({ isLoading: false });
                    }
                    break;

                  case 'session_title':
                    // セッションタイトルを保存
                    console.log('Session title:', data);
                    if (data.title) {
                      set({ currentSessionTitle: data.title });

                      // サイドバーのセッション一覧も更新
                      const { currentSession, sessions } = get();
                      if (currentSession) {
                        set({
                          sessions: sessions.map(s =>
                            s.id === currentSession.id
                              ? { ...s, title: data.title }
                              : s
                          ),
                          currentSession: { ...currentSession, title: data.title }
                        });
                      }
                    }
                    // ストリーミング終了後はローディング状態を維持しない
                    if (streamingStopped) {
                      console.log('Session title received after stream_stopped, ensuring loading is false');
                      set({ isLoading: false });
                    }
                    break;

                  default:
                    console.log('Unknown SSE event:', data);
                }
              } catch (error) {
                console.error('Error processing SSE message:', error);
              }
            },
            // onError callback
            (error) => {
              console.error('Streaming error:', error);
              setError('通信エラーが発生しました');
              stopStreaming();
            },
            // onComplete callback
            () => {
              console.log('Streaming completed or paused');
              const { pendingToolApproval, messages } = get();
              
              // もしツール承認待ちでない場合のみストリーミングを停止
              if (!pendingToolApproval) {
                console.log('Stopping streaming - no pending tool approval');
                stopStreaming();
              } else {
                console.log('Streaming paused - waiting for tool approval');
                // ツール承認待ちの場合はローディング状態を維持
                set({ isLoading: true });
              }
            }
          );

          // 即座にcontrollerをセット
          console.log('Setting stream controller:', controller, 'type:', typeof controller, 'has abort:', typeof controller?.abort);
          set({ streamController: controller });
        } catch (error) {
          setError('エージェントの実行に失敗しました');
          set({ isLoading: false });
        }
      },

      stopStreaming: () => {
        const { streamController } = get();
        console.log('stopStreaming called, controller:', streamController, 'type:', typeof streamController);
        
        try {
          if (streamController) {
            console.log('Controller has abort method:', typeof streamController.abort);
            if (typeof streamController.abort === 'function') {
              streamController.abort();
              console.log('Stream aborted successfully');
            } else {
              console.warn('streamController.abort is not a function, type:', typeof streamController.abort);
              console.warn('Controller object:', streamController);
            }
          } else {
            console.log('No stream controller to stop');
          }
        } catch (error) {
          console.error('Error stopping stream:', error);
        } finally {
          set({ streamController: null, isLoading: false });
        }
      },

      // ツール承認関連アクション
      setPendingToolApproval: (pending, toolCall) => {
        set({ pendingToolApproval: pending, currentToolCall: toolCall });
      },

      approveTools: async () => {
        const { currentSession, setPendingToolApproval } = get();
        console.log('approveTools called, currentSession:', currentSession);
        
        try {
          console.log('Cagentの制限により、実際のAPI呼び出しは行いません');
          console.log('代わりに承認バナーを非表示にして処理を続行します');
          
          // 承認バナーを非表示にして処理を続行
          setPendingToolApproval(false, null);
          
          console.log('Tools approved (UI only) - streaming will continue');
          
          // 実際にはCagentでは動的承認ができないため、
          // セッション作成時の設定に依存します
          
        } catch (error) {
          console.error('Tool approval error:', error);
          set({ error: 'ツールの承認中にエラーが発生しました' });
        }
      },

      denyTools: async () => {
        const { currentSession, setPendingToolApproval, stopStreaming } = get();
        console.log('denyTools called, currentSession:', currentSession);

        try {
          console.log('ツールが拒否されました。ストリーミングを停止します。');
          setPendingToolApproval(false, null);

          // ストリーミングを停止してエージェント処理を中断
          stopStreaming();

          // ユーザーにフィードバック
          set({ error: null }); // エラーメッセージをクリア
          console.log('Tools denied and streaming stopped successfully');

        } catch (error) {
          console.error('Tool denial error:', error);
          set({ error: 'ツールの拒否中にエラーが発生しました' });
        }
      },

      // YAML管理関連アクション
      getAgentYAML: async (agentId: string) => {
        try {
          const result = await cagentAPI.getAgent(agentId);
          if (result.success && result.data) {
            // AgentConfigをYAML文字列に変換（簡易実装）
            const yamlContent = JSON.stringify(result.data, null, 2);
            return yamlContent;
          } else {
            set({ error: result.error || 'YAMLの読み込みに失敗しました' });
            return null;
          }
        } catch (error) {
          set({ error: 'YAMLの読み込み中にエラーが発生しました' });
          return null;
        }
      },

      updateAgentYAML: async (agentId: string, yamlContent: string) => {
        try {
          // YAML文字列をAgentConfigに変換（簡易実装）
          const agentConfig = JSON.parse(yamlContent);

          const result = await cagentAPI.updateAgent({
            filename: agentId,
            agent_config: agentConfig
          });

          if (result.success) {
            await get().loadAgents(); // 更新後にリストを更新
            return true;
          } else {
            set({ error: result.error || 'YAMLの更新に失敗しました' });
            return false;
          }
        } catch (error) {
          set({ error: 'YAMLの更新中にエラーが発生しました' });
          return false;
        }
      },
    }),
    {
      name: 'chat-store',
    }
  )
);
