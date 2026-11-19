'use client'
import {useApp} from './Providers'
import {estimate,type Item} from '@/lib/pricing/engine'
import {money,num,actName,unitLabel} from '@/lib/i18n'
export function Estimate({items,mult=1}:{items:Item[];mult?:number}){ // read-only for visitors: quantities cannot be edited
 const {c,t,lang}=useApp(),e=estimate(c,items,mult),m=(n:number)=>money(n,c.currency,c.locale),m0=(n:number)=>money(n,c.currency,c.locale,0)
 const rng=(a:number,b:number,f=m)=>a===b?f(a):`${f(a)} – ${f(b)}`
 return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-stone"><th className="py-2">{t('item')}</th><th>{t('qty')}</th><th>{t('price')}</th><th className="text-right">{t('subtotal')}</th></tr></thead><tbody>
  {e.lines.map(l=><tr key={l.activity.id} className="border-b border-stone"><td className="py-2 pr-2">{actName(l.activity,lang,l.variant)}</td>
   <td className="whitespace-nowrap">{l.qtyMin===l.qtyMax?num(l.qtyMin,c.locale):`${num(l.qtyMin,c.locale)}–${num(l.qtyMax,c.locale)}`} {unitLabel(l.activity.unit,lang)}</td>
   <td className="whitespace-nowrap">{m(l.activity.price)}/{unitLabel(l.activity.unit,lang)}</td><td className="text-right">{rng(l.subMin,l.subMax)}</td></tr>)}
  <tr><td colSpan={3} className="py-2">{t('callout')}</td><td className="text-right">{m(e.callout)}</td></tr>
  <tr><td colSpan={3}>{t('vat')} ({c.vat}%)</td><td className="text-right">{rng(e.vatMin,e.vatMax)}</td></tr>
  <tr className="font-display text-lg font-bold"><td colSpan={2} className="pt-3">{t('total')}</td><td colSpan={2} className="pt-3 text-right" style={{color:c.color}}>{rng(e.roundedMin,e.roundedMax,m0)}</td></tr></tbody></table></div>}
