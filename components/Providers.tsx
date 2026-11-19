'use client'
import {createContext,useContext,useEffect,useState,type CSSProperties,type ReactNode} from 'react'
import {DICT,LANGS,type Lang,type Key} from '@/lib/i18n'
import {DEMO_COMPANY,PRODUCT_NAME} from '@/config/demo'
import type {Company} from '@/lib/pricing/engine'
type Ctx={lang:Lang;setLang:(l:Lang)=>void;t:(k:string)=>string;c:Company;setC:(c:Company)=>void}
const X=createContext<Ctx>(null!)
export const useApp=()=>useContext(X)
export function Providers({children}:{children:ReactNode}){
 const [lang,setLang]=useState<Lang>('nl'),[c,setC]=useState<Company>(DEMO_COMPANY) // memory only: no cookies, no localStorage
 const t=(k:string)=>(DICT[lang] as Record<string,string>)[k]??k
 const HEX=/^#[0-9a-f]{6}$/i
 useEffect(()=>{try{const s=JSON.parse(sessionStorage.getItem('gq_company')||'null');if(s&&Array.isArray(s.activities)&&HEX.test(s.color))setC({...DEMO_COMPANY,...s})}catch{}},[]) // company settings only; never visitor input
 return <X.Provider value={{lang,setLang,t,c,setC}}><div style={{'--brand':HEX.test(c.color)?c.color:'#2f6b4a'} as CSSProperties}>
  <header className="border-b border-stone bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
   <a href="/" className="font-display text-xl font-bold " style={{color:'var(--brand)'}}>{PRODUCT_NAME}</a>
   <nav className="flex items-center gap-4 text-sm"><a href="/quote" className="hover:underline">Widget</a><a href="/dashboard" className="hover:underline">{t('dashboard')}</a>
    <select aria-label="Language" className="rounded border border-stone bg-white p-1" value={lang} onChange={e=>setLang(e.target.value as Lang)}>{LANGS.map(l=><option key={l.id} value={l.id}>{l.label}</option>)}</select></nav></div></header>
  <main className="mx-auto max-w-5xl px-4 py-8">{children}</main></div></X.Provider>}
