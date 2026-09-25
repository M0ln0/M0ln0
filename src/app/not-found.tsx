import { ButtonLink, Container } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="mt-4 font-display text-display">Page introuvable.</h1>
      <p className="mx-auto mt-6 max-w-md text-ink-2">Cette page n&apos;existe pas ou plus. La pièce a peut-être trouvé preneur.</p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/explorer">Explorer</ButtonLink>
        <ButtonLink href="/createurs" variant="outline">
          Les créateurs
        </ButtonLink>
      </div>
    </Container>
  );
}
