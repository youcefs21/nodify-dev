import { AbstractNode } from "./AbstractNode";
import type { CustomData } from "./nodes.schema";

import { Split } from "lucide-react";

const ExpressionNode = ({ data }: { data: CustomData }) => {
	return (
		<AbstractNode
			data={data}
			Icon={Split} // Using ChevronRight as an example icon
			className="bg-amber-500"
		/>
	);
};

export default ExpressionNode;
