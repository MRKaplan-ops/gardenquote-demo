'use client'
import {useState} from 'react'
import {useApp} from '@/components/Providers'
import {Estimate} from '@/components/Estimate'
import type {Analysis} from '@/lib/ai'
const TYPES=['garden','paving','lawn','artificial','fence','planting','renovation','other']
const MAXF=8*1024*1024
async function toJpeg(f:File){const b=await createImageBitmap(f);const k=Math.min(1,1400/Math.max(b.width,b.height));const cv=document.createElement('canvas');cv.width=b.width*k;cv.height=b.height*k;cv.getContext('2d')!.drawImage(b,0,0,cv.width,cv.height);return cv.toDataURL('image/jpeg',.85)} // re-encode strips EXIF client-side too
export default function Quote(){
 const {t,c}=useApp()
 const [step,setStep]=useState(1),[imgs,setImgs]=useState<string[]>([]),[type,setType]=useState('paving'),[desc,setDesc]=useState(''),[area,setArea]=useState(''),[remove,setRemove]=useState(false),[access,setAccess]=useState('easy'),[materials,setMaterials]=useState(''),[time,setTime]=useState('t2')
 const [an,setAn]=useState<Analysis|null>(null),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[pdfBusy,setPdfBusy]=useState(false)
 const addFiles=async(fl:FileList|null)=>{setErr('');const out=[...imgs];for(const f of Array.from(fl||[])){if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>MAXF||out.length>=5){setErr(t('err'));continue}try{out.push(await toJpeg(f))}catch{setErr(t('err'))}}setImgs(out)}
 const run=async()=>{setBusy(true);setErr('');try{
  const fd=new FormData();fd.append('payload',JSON.stringify({type,desc,area:area?Number(area):null,remove,access,materials,time,activities:c.activities.map(({id,name,unit})=>({id,name,unit}))}))
  for(const u of imgs)fd.append('images',await (await fetch(u)).blob(),'p.jpg')
  const r=await fetch('/api/analyze',{method:'POST',body:fd});if(!r.ok)throw 0;setAn(await r.json());setStep(5)}catch{setErr(t('err'))}setBusy(false)}
 const items=an?.items.map(i=>({activityId:i.activityId,qtyMin:i.qtyMin,qtyMax:i.qtyMax}))??[]
 const pdf=async()=>{setPdfBusy(true);try{const [{pdf},{EstimatePdf}]=await Promise.all([import('@react-pdf/renderer'),import('@/components/EstimatePdf')])
  const blob=await pdf(<EstimatePdf c={c} items={items} desc={desc} images={imgs} notes={(an?.assumptions||[]).map(t)} t={t}/>).toBlob();const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='estimate.pdf';a.click();URL.revokeObjectURL(a.href)}catch{setErr(t('err'))}setPdfBusy(false)}
 const nav=<div className="mt-6 flex gap-3">{step>1&&<button className="btn2" onClick={()=>setStep(step-1)}>{t('back')}</button>}{step<3&&<button className="btn" onClick={()=>setStep(step+1)} disabled={step===2&&!desc.trim()}>{t('next')}</button>}{step===3&&<button className="btn" onClick={run} disabled={busy}>{busy?t('analyzing'):t('analyze')}</button>}</div>
 return <div className="mx-auto max-w-2xl"><ol className="mb-6 flex flex-wrap gap-2 text-sm">{[1,2,3,4,5,6].map(n=><li key={n} aria-current={n===Math.min(step,6)} className={`rounded-full px-3 py-1 ${n===step?'bg-leaf text-white':'bg-stone'}`}>{t('s'+n)}</li>)}</ol>
  {err&&<p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm">{err}</p>}
  {step===1&&<section><p className="mb-3">{t('photosNote')}</p><label className="btn inline-block cursor-pointer">{t('add')}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>addFiles(e.target.files)}/></label>
   <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{imgs.map((u,i)=><div key={i}><img src={u} alt="" className="h-28 w-full rounded object-cover"/><button className="text-sm underline" onClick={()=>setImgs(imgs.filter((_,j)=>j!==i))}>{t('remove')}</button></div>)}</div>{nav}</section>}
  {step===2&&<section className="space-y-3"><div className="grid gap-2 sm:grid-cols-2">{TYPES.map(k=><label key={k} className={`cursor-pointer rounded border p-3 ${type===k?'border-leaf bg-white ring-2 ring-leaf':'border-stone bg-white'}`}><input className="mr-2" type="radio" name="type" checked={type===k} onChange={()=>setType(k)}/>{t('ty_'+k)}</label>)}</div>
   <label className="block">{t('desc')}<textarea className="inp mt-1" rows={4} maxLength={2000} placeholder={t('descPh')} value={desc} onChange={e=>setDesc(e.target.value)}/></label>{nav}</section>}
  {step===3&&<section className="space-y-3"><label className="block">{type==='fence'?t('areaFence'):t('area')}<input className="inp mt-1" type="number" min="0" max="100000" value={area} onChange={e=>setArea(e.target.value)}/></label>
   {['paving','artificial','fence'].includes(type)&&<label className="block">{t('materials')}<input className="inp mt-1" maxLength={200} value={materials} onChange={e=>setMaterials(e.target.value)}/></label>}
   {['paving','renovation','artificial','lawn','garden'].includes(type)&&<label className="flex items-center gap-2"><input type="checkbox" checked={remove} onChange={e=>setRemove(e.target.checked)}/>{t('removeOld')}</label>}
   <label className="block">{t('access')}<select className="inp mt-1" value={access} onChange={e=>setAccess(e.target.value)}><option value="easy">{t('accessEasy')}</option><option value="hard">{t('accessHard')}</option></select></label>
   <label className="block">{t('time')}<select className="inp mt-1" value={time} onChange={e=>setTime(e.target.value)}>{['t1','t2','t3'].map(k=><option key={k} value={k}>{t(k)}</option>)}</select></label>{nav}</section>}
  {step>=5&&an&&<section className="space-y-5"><p className="rounded border border-straw bg-white p-3 text-sm">{t(an.mode==='demo'?'demo':'ai')}</p>
   <div><h2 className="font-display text-xl font-bold">{t('cats')}</h2><ul className="mt-1 text-sm">{an.items.map(i=>{const a=c.activities.find(x=>x.id===i.activityId);return a&&<li key={i.activityId}>{a.name} <span className="text-ink/70">({t(i.source==='customer'?'customer':'assumed')})</span></li>})}</ul><p className="mt-1 text-sm">{t('confidence')}: {t(an.confidence)}</p></div>
   <Estimate items={items}/>
   {[['assumptions',an.assumptions],['missing',an.missing],['questions',an.questions]].map(([k,l])=>(l as string[]).length>0&&<div key={k as string}><h3 className="font-medium">{t(k as string)}</h3><ul className="list-disc pl-5 text-sm">{(l as string[]).map(x=><li key={x}>{t(x)}</li>)}</ul></div>)}
   <p className="text-sm font-medium">{t('disclaimer')}</p>
   <div className="flex gap-3"><button className="btn" onClick={pdf} disabled={pdfBusy}>{pdfBusy?'…':t('download')}</button><button className="btn2" onClick={()=>{setStep(1);setAn(null);setImgs([]);setDesc('');setArea('')}}>{t('restart')}</button></div></section>}</div>}
