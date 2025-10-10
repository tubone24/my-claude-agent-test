'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function Home() {
  const {
    agents,
    sessions,
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
    loadSessionsByAgent,
    setCurrentAgent,
    setCurrentSession,
    createSession,
    deleteSession,
    sendMessage,
    stopStreaming,
    approveTools,
    approveAllTools,
    denyTools
  } = useChatStore()

  const [messageInput, setMessageInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [isComposing, setIsComposing] = useState(false)

  useEffect(() => {
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
      await createSession({ tools_approved: false })
    }

    await sendMessage(messageInput)
    setMessageInput('')
  }

  const handleSelectAgent = async (agent: any) => {
    // ストリーミング中の場合は強制停止
    if (isLoading) {
      try {
        stopStreaming()
      } catch (error) {
        console.error('Error stopping streaming:', error)
      }
    }

    setCurrentAgent(agent)
    // エージェント切り替え時にそのエージェントのセッション一覧を読み込む
    await loadSessionsByAgent(agent.name)
  }

  const handleSelectSession = async (session: any) => {
    // セッションを選択して引き継ぐ
    await setCurrentSession(session)
  }

  const handleNewSession = async () => {
    if (!currentAgent) return
    // 新規セッションを作成（実用性のため自動承認）
    await createSession({ tools_approved: false })
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // カードのクリックイベントを防ぐ

    if (deletingSessionId === sessionId) {
      // 確認中の場合は実際に削除
      const success = await deleteSession(sessionId)
      if (success && currentAgent) {
        // 削除後にセッション一覧を再読み込み
        await loadSessionsByAgent(currentAgent.name)
      }
      setDeletingSessionId(null)
    } else {
      // 削除確認状態に設定
      setDeletingSessionId(sessionId)
    }
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingSessionId(null)
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
          <p className="text-muted-foreground">Initializing Cagent...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
            <CardDescription>
              Unable to connect to the Cagent API server. Please verify that the server is running.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Error Details: {error}
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-muted/30 border-r border-border overflow-hidden`}>
        <div className="p-4 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Cagent Chat</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </Button>
          </div>
          
          {/* Agent list */}
          <div className="space-y-3 mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Agent</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
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
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                        🤖
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">{agent.name}</div>
                          {agent.multi && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 border border-purple-200">
                              Multi
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {agent.description || 'No description'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {agents.length === 0 && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">
                      No agents found
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Session list */}
          {currentAgent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Sessions</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNewSession}
                  className="h-7 text-xs"
                >
                  + New
                </Button>
              </div>
              <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      currentSession?.id === session.id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : ''
                    } ${deletingSessionId === session.id ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                    onClick={() => handleSelectSession(session)}
                  >
                    <CardContent className="p-3">
                      {deletingSessionId === session.id ? (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-red-700 font-medium">
                              Delete?
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelDelete}
                              className="h-6 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="h-6 text-xs"
                            >
                                Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {session.title || session.id}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session.created_at || session.createdAt
                                ? new Date(session.created_at || session.createdAt!).toLocaleDateString()
                                : 'No date'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {currentSession?.id === session.id && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary text-white">
                                Active
                              </span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {sessions.length === 0 && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-sm text-muted-foreground">
                        No sessions
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar toggle button (for when closed) */}
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

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header*/}
        <header className="border-b border-border p-4 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {currentAgent?.name || 'Please select an agent'}
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
                    Session: &quot;{currentSessionTitle}&quot;
                </div>
              )}
              {currentTokenUsage && (
                <div className="text-xs text-muted-foreground border-l pl-3">
                  Input: {currentTokenUsage.input_tokens || 0} | Output: {currentTokenUsage.output_tokens || 0}
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {currentAgent ? (
            <>
              {/* Debug information - Fixed */}
              <div className="flex-shrink-0 p-4 pb-0">
                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border">
                  <div>Session: {currentSession?.id || 'None'}</div>
                  <div>Agent: {currentAgent?.name || 'None'}</div>
                  <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                  <div>Pending Tool Approval: {pendingToolApproval ? 'Yes' : 'No'}</div>
                  {currentToolCall && (
                    <div>Tool Call: {currentToolCall.function?.name} | Args: {currentToolCall.function?.arguments}</div>
                  )}
                </div>
              </div>

              {/* Tool Approval Banner - Fixed */}
              {pendingToolApproval && (
                <div className="flex-shrink-0 px-4 pt-4">
                  {currentToolCall?.function?.name === 'transfer_task' ? (
                    // transfer_taskの場合は通知のみ
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-800">エージェント切り替え</h4>
                            <p className="text-sm text-blue-600 mt-1">
                              サブエージェントまたは親エージェントに切り替えます
                            </p>
                            {currentToolCall?.function?.arguments && (
                              <div className="mt-2 p-2 bg-blue-100 rounded border border-blue-200">
                                <p className="text-xs text-blue-700 font-semibold mb-1">切り替え情報:</p>
                                <p className="text-xs text-blue-600 font-mono break-all">
                                  {currentToolCall.function.arguments}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => {
                                console.log('Acknowledging agent transfer...');
                                approveTools();
                              }}
                              className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                            >
                              OK
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // 通常のツールの場合は承認UI
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-yellow-800">ツールの使用を承認しますか？</h4>
                            <p className="text-sm text-yellow-600 mt-1">
                              エージェントが &quot;{currentToolCall?.function?.name || 'tool'}&quot; を使用しようとしています
                            </p>
                            {currentToolCall?.function?.arguments && (
                              <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-200">
                                <p className="text-xs text-yellow-700 font-semibold mb-1">引数:</p>
                                <p className="text-xs text-yellow-600 font-mono break-all">
                                  {currentToolCall.function.arguments}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col space-y-2 flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => {
                                console.log('Approving current tool only...');
                                approveTools();
                              }}
                              className="bg-green-600 text-white hover:bg-green-700 whitespace-nowrap"
                            >
                              Yes（今回のみ）
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                console.log('Approving all tools for this session...');
                                approveAllTools();
                              }}
                              className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                            >
                              全許可
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                console.log('Denying tool usage...');
                                denyTools();
                              }}
                              className="whitespace-nowrap"
                            >
                              No
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Message Area - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Card className="max-w-md">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          🤖
                        </div>
                        <h3 className="text-lg font-medium mb-2">{currentAgent.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            Send a message to start the conversation
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
                      let toolArguments: any = null;

                      if (message.toolCall?.function?.arguments) {
                        try {
                          toolArguments = JSON.parse(message.toolCall.function.arguments);

                          // create_todosの場合は特別な表示
                          if (message.toolName === 'create_todos' && toolArguments.todos && Array.isArray(toolArguments.todos)) {
                            todoList = toolArguments.todos;
                          }
                        } catch (e) {
                          console.error('Failed to parse tool arguments:', e);
                        }
                      }

                      return (
                        <div key={message.id || index} className="flex justify-start">
                          <div className="flex items-start space-x-3 max-w-3xl">
                            <div className="flex flex-col items-center flex-shrink-0 w-20">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                🔧
                              </div>
                              {message.agentName && (
                                <div className="text-xs text-muted-foreground mt-1 text-center break-words overflow-wrap-anywhere">
                                  {message.agentName}
                                </div>
                              )}
                            </div>
                            <Card className="bg-blue-50 border-blue-200">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-blue-700">
                                    {message.toolName} execution result
                                  </span>
                                </div>

                                {/* ツール引数を表示 */}
                                {toolArguments && (
                                  <div className="mb-3 p-2 bg-blue-100 rounded border border-blue-200">
                                    <div className="text-xs font-semibold text-blue-700 mb-1">Arguments:</div>
                                    <pre className="whitespace-pre-wrap font-mono text-xs text-blue-900 overflow-x-auto">
                                      {JSON.stringify(toolArguments, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {todoList.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="text-sm text-blue-900 mb-2">
                                      Created {todoList.length} task{todoList.length !== 1 ? 's' : ''}
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

                                <div className="text-xs opacity-70 mt-2 text-blue-600 flex items-center gap-2">
                                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                                  {message.tokens && (message.tokens.input || message.tokens.output) && (
                                    <span>
                                      • Input: {message.tokens.input || 0} | Output: {message.tokens.output || 0}
                                    </span>
                                  )}
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
                        <div className="flex items-start space-x-3 max-w-3xl">
                          {message.role === 'assistant' && (
                            <div className="flex flex-col items-center flex-shrink-0 w-20">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                🤖
                              </div>
                              {message.agentName && (
                                <div className="text-xs text-muted-foreground mt-1 text-center break-words overflow-wrap-anywhere">
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
                              <div className="text-xs opacity-70 mt-2 flex items-center gap-2">
                                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                                {message.tokens && (message.tokens.input || message.tokens.output) && (
                                  <span className={message.role === 'user' ? 'opacity-70' : 'text-muted-foreground'}>
                                    • Input: {message.tokens.input || 0} | Output: {message.tokens.output || 0}
                                  </span>
                                )}
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
                            <span className="text-xs text-muted-foreground">Thinking...</span>
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
                    placeholder={`Send a message to ${currentAgent.name}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                    disabled={isLoading}
                    className="min-h-[60px] resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Shift + Enter for new line
                    </div>
                    <div className="flex items-center space-x-2">
                      {isLoading && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleStopStreaming}
                        >
                          Stop
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={!messageInput.trim() || isLoading}
                      >
                        {isLoading ? 'Sending...' : 'Send'}
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
                  <CardTitle>Welcome to Cagent Chat</CardTitle>
                  <CardDescription>
                    Select an AI agent to start chatting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {agents.length > 0 ? (
                    <Button 
                      onClick={() => handleSelectAgent(agents[0])} 
                      className="w-full"
                    >
                      Select {agents[0].name}
                    </Button>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No agents available
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
