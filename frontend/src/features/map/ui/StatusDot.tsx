import type { DotStatus } from "../hooks/useTabStatuses";

type Props = { s: DotStatus };

export function StatusDot({ s }: Props) {
	if (s === "none") return null;
	const cls = {
		pass: "bg-success",
		warn: "bg-warning",
		fail: "bg-danger",
		loading: "bg-text-muted animate-pulse",
	}[s];
	return (
		<span className={`inline-block h-1.5 w-1.5 rounded-full ${cls} shrink-0`} />
	);
}
