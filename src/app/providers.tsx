'use client';

import { useRef, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from '@store/index';

/**
 * The counterpart of Angular's root `StoreModule.forRoot` / `EffectsModule`
 * bootstrap. The store is built once per browser session and held in a ref:
 * building it during render would hand React's strict-mode double-invoke two
 * different stores, and re-register every listener twice with them.
 */
export function Providers({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  storeRef.current ??= makeStore();

  return <Provider store={storeRef.current}>{children}</Provider>;
}
