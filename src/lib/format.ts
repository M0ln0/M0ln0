import type { Cents } from "@/types/domain";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euroRound = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
const dateLong = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const monthYear = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

/** 12900 → « 129 € » ; 12950 → « 129,50 € ». */
export function formatPrice(cents: Cents): string {
  return cents % 100 === 0 ? euroRound.format(cents / 100) : euro.format(cents / 100);
}

export function formatCount(n: number): string {
  return compact.format(n);
}

export function formatDate(iso: string): string {
  return dateLong.format(new Date(iso));
}

export function formatMonthYear(iso: string): string {
  return monthYear.format(new Date(iso));
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${formatCount(n)} ${n > 1 ? plural : singular}`;
}
