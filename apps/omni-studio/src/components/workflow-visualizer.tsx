/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { useEffect } from 'react';
import type {
  Edge,
  Node} from '@xyflow/react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Card } from '@omnidesk/ui';

function WorkflowCardNode({ data }: { data: any }) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Card 
        className="p-3 w-[260px] shadow-md bg-card text-card-foreground border-border"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '260px 120px' }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{data.label}</span>
            <span className="text-[10px] text-muted-foreground">{data.id}</span>
          </div>
          {data.details && Object.keys(data.details).length > 0 && (
            <pre className="text-[10px] bg-muted text-muted-foreground p-1.5 rounded mt-2 overflow-hidden text-ellipsis whitespace-pre max-h-24">
              {JSON.stringify(data.details, null, 2)}
            </pre>
          )}
        </div>
      </Card>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </>
  );
}

const nodeTypes = {
  workflowCard: WorkflowCardNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 260;
  const nodeHeight = 120;

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };

    newNode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

export function WorkflowVisualizer({ parsedJson }: { parsedJson: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!parsedJson?.drawflow) return;
    
    let rawNodes = [];
    if (Array.isArray(parsedJson.drawflow.nodes)) {
      rawNodes = parsedJson.drawflow.nodes;
    } else if (typeof parsedJson.drawflow.nodes === 'object' && parsedJson.drawflow.nodes !== null) {
      rawNodes = Object.values(parsedJson.drawflow.nodes);
    }
    
    let rawEdges = [];
    if (Array.isArray(parsedJson.drawflow.edges)) {
      rawEdges = parsedJson.drawflow.edges;
    } else if (typeof parsedJson.drawflow.edges === 'object' && parsedJson.drawflow.edges !== null) {
      rawEdges = Object.values(parsedJson.drawflow.edges);
    }

    const flowNodes: Node[] = rawNodes.map((n: any) => ({
      id: String(n.id || Math.random()),
      type: 'workflowCard',
      data: { 
        label: n.label || n.type || 'Unknown Node', 
        id: n.id,
        details: n.data 
      },
      position: { x: 0, y: 0 },
    }));

    const flowEdges: Edge[] = rawEdges.map((e: any) => ({
      id: String(e.id || `${e.source}-${e.target}`),
      source: String(e.source),
      target: String(e.target),
      animated: true,
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [parsedJson, setNodes, setEdges]);

  return (
    <div className="w-full h-full min-h-[500px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
