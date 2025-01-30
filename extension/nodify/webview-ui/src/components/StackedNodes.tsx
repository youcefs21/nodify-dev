import type { CustomData } from "@nodify/schema";
import { AbstractNode } from "./AbstractNode";

export function StackedNodes({ data }: { data: CustomData }) {
	return (
		<div className="p-3 bg-transparent rounded-lg">
			{(() => {
				if (data.id === "-2") return null;

				return (
					<div
						key={`${data.children[0].id}-root`}
						className="box-border border-t border-crust"
					>
						<AbstractNode
							data={data}
							iconName={data.icon}
							iconBackgroundColor={data.iconBackgroundColor}
						/>
					</div>
				);
			})()}
			{data.children.map((n) => {
				return (
					<div key={n.id} className="pl-4">
						<AbstractNode
							data={n}
							iconName={n.icon}
							iconBackgroundColor={n.iconBackgroundColor}
						/>
					</div>
				);
			})}
		</div>
	);
}
