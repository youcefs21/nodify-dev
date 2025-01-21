import { AbstractNode } from "./AbstractNode";
import type { CustomData } from "./nodes.schema";

import { Repeat2 } from "lucide-react";

const LoopNode = ({ data }: { data: CustomData }) => {
	return (
		<AbstractNode
			data={data}
			Icon={Repeat2} // Using ChevronRight as an example icon
			className="bg-teal-500"
		/>
	);
};

export default LoopNode;
