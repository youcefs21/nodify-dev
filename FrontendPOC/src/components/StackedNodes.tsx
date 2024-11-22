import { type CustomData, nodeTypes } from "./nodes.schema";
import { AbstractNode } from "./AbstractNode";
import { Variable } from "lucide-react";

export function StackedNodes({ data }: { data: CustomData }) {
	return (
		<div className="flex flex-col">
			<div className="bg-transparent rounded-lg p-2 overflow-hidden flex flex-col">
				{(() => {
					if (data.id === "-2") return null;

					const nodeData = {
						label: data.label,
						id: `${data.children[0].id}-root`,
						hasChildren: false,
						idRange: data.idRange,
						children: [],
						reversed: false,
						active: false,
						disabled: false,
						type: data.type,
					} satisfies CustomData;

					const Component = nodeTypes[nodeData.type];
					return <Component key={nodeData.id} data={nodeData} />;
				})()}
				<div className="pl-4 flex flex-col">
					{data.children.map((n) => {
						const Component = nodeTypes[n.type];

						return <Component key={n.id} data={n} />;
					})}
				</div>
			</div>
		</div>
	);
}
