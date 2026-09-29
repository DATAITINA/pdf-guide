import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { deleteAdminProduct, saveAdminProduct } from "@/lib/store/admin";
import { koboToNaira } from "@/lib/store/money";
import { slugify } from "@/lib/store/slug";
import type { ProductDetail } from "@/lib/store/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

export function ProductForm({
  product,
  categories,
}: {
  product: ProductDetail | null;
  categories: { id: string; name: string; slug: string }[];
}) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    try {
      const cover = fd.get("cover") as File | null;
      const pdf = fd.get("pdf") as File | null;
      let coverDataUrl: string | undefined;
      let pdfBase64: string | undefined;
      let pdfName: string | undefined;
      if (cover && cover.size) coverDataUrl = await readDataUrl(cover);
      if (pdf && pdf.size) {
        pdfBase64 = await readBase64(pdf);
        pdfName = pdf.name;
      }
      const result = await saveAdminProduct({
        data: {
          id: product?.id,
          title: String(fd.get("title") || ""),
          slug: String(fd.get("slug") || ""),
          subtitle: String(fd.get("subtitle") || ""),
          shortDescription: String(fd.get("shortDescription") || ""),
          fullDescription: String(fd.get("fullDescription") || ""),
          priceNaira: Number(fd.get("priceNaira") || 0),
          categoryId: String(fd.get("categoryId") || ""),
          pages: Number(fd.get("pages") || 0) || undefined,
          benefits: lines(String(fd.get("benefits") || "")),
          tableOfContents: textToToc(String(fd.get("toc") || "")),
          learnings: lines(String(fd.get("learnings") || "")),
          audience: String(fd.get("audience") || ""),
          included: lines(String(fd.get("included") || "")),
          tags: lines(String(fd.get("tags") || "")),
          featured: fd.get("featured") === "on",
          published: fd.get("published") === "on",
          archived: fd.get("archived") === "on",
          isPlaceholder: fd.get("isPlaceholder") === "on",
          seoTitle: String(fd.get("seoTitle") || ""),
          seoDescription: String(fd.get("seoDescription") || ""),
          coverDataUrl,
          pdfName,
          pdfBase64,
        },
      });
      toast.success("Product saved");
      void navigate({ to: "/admin/product/$id", params: { id: result.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!product) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await deleteAdminProduct({ data: { id: product.id } });
    void navigate({ to: "/admin/products" });
  }

  return (
    <form className="mx-auto max-w-3xl space-y-5" onSubmit={onSubmit}>
      <Field label="Title">
        <Input
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!product) setSlug(slugify(e.target.value));
          }}
          required
        />
      </Field>
      <Field label="Slug" hint="Used in the public URL /guides/your-slug">
        <Input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </Field>
      <Field label="Subtitle">
        <Input name="subtitle" defaultValue={product?.subtitle ?? ""} />
      </Field>
      <Field label="Short description">
        <Textarea name="shortDescription" defaultValue={product?.shortDescription ?? ""} required />
      </Field>
      <Field label="Full description">
        <Textarea name="fullDescription" defaultValue={product?.fullDescription ?? ""} rows={8} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (naira)">
          <Input
            name="priceNaira"
            type="number"
            min={1}
            step="1"
            defaultValue={product ? koboToNaira(product.priceKobo) : 3500}
            required
          />
        </Field>
        <Field label="Pages">
          <Input name="pages" type="number" min={1} defaultValue={product?.pages ?? ""} />
        </Field>
        <Field label="Category">
          <select
            name="categoryId"
            defaultValue={product?.categoryId ?? categories[0]?.id}
            className="h-12 w-full rounded-[12px] border border-line bg-surface px-3"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Who it is for">
        <Textarea name="audience" defaultValue={product?.audience ?? ""} />
      </Field>
      <Field label="Benefits" hint="One per line">
        <Textarea name="benefits" defaultValue={(product?.benefits ?? []).join("\n")} />
      </Field>
      <Field label="What the reader will learn" hint="One per line">
        <Textarea name="learnings" defaultValue={(product?.learnings ?? []).join("\n")} />
      </Field>
      <Field label="What's included" hint="One per line">
        <Textarea name="included" defaultValue={(product?.included ?? []).join("\n")} />
      </Field>
      <Field label="Table of contents" hint="Section title, then indented child lines. Blank line between sections.">
        <Textarea name="toc" defaultValue={tocToText(product?.tableOfContents ?? [])} rows={10} />
      </Field>
      <Field label="Tags" hint="One per line">
        <Textarea name="tags" defaultValue={(product?.tags ?? []).join("\n")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SEO title">
          <Input name="seoTitle" defaultValue={product?.seoTitle ?? ""} />
        </Field>
        <Field label="SEO description">
          <Input name="seoDescription" defaultValue={product?.seoDescription ?? ""} />
        </Field>
      </div>
      <Field label="Cover image">
        <Input name="cover" type="file" accept="image/*" />
      </Field>
      <Field label="PDF file" hint={product?.hasPdf ? "A PDF is already attached. Upload to replace it." : "Required before the guide can be purchased."}>
        <Input name="pdf" type="file" accept="application/pdf" />
      </Field>
      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={product?.published ?? true} /> Published
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /> Featured
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="archived" defaultChecked={product?.archived ?? false} /> Archived
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPlaceholder" defaultChecked={product?.isPlaceholder ?? false} /> Demo / placeholder
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          Save product
        </Button>
        {product ? (
          <Button type="button" variant="danger" onClick={() => void onDelete()}>
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function tocToText(toc: { title: string; children?: string[] }[]): string {
  return toc
    .map((section) => [section.title, ...(section.children ?? []).map((c) => `  ${c}`)].join("\n"))
    .join("\n\n");
}

function textToToc(text: string): { title: string; children?: string[] }[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => {
      const rows = block
        .split("\n")
        .map((l) => l.trimEnd())
        .filter((l) => l.trim());
      if (!rows.length) return null;
      const title = rows[0].trim();
      const children = rows.slice(1).map((l) => l.trim().replace(/^- /, ""));
      return { title, children: children.length ? children : undefined };
    })
    .filter((row): row is { title: string; children?: string[] } => Boolean(row));
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readBase64(file: File): Promise<string> {
  return readDataUrl(file).then((url) => (url.includes(",") ? url.split(",")[1] : url));
}
