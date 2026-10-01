import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSql } from "@/lib/db";
import { mapSettings } from "./map";
import { DEFAULT_SETTINGS } from "./types";

const PARENTING_ID = "prod_disciplined_child";
const ATHLETIC_ID = "prod_athletic_physique";

async function loadPdfFromCandidates(candidates: string[]): Promise<Buffer | null> {
  for (const path of candidates) {
    try {
      if (path.endsWith(".b64")) {
        const raw = await readFile(path, "utf8");
        return Buffer.from(raw.replace(/\s/g, ""), "base64");
      }
      return await readFile(path);
    } catch {
      /* try next */
    }
  }
  return null;
}

async function loadSeedPdf(): Promise<Buffer | null> {
  return loadPdfFromCandidates([
    join(process.cwd(), "private/pdfs/how-to-raise-a-disciplined-child.pdf"),
    join(process.cwd(), "attachments/Disciplined_Child_Guide.pdf"),
  ]);
}

async function loadAthleticPdf(): Promise<Buffer | null> {
  return loadPdfFromCandidates([
    join(process.cwd(), "private/pdfs/medium-size-athletic-physique-system.pdf"),
    join(process.cwd(), "private/pdfs/medium-size-athletic-physique-system.pdf.b64"),
    join(process.cwd(), "attachments/Medium-Size_Athletic_Physique_System.pdf"),
  ]);
}

async function ensureBankDetails(): Promise<void> {
  const sql = await getSql();
  const rows = await sql<{ value: unknown }>`select value from settings where key = 'store'`;
  if (!rows[0]) {
    await sql.query(`insert into settings (key, value) values ('store', $1::jsonb)`, [
      JSON.stringify(DEFAULT_SETTINGS),
    ]);
    return;
  }
  const current = mapSettings(rows[0].value);
  const next = {
    ...current,
    bankName: DEFAULT_SETTINGS.bankName,
    accountName: DEFAULT_SETTINGS.accountName,
    accountNumber: DEFAULT_SETTINGS.accountNumber,
  };
  await sql.query(
    `update settings set value = $1::jsonb, updated_at = now() where key = 'store'`,
    [JSON.stringify(next)],
  );
}

async function ensureAthleticProduct(): Promise<void> {
  const sql = await getSql();
  const existing = await sql<{ id: string }>`select id from products where id = ${ATHLETIC_ID}`;

  const toc = [
    {
      title: "Part 1 - Foundation",
      children: [
        "01 The Target Physique",
        "02 Expectations and Realistic Timeline",
        "03 Starting-Point Assessment",
      ],
    },
    {
      title: "Part 2 - Training",
      children: [
        "04 Training Philosophy and Weekly Rhythm",
        "05 Primary Four-Day Gym Plan",
        "06 Technique, Effort and RIR",
        "07 Simple Progressive Overload",
        "08 The 12-Week Training Roadmap",
        "09 Cardio and Athletic Conditioning",
        "10 Home and Minimal-Equipment Alternatives",
      ],
    },
    {
      title: "Part 3 - Nutrition and Recovery",
      children: [
        "11 Nutrition and Calories",
        "12 Protein, Carbs, Fats and Meal Structure",
        "13 A Nigerian-Friendly Food System",
        "14 Sample Nigerian Meal Plans",
        "15 Supplements and Recovery",
      ],
    },
    {
      title: "Part 4 - Track and Sustain",
      children: [
        "16 Progress Tracking",
        "17 Plateaus and Common Mistakes",
        "18 Your 12-Week Action Checklist",
        "19 Quick Reference, Safety and Sources",
      ],
    },
  ];

  const payload = [
    ATHLETIC_ID,
    "The Medium-Size Athletic Physique System",
    "medium-size-athletic-physique-system",
    "12 Weeks to a Leaner, Stronger and More Balanced Body",
    "A practical 12-week training and nutrition system for balanced proportions - build muscle, stay lean, and move well without crash diets or extreme volume.",
    "This is a flexible, evidence-informed 12-week training and nutrition system for people who want a leaner, stronger, more balanced body - not maximum size, crash dieting, or a promised physique.\n\nIt covers a clear target physique, realistic expectations, a starting-point assessment, a primary four-day gym plan (with home and minimal-equipment options), progressive overload, cardio, Nigerian-friendly meal structure and sample meal plans, recovery, progress tracking, and a 12-week action checklist.\n\nUse it as general education, not medical advice. Choose a 3-, 4- or 5-day schedule (or the home option), pick a nutrition path, log sessions, and change one thing at a time.",
    200000,
    "NGN",
    "cat_lifestyle",
    "/covers/athletic-physique.svg",
    22,
    JSON.stringify([
      "Follow a clear 12-week roadmap for training and nutrition",
      "Train with a practical four-day gym plan (or home alternatives)",
      "Use simple progressive overload without extreme volume",
      "Structure protein, carbs and fats with Nigerian-friendly meals",
      "Track progress and adjust when plateaus show up",
      "Finish with a concrete 12-week action checklist",
    ]),
    JSON.stringify(toc),
    JSON.stringify([
      "What a medium-size athletic physique actually means",
      "How to set realistic expectations and a starting-point assessment",
      "Training philosophy, weekly rhythm, technique and RIR",
      "A primary four-day plan plus home and minimal-equipment options",
      "Cardio and athletic conditioning that supports the goal",
      "Calories, macros and sample Nigerian meal plans",
      "How to track progress and handle plateaus",
    ]),
    "Adults who want a leaner, stronger, more balanced body with training and food that fit real life - gym or home, without crash diets or extreme programmes.",
    JSON.stringify([
      "22-page practical PDF system",
      "12-week training roadmap and weekly rhythm",
      "Gym, home and minimal-equipment options",
      "Nigerian-friendly nutrition paths and sample meal plans",
      "Progress tracking tools and a 12-week action checklist",
      "Instant digital download after payment is confirmed",
    ]),
    JSON.stringify(["fitness", "training", "nutrition", "Nigerian", "athletic physique"]),
    "The Medium-Size Athletic Physique System",
    "A practical 12-week training and nutrition system for a leaner, stronger, balanced body - built for real life.",
  ];

  if (!existing[0]) {
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
      payload,
    );
  } else {
    await sql.query(
      `update products set
        title=$2, slug=$3, subtitle=$4, short_description=$5, full_description=$6,
        price_kobo=$7, currency=$8, category_id=$9, cover_image=$10, pages=$11,
        benefits=$12::jsonb, table_of_contents=$13::jsonb, learnings=$14::jsonb,
        audience=$15, included=$16::jsonb, tags=$17::jsonb,
        featured=true, published=true, archived=false, is_placeholder=false,
        seo_title=$18, seo_description=$19, updated_at=now()
       where id=$1`,
      payload,
    );
  }

  const file = await sql<{ n: number }>`select count(*)::int as n from product_files where product_id = ${ATHLETIC_ID}`;
  if ((file[0]?.n ?? 0) === 0) {
    const pdf = await loadAthleticPdf();
    if (pdf) {
      await sql.query(
        `insert into product_files (product_id, filename, mime, data, byte_size)
         values ($1,$2,'application/pdf',$3,$4)
         on conflict (product_id) do nothing`,
        [ATHLETIC_ID, "Medium-Size-Athletic-Physique-System.pdf", pdf, pdf.length],
      );
    }
  }
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
    await ensureBankDetails();
    await ensureAthleticProduct();
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
      "A warm, realistic 41-page guide for everyday family life - from homework and chores to screens, siblings and big feelings.",
      "This is a practical parenting guide for Nigerian parents and caregivers.",
      200000,
      "NGN",
      "cat_parenting",
      "/covers/disciplined-child.jpg",
      41,
      JSON.stringify(["Calm discipline without constant shouting"]),
      JSON.stringify([]),
      JSON.stringify(["Calm Parent system"]),
      "Nigerian parents and caregivers of children ages 3-15.",
      JSON.stringify(["41-page practical PDF guide", "Instant digital download after payment is confirmed"]),
      JSON.stringify(["parenting", "discipline"]),
      "How to Raise a Disciplined Child Without Constant Shouting",
      "A practical 41-page guide for Nigerian parents.",
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

  await ensureAthleticProduct();

  await sql.query(
    `insert into settings (key, value) values ('store', $1::jsonb)`,
    [JSON.stringify(DEFAULT_SETTINGS)],
  );
}
