import type { Faq } from "./types";

/**
 * Answers about the personal guide. Shown before the store's own FAQs
 * (which the owner edits in Publisher → Settings) on the home and FAQ pages.
 */
export const PERSONAL_GUIDE_FAQS: Faq[] = [
  {
    id: "personal-what",
    question: "What is a personal guide?",
    answer:
      "A short, practical guide written for your situation, not a general one. You tell us what’s going on, we ask a few questions on WhatsApp, then we write clear steps you can follow at home or at work.",
    sortOrder: -3,
    published: true,
  },
  {
    id: "personal-price",
    question: "How much does a personal guide cost?",
    answer:
      "It depends on your situation and how much help you need. We tell you the price on WhatsApp before you pay anything, and you decide from there.",
    sortOrder: -2,
    published: true,
  },
  {
    id: "personal-check-ins",
    question: "How do check-ins work?",
    answer:
      "After you get your guide, we message you on WhatsApp to see how it’s going. If something isn’t working, we talk it through and adjust the guide with you.",
    sortOrder: -1,
    published: true,
  },
];
