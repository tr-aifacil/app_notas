
export function toAnalyticsSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function buildAnalyticsLabel(fields: {
  bodyRegion?: string | null;
  conditionType?: string | null;
  conditionChronicity?: string | null;
}) {
  const parts = [fields.bodyRegion, fields.conditionType, fields.conditionChronicity]
    .map((part) => (part ? toAnalyticsSlug(part) : ""))
    .filter(Boolean);

  return parts.length ? parts.join("_") : null;
}

export function isRecoveryAnalyticsIncluded(caseType: string | null | undefined) {
  return caseType === "novo_caso";
}

export function prettyLabel(value: string | null | undefined) {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
