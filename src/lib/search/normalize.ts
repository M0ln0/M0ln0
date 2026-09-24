/** Minuscule, sans accents, ponctuation réduite à des espaces. */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  const n = normalize(value);
  return n ? n.split(" ").filter((t) => t.length > 1 || /\d/.test(t)) : [];
}
