// src/config/globalScripts.ts
import type { ScriptRequest, ScriptPosition } from "@/utils/scriptRegistry";

/**
 * Put your always-on scripts here (don’t worry about duplicates:
 * registry uses a stable key and will overwrite on same identity+flags).
 */
export const globalHeadScripts: ScriptRequest[] = [
  // example:
  // { name: "critical-polyfill", src: "/scripts/critical-polyfill.js", position: "head", priority: -10, defer: false, async: false, module: false }
];

export const globalFooterScripts: ScriptRequest[] = [
  // example:
  { name: "analytics-consent-handler", position: "footer", priority: -10, module: true, defer: true },
  { name: "header-menu-theme", position: "footer", priority: -9, module: true, defer: true },
  // { name: "app", src: "/scripts/app.js", position: "footer", priority: 0, module: true, defer: true }
];

/** convenience (optional) */
export function getGlobalScripts(position: ScriptPosition) {
  return position === "head" ? globalHeadScripts : globalFooterScripts;
}
