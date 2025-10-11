'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { YAMLEditorDialog } from '@/components/ui/yaml-editor-dialog'
import { AgentGraphDialog } from '@/components/ui/agent-graph-dialog'
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
    pendingOAuthAuth,
    currentOAuthRequest,
    currentTokenUsage,
    currentSessionTitle,
    streamController,
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
    denyTools,
    approveOAuth,
    denyOAuth,
    getAgentYAML,
    updateAgentYAML,
    importAgent,
    exportAgents,
    pullAgent,
    pushAgent
  } = useChatStore()

  const [messageInput, setMessageInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [yamlEditorOpen, setYamlEditorOpen] = useState(false)
  const [graphDialogOpen, setGraphDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<{ id: string; name: string } | null>(null)
  const [viewingGraphAgent, setViewingGraphAgent] = useState<{ id: string; name: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  const [exportedFilePath, setExportedFilePath] = useState('')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [showPullDialog, setShowPullDialog] = useState(false)
  const [pullAgentName, setPullAgentName] = useState('')
  const [showPushDialog, setShowPushDialog] = useState(false)
  const [pushAgentPath, setPushAgentPath] = useState('')
  const [pushAgentTag, setPushAgentTag] = useState('')
  const [showPullSuccess, setShowPullSuccess] = useState(false)
  const [showPushSuccess, setShowPushSuccess] = useState(false)
  const [pushDigest, setPushDigest] = useState('')

  // デバッグモードの設定（環境変数から取得）
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'

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
      // Create session if none exists (auto-approve for convenience)
      await createSession({ tools_approved: false })
    }

    await sendMessage(messageInput)
    setMessageInput('')
  }

  const handleSelectAgent = async (agent: any) => {
    // Force stop if streaming
    if (isLoading) {
      try {
        stopStreaming()
      } catch (error) {
        console.error('Error stopping streaming:', error)
      }
    }

    setCurrentAgent(agent)
    // Load sessions for the selected agent
    await loadSessionsByAgent(agent.name)
  }

  const handleSelectSession = async (session: any) => {
    // Select and continue the session
    await setCurrentSession(session)
  }

  const handleNewSession = async () => {
    if (!currentAgent) return
    // Create new session (auto-approve for convenience)
    await createSession({ tools_approved: false })
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click event

    if (deletingSessionId === sessionId) {
      // Actually delete if confirming
      const success = await deleteSession(sessionId)
      if (success && currentAgent) {
        // Reload session list after deletion
        await loadSessionsByAgent(currentAgent.name)
      }
      setDeletingSessionId(null)
    } else {
      // Set to delete confirmation state
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

  const handleOpenYAMLEditor = (agent: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent agent selection
    setEditingAgent({ id: agent.name, name: agent.name })
    setYamlEditorOpen(true)
  }

  const handleCloseYAMLEditor = () => {
    setYamlEditorOpen(false)
    setEditingAgent(null)
  }

  const handleOpenGraphDialog = (agent: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent agent selection
    setViewingGraphAgent({ id: agent.name, name: agent.name })
    setGraphDialogOpen(true)
  }

  const handleCloseGraphDialog = () => {
    setGraphDialogOpen(false)
    setViewingGraphAgent(null)
  }

  const handleImportAgent = async () => {
    if (!selectedFile) return
    const success = await importAgent(selectedFile)
    if (success) {
      setSelectedFile(null)
      setShowImportDialog(false)
    }
  }

  const handleExportAgents = async () => {
    const result = await exportAgents()
    if (result && result.zipPath) {
      setExportedFilePath(result.zipPath)
      setShowExportSuccess(true)
      // 5秒後に成功メッセージを閉じる
      setTimeout(() => setShowExportSuccess(false), 5000)
    }
  }

  const handlePullAgent = async () => {
    if (!pullAgentName.trim()) return
    const success = await pullAgent(pullAgentName.trim())
    if (success) {
      setPullAgentName('')
      setShowPullDialog(false)
      setShowPullSuccess(true)
      setTimeout(() => setShowPullSuccess(false), 5000)
    }
  }

  const handlePushAgent = async () => {
    if (!pushAgentPath.trim() || !pushAgentTag.trim()) return
    const result = await pushAgent(pushAgentPath.trim(), pushAgentTag.trim())
    if (result && result.digest) {
      setPushDigest(result.digest)
      setPushAgentPath('')
      setPushAgentTag('')
      setShowPushDialog(false)
      setShowPushSuccess(true)
      setTimeout(() => setShowPushSuccess(false), 5000)
    }
  }

  const handleCopyMessage = async (messageId: string, content: string, contentParts?: any[]) => {
    try {
      // メッセージのテキストを抽出
      let textToCopy = ''
      if (contentParts && contentParts.length > 0) {
        // contentPartsがある場合は、typeが'choice'のものを抽出してコピー
        textToCopy = contentParts
          .filter(part => part.type === 'choice')
          .map(part => part.content)
          .join('\n\n')
      } else {
        textToCopy = content
      }

      // クリップボードにコピー
      await navigator.clipboard.writeText(textToCopy)
      
      // コピー成功のフィードバック
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
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
    <>
      {/* YAML Editor Dialog */}
      {editingAgent && (
        <YAMLEditorDialog
          agentId={editingAgent.id}
          agentName={editingAgent.name}
          isOpen={yamlEditorOpen}
          onClose={handleCloseYAMLEditor}
          onSave={updateAgentYAML}
          onLoad={getAgentYAML}
        />
      )}

      {/* Agent Graph Dialog */}
      {viewingGraphAgent && (
        <AgentGraphDialog
          agentId={viewingGraphAgent.id}
          agentName={viewingGraphAgent.name}
          isOpen={graphDialogOpen}
          onClose={handleCloseGraphDialog}
          onLoad={getAgentYAML}
        />
      )}

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
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{agent.name}</div>
                            {agent.multi && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 border border-purple-200 flex-shrink-0">
                                Multi
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleOpenGraphDialog(agent, e)}
                              className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600 flex-shrink-0"
                              title="View agent graph"
                            >
                              📊
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleOpenYAMLEditor(agent, e)}
                              className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600 flex-shrink-0"
                              title="Edit YAML configuration"
                            >
                              📝
                            </Button>
                          </div>
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

            {/* Import/Export/Pull/Push Buttons */}
            <div className="space-y-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowImportDialog(true)}
                className="w-full text-xs"
              >
                📥 Import Agent
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportAgents}
                className="w-full text-xs"
                disabled={isLoading}
              >
                📤 Export All Agents
              </Button>
              {/* Pull/Push buttons only shown in debug mode */}
              {debugMode && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPullDialog(true)}
                    className="w-full text-xs"
                  >
                    ⬇️ Pull Agent
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPushDialog(true)}
                    className="w-full text-xs"
                  >
                    ⬆️ Push Agent
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Import Dialog */}
          {showImportDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-[400px]">
                <CardHeader>
                  <CardTitle>Import Agent</CardTitle>
                  <CardDescription>
                      Please select the agent&apos;s YAML file.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".yaml,.yml"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        setSelectedFile(file || null)
                      }}
                      className="w-full px-3 py-2 border rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground">
                          Selected file: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowImportDialog(false)
                        setSelectedFile(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImportAgent}
                      disabled={!selectedFile || isLoading}
                    >
                      {isLoading ? 'Importing...' : 'Import'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Export Success Message */}
          {showExportSuccess && (
            <div className="fixed bottom-4 right-4 z-50">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-green-600 text-xl">✓</span>
                    <div>
                      <h4 className="font-medium text-green-800">Export successful</h4>
                      <p className="text-sm text-green-600 mt-1">
                          A ZIP file has been created.
                      </p>
                      <p className="text-xs text-green-600 font-mono mt-2 break-all">
                        {exportedFilePath}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pull Agent Dialog */}
          {showPullDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-[400px]">
                <CardHeader>
                  <CardTitle>Pull Agent</CardTitle>
                  <CardDescription>
                    Enter the agent name to pull from the registry (e.g., username/agent-name)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Agent Name</label>
                    <input
                      type="text"
                      value={pullAgentName}
                      onChange={(e) => setPullAgentName(e.target.value)}
                      placeholder="e.g., username/agent-name"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPullDialog(false)
                        setPullAgentName('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePullAgent}
                      disabled={!pullAgentName.trim() || isLoading}
                    >
                      {isLoading ? 'Pulling...' : 'Pull'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Push Agent Dialog */}
          {showPushDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-[400px]">
                <CardHeader>
                  <CardTitle>Push Agent</CardTitle>
                  <CardDescription>
                    Enter the agent file path and tag to push to the registry
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Agent File Path</label>
                    <input
                      type="text"
                      value={pushAgentPath}
                      onChange={(e) => setPushAgentPath(e.target.value)}
                      placeholder="e.g., /path/to/agent.yaml"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tag</label>
                    <input
                      type="text"
                      value={pushAgentTag}
                      onChange={(e) => setPushAgentTag(e.target.value)}
                      placeholder="e.g., username/agent-name:latest"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPushDialog(false)
                        setPushAgentPath('')
                        setPushAgentTag('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePushAgent}
                      disabled={!pushAgentPath.trim() || !pushAgentTag.trim() || isLoading}
                    >
                      {isLoading ? 'Pushing...' : 'Push'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pull Success Message */}
          {showPullSuccess && (
            <div className="fixed bottom-4 right-4 z-50">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-green-600 text-xl">✓</span>
                    <div>
                      <h4 className="font-medium text-green-800">Pull successful</h4>
                      <p className="text-sm text-green-600 mt-1">
                        The agent has been pulled successfully.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Push Success Message */}
          {showPushSuccess && (
            <div className="fixed bottom-4 right-4 z-50">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-green-600 text-xl">✓</span>
                    <div>
                      <h4 className="font-medium text-green-800">Push successful</h4>
                      <p className="text-sm text-green-600 mt-1">
                        The agent has been pushed successfully.
                      </p>
                      {pushDigest && (
                        <p className="text-xs text-green-600 font-mono mt-2 break-all">
                          Digest: {pushDigest}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
              {/* Debug information - Controlled by NEXT_PUBLIC_DEBUG_MODE */}
              {debugMode && (
                <div className="flex-shrink-0 p-4 pb-0">
                  <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    <div className="font-semibold mb-2 text-gray-700 dark:text-gray-200">🐛 Debug Information</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold">Session ID:</span> {currentSession?.id || 'None'}
                      </div>
                      <div>
                        <span className="font-semibold">Agent:</span> {currentAgent?.name || 'None'}
                      </div>
                      <div>
                        <span className="font-semibold">Loading:</span> {isLoading ? '✅ Yes' : '❌ No'}
                      </div>
                      <div>
                        <span className="font-semibold">Streaming:</span> {streamController ? '✅ Active' : '❌ Inactive'}
                      </div>
                      <div>
                        <span className="font-semibold">Tool Approval Pending:</span> {pendingToolApproval ? '⏳ Yes' : '✅ No'}
                      </div>
                      <div>
                        <span className="font-semibold">OAuth Auth Pending:</span> {pendingOAuthAuth ? '⏳ Yes' : '✅ No'}
                      </div>
                      <div>
                        <span className="font-semibold">Message Count:</span> {messages.length}
                      </div>
                      <div>
                        <span className="font-semibold">Session Title:</span> {currentSessionTitle || 'Not set'}
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold">Tools Approved:</span> {currentSession?.tools_approved ? '✅ Yes (All)' : '❌ No (Per request)'}
                      </div>
                      {currentTokenUsage && (
                        <>
                          <div>
                            <span className="font-semibold">Input Tokens:</span> {currentTokenUsage.input_tokens?.toLocaleString() || 0}
                          </div>
                          <div>
                            <span className="font-semibold">Output Tokens:</span> {currentTokenUsage.output_tokens?.toLocaleString() || 0}
                          </div>
                          <div className="col-span-2">
                            <span className="font-semibold">Total Tokens:</span> {((currentTokenUsage.input_tokens || 0) + (currentTokenUsage.output_tokens || 0)).toLocaleString()}
                          </div>
                          {currentTokenUsage.context_length && (
                            <div className="col-span-2">
                              <span className="font-semibold">Context Length:</span> {currentTokenUsage.context_length.toLocaleString()}
                            </div>
                          )}
                        </>
                      )}
                      {currentToolCall && (
                        <div className="col-span-2 mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded border border-yellow-200 dark:border-yellow-700">
                          <div className="font-semibold text-yellow-800 dark:text-yellow-200">Current Tool Call:</div>
                          <div className="mt-1">
                            <span className="font-semibold">Function:</span> {currentToolCall.function?.name || 'N/A'}
                          </div>
                          {currentToolCall.function?.arguments && (
                            <div className="mt-1">
                              <span className="font-semibold">Arguments:</span>
                              <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap break-all">
                                {currentToolCall.function.arguments}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                      {currentOAuthRequest && (
                        <div className="col-span-2 mt-2 p-2 bg-green-100 dark:bg-green-900 rounded border border-green-200 dark:border-green-700">
                          <div className="font-semibold text-green-800 dark:text-green-200">Current OAuth Request:</div>
                          <div className="mt-1">
                            <span className="font-semibold">Server:</span> {currentOAuthRequest.serverUrl}
                          </div>
                          <div className="mt-1">
                            <span className="font-semibold">Message:</span> {currentOAuthRequest.message}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tool Approval Banner - Fixed */}
              {pendingToolApproval && (
                <div className="flex-shrink-0 px-4 pt-4">
                  {currentToolCall?.function?.name === 'transfer_task' ? (
                    // Notification only for transfer_task
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-800">Agent Transfer</h4>
                            <p className="text-sm text-blue-600 mt-1">
                              Transferring to sub-agent or parent agent
                            </p>
                            {currentToolCall?.function?.arguments && (
                              <div className="mt-2 p-2 bg-blue-100 rounded border border-blue-200">
                                <p className="text-xs text-blue-700 font-semibold mb-1">Transfer Info:</p>
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
                    // Approval UI for regular tools
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-yellow-800">Approve Tool Usage?</h4>
                            <p className="text-sm text-yellow-600 mt-1">
                              Agent is attempting to use &quot;{currentToolCall?.function?.name || 'tool'}&quot;
                            </p>
                            {currentToolCall?.function?.arguments && (
                              <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-200">
                                <p className="text-xs text-yellow-700 font-semibold mb-1">Arguments:</p>
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
                              Yes（This request only）
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                console.log('Approving all tools for this session...');
                                approveAllTools();
                              }}
                              className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                            >
                              All Accepted
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

              {/* OAuth Authorization Banner */}
              {pendingOAuthAuth && currentOAuthRequest && (
                <div className="flex-shrink-0 px-4 pt-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-green-800">OAuth Authentication Required</h4>
                          <p className="text-sm text-green-600 mt-1">
                            {currentOAuthRequest.message}
                          </p>
                          <div className="mt-2 p-2 bg-green-100 rounded border border-green-200">
                            <p className="text-xs text-green-700 font-semibold mb-1">Server:</p>
                            <p className="text-xs text-green-600 font-mono break-all">
                              {currentOAuthRequest.serverUrl}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => {
                              console.log('Approving OAuth authorization...');
                              approveOAuth();
                            }}
                            className="bg-green-600 text-white hover:bg-green-700 whitespace-nowrap"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              console.log('Denying OAuth authorization...');
                              denyOAuth();
                            }}
                            className="whitespace-nowrap"
                          >
                            Deny
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                            {/* choiceタイプのメッセージの場合のみアクションボタンを表示 */}
                            {message.role === 'assistant' && 
                             message.contentParts && 
                             message.contentParts.some(part => part.type === 'choice') && (
                              <div className="px-3 pb-2 pt-0">
                                <button
                                  onClick={() => handleCopyMessage(
                                    message.id || String(index),
                                    message.content,
                                    message.contentParts
                                  )}
                                  className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded transition-colors flex items-center gap-1"
                                  title="クリップボードにコピー"
                                >
                                  {copiedMessageId === (message.id || String(index)) ? (
                                    <>
                                      <span>✓</span>
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>📋</span>
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
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
    </>
  )
}
