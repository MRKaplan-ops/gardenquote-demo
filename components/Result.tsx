'use client'
import {useEffect,useState} from 'react'
import {useApp} from './Providers'
import {Estimate} from './Estimate'
import {estimate,MAT,TIERS,type Item} from '@/lib/pricing/engine'
import {money,actName,unitLabel} from '@/lib/i18n'
const STYLES=['modern','kids','green','luxe','low']
const defStyle=(it:Item[])=>{const h=(id:string)=>it.some(i=>i.activityId===id);return h('canopy')?'luxe':h('artificial')?'kids':h('lawn')||h('planting')?'green':'modern'}
export function Result({items,tier,setTier,before,insp,wish,summary,scene,inspiration,hard,onPdf,pdfBusy}:{items:Item[];summary:string;scene:string;inspiration:string;insp:string[];wish:string;hard:boolean;tier:number;setTier:(n:number)=>void;before:string;onPdf:()=>void;pdfBusy:boolean}){
 const {c,t,lang}=useApp(),m0=(n:number)=>money(n,c.currency,c.locale,0)
 const [def]=useState(()=>defStyle(items)),[used,setUsed]=useState<string[]>([def+'|'+TIERS[tier].id]),[style,setStyle]=useState(def),[pos,setPos]=useState(50),[modal,setModal]=useState(false),[f,setF]=useState({name:'',contact:'',when:'',time:'t2'}),[gens,setGens]=useState<Record<string,string>>({}),[errs,setErrs]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[off,setOff]=useState(false)
 const hasMat=items.some(i=>MAT.includes(i.activityId)),e=estimate(c,items,TIERS[tier].m,hard,TIERS[tier].id),range=`${m0(e.roundedMin)} – ${m0(e.roundedMax)}`,left=5-used.length
 const tid=TIERS[tier].id,key=style+'|'+tid
 const gen=async(k:string,s:string,tr:string)=>{setBusy(true)
  try{const fd=new FormData();fd.append('style',s);fd.append('tier',tr);fd.append('wish',wish);fd.append('summary',summary);fd.append('scene',scene);fd.append('inspiration',inspiration)
   const d=await (await fetch('/api/visualize',{method:'POST',body:fd})).json()
   if(d.mode==='ai'&&typeof d.image==='string')setGens(g=>({...g,[k]:d.image}));else if(d.mode==='off')setOff(true);else throw new Error([d.code||d.status||'error',d.param?'param: '+d.param:'',d.message||''].filter(Boolean).join(' · '))}
  catch(err){setErrs(x=>({...x,[k]:err instanceof Error?err.message:'error'}));setUsed(u=>u.filter(y=>y!==k))}
  setBusy(false)}
 useEffect(()=>{if(!hasMat||busy||off||gens[key]||errs[key])return;if(!used.includes(key)){if(left<=0)return;setUsed(u=>[...u,key])};gen(key,style,tid)},[key,busy,off]) // one generation per style+tier combination
 const pick=(s:string)=>{setErrs({});setStyle(s);setPos(50);if(s==='luxe')setTier(2)} // luxury style forces the luxury tier so image and price agree
 const chooseTier=(i:number)=>{setErrs({});setTier(i)}
 const msg=hasMat?t('wa_msg').replace('{s}',style?t('st_'+style):'-').replace('{p}',t('tier_'+TIERS[tier].id)).replace('{r}',range):t('wa_msg2').replace('{r}',range)
 const num=(c.whatsapp||'').replace(/\D/g,'').replace(/^0/,'31'),mid=items.some(i=>['lawn','planting'].includes(i.activityId))
 const body=[msg,'',...e.lines.map(l=>`${actName(l.activity,lang,l.variant)}: ${l.qtyMin}–${l.qtyMax} ${unitLabel(l.activity.unit,lang)}`),'',f.name,f.contact,f.when,t('time')+': '+t(f.time)].join('\n')
 return <div className="space-y-8">
  <section><h2 className="font-display text-xl font-bold">{t(hasMat?'tier_h':'single_h')}</h2>
   {hasMat&&<div className="mt-3 grid gap-3 sm:grid-cols-3">{TIERS.map((x,i)=>{const r=estimate(c,items,x.m,hard,x.id);return <button key={x.id} aria-pressed={tier===i} onClick={()=>chooseTier(i)} className="relative rounded border border-stone bg-white p-4 text-left" style={tier===i?{borderColor:c.color,boxShadow:`0 0 0 2px ${c.color}`}:undefined}>
    {i===1&&<span className="absolute -top-2 right-2 rounded-full px-2 py-0.5 text-xs text-white" style={{background:c.color}}>{t('popular')}</span>}
    <b>{t('tier_'+x.id)}</b><p className="text-sm">{t('tier_'+x.id+'_d')}</p><p className="mt-2 font-display text-lg">{m0(r.roundedMin)} – {m0(r.roundedMax)}</p></button>})}</div>}
   {hasMat&&<p className="mt-3 inline-block rounded-full border border-stone bg-white px-3 py-1 text-sm">{t(mid?'maint_mid':'maint_low')}</p>}
   <div className="mt-3"><Estimate items={items} mult={TIERS[tier].m} hard={hard} tierId={TIERS[tier].id}/></div></section>
  {hasMat&&<section><h2 className="font-display text-xl font-bold">{t('viz_h')}</h2>
   {off?<p className="mt-2 text-sm">{t('viz_off')}</p>:<><p className="mt-1 text-sm">{t('viz_left').replace('{n}',String(left))}</p>
    <div className="mt-2 flex flex-wrap gap-2">{STYLES.map(s=><button key={s} disabled={busy} className={style===s?'btn':'btn2'} onClick={()=>pick(s)}>{t('st_'+s)}</button>)}</div>
    {gens[key]?<div className="mt-3"><div className="relative aspect-[4/3] overflow-hidden rounded border border-stone bg-white">
     <img src={gens[key]} alt={t('viz_after')} className="absolute inset-0 h-full w-full object-cover"/>
     <img src={before} alt={t('viz_before')} className="absolute inset-0 h-full w-full object-cover" style={{clipPath:`inset(0 ${100-pos}% 0 0)`}}/>
     <div className="absolute inset-y-0 w-0.5 bg-white" style={{left:`${pos}%`}}/><span className="absolute left-2 top-2 rounded bg-white/90 px-2 text-xs">{t('viz_before')}</span><span className="absolute right-2 top-2 rounded bg-white/90 px-2 text-xs">{t('viz_after')}</span></div>
     <input type="range" min="0" max="100" value={pos} onChange={ev=>setPos(Number(ev.target.value))} aria-label={t('viz_before')+' / '+t('viz_after')} className="mt-2 w-full"/><p className="text-xs">{t('viz_ai')}</p><p className="mt-1 inline-block rounded-full border border-stone bg-white px-3 py-1 text-xs">{t('viz_for')}: {t('tier_'+tid)}</p><p className="text-xs">{t('ex_furn')}</p><p className="text-xs">{t('ex_color')}</p></div>
    :busy?<p className="mt-3 text-sm">{t('viz_load')}</p>:left<=0&&!used.includes(key)?<p className="mt-3 text-sm">{t('viz_limit')}</p>:errs[key]?<p role="alert" className="mt-3 text-sm">{t('viz_err')} ({errs[key]})</p>:null}</>}</section>}
  <section className="rounded-lg border border-stone bg-white p-5"><p className="inline-block rounded-full px-3 py-1 text-sm text-white" style={{background:c.color}}>{t('avail').replace('{t}',c.leadTime||'')}</p>
   <h2 className="mt-4 font-display text-xl font-bold">{t('next_h')}</h2><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{['n1','n2','n3'].map(k=><li key={k}>{t(k)}</li>)}</ol>
   <div className="mt-4 flex flex-wrap gap-3"><button className="btn" onClick={()=>setModal(true)}>{t('advice')}</button>
    <a className="btn2 inline-block" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${num}?text=${encodeURIComponent(msg)}`}>{t('wa_send')}</a>
    <a className="btn2 inline-block" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(msg)}`}>{t('share')}</a>
    <button className="btn2" onClick={onPdf} disabled={pdfBusy}>{pdfBusy?'…':t('download')}</button></div></section>
  {modal&&<div role="dialog" aria-modal="true" className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md space-y-3 rounded-lg bg-white p-5">
   <h2 className="font-display text-xl font-bold">{t('modal_h')}</h2>
   <label className="block text-sm">{t('m_name')}<input className="inp mt-1" maxLength={80} value={f.name} onChange={ev=>setF({...f,name:ev.target.value})}/></label>
   <label className="block text-sm">{t('m_contact')}<input className="inp mt-1" maxLength={80} value={f.contact} onChange={ev=>setF({...f,contact:ev.target.value})}/></label>
   <label className="block text-sm">{t('m_when')}<input className="inp mt-1" maxLength={80} value={f.when} onChange={ev=>setF({...f,when:ev.target.value})}/></label>
   <label className="block text-sm">{t('time')}<select className="inp mt-1" value={f.time} onChange={ev=>setF({...f,time:ev.target.value})}>{['t1','t2','t3'].map(k=><option key={k} value={k}>{t(k)}</option>)}</select></label>
   <p className="text-xs">{t('m_note').replace('{c}',c.name)}</p>
   <div className="flex gap-3"><a className="btn inline-block" href={`mailto:${c.email}?subject=${encodeURIComponent(c.name+' – '+t('modal_h'))}&body=${encodeURIComponent(body)}`}>{t('m_send')}</a><button className="btn2" onClick={()=>{setModal(false);setF({name:'',contact:'',when:'',time:'t2'})}}>{t('close')}</button></div></div></div>}</div>}
