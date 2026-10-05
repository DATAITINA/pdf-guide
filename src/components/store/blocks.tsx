import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Faq } from "@/lib/store/types";
import { Button } from "@/components/ui/button";
import { CairnStones } from "./cairn-art";

/** Eyebrow + heading + optional lead, the same on every page. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  as: Tag = "h2",
  size = "section",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  as?: "h1" | "h2";
  size?: "display" | "section";
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <Tag className={`${eyebrow ? "mt-3" : ""} ${size === "display" ? "h-display" : "h-section"} text-ink`}>
        {title}
      </Tag>
      {lead ? <p className="lead mt-4">{lead}</p> : null}
    </div>
  );
}

/** Questions and answers as an accordion with 56px rows. */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="accordion">
      {items.map((faq) => (
        <details key={faq.id}>
          <summary>{faq.question}</summary>
          <p>{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

/** Link to the personal-guide request form on the home page, from anywhere. */
export function RequestGuideLink({
  children = "Request a personal guide",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link to="/" hash="request-guide" className={className}>
      {children}
    </Link>
  );
}

/** "Need something made for you?" Shown on guide, about, FAQ, contact and 404 pages. */
export function PersonalGuideCta({ title = "Need something made for you?" }: { title?: string }) {
  return (
    <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex gap-4">
        <CairnStones className="mt-1 size-8 shrink-0 text-accent" />
        <div>
          <h2 className="h-card text-ink">{title}</h2>
          <p className="mt-2 text-muted">
            Tell us your situation. We’ll write a guide for you and check in on WhatsApp. The price is agreed with you
            before you pay.
          </p>
        </div>
      </div>
      <Button asChild size="lg" className="w-full shrink-0 sm:w-auto">
        <RequestGuideLink>
          Request a personal guide <ArrowRight className="size-4" aria-hidden />
        </RequestGuideLink>
      </Button>
    </div>
  );
}
