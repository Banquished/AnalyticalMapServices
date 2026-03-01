import { AlertCircle } from "lucide-react";
import type { FeatureInfoEntry } from "../domain/featureInfoTypes";
import type { SelectedProperty } from "../stores/propertySelection.store";
import { ActivePropertyHeader } from "./ActivePropertyHeader";
import { GenereltTab } from "./GenereltTab";
import { KlimaTab } from "./KlimaTab";
import { MiljoTab } from "./MiljoTab";
import { PropertyTable } from "./PropertyTable";
import { RisikoTab } from "./RisikoTab";
import { TabEmptyState } from "./TabEmptyState";

type Props = {
	tabId: string;
	activeItem: { item: SelectedProperty; index: number } | null;
	featureInfo: FeatureInfoEntry | undefined;
	selected: SelectedProperty[];
	highlightedKey: string | null;
	activeKey: string | null;
	removeByKey: (key: string) => void;
	moveUp: (index: number) => void;
	moveDown: (index: number) => void;
	onHighlight: (key: string | null) => void;
	onSetActive: (key: string) => void;
};

export function FeatureInfoTabs({
	tabId,
	activeItem,
	featureInfo,
	selected,
	highlightedKey,
	activeKey,
	removeByKey,
	moveUp,
	moveDown,
	onHighlight,
	onSetActive,
}: Props) {
	switch (tabId) {
		case "eiendommer":
			return (
				<PropertyTable
					items={selected}
					highlightedKey={highlightedKey}
					activeKey={activeKey}
					onRemove={removeByKey}
					onMoveUp={moveUp}
					onMoveDown={moveDown}
					onHighlight={onHighlight}
					onSetActive={onSetActive}
				/>
			);
		case "generelt":
			if (!activeItem) return <TabEmptyState />;
			return (
				<div>
					<ActivePropertyHeader
						item={activeItem.item}
						index={activeItem.index}
					/>
					{featureInfo?.status === "loading" && (
						<div className="fi-loading">
							<i className="sweco-spinner" aria-hidden="true" />
							<span>Henter eiendomsdata…</span>
						</div>
					)}
					{featureInfo?.status === "error" && (
						<div className="fi-error">
							<AlertCircle size={14} />
							<span>{featureInfo.error}</span>
						</div>
					)}
					{featureInfo?.status === "loaded" && (
						<GenereltTab data={featureInfo.data.generelt} />
					)}
				</div>
			);
		case "klima":
			if (!activeItem) return <TabEmptyState />;
			return (
				<div>
					<ActivePropertyHeader
						item={activeItem.item}
						index={activeItem.index}
					/>
					{featureInfo?.status === "loading" && (
						<div className="fi-loading">
							<i className="sweco-spinner" aria-hidden="true" />
							<span>Henter klimadata…</span>
						</div>
					)}
					{featureInfo?.status === "error" && (
						<div className="fi-error">
							<AlertCircle size={14} />
							<span>{featureInfo.error}</span>
						</div>
					)}
					{featureInfo?.status === "loaded" &&
						featureInfo.data.klima && (
							<KlimaTab
								data={featureInfo.data.klima}
								kvikkleire={featureInfo.data.risiko?.kvikkleire ?? null}
							/>
						)}
				</div>
			);
		case "risiko":
			if (!activeItem) return <TabEmptyState />;
			return (
				<div>
					<ActivePropertyHeader
						item={activeItem.item}
						index={activeItem.index}
					/>
					{featureInfo?.status === "loading" && (
						<div className="fi-loading">
							<i className="sweco-spinner" aria-hidden="true" />
							<span>Henter risikodata…</span>
						</div>
					)}
					{featureInfo?.status === "error" && (
						<div className="fi-error">
							<AlertCircle size={14} />
							<span>{featureInfo.error}</span>
						</div>
					)}
					{featureInfo?.status === "loaded" &&
						featureInfo.data.risiko && (
							<RisikoTab data={featureInfo.data.risiko} />
						)}
				</div>
			);
		case "miljo":
			if (!activeItem) return <TabEmptyState />;
			return (
				<div>
					<ActivePropertyHeader
						item={activeItem.item}
						index={activeItem.index}
					/>
					{featureInfo?.status === "loading" && (
						<div className="fi-loading">
							<i className="sweco-spinner" aria-hidden="true" />
							<span>Henter miljødata…</span>
						</div>
					)}
					{featureInfo?.status === "error" && (
						<div className="fi-error">
							<AlertCircle size={14} />
							<span>{featureInfo.error}</span>
						</div>
					)}
					{featureInfo?.status === "loaded" && (
						<MiljoTab
							kulturminner={featureInfo.data.risiko?.kulturminner ?? null}
							stoy={featureInfo.data.risiko?.stoy ?? null}
							naturvern={featureInfo.data.risiko?.naturvern ?? null}
							grunnforurensning={
								featureInfo.data.risiko?.grunnforurensning ?? null
							}
						/>
					)}
				</div>
			);
		default:
			return null;
	}
}
