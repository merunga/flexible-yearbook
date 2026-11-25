export const GROUPS = [
  { slug: "5-6", name: "5 y 6 años", tone: "sun" },
  { slug: "7-9", name: "7 a 9 años", tone: "mint" },
  { slug: "9-13", name: "9 a 13 años", tone: "sky" },
] as const;

export type GroupSlug = (typeof GROUPS)[number]["slug"];

export function findGroup(slug: string) {
  return GROUPS.find((g) => g.slug === slug);
}

export const toneClass: Record<string, string> = {
  sun: "bg-sun text-sun-foreground",
  mint: "bg-mint text-mint-foreground",
  sky: "bg-sky text-sky-foreground",
};
