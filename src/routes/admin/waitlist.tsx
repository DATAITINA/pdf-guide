import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  exportWaitlistCsv,
  launchTopic,
  listAdminWaitlist,
  mergeTopics,
  setTopicBuilding,
} from "@/lib/store/waitlist-admin";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/waitlist")({
  component: AdminWaitlist,
});

type TopicRow = {
  id: string;
  name: string;
  status: string;
  productId: string | null;
  createdAt: string;
  count: number;
};

type ProductOpt = { id: string; title: string; slug: string };

function AdminWaitlist() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [productPick, setProductPick] = useState<Record<string, string>>({});
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const data = await listAdminWaitlist();
      setTopics(data.topics);
      setProducts(data.products);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load waitlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onExport(topicId: string, name: string) {
    try {
      const { csv } = await exportWaitlistCsv({ data: { topicId } });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `waitlist-${name.replace(/\s+/g, "-").toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  }

  async function onBuilding(topicId: string) {
    try {
      await setTopicBuilding({ data: { topicId } });
      toast.success("Marked as building");
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onLaunch(topicId: string, dryRun: boolean) {
    const productId = productPick[topicId];
    if (!productId) {
      toast.error("Select a product to link");
      return;
    }
    try {
      const result = await launchTopic({ data: { topicId, productId, dryRun } });
      if (result.dryRun) {
        toast.message(`Dry run: would email ${result.wouldEmail} people for ${result.topicName}`);
      } else {
        toast.success(
          `Launched “${result.topicName}”. Activated ${result.activated}, emailed ${result.emailed}.`,
        );
        void refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Launch failed");
    }
  }

  async function onMerge() {
    if (!mergeSource || !mergeTarget) {
      toast.error("Pick source and target topics");
      return;
    }
    try {
      const result = await mergeTopics({
        data: { sourceTopicId: mergeSource, targetTopicId: mergeTarget },
      });
      toast.success(`Merged (${result.moved} entries processed)`);
      setMergeSource("");
      setMergeTarget("");
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Merge failed");
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8">
      <h1 className="font-display text-3xl">Waitlist</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        View demand, export signups, mark topics as building, and launch a topic by linking a published
        product (activates vouchers and sends launch emails).
      </p>

      {loading ? (
        <p className="mt-10 text-muted">Loading…</p>
      ) : (
        <div className="mt-8 space-y-4">
          {topics.length === 0 ? (
            <p className="text-muted">No topics yet.</p>
          ) : (
            topics.map((t) => (
              <div key={t.id} className="rounded-[16px] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {t.count} requests · {t.status}
                      {t.productId ? " · linked" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => void onExport(t.id, t.name)}>
                      Export CSV
                    </Button>
                    {t.status === "requested" ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => void onBuilding(t.id)}>
                        Mark building
                      </Button>
                    ) : null}
                  </div>
                </div>
                {t.status !== "launched" ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      className="h-10 rounded-[10px] border border-line bg-paper px-3 text-sm"
                      value={productPick[t.id] ?? ""}
                      onChange={(e) => setProductPick((p) => ({ ...p, [t.id]: e.target.value }))}
                      aria-label={`Product for ${t.name}`}
                    >
                      <option value="">Link product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                    <Button type="button" size="sm" variant="outline" onClick={() => void onLaunch(t.id, true)}>
                      Dry-run launch
                    </Button>
                    <Button type="button" size="sm" onClick={() => void onLaunch(t.id, false)}>
                      Launch
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}

          <div className="rounded-[16px] border border-line bg-surface p-4">
            <p className="font-medium">Merge duplicate topics</p>
            <p className="mt-1 text-sm text-muted">
              Moves entries and vouchers into the target; drops source. Conflicting emails keep the target
              entry.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select
                className="h-10 rounded-[10px] border border-line bg-paper px-3 text-sm"
                value={mergeSource}
                onChange={(e) => setMergeSource(e.target.value)}
              >
                <option value="">Source (will be removed)</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-[10px] border border-line bg-paper px-3 text-sm"
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
              >
                <option value="">Target (keep)</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Button type="button" size="sm" variant="outline" onClick={() => void onMerge()}>
                Merge
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
