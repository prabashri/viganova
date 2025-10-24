// ==============================
// File: src/utils/cn.ts
// Small class composer with conflict resolution for utility groups
// ==============================
export type ClassValue = string | false | null | undefined | Record<string, boolean> | ClassValue[];


// Groups where "last one wins"; tune the regexes to your utility system
const GROUPS: { name: string; test: RegExp }[] = [
{ name: "bg", test: /\bbg-[^\s]+/ },
{ name: "col", test: /\bcol-[^\s]+/ },
{ name: "text", test: /\btext-[^\s]+/ },
{ name: "w", test: /\bw-(?:site|\d+(?:-\d+)?)\b/ },
{ name: "h", test: /\bh-\d+(?:-\d+)?\b/ },
{ name: "display", test: /\b(?:display-none|block|inline|inline-block|flex|grid|sm-display-inherit)\b/ },
{ name: "order", test: /\border-(?:\d+|first|last)\b|\b(?:sm|md|lg)-order-(?:\d+|first|last)\b/ },
{ name: "position", test: /\b(?:static|relative|absolute|fixed|sticky)\b/ },
{ name: "shadow", test: /\b(?:shadow|shadow-sm|shadow-md|shadow-lg|desktop-box-shadow-bottom|box-shadow-bottom)\b/ },
{ name: "border-b", test: /\bborder-b\b/ },
];


function toArray(input: ClassValue): string[] {
if (!input) return [];
if (typeof input === "string") return input.trim().split(/\s+/).filter(Boolean);
if (Array.isArray(input)) return input.flatMap(toArray);
if (typeof input === "object") return Object.keys(input).filter((k) => (input as Record<string, boolean>)[k]);
return [];
}


export function cn(...values: ClassValue[]): string {
const tokens = values.flatMap(toArray);
const kept: string[] = [];
const lastOfGroup = new Map<string, number>();


tokens.forEach((cls) => {
let matchedGroup: string | null = null;
for (const g of GROUPS) {
if (g.test.test(cls)) { matchedGroup = g.name; break; }
}


if (!matchedGroup) {
kept.push(cls);
return;
}


const prevIndex = lastOfGroup.get(matchedGroup);
if (prevIndex == null) {
lastOfGroup.set(matchedGroup, kept.push(cls) - 1);
} else {
// replace previous with new one (last wins)
kept[prevIndex] = cls;
lastOfGroup.set(matchedGroup, prevIndex);
}
});


// Deduplicate leftover identical classes (preserving order)
const seen = new Set<string>();
return kept.filter((c) => (c && !seen.has(c) && seen.add(c))).join(" ");
}