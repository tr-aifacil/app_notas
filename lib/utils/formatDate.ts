export function formatDatePT(dateLike: string | Date | null | undefined): string {
  if (!dateLike) return "";

  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("pt-PT");
}
