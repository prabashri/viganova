// utils/scriptRegistry.ts
export type ScriptPosition = "head" | "footer";

export type ReferrerPolicy =
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

export type ScriptRequest = {
  name?: string;
  src?: string;

  module?: boolean;
  async?: boolean;
  defer?: boolean;
  nomodule?: boolean;

  id?: string;
  integrity?: string;
  crossOrigin?: "" | "anonymous" | "use-credentials";
  referrerPolicy?: ReferrerPolicy;            // ✅ accept RP
  data?: Record<string, string | number | boolean>;

  position?: ScriptPosition;
  priority?: number;
};

const _set = new Map<string, ScriptRequest>();

function keyOf(req: ScriptRequest): string {
  const id = req.name ? `name:${req.name}` : `src:${req.src ?? ""}`;
  const flags = [
    req.position ?? "footer",
    req.module === false ? "m0" : "m1",
    req.async ? "a1" : "a0",
    req.defer === false ? "d0" : "d1",
    req.nomodule ? "nm1" : "nm0",
  ].join("|");
  return `${id}|${flags}`;
}

export function sanitizeReferrerPolicy(rp?: string | null): ReferrerPolicy | undefined {
  if (!rp) return undefined;
  const ok = new Set<ReferrerPolicy>([
    "no-referrer",
    "no-referrer-when-downgrade",
    "origin",
    "origin-when-cross-origin",
    "same-origin",
    "strict-origin",
    "strict-origin-when-cross-origin",
    "unsafe-url",
  ]);
  return ok.has(rp as ReferrerPolicy) ? (rp as ReferrerPolicy) : undefined;
}

export function registerScript(req: ScriptRequest) {
  const normalized: ScriptRequest = {
    position: "footer",
    priority: 0,
    module: req.nomodule ? false : (req.module ?? true),
    async: req.async ?? false,
    defer: req.async ? false : (req.defer ?? true),
    ...req,
    referrerPolicy: sanitizeReferrerPolicy(req.referrerPolicy),
  };
  _set.set(keyOf(normalized), normalized);
}

export function getRegisteredScripts(position: ScriptPosition) {
  return Array.from(_set.values())
    .filter(r => (r.position ?? "footer") === position)
    .sort((a,b) => (a.priority ?? 0) - (b.priority ?? 0) || (a.name ?? a.src ?? "").localeCompare(b.name ?? b.src ?? ""));
}

export function clearScriptRegistry() { _set.clear(); }
