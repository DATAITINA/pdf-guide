import { SITE_URL } from "@/content/stories";

/**
 * Title, description and link-preview tags for X, WhatsApp, Facebook and Instagram.
 * Open Graph uses `property=` (what WhatsApp and Facebook read); X reads the `twitter:` tags.
 */
export function storyMeta({
  title,
  description,
  image,
  path,
  noindex,
}: {
  title: string;
  description: string;
  /** Site-relative path to a 1200×630 image, e.g. shareImageSrc(slug). */
  image: string;
  /** Site-relative path of this page, e.g. "/stories/danfo-13". */
  path: string;
  noindex?: boolean;
}) {
  const url = `${SITE_URL}${path}`;
  const imageUrl = `${SITE_URL}${image}`;
  return [
    { title },
    { name: "description", content: description },
    { name: "theme-color", content: "#0b0b0c" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Cairn" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
    ...(noindex ? [{ name: "robots", content: "noindex" }] : []),
  ];
}
