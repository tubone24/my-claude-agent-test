'use client'

import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useChatStore } from '@/lib/store'

interface YAMLViewerProps {
  agentId: string
  agentName: string
  onClose: () => void
}

export function YAMLViewer({ agentId, agentName, onClose }: YAMLViewerProps) {
  const [yamlContent, setYamlContent] = useState<string>('')
  const [editedYaml, setEditedYaml] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { getAgentYAML, updateAgentYAML } = useChatStore()

  useEffect(() => {
    loadYAML()
  }, [agentId])

  const loadYAML = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const yaml = await getAgentYAML(agentId)
      if (yaml) {
        setYamlContent(yaml)
        setEditedYaml(yaml)
      } else {
        setError('YAML定義の読み込みに失敗しました')
      }
    } catch (err) {
      setError('YAML定義の読み込み中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const success = await updateAgentYAML(agentId, editedYaml)
      if (success) {
        setYamlContent(editedYaml)
        setIsEditing(false)
      } else {
        setError('YAML定義の保存に失敗しました')
      }
    } catch (err) {
      setError('YAML定義の保存中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedYaml(yamlContent)
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>YAML定義: {agentName}</CardTitle>
              <CardDescription>
                エージェントの定義をYAML形式で表示・編集できます
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground">読み込み中...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={loadYAML}>再試行</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        size="sm"
                      >
                        {isSaving ? '保存中...' : '保存'}
                      </Button>
                      <Button 
                        onClick={handleCancel} 
                        variant="outline"
                        disabled={isSaving}
                        size="sm"
                      >
                        キャンセル
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} size="sm">
                      編集
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {yamlContent.split('\n').length} 行
                </div>
              </div>

              <div className="flex-1 overflow-auto border rounded-lg">
                {isEditing ? (
                  <Textarea
                    value={editedYaml}
                    onChange={(e) => setEditedYaml(e.target.value)}
                    className="w-full h-full min-h-[500px] font-mono text-sm resize-none border-0 focus-visible:ring-0"
                    placeholder="YAML定義を入力..."
                  />
                ) : (
                  <SyntaxHighlighter
                    language="yaml"
                    style={vscDarkPlus}
                    showLineNumbers={true}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                    }}
                    lineNumberStyle={{
                      minWidth: '3em',
                      paddingRight: '1em',
                      color: '#6e7681',
                      userSelect: 'none',
                    }}
                  >
                    {yamlContent}
                  </SyntaxHighlighter>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
