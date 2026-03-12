import { prettyLabel } from "@/lib/episodes/analytics";
import { getClassificationLabel } from "@/lib/episodes/classification";

type Props = {
  bodyRegion?: string | null;
  conditionType?: string | null;
  conditionChronicity?: string | null;
  caseType?: string | null;
  laterality?: string | null;
  analyticsIncluded?: boolean | null;
  showLaterality?: boolean;
};

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{label}</span>;
}

export default function EpisodeClassificationBadges({
  bodyRegion,
  conditionType,
  conditionChronicity,
  caseType,
  laterality,
  analyticsIncluded,
  showLaterality = false,
}: Props) {
  const badges = [
    bodyRegion ? getClassificationLabel("body_region", bodyRegion, prettyLabel) : null,
    conditionType ? getClassificationLabel("condition_type", conditionType, prettyLabel) : null,
    conditionChronicity ? getClassificationLabel("condition_chronicity", conditionChronicity, prettyLabel) : null,
    caseType ? getClassificationLabel("case_type", caseType, prettyLabel) : null,
    showLaterality && laterality ? getClassificationLabel("laterality", laterality, prettyLabel) : null,
  ].filter(Boolean) as string[];

  if (!badges.length && analyticsIncluded !== false) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {badges.map((item, index) => (
        <Badge key={`${item}-${index}`} label={item} />
      ))}
      {analyticsIncluded === false && (
        <span className="text-xs text-slate-500">Excluído das métricas de recovery</span>
      )}
    </div>
  );
}
