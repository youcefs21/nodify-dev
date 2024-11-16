import type { CustomNode, NodeTypes, output } from "../components/nodes.schema";

export function AbstractionLevelOneNodeMapper(output: output[]): CustomNode[] {
	// Map the output nodes recursively, starting with depth 1
	return output.map((node) => mapSingleNode(node, 1));
}

// Helper function to map a single node to CustomNode
function mapSingleNode(node: output, depth: number): CustomNode {
	const nodeType: NodeTypes = mapNodeType(node.type);

	return {
		id: `${node.groupID}`,
		data: {
			id: `${node.groupID}`,
			label: node.label,
			idRange: node.idRange,
			children: node.children
				? node.children.map((child) => {
						const childNode = mapSingleNode(child, depth + 1);
						return {
							...childNode.data,
							position: childNode.position,
						};
					})
				: [],
			reversed: false,
			active: true,
			disabled: false,
		},
		type: nodeType,
		position: { x: 300 * depth, y: 0 },
	};
}

// Helper function to map node type to NodeTypes enum
function mapNodeType(type: string): NodeTypes {
	switch (type) {
		case "function_call":
			return "function";
		case "expression":
			return "expression";
		case "event_handler_setup":
			return "event";
		case "loop":
			return "loop";
		case "conditional":
			return "condition";
		default:
			throw new Error(
				`Unknown node type: ${type}. Please check the input data.`,
			);
	}
}
