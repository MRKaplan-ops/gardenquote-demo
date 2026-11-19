'use client'
import {useState} from 'react'
import {useApp} from '@/components/Providers'
import {Result} from '@/components/Result'
import {gardenSvg} from '@/lib/visual'
import {actName} from '@/lib/i18n'
import {PRIMARY,TYPE_CATS,type Analysis} from '@/lib/ai'
import {TIERS,type Item} from '@/lib/pricing/engine'
const TYPES=['makeover','paving','artificial','pruning','garden','lawn','fence','planting','canopy','renovation','other']
const MAXF=8*1024*1024
async function toJpeg(f:File){const b=await createImageBitmap(f);const k=Math.min(1,1400/Math.max(b.width,b.height));const cv=document.createElement('canvas');cv.width=b.width*k;cv.height=b.height*k;cv.getContext('2d')!.drawImage(b,0,0,cv.width,cv.height);return cv.toDataURL('image/jpeg',.85)} // re-encode strips EXIF client-side too
export default function Quote(){
 const {t,c,lang}=useApp()
 const [step,setStep]=useState(1),[imgs,setImgs]=useState<string[]>([]),[types,setTypes]=useState<string[]>(['paving']),[desc,setDesc]=useState(''),[area,setArea]=useState(''),[split,setSplit]=useState(false),[areas,setAreas]=useState<Record<string,string>>({}),[fenceLen,setFenceLen]=useState(''),[remove,setRemove]=useState(false),[access,setAccess]=useState('easy'),[materials,setMaterials]=useState(''),[time,setTime]=useState('t2')
 const [insp,setInsp]=useState<string[]>([]),[tier,setTier]=useState(1),[an,setAn]=useState<Analysis|null>(null),[items,setItems]=useState<Item[]>([]),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[pdfBusy,setPdfBusy]=useState(false)
 const cats=types.flatMap(x=>TYPE_CATS[x]||[]),prim=PRIMARY.filter(id=>cats.includes(id)&&c.activities.some(a=>a.id===id)),onlyFence=types.length>0&&types.every(x=>x==='fence')
 const toggle=(k:string)=>setTypes(types.includes(k)?types.filter(x=>x!==k):[...types,k])
 const addFiles=async(fl:FileList|null,cur:string[]=imgs,set:(v:string[])=>void=setImgs,max=5)=>{setErr('');const out=[...cur];for(const f of Array.from(fl||[])){if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>MAXF||out.length>=max){setErr(t('err'));continue}try{out.push(await toJpeg(f))}catch{setErr(t('err'))}}set(out)}
 const run=async()=>{setBusy(true);setErr('');try{
  const sub:Record<string,number>={};if(split)for(const [k,v] of Object.entries(areas))if(Number(v)>0)sub[k]=Number(v)
  if(Number(fenceLen)>0&&types.includes('fence'))sub.fence=Number(fenceLen)
  const fd=new FormData();fd.append('payload',JSON.stringify({types,areas:sub,desc,area:area?Number(area):null,remove,access,materials,time,activities:c.activities.map(a=>({id:a.id,name:actName(a,lang),unit:a.unit}))}))
  for(const u of [...imgs,...insp].filter(x=>x.startsWith('data:image/jpeg')))fd.append('images',await (await fetch(u)).blob(),'p.jpg')
  const r=await fetch('/api/analyze',{method:'POST',body:fd});if(!r.ok)throw new Error('x');const res:Analysis=await r.json()
  setAn(res);setItems(res.items.map(i=>({activityId:i.activityId,qtyMin:i.qtyMin,qtyMax:i.qtyMax,variant:i.variant})));setStep(5)}catch{setErr(t('err'))}setBusy(false)}
 const pdf=async()=>{setPdfBusy(true);try{const [{pdf},{EstimatePdf}]=await Promise.all([import('@react-pdf/renderer'),import('@/components/EstimatePdf')])
  const blob=await pdf(<EstimatePdf c={c} items={items} desc={desc} images={imgs.filter(x=>x.startsWith('data:image/jpeg'))} mult={TIERS[tier].m} tierName={t('tier_'+TIERS[tier].id)} notes={(an?.assumptions||[]).map(t)} t={t} lang={lang}/>).toBlob();const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='estimate.pdf';a.click();URL.revokeObjectURL(a.href)}catch{setErr(t('err'))}setPdfBusy(false)}
 const descOptional=types.includes('makeover')&&insp.length>0&&!types.includes('other')
 const loadExample=()=>{setErr('');setImgs([gardenSvg('before')]);setTypes(['paving','artificial']);setDesc('Nieuw terras met keramische tegels en kunstgras, oude bestrating verwijderen, bestaande schutting laten staan.');setArea('55')}
 const next=()=>{setErr('');if(step===1&&!imgs.length)return setErr(t('e_photo'));if(step===2){if(!types.length)return setErr(t('e_goal'));if(!descOptional&&desc.trim().length<10)return setErr(t('e_desc'))}setStep(step+1)}
 const nav=<div className="mt-6 flex gap-3">{step>1&&<button className="btn2" onClick={()=>setStep(step-1)}>{t('back')}</button>}{step<3&&<button className="btn" onClick={next}>{t('next')}</button>}{step===3&&<button className="btn" onClick={run} disabled={busy}>{busy?t('analyzing'):t('analyze')}</button>}</div>
 const lists:[string,string[]][]=an?[['assumptions',an.assumptions],['missing',an.missing],['questions',an.questions]]:[]
 return <div className="mx-auto max-w-2xl"><ol className="mb-6 flex flex-wrap gap-2 text-sm">{[1,2,3,4,5,6].map(n=><li key={n} aria-current={n===Math.min(step,6)} className={`rounded-full px-3 py-1 ${n===step?'text-white':'bg-stone'}`} style={n===step?{backgroundColor:c.color}:undefined}>{t('s'+n)}</li>)}</ol>
  {err&&<p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm">{err}</p>}
  {step===1&&<section><p className="mb-3">{t('photosNote')}</p><label className="btn inline-block cursor-pointer">{t('add')}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>addFiles(e.target.files)}/></label>
   <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{imgs.map((u,i)=><div key={i}><img src={u} alt="" className="h-28 w-full rounded object-cover"/><button className="text-sm underline" onClick={()=>setImgs(imgs.filter((_,j)=>j!==i))}>{t('remove')}</button></div>)}</div><button className="btn2 mt-4" onClick={loadExample}>{t('loadExample')}</button><div className="mt-6"><h3 className="font-medium">{t('insp')}</h3><p className="text-sm">{t('inspHint')}</p><label className="btn2 mt-2 inline-block cursor-pointer">{t('add')}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>addFiles(e.target.files,insp,setInsp,3)}/></label><div className="mt-2 flex gap-2">{insp.map((u,i)=><img key={i} src={u} alt="" title={t('remove')} className="h-16 w-16 cursor-pointer rounded object-cover" onClick={()=>setInsp(insp.filter((_,j)=>j!==i))}/>)}</div></div>{nav}</section>}
  {step===2&&<section className="space-y-3"><p className="text-sm">{t('multi')}</p><div className="grid gap-2 sm:grid-cols-2">{TYPES.map(k=><label key={k} className={`cursor-pointer rounded border p-3 ${k==='makeover'?'sm:col-span-2 font-medium':''} ${types.includes(k)?'border-[color:var(--brand)] bg-white ring-2 ring-[color:var(--brand)]':'border-stone bg-white'}`}><input className="mr-2" type="checkbox" checked={types.includes(k)} onChange={()=>toggle(k)}/>{t('ty_'+k)}</label>)}</div>
   {types.includes('makeover')&&!insp.length&&<p className="rounded bg-stone p-3 text-sm">{t('makeoverHint')}</p>}<label className="block">{t('desc')}{descOptional?` (${t('optional')})`:''}<textarea className="inp mt-1" rows={4} maxLength={2000} placeholder={t('descPh')} value={desc} onChange={e=>setDesc(e.target.value)}/></label>{nav}</section>}
  {step===3&&<section className="space-y-3">
   {!onlyFence&&<p className="rounded bg-stone p-3 text-sm">{t('optHint')}</p>}
   {!onlyFence&&<label className="block">{t('area')} ({t('optional')})<input className="inp mt-1" type="number" min="0" max="100000" value={area} onChange={e=>setArea(e.target.value)}/></label>}
   {prim.length>1&&<div><label className="flex items-center gap-2"><input type="checkbox" checked={split} onChange={e=>setSplit(e.target.checked)}/>{t('split')}</label>
    {split&&<div className="mt-2 grid gap-2 sm:grid-cols-2">{prim.map(id=>{const a=c.activities.find(x=>x.id===id)!;return <label key={id} className="block text-sm">{actName(a,lang)} (m²)<input className="inp mt-1" type="number" min="0" value={areas[id]||''} onChange={e=>setAreas({...areas,[id]:e.target.value})}/></label>})}<p className="text-xs sm:col-span-2">{t('splitHint')}</p></div>}</div>}
   {types.includes('fence')&&<label className="block">{t('areaFence')} ({t('optional')})<input className="inp mt-1" type="number" min="0" value={fenceLen} onChange={e=>setFenceLen(e.target.value)}/></label>}
   {types.some(x=>['paving','artificial','fence','canopy'].includes(x))&&<label className="block">{t('materials')}<input className="inp mt-1" maxLength={200} value={materials} onChange={e=>setMaterials(e.target.value)}/></label>}
   <label className="flex items-center gap-2"><input type="checkbox" checked={remove} onChange={e=>setRemove(e.target.checked)}/>{t('removeOld')}</label>
   <label className="block">{t('access')}<select className="inp mt-1" value={access} onChange={e=>setAccess(e.target.value)}><option value="easy">{t('accessEasy')}</option><option value="hard">{t('accessHard')}</option></select></label>
   <label className="block">{t('time')}<select className="inp mt-1" value={time} onChange={e=>setTime(e.target.value)}>{['t1','t2','t3'].map(k=><option key={k} value={k}>{t(k)}</option>)}</select></label>{nav}</section>}
  {step>=5&&an&&<section className="space-y-5"><p className="rounded border border-straw bg-white p-3 text-sm">{t(an.mode==='demo'?'demo':'ai')}</p>
   <div><h2 className="font-display text-xl font-bold">{t('cats')}</h2><ul className="mt-1 text-sm">{an.items.map(i=>{const a=c.activities.find(x=>x.id===i.activityId);return a&&<li key={i.activityId}>{actName(a,lang,i.variant)} <span className="text-ink/70">({t(i.source==='customer'?'customer':'assumed')})</span></li>})}</ul><p className="mt-1 text-sm">{t('confidence')}: {t(an.confidence)}</p></div>
   <Result items={items} tier={tier} setTier={setTier} before={imgs[0]||''} onPdf={pdf} pdfBusy={pdfBusy}/>
   {lists.map(([k,l])=>l.length>0&&<div key={k}><h3 className="font-medium">{t(k)}</h3><ul className="list-disc pl-5 text-sm">{l.map(x=><li key={x}>{t(x)}</li>)}</ul></div>)}
   <p className="text-sm font-medium">{t('disclaimer')}</p>
   <div className="flex gap-3"><button className="btn2" onClick={()=>{setStep(1);setAn(null);setItems([]);setImgs([]);setInsp([]);setTier(1);setDesc('');setArea('');setAreas({});setFenceLen('')}}>{t('restart')}</button></div></section>}</div>}
