export type ClassificationOption = {
  value: string;
  label: string;
};

export const BODY_REGION_OPTIONS: ClassificationOption[] = [
  { value: "ombro", label: "Ombro" },
  { value: "cervical", label: "Cervical" },
  { value: "dorsal", label: "Dorsal" },
  { value: "lombar", label: "Lombar" },
  { value: "cotovelo", label: "Cotovelo" },
  { value: "punho_mao", label: "Punho/mão" },
  { value: "anca", label: "Anca" },
  { value: "joelho", label: "Joelho" },
  { value: "tornozelo_pe", label: "Tornozelo/pé" },
  { value: "outra", label: "Outra" },
];

export const CONDITION_TYPE_OPTIONS: ClassificationOption[] = [
  { value: "tendinopatia", label: "Tendinopatia" },
  { value: "entorse", label: "Entorse" },
  { value: "lesao_muscular", label: "Lesão muscular" },
  { value: "lombalgia_inespecifica", label: "Lombalgia inespecífica" },
  { value: "cervicalgia", label: "Cervicalgia" },
  { value: "rigidez", label: "Rigidez" },
  { value: "instabilidade", label: "Instabilidade" },
  { value: "pos_operatorio", label: "Pós-operatório" },
  { value: "dor_patelo_femoral", label: "Dor patelo-femoral" },
  { value: "outra", label: "Outra" },
];

export const CONDITION_CHRONICITY_OPTIONS: ClassificationOption[] = [
  { value: "agudo", label: "Agudo" },
  { value: "subagudo", label: "Subagudo" },
  { value: "cronico", label: "Crónico" },
];

export const CASE_TYPE_OPTIONS: ClassificationOption[] = [
  { value: "novo_caso", label: "Novo caso" },
  { value: "recorrencia", label: "Recorrência" },
  { value: "flare_up", label: "Flare-up" },
  { value: "manutencao", label: "Manutenção" },
  { value: "pos_operatorio", label: "Pós-operatório" },
];

export const LATERALITY_OPTIONS: ClassificationOption[] = [
  { value: "direito", label: "Direito" },
  { value: "esquerdo", label: "Esquerdo" },
  { value: "bilateral", label: "Bilateral" },
  { value: "nao_aplicavel", label: "Não aplicável" },
];

const classificationLabelMaps = {
  body_region: new Map(BODY_REGION_OPTIONS.map((option) => [option.value, option.label])),
  condition_type: new Map(CONDITION_TYPE_OPTIONS.map((option) => [option.value, option.label])),
  condition_chronicity: new Map(CONDITION_CHRONICITY_OPTIONS.map((option) => [option.value, option.label])),
  case_type: new Map(CASE_TYPE_OPTIONS.map((option) => [option.value, option.label])),
  laterality: new Map(LATERALITY_OPTIONS.map((option) => [option.value, option.label])),
};

export function getClassificationLabel(
  key: keyof typeof classificationLabelMaps,
  value: string | null | undefined,
  fallback: (value: string | null | undefined) => string
) {
  if (!value) return "-";
  return classificationLabelMaps[key].get(value) ?? fallback(value);
}

export function hasClassificationOption(options: ClassificationOption[], value: string | null | undefined) {
  if (!value) return false;
  return options.some((option) => option.value === value);
}
