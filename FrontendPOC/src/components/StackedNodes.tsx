import { type CustomData, nodeTypes } from "./nodes.schema";

export function StackedNodes({ data }: { data: CustomData }) {
	return (
		<div className="bg-transparent rounded-lg p-2 overflow-hidden flex flex-col">
			{data.children.map((n) => {
				const Component = nodeTypes[n.type];

				return <Component key={n.id} data={n} />;
			})}
		</div>
	);
}
