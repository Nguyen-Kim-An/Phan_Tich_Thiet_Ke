'use client';
import { useRef } from 'react';import { Provider } from 'react-redux';import { makeStore,AppStore } from './store';
export function StoreProvider({children}:{children:React.ReactNode}){const ref=useRef<AppStore|null>(null);if(!ref.current)ref.current=makeStore();return <Provider store={ref.current}>{children}</Provider>}
