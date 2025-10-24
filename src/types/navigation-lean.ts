// ==============================
// File: src/types/navigation-lean.ts
// (Optional) A leaner NavItem with stricter unions to avoid prop bloat
// ==============================
export type IconLocation = "left" | "right" | "none";
export type IconSize = "sm" | "md" | "lg";
export type NavType = "link" | "dropdown" | "mega";


export interface BaseNavItem {
label: string;
href?: string;
title?: string;
ariaLabel?: string;
description?: string;
iconName?: string; // prefer a single icon source
iconLocation?: IconLocation;
iconSize?: IconSize;
className?: string; // escape hatch
}


export interface NavLink extends BaseNavItem {
type: "link";
}


export interface NavDropdown extends BaseNavItem {
type: "dropdown";
content: BaseNavItem[]; // use NavLink for clarity if needed
}


export interface MegaMenuItem {
label: string;
href?: string;
title?: string;
description?: string;
}


export interface MegaColumn {
title: string;
items: MegaMenuItem[];
}


export interface NavMega extends BaseNavItem {
type: "mega";
columns: MegaColumn[];
}


export type NavItem = NavLink | NavDropdown | NavMega;