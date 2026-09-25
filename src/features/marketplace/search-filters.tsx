import type { ProductFacets } from "@/lib/search/catalog-search";
import { EDITION_FILTERS, PRODUCT_SORT_LABELS, PRODUCT_SORTS, type ProductQuery } from "@/lib/search/query";
import { EDITION_LABELS } from "@/lib/labels";
import type { Category } from "@/types/domain";
import { AutoSubmitForm } from "./auto-submit";

function Group({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line py-4">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
        {title}
        <span aria-hidden className="text-ink-3 transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function Check({ name, value, checked, label, count }: { name: string; value: string; checked: boolean; label: string; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="h-4 w-4 accent-ink" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="font-mono text-xs text-ink-3">{count}</span>}
    </label>
  );
}

function Select({
  name,
  value,
  label,
  options,
  resets,
}: {
  name: string;
  value?: string;
  label: string;
  options: { value: string; label: string; count?: number }[];
  resets?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={value ?? ""} data-resets={resets} className="h-10 w-full rounded-card border border-line bg-paper px-2">
        <option value="">Toutes</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
            {o.count !== undefined ? ` (${o.count})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Filtres de recherche produits : formulaire GET, partageable par URL. */
export function SearchFilters({ query, facets, categories }: { query: ProductQuery; facets: ProductFacets; categories: Category[] }) {
  const catLabel = new Map(categories.map((c) => [c.slug, c.label]));
  const current = categories.find((c) => c.slug === query.category);
  return (
    <AutoSubmitForm action="/explorer" method="get" aria-label="Filtres">
      {query.q && <input type="hidden" name="q" value={query.q} />}
      {query.sort !== "relevance" && <input type="hidden" name="tri" value={query.sort} />}

      <Group title="Catégorie">
        <div className="space-y-3">
          <Select name="categorie" value={query.category} label="Catégorie" resets="sous_categorie" options={facets.categories.map((c) => ({ value: c.value, label: catLabel.get(c.value as Category["slug"]) ?? c.value, count: c.count }))} />
          {current && <Select name="sous_categorie" value={query.subcategory} label="Sous-catégorie" options={current.subcategories.map((s) => ({ value: s.slug, label: s.label }))} />}
        </div>
      </Group>

      <Group title="Disponibilité">
        <Check name="disponible" value="1" checked={query.availableOnly} label="Disponible maintenant" />
        {EDITION_FILTERS.map((e) => (
          <Check key={e} name="edition" value={e} checked={query.editions.includes(e)} label={EDITION_LABELS[e]} />
        ))}
      </Group>

      <Group title="Prix">
        <div className="flex items-center gap-2 text-sm">
          <label className="flex-1">
            <span className="sr-only">Prix minimum</span>
            <input type="number" name="prix_min" min={0} inputMode="numeric" placeholder={`${facets.priceRange.min} €`} defaultValue={query.minPrice} className="h-10 w-full rounded-card border border-line bg-paper px-2" />
          </label>
          <span aria-hidden>—</span>
          <label className="flex-1">
            <span className="sr-only">Prix maximum</span>
            <input type="number" name="prix_max" min={0} inputMode="numeric" placeholder={`${facets.priceRange.max} €`} defaultValue={query.maxPrice} className="h-10 w-full rounded-card border border-line bg-paper px-2" />
          </label>
        </div>
      </Group>

      {facets.sizes.length > 0 && (
        <Group title="Taille">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => (
              <label key={s.value} className="cursor-pointer">
                <input type="checkbox" name="taille" value={s.value} defaultChecked={query.sizes.includes(s.value)} className="peer sr-only" />
                <span className="grid h-9 min-w-11 place-items-center rounded-full border border-line px-3 text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-signature">
                  {s.value}
                </span>
              </label>
            ))}
          </div>
        </Group>
      )}

      <Group title="Couleur" open={query.colors.length > 0}>
        {facets.colors.map((c) => (
          <Check key={c.value} name="couleur" value={c.value} checked={query.colors.includes(c.value)} label={c.label} count={c.count} />
        ))}
      </Group>

      <Group title="Matière" open={query.materials.length > 0}>
        {facets.materials.map((m) => (
          <Check key={m.value} name="matiere" value={m.value} checked={query.materials.includes(m.value)} label={m.label} count={m.count} />
        ))}
      </Group>

      <Group title="Créateur, école, ville" open={!!(query.creator || query.school || query.city)}>
        <div className="space-y-3">
          <Select name="createur" value={query.creator} label="Créateur" options={facets.creators} />
          <Select name="ecole" value={query.school} label="École" options={facets.schools} />
          <Select name="ville" value={query.city} label="Ville" options={facets.cities.map((c) => ({ value: c.value, label: c.value, count: c.count }))} />
        </div>
      </Group>

      <div className="sticky bottom-0 flex gap-2 bg-paper py-4 lg:static">
        <button type="submit" className="h-11 flex-1 rounded-full bg-ink text-sm font-medium text-paper">
          Appliquer
        </button>
        <a href={query.q ? `/explorer?q=${encodeURIComponent(query.q)}` : "/explorer"} className="grid h-11 place-items-center rounded-full border border-line px-4 text-sm">
          Effacer
        </a>
      </div>
    </AutoSubmitForm>
  );
}

export function SortForm({ query }: { query: ProductQuery }) {
  return (
    <AutoSubmitForm action="/explorer" method="get" className="flex items-center gap-2">
      {[...buildHidden(query)].map(([k, v], i) => (
        <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor="tri" className="text-sm text-ink-3">
        Trier
      </label>
      <select id="tri" name="tri" defaultValue={query.sort} className="h-10 rounded-full border border-line bg-paper px-3 text-sm">
        {PRODUCT_SORTS.map((s) => (
          <option key={s} value={s}>
            {PRODUCT_SORT_LABELS[s]}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="h-10 rounded-full border border-line px-3 text-sm">
          OK
        </button>
      </noscript>
    </AutoSubmitForm>
  );
}

/** Paramètres actuels hors tri et page, pour les champs cachés. */
function buildHidden(q: ProductQuery): [string, string][] {
  const out: [string, string][] = [];
  if (q.q) out.push(["q", q.q]);
  if (q.category) out.push(["categorie", q.category]);
  if (q.subcategory) out.push(["sous_categorie", q.subcategory]);
  if (q.minPrice !== undefined) out.push(["prix_min", String(q.minPrice)]);
  if (q.maxPrice !== undefined) out.push(["prix_max", String(q.maxPrice)]);
  q.sizes.forEach((v) => out.push(["taille", v]));
  q.colors.forEach((v) => out.push(["couleur", v]));
  q.materials.forEach((v) => out.push(["matiere", v]));
  if (q.creator) out.push(["createur", q.creator]);
  if (q.school) out.push(["ecole", q.school]);
  if (q.city) out.push(["ville", q.city]);
  q.editions.forEach((v) => out.push(["edition", v]));
  if (q.availableOnly) out.push(["disponible", "1"]);
  return out;
}
