import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { SITE_URL } from "@/content/stories";

const btn =
  "inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-surface px-2 text-sm font-semibold text-ink transition-colors hover:border-field";

/** Share to X, WhatsApp, or copy the link. `path` is site-relative, e.g. "/stories/danfo-13". */
export function ShareButtons({ path, text }: { path: string; text: string }) {
  const url = `${SITE_URL}${path}`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Share this story</p>
      <div className="mt-3 flex gap-2">
        <a
          className={btn}
          href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          X
        </a>
        <a
          className={btn}
          href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
        <button type="button" className={btn} onClick={() => void copy()}>
          {copied ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Link2 className="size-4" aria-hidden />
          )}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
