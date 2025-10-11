'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import * as yaml from 'js-yaml'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { AgentConfig } from '@/lib/types'

interface AgentGraphDialogProps {
  agentId: string
  agentName: string
  isOpen: boolean
  onClose: () => void
  onLoad: (agentId: string) => Promise<string | null>
}

// ツールタイプから色を生成する関数
const getColorFromString = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  // 色相(hue)を0-360の範囲で生成
  const hue = Math.abs(hash % 360)
  return {
    light: `hsl(${hue}, 75%, 90%)`,
    lightBorder: `hsl(${hue}, 70%, 70%)`,
    lightText: `hsl(${hue}, 70%, 30%)`,
    dark: `hsl(${hue}, 60%, 25%)`,
    darkBorder: `hsl(${hue}, 60%, 40%)`,
    darkText: `hsl(${hue}, 75%, 75%)`,
  }
}

// カスタムノードコンポーネント
function AgentNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg border-2 bg-white dark:bg-gray-800" style={{ minWidth: '200px' }}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{data.isRoot ? '👑' : '🤖'}</span>
        <div className="font-bold text-lg">{data.label}</div>
      </div>

      {data.model && (
        <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
          <span className="font-semibold">Model:</span> {data.model}
        </div>
      )}

      {data.description && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
          {data.description}
        </div>
      )}

      {data.toolsets && data.toolsets.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tools</div>
          <div className="flex flex-wrap gap-1">
            {data.toolsets.map((toolset: any, idx: number) => {
              // typeとrefを組み合わせて色を生成（mcpなどで異なるrefがある場合に区別するため）
              const colorKey = toolset.ref ? `${toolset.type}-${toolset.ref}` : toolset.type
              const colors = getColorFromString(colorKey)
              return (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs border"
                  style={{
                    backgroundColor: colors.light,
                    borderColor: colors.lightBorder,
                    color: colors.lightText,
                  }}
                >
                  {toolset.type}
                  {toolset.ref && ` (${toolset.ref})`}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {data.subAgentCount > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
            ↓ {data.subAgentCount} Sub-agents
          </div>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes = {
  agentNode: AgentNode,
}

// Dagreを使った階層レイアウト関数
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const nodeWidth = 250
  const nodeHeight = 180

  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100,  // ノード間の水平間隔
    ranksep: 150,  // レベル間の垂直間隔
    marginx: 50,
    marginy: 50,
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = isHorizontal ? Position.Left : Position.Top
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom

    // dagreはノードの中心座標を返すので、左上座標に変換
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    }

    return node
  })

  return { nodes, edges }
}

export function AgentGraphDialog({
  agentId,
  agentName,
  isOpen,
  onClose,
  onLoad
}: AgentGraphDialogProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null)

  // YAMLの読み込みとパース
  useEffect(() => {
    if (isOpen && agentId) {
      loadAndParseYAML()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, agentId])

  const loadAndParseYAML = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const content = await onLoad(agentId)
      if (content) {
        const parsed = yaml.load(content) as AgentConfig
        setAgentConfig(parsed)

        // ノードとエッジを生成
        const { nodes: generatedNodes, edges: generatedEdges } = generateGraphData(parsed)

        // Dagreレイアウトを適用
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          generatedNodes,
          generatedEdges,
          'TB'
        )

        console.log('Generated nodes:', layoutedNodes.length)
        console.log('Generated edges:', layoutedEdges)

        setNodes(layoutedNodes)
        setEdges(layoutedEdges)
      } else {
        setError('YAMLの読み込みに失敗しました')
      }
    } catch (err) {
      console.error('Error parsing YAML:', err)
      setError('YAMLのパース中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const generateGraphData = (config: AgentConfig): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    if (!config.agents) {
      return { nodes, edges }
    }

    // ルートエージェントを見つける
    const rootAgentName = 'root'
    const rootAgent = config.agents[rootAgentName]

    if (!rootAgent) {
      // ルートがない場合は、最初のエージェントをルートとして扱う
      const firstAgentName = Object.keys(config.agents)[0]
      if (firstAgentName) {
        return generateGraphDataFromAgent(config, firstAgentName, 0, 0)
      }
      return { nodes, edges }
    }

    // ルートから階層的にグラフを構築
    return generateGraphDataFromAgent(config, rootAgentName, 0, 0)
  }

  const generateGraphDataFromAgent = (
    config: AgentConfig,
    agentName: string,
    level: number,
    siblingIndex: number,
    parentId?: string
  ): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    const agent = config.agents[agentName]
    if (!agent) {
      return { nodes, edges }
    }

    const nodeId = agentName
    const isRoot = agentName === 'root'

    // モデル名を取得
    let modelName = agent.model
    if (config.models && config.models[agent.model]) {
      const modelConfig = config.models[agent.model]
      modelName = `${modelConfig.provider}/${modelConfig.model}`
    }

    // ノードを作成
    const node: Node = {
      id: nodeId,
      type: 'agentNode',
      position: { x: siblingIndex * 300, y: level * 250 },
      data: {
        label: agentName,
        model: modelName,
        description: agent.description,
        toolsets: agent.toolsets || [],
        subAgentCount: agent.sub_agents?.length || 0,
        isRoot: isRoot,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }
    nodes.push(node)

    // 親エージェントからのエッジを作成
    if (parentId) {
      const edge: Edge = {
        id: `e${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'default',
        animated: true,
        style: {
          stroke: '#6366f1',
          strokeWidth: 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
      }
      edges.push(edge)
    }

    // サブエージェントを処理
    if (agent.sub_agents && agent.sub_agents.length > 0) {
      let totalWidth = 0
      const childrenData: { nodes: Node[], edges: Edge[] }[] = []

      agent.sub_agents.forEach((subAgentName, index) => {
        const childData = generateGraphDataFromAgent(config, subAgentName, level + 1, 0, nodeId)
        childrenData.push(childData)

        // 子ノードの幅を計算
        childData.nodes.forEach(childNode => {
          childNode.position.x += totalWidth
        })

        // 次の子のためにオフセットを更新
        const childWidth = Math.max(300, (childData.nodes.length) * 300)
        totalWidth += childWidth
      })

      // 親ノードを子ノードの中央に配置
      const parentWidth = totalWidth
      node.position.x = (parentWidth - 300) / 2 + siblingIndex * 300

      // すべての子ノードとエッジを追加
      childrenData.forEach(childData => {
        nodes.push(...childData.nodes)
        edges.push(...childData.edges)
      })
    }

    return { nodes, edges }
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
              <CardTitle>Visualization of Agent Structures</CardTitle>
              <CardDescription>
                &quot;{agentName}&quot;
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          {/* エラー表示 */}
          {error && (
            <div className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* グラフ表示 */}
          <div className="flex-1 relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={1.5}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  style: { stroke: '#6366f1', strokeWidth: 3 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background />
                <Controls />
              </ReactFlow>
            )}
          </div>

          {/* 凡例 */}
          {!isLoading && !error && agentConfig && (
            <div className="flex-shrink-0 p-4 border-t bg-gray-50 dark:bg-gray-900">
              <div className="text-sm">
                <div className="font-semibold mb-2">Legend</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span>👑</span>
                    <span>Root Agent (Starting)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🤖</span>
                    <span>Sub Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">→</span>
                    <span>Inheritance relationship (parent → child)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span>
                    <span>Available tools</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
