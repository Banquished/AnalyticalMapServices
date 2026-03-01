/* ------------------------------------------------------------------ */
/*  TabEmptyState — shown when no property is active in analysis tabs   */
/* ------------------------------------------------------------------ */

type Props = {
	message?: string;
};

import { MousePointer } from "lucide-react";

export function TabEmptyState({
	message = "Velg en eiendom for å se informasjon",
}: Props) {
	return (
		<div className="tab-empty-state">
			<MousePointer size={32} className="tab-empty-state__icon" />
			<p>{message}</p>
		</div>
	);
}
