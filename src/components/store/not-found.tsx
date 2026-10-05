import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CairnStones } from "./cairn-art";
import { RequestGuideLink } from "./blocks";

/**
 * 404. Rendered by the router without page data, so it carries its own
 * light header instead of the full store shell.
 */
export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="border-b border-line/80">
        <div className="page flex h-16 items-center">
          <Link to="/" className="flex min-h-12 items-center gap-3 rounded-md" aria-label="Cairn home">
            <img src="/cairn-mark.svg" alt="" aria-hidden="true" width={36} height={36} className="size-9" />
            <span className="font-display text-2xl leading-none">Cairn</span>
          </Link>
        </div>
      </header>
      <main id="main" className="page-narrow flex flex-1 flex-col justify-center py-16">
        <CairnStones className="size-12 text-accent/70" />
        <p className="eyebrow mt-6">Page not found</p>
        <h1 className="h-section mt-3">This path doesn’t lead anywhere</h1>
        <p className="lead mt-4">
          The link may be old or mistyped. Here are some good places to go instead.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/">Go to the home page</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <RequestGuideLink>
              Request a personal guide <ArrowRight className="size-4" aria-hidden />
            </RequestGuideLink>
          </Button>
        </div>
        <Link to="/guides" className="link link-tap mt-4 self-start">
          Browse ready-made guides
        </Link>
      </main>
    </div>
  );
}
