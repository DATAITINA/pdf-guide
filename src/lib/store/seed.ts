import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSql } from "@/lib/db";
import { DEFAULT_SETTINGS } from "./types";

const PARENTING_ID = "prod_disciplined_child";

async function loadSeedPdf(): Promise<Buffer | null> {
  const candidates = [
    join(process.cwd(), "private/pdfs/how-to-raise-a-disciplined-child.pdf"),
    join(process.cwd(), "attachments/Disciplined_Child_Guide.pdf"),
  ];
  for (const path of candidates) {
    try {
      return await readFile(path);
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function ensureSeeded(): Promise<void> {
  const sql = await getSql();
  const existing = await sql<{ n: number }>`select count(*)::int as n from categories`;
  if ((existing[0]?.n ?? 0) > 0) {
    const file = await sql<{ n: number }>`select count(*)::int as n from product_files where product_id = ${PARENTING_ID}`;
    if ((file[0]?.n ?? 0) === 0) {
      const pdf = await loadSeedPdf();
      if (pdf) {
        await sql.query(
          `insert into product_files (product_id, filename, mime, data, byte_size)
           values ($1,$2,$3,$4,$5)
           on conflict (product_id) do nothing`,
          [PARENTING_ID, "How-to-Raise-a-Disciplined-Child.pdf", "application/pdf", pdf, pdf.length],
        );
      }
    }
    return;
  }

  const categories = [
    ["cat_parenting", "Parenting & Family", "parenting-family", "Practical guides for homes, children and everyday family life.", 1],
    ["cat_relationships", "Relationships", "relationships", "Clear, grounded writing on partnership and communication.", 2],
    ["cat_money", "Money & Personal Finance", "money-personal-finance", "Household money, planning and financial habits.", 3],
    ["cat_business", "Business", "business", "Starting and running small, practical businesses.", 4],
    ["cat_career", "Career & Jobs", "career-jobs", "Work, career decisions and professional habits.", 5],
    ["cat_productivity", "Productivity", "productivity", "Focus, routines and getting important work done.", 6],
    ["cat_lifestyle", "Lifestyle", "lifestyle", "Home rhythm, wellbeing and everyday living.", 7],
    ["cat_education", "Education", "education", "Learning, study habits and school life.", 8],
  ] as const;

  for (const [id, name, slug, description, sort] of categories) {
    await sql`insert into categories (id, name, slug, description, sort_order)
      values (${id}, ${name}, ${slug}, ${description}, ${sort})`;
  }

  const toc = [
    {
      title: "Part I — Foundations",
      children: [
        "Introduction — From shouting to teaching",
        "1. What discipline really means",
        "2. Why children repeat the same behaviours",
        "3. The Calm Parent system",
      ],
    },
    {
      title: "Part II — Building the Structure",
      children: [
        "4. Set clear family rules",
        "5. Stop repeating yourself",
        "6. Consequences without shouting",
      ],
    },
    {
      title: "Part III — Everyday Situations",
      children: [
        "7. Tantrums and emotional outbursts",
        "8. Discipline for different ages",
        "9. Chores, responsibility and independence",
        "10. Homework, school and study habits",
        "11. Phones, TV, gaming and social media",
        "12. When your child talks back",
        "13. Sibling fights",
      ],
    },
    {
      title: "Part IV — Connection and Repair",
      children: [
        "14. Correct behaviour without breaking confidence",
        "15. The power of praise and positive attention",
        "16. What to do when you lose your temper",
      ],
    },
    {
      title: "Part V — Put It Into Practice",
      children: ["17. The 7-day Calm Discipline reset"],
    },
    {
      title: "The Toolkit",
      children: [
        "Tool 1. Our Family Rules",
        "Tool 2. Weekly Chore Chart",
        "Tool 3. Daily Routine Planner",
        "Tool 4. Behaviour Tracker",
        "Tool 5. Consequence Planner",
        "Tool 6. Parent Calm-Down Checklist",
        "Tool 7. Weekly Family Review",
        "Tool 8. 30-Day Discipline Habit Tracker",
        "Quick reference. 50 things to say instead of shouting",
      ],
    },
  ];

  await sql.query(
    `insert into products (
      id, title, slug, subtitle, short_description, full_description,
      price_kobo, currency, category_id, cover_image, pages,
      benefits, table_of_contents, learnings, audience, included, tags,
      featured, published, archived, is_placeholder, seo_title, seo_description
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16::jsonb,$17::jsonb,
      true,true,false,false,$18,$19
    )`,
    [
      PARENTING_ID,
      "How to Raise a Disciplined Child Without Constant Shouting",
      "how-to-raise-a-disciplined-child",
      "A Practical Guide for Nigerian Parents to Build Respect, Responsibility, Good Habits and Self-Control",
      "A warm, realistic 41-page guide for everyday family life — from homework and chores to screens, siblings and big feelings.",
      "This is a practical parenting guide for Nigerian parents and caregivers who are tired of repeating the same instruction, raising their voice, and wishing the moment had gone differently. It does not promise a silent house or a child who never makes mistakes. It shows how to make expectations clear, follow through without fear, and give children repeated chances to practise responsibility.\n\nThe approach is warm and firm at the same time. Discipline is treated as teaching a skill — not proving who is in charge, and not frightening a child into obedience. The guide walks through a five-step Calm Parent system, then applies it to tantrums, different ages, chores, homework, screens, talking back and sibling fights. Printable tools and 50 alternative phrases help you put the ideas to work at home.\n\nIt is written for real homes: school runs, work, meals, bills, care for relatives, and more than one caregiver. Keep the principles; adapt the routines, language and family values.",
      450000,
      "NGN",
      "cat_parenting",
      "/covers/disciplined-child.jpg",
      41,
      JSON.stringify([
        "Replace the first angry reaction with a five-step, teachable response",
        "Write a few clear family rules people can actually remember",
        "Give one doable instruction — then follow through without a lecture",
        "Use connected, fair consequences instead of revenge or threats",
        "Handle tantrums, homework, screens, talking back and sibling fights with short scripts",
        "Print and reuse eight practical tools, including a 7-day reset",
      ]),
      JSON.stringify(toc),
      JSON.stringify([
        "What discipline really means, and how it differs from punishment or fear",
        "Why children repeat the same behaviours — and what the pattern is telling you",
        "The Calm Parent system: Pause, Understand, State, Consequence, Follow through",
        "How to set 5–8 visible family rules that pass the specific / realistic / positive / consistent tests",
        "Age-appropriate expectations from about 3 to 15, with the amount of help changing as children grow",
        "A low-drama homework routine and a workable family screen plan",
        "How to correct an action without labelling a child as lazy, bad or careless",
        "A simple repair after you lose your temper, without dropping the original limit",
      ]),
      "Nigerian parents and caregivers of children approximately ages 3–15 — mothers, fathers, grandparents and other adults who share the home. Written for busy family life, not a perfect house.",
      JSON.stringify([
        "41-page practical PDF guide",
        "8 printable tools (rules, chores, routines, behaviour tracker, consequences, calm-down checklist, weekly review, 30-day habit tracker)",
        "Quick reference: 50 things to say instead of shouting",
        "Instant digital download after payment is confirmed",
      ]),
      JSON.stringify(["parenting", "discipline", "Nigerian family", "calm parenting"]),
      "How to Raise a Disciplined Child Without Constant Shouting",
      "A practical 41-page guide for Nigerian parents to build respect, responsibility and self-control without constant shouting.",
    ],
  );

  const pdf = await loadSeedPdf();
  if (pdf) {
    await sql.query(
      `insert into product_files (product_id, filename, mime, data, byte_size)
       values ($1,$2,$3,$4,$5)`,
      [PARENTING_ID, "How-to-Raise-a-Disciplined-Child.pdf", "application/pdf", pdf, pdf.length],
    );
  }

  const placeholders = [
    {
      id: "prod_demo_budget",
      title: "The Nigerian Family Budget Guide",
      slug: "nigerian-family-budget-guide",
      subtitle: "A Practical Household Money Plan",
      short: "A placeholder catalogue example for a household money guide.",
      category: "cat_money",
      cover: "/covers/family-budget.jpg",
      price: 350000,
      pages: 28,
    },
    {
      id: "prod_demo_career",
      title: "The After-Work Career Reset",
      slug: "after-work-career-reset",
      subtitle: "A Practical Guide for Working Professionals",
      short: "A placeholder catalogue example for a career guide.",
      category: "cat_career",
      cover: "/covers/career-reset.jpg",
      price: 400000,
      pages: 32,
    },
    {
      id: "prod_demo_business",
      title: "Starting a Small Business in Nigeria",
      slug: "starting-a-small-business-in-nigeria",
      subtitle: "First Steps for Everyday Entrepreneurs",
      short: "A placeholder catalogue example for a small-business guide.",
      category: "cat_business",
      cover: "/covers/small-business.jpg",
      price: 500000,
      pages: 36,
    },
    {
      id: "prod_demo_routines",
      title: "Calm Household Routines",
      slug: "calm-household-routines",
      subtitle: "A Practical Guide to Daily Home Rhythm",
      short: "A placeholder catalogue example for a home-routines guide.",
      category: "cat_lifestyle",
      cover: "/covers/household-routines.jpg",
      price: 250000,
      pages: 24,
    },
  ];

  for (const p of placeholders) {
    await sql.query(
      `insert into products (
        id, title, slug, subtitle, short_description, full_description,
        price_kobo, currency, category_id, cover_image, pages,
        benefits, table_of_contents, learnings, audience, included, tags,
        featured, published, archived, is_placeholder, seo_title, seo_description
      ) values (
        $1,$2,$3,$4,$5,$6,$7,'NGN',$8,$9,$10,
        '[]'::jsonb,'[]'::jsonb,'[]'::jsonb,$11,'[]'::jsonb,'[]'::jsonb,
        false,true,false,true,$2,$5
      )`,
      [
        p.id,
        p.title,
        p.slug,
        p.subtitle,
        p.short,
        "This listing is a DEMO / PLACEHOLDER product so the catalogue looks complete while more guides are being written. It is not a real title and cannot be purchased.",
        p.price,
        p.category,
        p.cover,
        p.pages,
        "Placeholder listing — not a real guide.",
      ],
    );
  }

  await sql.query(
    `insert into settings (key, value) values ('store', $1::jsonb)`,
    [JSON.stringify(DEFAULT_SETTINGS)],
  );

  const faqs = [
    ["What are these products?", "Each product is a digital PDF guide you can download after payment is confirmed. There is no physical book in the post."],
    ["How do I pay?", "You can pay online with Paystack (cards and supported local methods) or submit a bank transfer for the publisher to confirm."],
    ["Can I pay by bank transfer?", "Yes. Choose Pay by bank transfer on checkout, send the exact amount to the account shown, then upload your proof of payment. The PDF unlocks only after the publisher approves the transfer."],
    ["When will I receive my PDF?", "For confirmed online payments, the download page opens as soon as payment is verified. For bank transfer, it unlocks after approval. If email is configured, a copy of the link is also sent to you."],
    ["Can I download it on my phone?", "Yes. Open the download link on your phone and save the PDF. You can read it in any PDF app."],
    ["What happens if my payment succeeds but I cannot download?", "Keep your order reference and email the support address in the footer. Access is restored for confirmed payments — you should not need to pay again."],
    ["What is the refund policy?", DEFAULT_SETTINGS.refundSummary],
  ];
  let i = 0;
  for (const [q, a] of faqs) {
    i += 1;
    await sql`insert into faqs (id, question, answer, sort_order, published)
      values (${`faq_${i}`}, ${q}, ${a}, ${i}, true)`;
  }

  const testimonials = [
    ["Add a short note from a real reader here. Until then, this card is only a placeholder.", "A parent — replace with a real attribution"],
    ["Customer stories belong here once you have permission to share them. Do not treat this as a review.", "A reader — placeholder only"],
    ["Use Settings in the publisher dashboard to replace these with genuine quotes.", "Fieldnote — placeholder"],
  ];
  i = 0;
  for (const [quote, attribution] of testimonials) {
    i += 1;
    await sql`insert into testimonials (id, quote, attribution, is_placeholder, sort_order, published)
      values (${`tst_${i}`}, ${quote}, ${attribution}, true, ${i}, true)`;
  }
}
