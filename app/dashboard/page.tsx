'use client'
import {useApp} from '@/components/Providers'
import {actName} from '@/lib/i18n'
import {DEMO_COMPANY} from '@/config/demo'
import type {Company} from '@/lib/pricing/engine'
export default function Dash(){
 const {c,setC,t,lang}=useApp(),set=(p:Partial<Company>)=>setC({...c,...p})
 const T=(k:keyof Company,l:string,type='text')=><label className="block text-sm">{t(l)}<input className="inp mt-1" type={type} value={c[k] as string|number} onChange={e=>set({[k]:type==='number'?Math.max(0,Number(e.target.value)):e.target.value} as Partial<Company>)}/></label>
 const upd=(i:number,p:object)=>set({activities:c.activities.map((a,j)=>j===i?{...a,...p}:a)})
 return <div><h1 className="font-display text-3xl font-bold">{t('dashboard')}</h1><p className="mt-1 mb-5 text-sm">{t('dnote')}</p>
  <div className="grid gap-3 sm:grid-cols-3">{T('name','name')}{T('color','color','color')}{T('email','email')}{T('phone','phone')}{T('currency','currency')}{T('locale','locale')}{T('vat','vatPct','number')}{T('minProject','minProject','number')}{T('callout','calloutFee','number')}{T('marginLow','marginLow','number')}{T('marginHigh','marginHigh','number')}{T('roundTo','roundTo','number')}</div>
  <h2 className="mt-8 mb-2 font-display text-xl font-bold">{t('prices')}</h2>
  <div className="space-y-2">{c.activities.map((a,i)=><div key={a.id} className="grid grid-cols-[1fr_4rem_6rem_auto] gap-2"><input aria-label={t('actName')} className="inp" value={actName(a,lang)} onChange={e=>upd(i,{names:{...a.names,[lang]:e.target.value},...(a.name?{}:{name:e.target.value})})}/><input aria-label={t('unit')} className="inp" value={a.unit} onChange={e=>upd(i,{unit:e.target.value})}/><input aria-label={t('price')} className="inp" type="number" min="0" value={a.price} onChange={e=>upd(i,{price:Math.max(0,Number(e.target.value))})}/><button className="btn2" onClick={()=>set({activities:c.activities.filter((_,j)=>j!==i)})}>{t('remove')}</button></div>)}</div>
  <div className="mt-4 flex gap-3"><button className="btn" onClick={()=>set({activities:[...c.activities,{id:'c'+Date.now(),name:'',unit:'m²',price:0}]})}>{t('addAct')}</button><button className="btn2" onClick={()=>setC(DEMO_COMPANY)}>{t('reset')}</button></div></div>}
