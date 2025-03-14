import { Book, FileText, LogIn, Play, Settings2, Unplug } from "lucide-react";
import { cn } from "../utils/cn";

export const TypeIconMap = {
	main: () => (
		<div className={cn("p-2 rounded-lg bg-green [&>*]:stroke-mantle")}>
			<LogIn className="size-5" />
		</div>
	),
	documentation: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<Book className="size-5" />
		</div>
	),
	utility: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<Unplug className="size-5" />
		</div>
	),
	data_processor: () => (
		<div className={cn("p-2 rounded-lg bg-flamingo [&>*]:stroke-mantle")}>
			<FileText className="size-5" />
		</div>
	),
	initialization: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Settings2 className="size-5" />
		</div>
	),
	preparation: () => (
		<div className={cn("p-2 rounded-lg bg-peach [&>*]:stroke-mantle")}>
			<FileText className="size-5" />
		</div>
	),
	execution: () => (
		<div className={cn("p-2 rounded-lg bg-green [&>*]:stroke-mantle")}>
			<Play className="size-5" />
		</div>
	),
};
