import { useCallback, useEffect, useMemo } from "react";
import type { CustomNode, NodeProps } from "../../../src/shared-types";
import { sendToServer } from "./sendToServer";
import { atom, useAtom } from "jotai";
import { useReactFlow } from "@xyflow/react";

export const highlightedNodeAtom = atom<string | null>(null);

export function useNodeNavigation(renderedNodes: NodeProps[]) {
	const reactFlow = useReactFlow();
	const [highlightedNodeId, setHighlightedNodeId] =
		useAtom(highlightedNodeAtom);

	const highlightedNode = useMemo(() => {
		return renderedNodes
			.flatMap((n) => n.children)
			.find((n) => n.id === highlightedNodeId);
	}, [highlightedNodeId, renderedNodes]);

	useEffect(() => {
		if (!highlightedNode) return;
		sendToServer({
			type: "highlight-node",
			nodeId: highlightedNode.id,
			filePath: highlightedNode.filePath,
			codeRange: highlightedNode.codeRange,
		});
		try {
			const currentZoom = reactFlow.getViewport().zoom;
			reactFlow.fitView({
				nodes: [{ id: highlightedNode.parentId }],
				maxZoom: currentZoom,
				minZoom: currentZoom,
			});
		} catch (error) {
			console.error("Error fitting view", error);
		}
	}, [highlightedNode, reactFlow]);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!highlightedNode) {
				console.log("no highlightedNodeId");
				return;
			}

			// Get parent node
			const parentNode = renderedNodes.find(
				(node) => node.id === highlightedNode.parentId,
			);

			// Get siblings (nodes with the same parent)
			const siblings = parentNode?.children ?? [];

			// Get current node's index among siblings
			const currentIndex = siblings.findIndex(
				(node) => node.id === highlightedNode.id,
			);

			// Get children of current node
			const children = highlightedNode.children;

			// Handle arrow keys and vim-like bindings
			console.log("event.key", event.key, siblings);
			switch (event.key) {
				case "ArrowDown":
				case "j":
					// Move to next sibling
					if (currentIndex < siblings.length - 1) {
						setHighlightedNodeId(siblings[currentIndex + 1].id);
					}
					break;
				case "ArrowUp":
				case "k":
					// Move to previous sibling
					if (currentIndex > 0) {
						setHighlightedNodeId(siblings[currentIndex - 1].id);
					}
					break;
				case "ArrowLeft":
				case "h":
					// Move to parent
					if (parentNode && parentNode.parentId !== "root") {
						setHighlightedNodeId(parentNode.id);
					}
					break;
				case "ArrowRight":
				case "l":
					// Move to first child
					if (!highlightedNode.expanded) {
						sendToServer({
							type: "node-toggle",
							nodeId: highlightedNode.id,
						});
					}

					if (children.length > 0 && highlightedNode.expanded) {
						setHighlightedNodeId(children[0].id);
					}

					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [highlightedNode, renderedNodes, setHighlightedNodeId]);

	return {
		setHighlightedNodeId,
	};
}
