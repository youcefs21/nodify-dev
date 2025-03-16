import { useCallback, useEffect } from "react";
import type { CustomNode } from "../../../src/shared-types";
import { sendToServer } from "./sendToServer";
import { atom, useAtom } from "jotai";
import { useReactFlow } from "@xyflow/react";

// Helper functions for node operations
const findNodeById = (nodes: CustomNode[], id: string) => {
	return nodes.find((node) => node.id === id);
};

const findParentNode = (nodes: CustomNode[], nodeId: string) => {
	const node = findNodeById(nodes, nodeId);
	if (!node) return null;
	return findNodeById(nodes, node.data.parentId);
};

const findChildNodes = (nodes: CustomNode[], nodeId: string) => {
	return nodes.filter((node) => node.data.parentId === nodeId);
};

export const highlightedNodeAtom = atom<string | null>(null);

export function useNodeNavigation(renderedNodes: CustomNode[]) {
	const reactFlow = useReactFlow();
	const [highlightedNodeId, setHighlightedNodeId] =
		useAtom(highlightedNodeAtom);

	// Highlight a node
	const highlightNode = useCallback(
		(node: CustomNode) => {
			const nodeId = node.id;
			if (!nodeId) {
				console.log("no nodeId", node);
				return;
			}

			setHighlightedNodeId(nodeId);
			sendToServer({
				type: "highlight-node",
				nodeId,
				filePath: node.data.filePath,
				codeRange: node.data.codeRange,
			});
			try {
				const currentZoom = reactFlow.getViewport().zoom;
				reactFlow.fitView({
					nodes: [{ id: node.data.parentId }],
					maxZoom: currentZoom,
					minZoom: currentZoom,
				});
			} catch (error) {
				console.error("Error fitting view", error);
			}
		},
		[setHighlightedNodeId, reactFlow],
	);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!highlightedNodeId) {
				console.log("no highlightedNodeId");
				return;
			}

			const currentNode = findNodeById(renderedNodes, highlightedNodeId);
			if (!currentNode) {
				console.log("no current node for highlightedNodeId", highlightedNodeId);
				return;
			}

			// Get parent node
			const parentNode = findParentNode(renderedNodes, highlightedNodeId);

			// Get siblings (nodes with the same parent)
			const siblings = parentNode
				? renderedNodes.filter((node) => node.data.parentId === parentNode.id)
				: [];

			// Get current node's index among siblings
			const currentIndex = siblings.findIndex(
				(node) => node.id === highlightedNodeId,
			);

			// Get children of current node
			const children = findChildNodes(renderedNodes, highlightedNodeId);

			// Handle arrow keys and vim-like bindings
			switch (event.key) {
				case "ArrowDown":
				case "j":
					// Move to next sibling
					if (currentIndex < siblings.length - 1) {
						highlightNode(siblings[currentIndex + 1]);
					}
					break;
				case "ArrowUp":
				case "k":
					// Move to previous sibling
					if (currentIndex > 0) {
						highlightNode(siblings[currentIndex - 1]);
					}
					break;
				case "ArrowLeft":
				case "h":
					// Move to parent
					if (parentNode && parentNode.data.parentId !== "root") {
						highlightNode(parentNode);
					}
					break;
				case "ArrowRight":
				case "l":
					// Move to first child
					if (children.length > 0) {
						highlightNode(children[0]);
					}
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [highlightedNodeId, renderedNodes, highlightNode]);

	return {
		highlightedNodeId,
		highlightNode,
	};
}
