import {
	BetweenHorizontalStart,
	FileInput,
	FileText,
	GitPullRequestClosed,
	Instagram,
	Pause,
	Play,
	ScanText,
	Tags,
	TriangleAlert,
	Unplug,
	type LucideProps,
} from "lucide-react";
import type dynamicIconImports from "lucide-react/dynamicIconImports";

export interface IconProps extends Omit<LucideProps, "ref"> {
	name: keyof typeof dynamicIconImports;
}

const icons = {
	"file-text": FileText,
	tags: Tags,
	play: Play,
	"between-horizontal-start": BetweenHorizontalStart,
	instagram: Instagram,
	"scan-text": ScanText,
	pause: Pause,
	"file-input": FileInput,
	"triangle-alert": TriangleAlert,
	"git-pull-request-closed": GitPullRequestClosed,
	unplug: Unplug,
} as const;

export function Icon({ name, ...props }: IconProps) {
	const Icon = icons[name as keyof typeof icons];

	return <Icon {...props} />;
}
