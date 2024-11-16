import { ReactFlow, useNodesState } from "@xyflow/react";
import { nodeTypes, type CustomNode } from "./nodes.schema";
import { useEffect, useState } from "react";


export function StackedNodes(NodesList: CustomNode[]) {
    const [nodes, setNodes, onNodesChange] = useNodesState(NodesList);
    const [stackedNodes, setStackedNodes] = useState<CustomNode[]>([]);

    useEffect(() => {
        // Generate stacked positions for nodes at the same level
        const updatedNodes = [...NodesList];
        const levelGroups: { [key: number]: CustomNode[] } = {};

        // Group nodes by their depth level (assuming depth is derived from node ID or a data property)
        for (const node of updatedNodes) {
            const depth = node.position.x / 300; // Assuming depth calculation is based on the x position
            if (!levelGroups[depth]) {
                levelGroups[depth] = [];
            }
            levelGroups[depth].push(node);
        }

        // Stack nodes within the same level
        for (const depth of Object.keys(levelGroups)) {
            const nodesAtSameLevel = levelGroups[Number(depth)];
            for (let index = 0; index < nodesAtSameLevel.length; index++) {
                const node = nodesAtSameLevel[index];
                node.position = { x: node.position.x, y: index * 100 };
            }
        }
        setStackedNodes(updatedNodes);
    }, [NodesList]);

    return (
        <ReactFlow
            nodes={stackedNodes}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
        >
        </ReactFlow>
    );
}

