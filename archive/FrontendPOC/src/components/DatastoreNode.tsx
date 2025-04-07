import { Database } from "lucide-react";
import { AbstractNode } from "./AbstractNode";
import type { CustomData } from "./nodes.schema";

export function DatastoreNode({ data }: { data: CustomData }) {
	return <AbstractNode data={data} className="bg-blue-800" Icon={Database} />;
}
