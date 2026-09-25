"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, FormEvent } from "react";

/**
 * Formulaire GET amélioré :
 * - se soumet dès qu'un choix change (pas pendant une saisie de texte ou de nombre) ;
 * - retire les paramètres vides pour garder des URL propres et partageables ;
 * - un champ portant `data-resets="autre_champ"` vide ce champ quand il change.
 * Sans JavaScript, c'est un formulaire GET classique avec son bouton « Appliquer ».
 */
export function AutoSubmitForm({ action, ...props }: ComponentProps<"form"> & { action: string }) {
  const router = useRouter();

  function navigate(form: HTMLFormElement) {
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(form)) {
      if (typeof v === "string" && v.trim() !== "") params.append(k, v.trim());
    }
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action, { scroll: false });
  }

  return (
    <form
      {...props}
      action={action}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        navigate(e.currentTarget);
      }}
      onChange={(e) => {
        const target = e.target as unknown as HTMLInputElement | HTMLSelectElement;
        const resets = target.dataset.resets;
        if (resets) {
          const other = e.currentTarget.elements.namedItem(resets);
          if (other instanceof HTMLSelectElement || other instanceof HTMLInputElement) other.value = "";
        }
        if (target instanceof HTMLInputElement && ["text", "search", "number"].includes(target.type)) return;
        navigate(e.currentTarget);
      }}
    />
  );
}
