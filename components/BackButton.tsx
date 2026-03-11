"use client";

import { useRouter } from "next/navigation";

type Props = {
  fallbackHref: string;
  label?: string;
};

export default function BackButton({ fallbackHref, label = "Voltar" }: Props) {
  const router = useRouter();

  const onBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button className="btn-brand-secondary" type="button" onClick={onBack}>
      {label}
    </button>
  );
}
