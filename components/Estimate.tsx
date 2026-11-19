'use client'
import {useApp} from './Providers'
import {estimate,type Item} from '@/lib/pricing/engine'
import {money,num} from '@/lib/i18n'
export function Estimate({items}:{items:Item[]}){
 const {c,t}=useApp(),e=estimate(c,items),m=(n:number)=>money(n,c.currency,c.locale),rng=(a:number,b:number)=>a===b?m(a):`${m(a)} – ${m(b)}`
 return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-stone"><th className="py-2">{t('item')}</th><th>{t('qty')}</th><th>{t('price')}</th><th className="text-right">{t('subtotal')}</th></tr></thead><tbody>
  {e.lines.map(l=><tr key={l.activity.id} className="border-b border-stone"><td className="py-2">{l.activity.name}</td><td>{l.qtyMin===l.qtyMax?num(l.qtyMin,c.locale):`${num(l.qtyMin,c.locale)}–${num(l.qtyMax,c.locale)}`} {l.activity.unit}</td><td>{m(l.activity.price)}/{l.activity.unit}</td><td className="text-right">{rng(l.subMin,l.subMax)}</td></tr>)}
  <tr><td colSpan={3} className="py-2">{t('callout')}</td><td className="text-right">{m(e.callout)}</td></tr>
  <tr><td colSpan={3}>{t('vat')} ({c.vat}%)</td><td className="text-right">{rng(e.vatMin,e.vatMax)}</td></tr>
  <tr className="font-display text-lg font-bold"><td colSpan={2} className="pt-3">{t('total')}</td><td colSpan={2} className="pt-3 text-right" style={{color:c.color}}>{rng(e.totalMin,e.totalMax)}</td></tr></tbody></table></div>}
