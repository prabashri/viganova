// ==============================
// File: src/components/navigation/headerVariants.ts
// Centralized class maps for Header styling
// ==============================
export type HeaderMode =
  | "default"
  | "glassy"
  | "transparent"
  | "primary-lighter-x"
  | "primary-lighter"
  | "primary-darker"
  | "primary-darker-x"
  | "base-00"
  | "base-90"
  | "custom";

export type HeaderWidth = "fullwidth" | "sitewidth";
export type HeaderPosition = "static" | "sticky" | "fixed";
export type HeaderSeparator = "none" | "shadow" | "border";

export const MODE_HEADER: Record<HeaderMode, string> = {
  default: "",
  glassy: "bg-transparent backdrop-blur",
  transparent: "bg-transparent",
  "primary-lighter-x": "bg-primary-lighter-x col-base-100",
  "primary-lighter": "bg-primary-lighter col-base-100",
  "primary-darker": "bg-primary-darker col-base-00",
  "primary-darker-x": "bg-primary-darker-x col-base-00",
  "base-00": "bg-base-00 col-base-100",
  "base-90": "bg-base-90 col-base-00",
  custom: "",
};

export const MODE_NAV: Record<HeaderMode, string> = {
  default: "",
  glassy: "big-bg-glass big-border-glass big-box-shadow",
  transparent: "bg-transparent",
  "primary-lighter-x": "bg-primary-lighter-x col-base-100",
  "primary-lighter": "bg-primary-lighter col-base-100",
  "primary-darker": "bg-primary-darker col-base-00",
  "primary-darker-x": "bg-primary-darker-x col-base-00",
  "base-00": "bg-base-00 col-base-100",
  "base-90": "bg-base-90 col-base-00",
  custom: "",
};

export const POSITION: Record<HeaderPosition, string> = {
  static: "",
  sticky: "sticky top-0 z-100",
  fixed: "fixed top-0 left-0 w-100p z-100",
};

export const SEPARATOR: Record<HeaderSeparator, string> = {
  none: "box-shadow-bottom", // your existing subtle separator
  shadow: "shadow-md",
  border: "border-b border-gray-200",
};

export function headerContainer({
  mode,
  width,
  position,
  separator,
}: {
  mode: HeaderMode;
  width: HeaderWidth;
  position: HeaderPosition;
  separator: HeaderSeparator;
}): string {
  const base = "flex flex-col ai-center jc-center gap-05 mx-auto px-1 py-05 min-h-70px overflow-anchor-none";
  return [
    base,
    MODE_HEADER[mode],
    POSITION[position],
    SEPARATOR[separator],
    width === "sitewidth" ? "w-site" : "w-100p",
  ].filter(Boolean).join(" ");
}

export function navPanel(mode: HeaderMode): string {
  return MODE_NAV[mode];
}

