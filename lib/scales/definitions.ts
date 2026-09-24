export type ScaleType = "END" | "DASH" | "QuickDASH" | "KOOS" | "NDI" | "RolandMorris";
export type ScoreFormat = "points_10" | "points_100" | "points_50" | "points_24" | "percent_100";
export type KoosSubscale = "pain" | "symptoms" | "adl" | "sport" | "qol";

export const SCALE_LABELS: Record<ScaleType, string> = {
  END: "END (dor)",
  DASH: "DASH",
  QuickDASH: "QuickDASH",
  KOOS: "KOOS",
  NDI: "NDI",
  RolandMorris: "Roland-Morris"
};

export const KOOS_SUBSCALES: Record<KoosSubscale, string> = {
  pain: "Dor",
  symptoms: "Sintomas",
  adl: "Atividades diárias",
  sport: "Desporto e recreação",
  qol: "Qualidade de vida"
};

export function scaleFormat(type: ScaleType, ndiFormat: "points_50" | "percent_100" = "points_50"): ScoreFormat {
  if (type === "END") return "points_10";
  if (type === "NDI") return ndiFormat;
  if (type === "RolandMorris") return "points_24";
  return "points_100";
}

export function validateScale(type: ScaleType, format: ScoreFormat, value: number, koosSubscale: string): string | null {
  if (!Number.isFinite(value)) return "Introduz um valor numérico válido.";
  if (type === "KOOS" && !Object.keys(KOOS_SUBSCALES).includes(koosSubscale)) return "Escolhe a subescala KOOS.";
  if (type !== "KOOS" && koosSubscale) return "Esta escala não usa subescalas KOOS.";
  if (type === "END" && format === "points_10" && value >= 0 && value <= 10) return null;
  if (["DASH", "QuickDASH", "KOOS"].includes(type) && format === "points_100" && value >= 0 && value <= 100) return null;
  if (type === "NDI" && ((format === "points_50" && Number.isInteger(value) && value >= 0 && value <= 50)
    || (format === "percent_100" && value >= 0 && value <= 100))) return null;
  if (type === "RolandMorris" && format === "points_24" && Number.isInteger(value) && value >= 0 && value <= 24) return null;
  return "A pontuação não corresponde ao intervalo ou formato desta escala.";
}

export function scoreUnit(format: string | null): string {
  if (format === "percent_100") return "%";
  if (format === "points_10") return "/10";
  if (format === "points_50") return "/50 pontos";
  if (format === "points_24") return "/24 pontos";
  if (format === "points_100") return "/100 pontos";
  return "(formato anterior por confirmar)";
}
