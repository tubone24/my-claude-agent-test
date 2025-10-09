'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function Home() {
  const {
    agents,
    currentAgent,
    currentSession,
    messages,
    isLoading,
    error,
    pendingToolApproval,
    currentToolCall,
    currentTokenUsage,
    currentSessionTitle,
    loadAgents,
    loadSessions,
    setCurrentAgent,
    createSession,
    sendMessage,
    stopStreaming,
    approveTools,
    denyTools
  } = useChatStore()

  const [messageInput, setMessageInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    // アプリ初期化時にエージェントとセッションを読み込む
    const initialize = async () => {
      await loadAgents()
      await loadSessions()
    }
    
    initialize()
  }, [loadAgents, loadSessions])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !currentAgent) return

    if (!currentSession) {
      // セッションがない場合は作成（実用性のため自動承認）
      await createSession({ tools_approved: true })
    }

    await sendMessage(messageInput)
    setMessageInput('')
  }

  const handleSelectAgent = async (agent: any) => {
    setCurrentAgent(agent)
    // エージェント選択時に自動でセッション作成（実用性のため自動承認）
    if (!currentSession) {
      await createSession({ tools_approved: true })
    }
  }

  const handleStopStreaming = () => {
    try {
      stopStreaming()
    } catch (error) {
      console.error('Error stopping streaming:', error)
    }
  }

  if (isLoading && !agents.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Cagentを初期化中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">接続エラー</CardTitle>
            <CardDescription>
              Cagent APIサーバーに接続できません。サーバーが起動していることを確認してください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                エラー詳細: {error}
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                再試行
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* サイドバー */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-muted/30 border-r border-border overflow-hidden`}>
        <div className="p-4 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Cagent チャット</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </Button>
          </div>
          
          {/* エージェント一覧 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">エージェント</h3>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {agents.map((agent) => (
                <Card
                  key={agent.name}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    currentAgent?.name === agent.name 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : ''
                  }`}
                  onClick={() => handleSelectAgent(agent)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        🤖
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{agent.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {agent.description || '説明なし'}
                        </div>
                        {agent.multi && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary">
                              マルチエージェント
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {agents.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground">
                      エージェントが見つかりません
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* サイドバートグルボタン（閉じた時用） */}
      {!sidebarOpen && (
        <div className="absolute top-4 left-4 z-10">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </Button>
        </div>
      )}

      {/* メインエリア */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <header className="border-b border-border p-4 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {currentAgent?.name || 'エージェントを選択してください'}
              </h1>
              {currentAgent?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentAgent.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {currentSessionTitle && (
                <div className="text-sm text-muted-foreground">
                  セッションタイトル: {currentSessionTitle}
                </div>
              )}
              {currentTokenUsage && (
                <div className="text-xs text-muted-foreground border-l pl-3">
                  入力: {currentTokenUsage.input_tokens || 0} | 出力: {currentTokenUsage.output_tokens || 0}
                </div>
              )}
              {isLoading && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopStreaming}
                >
                  停止
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* チャットエリア */}
        <div className="flex-1 flex flex-col">
          {currentAgent ? (
            <>
              {/* メッセージエリア */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* デバッグ情報 */}
                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border">
                  <div>Session: {currentSession?.id || 'None'}</div>
                  <div>Agent: {currentAgent?.name || 'None'}</div>
                  <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                  <div>Pending Tool Approval: {pendingToolApproval ? 'Yes' : 'No'}</div>
                  {currentToolCall && (
                    <div>Tool Call: {currentToolCall.function?.name} | Args: {currentToolCall.function?.arguments}</div>
                  )}
                </div>

                {/* ツール承認バナー */}
                {pendingToolApproval && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-yellow-800">ツール使用情報</h4>
                          <p className="text-sm text-yellow-600 mt-1">
                            エージェントが「{currentToolCall?.function?.name || 'ツール'}」を使用しています。
                          </p>
                          <p className="text-xs text-yellow-500 mt-1">
                            注：Cagentは自動承認で動作しています。情報表示のみです。
                          </p>
                          {currentToolCall?.function?.arguments && (
                            <p className="text-xs text-yellow-500 mt-1 font-mono">
                              引数: {currentToolCall.function.arguments}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              console.log('Closing tool info banner...');
                              approveTools();
                            }}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            了解
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Card className="max-w-md">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          🤖
                        </div>
                        <h3 className="text-lg font-medium mb-2">{currentAgent.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          メッセージを送信して会話を開始しましょう
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    // ツールメッセージの場合は別のUIを表示
                    if (message.role === 'tool' && message.messageType === 'tool_result') {
                      // create_todosの場合は特別な表示
                      let todoList: any[] = [];
                      if (message.toolName === 'create_todos' && message.toolCall?.function?.arguments) {
                        try {
                          const args = JSON.parse(message.toolCall.function.arguments);
                          if (args.todos && Array.isArray(args.todos)) {
                            todoList = args.todos;
                          }
                        } catch (e) {
                          console.error('Failed to parse create_todos arguments:', e);
                        }
                      }

                      return (
                        <div key={message.id || index} className="flex justify-start">
                          <div className="flex items-start space-x-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              🔧
                            </div>
                            <Card className="bg-blue-50 border-blue-200">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-blue-700">
                                    {message.toolName} の実行結果
                                  </span>
                                </div>

                                {todoList.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="text-sm text-blue-900 mb-2">
                                      {todoList.length}件のタスクを作成しました
                                    </div>
                                    <ul className="space-y-2">
                                      {todoList.map((todo, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-blue-900">
                                          <span className="text-blue-500 flex-shrink-0">✓</span>
                                          <span>{todo.description}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-blue-900">
                                    {message.content}
                                  </pre>
                                )}

                                <div className="text-xs opacity-70 mt-2 text-blue-600">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      );
                    }

                    // 通常のメッセージ
                    return (
                      <div
                        key={message.id || index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-start space-x-3 max-w-[80%]">
                          {message.role === 'assistant' && (
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                🤖
                              </div>
                              {message.agentName && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {message.agentName}
                                </div>
                              )}
                            </div>
                          )}
                          <Card className={message.role === 'user' ? 'bg-primary text-white' : ''}>
                            <CardContent className="p-3">
                              {/* contentPartsがある場合はパートごとにレンダリング */}
                              {message.contentParts && message.contentParts.length > 0 ? (
                                <div className="space-y-1">
                                  {message.contentParts.map((part, partIndex) => (
                                    <div key={partIndex}>
                                      {part.type === 'reasoning' ? (
                                        <pre
                                          className="whitespace-pre-wrap font-sans text-sm leading-relaxed opacity-60 text-muted-foreground italic"
                                        >
                                          {part.content}
                                        </pre>
                                      ) : (
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {part.content}
                                          </ReactMarkdown>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed ${message.role === 'user' ? 'text-white' : 'text-foreground'}`}>
                                  {message.content}
                                </pre>
                              )}
                              <div className="text-xs opacity-70 mt-2">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </div>
                            </CardContent>
                          </Card>
                          {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                              👤
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* タイピングインジケーター */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        🤖
                      </div>
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            </div>
                            <span className="text-xs text-muted-foreground">考えています...</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>

              {/* 入力エリア */}
              <div className="border-t border-border p-4">
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <Textarea
                    placeholder={`${currentAgent.name}にメッセージを送信...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                    disabled={isLoading}
                    className="min-h-[60px] resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Shift + Enter で改行
                    </div>
                    <div className="flex items-center space-x-2">
                      {isLoading && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleStopStreaming}
                        >
                          停止
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={!messageInput.trim() || isLoading}
                      >
                        {isLoading ? '送信中...' : '送信'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="max-w-md">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    🤖
                  </div>
                  <CardTitle>Cagent チャットへようこそ</CardTitle>
                  <CardDescription>
                    AIエージェントを選択してチャットを開始しましょう
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {agents.length > 0 ? (
                    <Button 
                      onClick={() => handleSelectAgent(agents[0])} 
                      className="w-full"
                    >
                      {agents[0].name} を選択
                    </Button>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      エージェントがありません
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
