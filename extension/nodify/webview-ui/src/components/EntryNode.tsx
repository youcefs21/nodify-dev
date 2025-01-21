import { AbstractNode } from "./AbstractNode";
import type { CustomData } from "./nodes.schema";

import { LogIn } from "lucide-react";

const EntryNode = ({ data }: { data: CustomData }) => {
	return (
		<AbstractNode
			data={data}
			Icon={LogIn} // Using ChevronRight as an example icon
			className="bg-lime-500"
		/>
	);
};

export default EntryNode;
