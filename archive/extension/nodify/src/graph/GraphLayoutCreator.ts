import type { CustomNode } from "../types";
import type { Edge } from "@xyflow/react";
import dagre from "@dagrejs/dagre";

// Keep track of node positions between renders to prevent movement
const stablePositions = new Map<string, { x: number, y: number }>();

export function createGraphLayout(nodes: CustomNode[], edges: Edge[]) {
    // Constants for node dimensions and spacing
    const nodeWidth = 260;
    const nodeHeight = 40;
    const xOffset = 300; // Horizontal distance between levels
    const gapBetweenNodes = 45; // Vertical gap between sibling nodes
    
    // Step 1: Use Dagre for initial hierarchical layout
    const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    graph.setGraph({ rankdir: "LR", ranksep: 250, nodesep: 150, edgesep: 120 });
    
    edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
    nodes.forEach((node) => 
        graph.setNode(node.id, { 
            width: nodeWidth, 
            height: nodeHeight * (1 + node.data.children.length) 
        }),
    );
    
    dagre.layout(graph);
    
    // Step 2: Position nodes starting from the root
    const nodePositions = new Map<string, { x: number, y: number }>();
    const processedNodes = new Set<string>();
    
    // Get the root node (first node in the array)
    const rootNode = nodes[0];
    const nodeWithPosition = graph.node(rootNode.id);
    
    // Position the root node
    if (stablePositions.has(rootNode.id)) {
        nodePositions.set(rootNode.id, stablePositions.get(rootNode.id)!);
    } else {
        // Otherwise use Dagre position
        const x = nodeWithPosition.x - nodeWidth / 2;
        const y = nodeWithPosition.y - (nodeHeight * (1 + rootNode.data.children.length)) / 2;
        nodePositions.set(rootNode.id, { x, y });
        // Save for future stability
        stablePositions.set(rootNode.id, { x, y });
    }
    
    // Mark as processed
    processedNodes.add(rootNode.id);
    
    // Position root's children
    positionChildren(rootNode.id, 1);
    
    // Step 3: Apply positions to nodes
    const positionedNodes = nodes.map(node => {
        const position = nodePositions.get(node.id) || { x: 0, y: 0 };
        
        // Save position for future stability
        stablePositions.set(node.id, position);
        
        return {
            ...node,
            position
        };
    });
    
    
    return { nodes: positionedNodes, edges };
    
    /**
     * Recursively positions children of a node
     */
    function positionChildren(parentId: string, level: number) {
        // Find the parent node
        const parentNode = nodes.find(n => n.id === parentId);
        if (!parentNode) return;
        
        // Get children data from the node
        const childrenData = parentNode.data.children;
        if (childrenData.length === 0) return;
        
        // Get the actual child nodes that match the children data IDs
        const children = nodes.filter(node => 
            childrenData.some(childData => childData.id === node.id)
        );
        if (children.length === 0) return;
        
        const parentPos = nodePositions.get(parentId)!;
        
        // Calculate node heights and total height
        const nodeHeights = children.map(child => 
            Math.max(nodeHeight * (1 + child.data.children.length), 60)
        );
        
        // Calculate total height including gaps
        const totalHeight = nodeHeights.reduce((sum, height) => sum + height, 0) 
            + (children.length - 1) * gapBetweenNodes;
        
        // Position each child
        let currentY = parentPos.y - (totalHeight / 2);
        
        children.forEach((child, index) => {
            if (processedNodes.has(child.id)) return; // Skip if already processed
            processedNodes.add(child.id);
            
            // Get this child's height
            const childHeight = nodeHeights[index];
            
            // Position the child
            const childX = parentPos.x + xOffset + (index * 15); // Add cascade effect
            const childY = currentY + (childHeight / 2);
            
            // Store position
            nodePositions.set(child.id, { x: childX, y: childY });
            
            // Update currentY for next child
            currentY += childHeight + gapBetweenNodes;
            
            // Process this child's children
            positionChildren(child.id, level + 1);
        });
    }
    
        
}
