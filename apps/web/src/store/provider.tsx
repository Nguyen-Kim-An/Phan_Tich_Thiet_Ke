'use client';

import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore, cartActions } from './store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<AppStore | null>(null);
  if (!ref.current) ref.current = makeStore();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('smartfashion_cart_v2');
      if (raw && ref.current) {
        const lines = JSON.parse(raw);
        if (Array.isArray(lines) && lines.length > 0) {
          ref.current.dispatch(cartActions.hydrate(lines));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  return <Provider store={ref.current}>{children}</Provider>;
}
