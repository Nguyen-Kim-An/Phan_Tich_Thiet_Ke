import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product, Variant } from '@/lib/catalog';
export type CartLine={product:Product;variant:Variant;quantity:number};
const cart=createSlice({name:'cart',initialState:{lines:[] as CartLine[],open:false},reducers:{
  add:(state,action:PayloadAction<{product:Product;variant:Variant}>)=>{const line=state.lines.find(x=>x.variant.variantId===action.payload.variant.variantId);if(line&&line.quantity<line.variant.stock)line.quantity++;else if(!line)state.lines.push({...action.payload,quantity:1});state.open=true},
  remove:(state,action:PayloadAction<string>)=>{state.lines=state.lines.filter(x=>x.variant.variantId!==action.payload)},
  setQuantity:(state,action:PayloadAction<{id:string;quantity:number}>)=>{const line=state.lines.find(x=>x.variant.variantId===action.payload.id);if(line)line.quantity=Math.max(1,Math.min(line.variant.stock,action.payload.quantity))},
  toggle:(state,action:PayloadAction<boolean|undefined>)=>{state.open=action.payload??!state.open},clear:(state)=>{state.lines=[]}
}});
export const cartActions=cart.actions;
export const makeStore=()=>configureStore({reducer:{cart:cart.reducer}});
export type AppStore=ReturnType<typeof makeStore>;export type RootState=ReturnType<AppStore['getState']>;export type AppDispatch=AppStore['dispatch'];
