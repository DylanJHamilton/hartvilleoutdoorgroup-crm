// src/app/shared/utils/location-context.util.ts
import { inject, Signal, WritableSignal, computed, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map, of, startWith, filter } from 'rxjs';

/** Shared timeframe type to keep usage consistent across pages. */
export type Timeframe = 'DTD' | 'WTD' | 'MTD' | 'QTD' | 'YTD';

export interface LocationContextOptions {
  /** Default store id if none can be found in the route/url. */
  defaultStoreId?: string;
  /** Enable console tracing for debugging. */
  devLog?: boolean;
}

export interface LocationContext {
  /** Reactive current store id derived from the route tree or URL. */
  storeId: Signal<string>;
  /** Reactive current URL for debugging/diagnostics. */
  url: Signal<string>;
  /** Timeframe state colocated with the location context. */
  timeframe: WritableSignal<Timeframe>;
  /** Convenience computed key you can feed to charts to force re-render on scope changes. */
  chartKey: Signal<string>;
  /** Helper that returns a non-empty id (falls back to default when missing). */
  idOrFallback(): string;
}

/* ----------------------------- Pure utilities ----------------------------- */

/** Walks up the ActivatedRoute tree and returns the first non-empty param value for `key`. */
export function findParamUpTree(route: ActivatedRoute, key: string): string | null {
  let r: ActivatedRoute | null = route;
  while (r) {
    const v = r.snapshot.paramMap.get(key);
    if (v) return v;
    r = r.parent;
  }
  return null;
}

/** Extracts `/location/:id/…` from a URL string (very tolerant). */
export function extractStoreIdFromUrl(url: string): string | null {
  if (!url) return null;
  // Matches /location/{id} where id has no slash
  const m = url.match(/\/location\/([^\/?#;]+)/i);
  return m?.[1] ?? null;
}

/**
 * Snapshot resolver – checks route tree first, then falls back to parsing the URL.
 * Use for non-reactive contexts (e.g., guards/resolvers/tests).
 */
export function resolveStoreIdSnapshot(route: ActivatedRoute, currentUrl: string, defaultId = ''): string {
  return (
    findParamUpTree(route, 'id') ??
    extractStoreIdFromUrl(currentUrl) ??
    defaultId
  );
}

/* ----------------------------- Reactive helper ---------------------------- */

/**
 * Creates a reusable, reactive location context (store id + timeframe + chartKey).
 * Nothing is registered globally; consumers decide when/how to use it.
 */
export function createLocationContext(
  route = inject(ActivatedRoute),
  router = inject(Router),
  opts: LocationContextOptions = {}
): LocationContext {
  const { defaultStoreId = '', devLog = false } = opts;

  // Reactive URL (updates on NavigationEnd, starts with current url)
  const url$ = router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    map(e => e.urlAfterRedirects || e.url),
    startWith(router.url)
  );
  const url = toSignal(url$, { initialValue: router.url });

  // Reactive paramMaps for current route and up to two parents (covers most nesting)
  const paramMaps$ = combineLatest([
    route.paramMap,
    route.parent ? route.parent.paramMap : of(null),
    route.parent?.parent ? route.parent.parent.paramMap : of(null),
  ]);

  // storeId reacts to either paramMap changes OR URL changes
  const storeId = toSignal(
    combineLatest([paramMaps$, url$]).pipe(
      map(([maps, currentUrl]) => {
        const [a, b, c] = maps;
        const fromParams =
          a?.get('id') ??
          b?.get('id') ??
          c?.get('id') ??
          null;
        const id = fromParams ?? extractStoreIdFromUrl(currentUrl) ?? defaultStoreId;
        if (devLog) {
          // eslint-disable-next-line no-console
          console.log('[LocationContext] derive storeId:', {
            fromParams,
            fromUrl: extractStoreIdFromUrl(currentUrl),
            chosen: id,
            currentUrl,
          });
        }
        return id;
      })
    ),
    { initialValue: resolveStoreIdSnapshot(route, router.url, defaultStoreId) }
  );

  // Local timeframe state colocated with the location context
  const timeframe = signal<Timeframe>('MTD');

  // Stable key that changes when either storeId or timeframe changes (for chart refresh)
  const chartKey = computed(() => `${storeId()}|${timeframe()}`);

  const idOrFallback = () => storeId() || defaultStoreId;

  if (devLog) {
    // Lightweight tracing (only if enabled)
    const logOnce = () => {
      // eslint-disable-next-line no-console
      console.log('[LocationContext] init', {
        url: url(),
        storeId: storeId(),
        timeframe: timeframe(),
        chartKey: chartKey(),
      });
    };
    // Log immediately
    logOnce();
    // And log on subsequent changes (micro task)
    queueMicrotask(() => {
      // eslint-disable-next-line no-console
      console.log('[LocationContext] ready; reactive updates will be logged as they occur.');
    });
  }

  return { storeId, url, timeframe, chartKey, idOrFallback };
}
