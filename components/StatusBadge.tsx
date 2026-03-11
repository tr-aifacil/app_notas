type StatusBadgeProps = {
  status?: string | null;
};

const getStatusConfig = (status?: string | null) => {
  if (status === "ativo") {
    return {
      label: "Ativo",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
    };
  }

  return {
    label: "Concluído",
    className: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"
  };
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
