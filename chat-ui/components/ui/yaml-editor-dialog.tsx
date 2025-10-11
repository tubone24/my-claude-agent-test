'use client'

import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'js-yaml'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface YAMLEditorDialogProps {
  agentId: string
  agentName: string
  isOpen: boolean
  onClose: () => void
  onSave: (agentId: string, yamlContent: string) => Promise<boolean>
  onLoad: (agentId: string) => Promise<string | null>
}

export function YAMLEditorDialog({
  agentId,
  agentName,
  isOpen,
  onClose,
  onSave,
  onLoad
}: YAMLEditorDialogProps) {
  const [yamlContent, setYamlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalContent, setOriginalContent] = useState<string>('')

  // YAMLの読み込み
  useEffect(() => {
    if (isOpen && agentId) {
      loadYAML()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, agentId])

  const loadYAML = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const content = await onLoad(agentId)
      if (content) {
        setYamlContent(content)
        setOriginalContent(content)
        setHasChanges(false)
        validateYAML(content)
      } else {
        setError('YAMLの読み込みに失敗しました')
      }
    } catch (err) {
      setError('YAMLの読み込み中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const validateYAML = (content: string) => {
    try {
      yaml.load(content)
      setValidationError(null)
      return true
    } catch (err) {
      if (err instanceof Error) {
        setValidationError(err.message)
      } else {
        setValidationError('YAML構文エラー')
      }
      return false
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || ''
    setYamlContent(newValue)
    setHasChanges(newValue !== originalContent)
    validateYAML(newValue)
  }

  const handleSave = async () => {
    if (!validateYAML(yamlContent)) {
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const success = await onSave(agentId, yamlContent)
      if (success) {
        setOriginalContent(yamlContent)
        setHasChanges(false)
        // 保存成功後、少し待ってからダイアログを閉じる
        setTimeout(() => {
          onClose()
        }, 500)
      } else {
        setError('Failed to save YAML')
      }
    } catch (err) {
      setError('An error occurred while saving YAML.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('Changes have not been saved. Discard?')) {
        setYamlContent(originalContent)
        setHasChanges(false)
        onClose()
      }
    } else {
      onClose()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-7xl h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>YAML Editor</CardTitle>
              <CardDescription>
                &quot;{agentName}&quot; Yaml file
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-xs text-orange-600 font-medium">
                  There are unsaved changes.
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden space-y-4 py-4">
          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* バリデーションエラー表示 */}
          {validationError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              <div className="font-semibold">syntax error:</div>
              <div className="text-sm mt-1">{validationError}</div>
            </div>
          )}

          {/* エディタ */}
          <div className="flex-1 border rounded overflow-hidden" style={{ minHeight: '500px' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : (
              <Editor
                height="100%"
                width="100%"
                defaultLanguage="yaml"
                value={yamlContent}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  fontSize: 18,
                  lineHeight: 28,
                  fontWeight: '500',
                  wordWrap: 'on',
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  folding: true,
                  renderWhitespace: 'selection',
                  padding: { top: 16, bottom: 16 },
                }}
              />
            )}
          </div>

          {/* ボタン */}
          <div className="flex-shrink-0 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !!validationError || !hasChanges}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
