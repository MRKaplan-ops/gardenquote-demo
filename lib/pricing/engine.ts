// Pure, deterministic pricing. Prices come ONLY from the company's configured activities.
export type Activity={id:string;name:string;names?:Record<string,string>;unit:string;price:number}
export type Company={name:string;color:string;email:string;phone:string;currency:string;locale:string;vat:number;minProject:number;callout:number;marginLow:number;marginHigh:number;roundTo?:number;accessPct?:number;contact?:string;whatsapp?:string;leadTime?:string;activities:Activity[]}
export type Item={activityId:string;qtyMin:number;qtyMax:number;variant?:string;auto?:boolean}
const r=(n:number)=>Math.round(n*100)/100
const rt=(n:number,s:number)=>s>0?Math.round(n/s)*s:r(n) // indicative rounding, default nearest 50
export const TIERS=[{id:'basic',m:1},{id:'comfort',m:1},{id:'luxury',m:1.3}] // material multipliers
export const MAT=['paving','decking','artificial','lawn','fence','planting','canopy','lighting','pond']
const SC=['artificial','lawn','fence','planting','canopy'] // no material class: scaled by the tier multiplier
const ADDON=['canopy','lighting','pond'] // luxury add-ons: Luxe only, unless they are the customer's sole goal
function scope(c:Company,items:Item[],tierId:string):Item[]{
 if(!tierId)return items
 let it=items,has=(id:string)=>c.activities.some(a=>a.id===id)
 if(tierId!=='luxury'){const keep=it.filter(i=>!ADDON.includes(i.activityId));if(keep.length)it=keep}
 if(tierId==='basic'&&has('lawn'))it=it.map(i=>i.activityId==='artificial'?{...i,activityId:'lawn'}:i) // basic = standard grass
 const m=new Map<string,Item>();for(const i of it){const p=m.get(i.activityId);m.set(i.activityId,p?{...p,qtyMin:p.qtyMin+i.qtyMin,qtyMax:p.qtyMax+i.qtyMax}:i)};it=[...m.values()]
 if(tierId==='luxury'&&it.some(i=>MAT.includes(i.activityId))){
  const t=it.filter(i=>i.activityId==='paving'||i.activityId==='decking'),lo=t.reduce((n,i)=>n+i.qtyMin,0),hi=t.reduce((n,i)=>n+i.qtyMax,0)
  if(t.length&&has('canopy')&&!it.some(i=>i.activityId==='canopy'))it=[...it,{activityId:'canopy',qtyMin:Math.max(1,Math.round(lo*.4)),qtyMax:Math.max(1,Math.round(hi*.4)),auto:true}] // pergola over ~40% of the terrace
  if(has('lighting')&&!it.some(i=>i.activityId==='lighting'))it=[...it,{activityId:'lighting',qtyMin:1,qtyMax:1,auto:true}]}
 return it}
export function estimate(c:Company,items:Item[],mult=1,hard=false,tierId=''){
 const lines=scope(c,items,tierId).flatMap(i=>{const v=tierId?c.activities.find(x=>x.id===i.activityId+'_'+tierId):undefined,a=v??c.activities.find(x=>x.id===i.activityId)??c.activities.find(x=>x.id===i.activityId+'_comfort');if(!a||!isFinite(i.qtyMin+i.qtyMax))return []
  const lo=Math.max(0,Math.min(i.qtyMin,i.qtyMax)),hi=Math.max(0,i.qtyMin,i.qtyMax)
  const pr=v||a.id.includes('_')?a.price:SC.includes(a.id)?a.price*mult:a.price
  return [{activity:{...a,price:r(pr)},variant:i.variant,auto:i.auto,qtyMin:lo,qtyMax:hi,subMin:r(pr*lo*(1-c.marginLow/100)),subMax:r(pr*hi*(1+c.marginHigh/100))}]})
 if(!lines.length)return {lines,subMin:0,subMax:0,callout:0,netMin:0,netMax:0,vatMin:0,vatMax:0,totalMin:0,totalMax:0,roundedMin:0,roundedMax:0,surMin:0,surMax:0}
 const subMin=r(lines.reduce((s,l)=>s+l.subMin,0)),subMax=r(lines.reduce((s,l)=>s+l.subMax,0))
 const sp=hard?(c.accessPct??15)/100:0,surMin=r(subMin*sp),surMax=r(subMax*sp) // limited access: +15% labour
 const netMin=r(Math.max(subMin+surMin+c.callout,c.minProject)),netMax=r(Math.max(subMax+surMax+c.callout,c.minProject))
 const vatMin=r(netMin*c.vat/100),vatMax=r(netMax*c.vat/100)
 return {lines,subMin,subMax,surMin,surMax,callout:c.callout,netMin,netMax,vatMin,vatMax,totalMin:r(netMin+vatMin),totalMax:r(netMax+vatMax),roundedMin:rt(r(netMin+vatMin),c.roundTo??50),roundedMax:rt(r(netMax+vatMax),c.roundTo??50)}
}
