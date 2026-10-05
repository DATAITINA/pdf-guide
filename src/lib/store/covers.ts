/**
 * Responsive sources for a cover. Bundled covers (/covers/name.jpg) have WebP
 * copies at 400 and 800px wide; uploaded covers are served as they are.
 */
export function coverSources(url: string): { src: string; srcSet?: string } {
  const match = /^\/covers\/([a-z0-9-]+)\.jpg$/.exec(url);
  if (!match) return { src: url };
  const name = match[1];
  return {
    src: `/covers/${name}-800.webp`,
    srcSet: `/covers/${name}-400.webp 400w, /covers/${name}-800.webp 800w`,
  };
}
