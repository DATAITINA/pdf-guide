import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6 text-center text-ink">
      <div>
        <p className="text-xs tracking-[0.18em] text-accent uppercase">404</p>
        <h1 className="mt-2 font-display text-4xl">Page not found</h1>
        <p className="mt-3 text-muted">That link does not match a guide or page in this store.</p>
        <a href="/" className="mt-6 inline-block text-accent underline">
          Back to the store
        </a>
      </div>
    </main>
  );
}

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFound,
  });
}
