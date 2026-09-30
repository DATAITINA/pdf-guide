export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * Workspace preview vs deployed app. The deployer writes GROK_PROJECT_ID on
 * every publish; the sandbox preview never has it. Single source of truth for
 * the split — gate audience, gate endpoints and connector-token semantics all
 * key off this predicate.
 */
export function isWorkspacePreview(): boolean {
  return !env("GROK_PROJECT_ID");
}

/** Test-only purchases must never be enabled on a deployed storefront. */
export function isDemoCheckoutEnabled(
  runtime: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return (
    runtime.NODE_ENV !== "production" &&
    !runtime.VERCEL &&
    !runtime.VERCEL_ENV &&
    !runtime.GROK_PROJECT_ID
  );
}
