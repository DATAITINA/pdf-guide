import type { TocItem } from "./types";

export function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter(Boolean);
    } catch {
      return value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function parseToc(value: unknown): TocItem[] {
  if (!value) return [];
  let raw: unknown = value;
  if (typeof value === "string") {
    try {
      raw = JSON.parse(value);
    } catch {
      return value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((title) => ({ title }));
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return { title: item };
    if (item && typeof item === "object") {
      const rec = item as { title?: unknown; children?: unknown };
      return {
        title: String(rec.title ?? ""),
        children: Array.isArray(rec.children)
          ? rec.children.map((c) => String(c))
          : undefined,
      };
    }
    return { title: String(item) };
  }).filter((item) => item.title);
}

export function parseSettings(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return {};
}
