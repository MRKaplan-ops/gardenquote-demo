// Pure, deterministic pricing. Prices come ONLY from the company's configured activities.
export type Activity={id:string;name:string;names?:Record<string,string>;unit:string;price:number}
export type Company={name:string;color:string;email:string;phone:string;currency:string;locale:string;vat:number;minProject:number;callout:number;marginLow:number;marginHigh:number;roundTo?:number;activities:Activity[]}
export type Item={activityId:string;qtyMin:number;qtyMax:number}
const r=(n:number)=>Math.round(n*100)/100
const rt=(n:number,s:number)=>s>0?Math.round(n/s)*s:r(n) // indicative rounding, default nearest 50
export function estimate(c:Company,items:Item[]){
 const lines=items.flatMap(i=>{const a=c.activities.find(x=>x.id===i.activityId);if(!a||!isFinite(i.qtyMin+i.qtyMax))return []
  const lo=Math.max(0,Math.min(i.qtyMin,i.qtyMax)),hi=Math.max(0,i.qtyMin,i.qtyMax)
  return [{activity:a,qtyMin:lo,qtyMax:hi,subMin:r(a.price*lo*(1-c.marginLow/100)),subMax:r(a.price*hi*(1+c.marginHigh/100))}]})
 if(!lines.length)return {lines,subMin:0,subMax:0,callout:0,netMin:0,netMax:0,vatMin:0,vatMax:0,totalMin:0,totalMax:0,roundedMin:0,roundedMax:0}
 const subMin=r(lines.reduce((s,l)=>s+l.subMin,0)),subMax=r(lines.reduce((s,l)=>s+l.subMax,0))
 const netMin=r(Math.max(subMin+c.callout,c.minProject)),netMax=r(Math.max(subMax+c.callout,c.minProject))
 const vatMin=r(netMin*c.vat/100),vatMax=r(netMax*c.vat/100)
 return {lines,subMin,subMax,callout:c.callout,netMin,netMax,vatMin,vatMax,totalMin:r(netMin+vatMin),totalMax:r(netMax+vatMax),roundedMin:rt(r(netMin+vatMin),c.roundTo??50),roundedMax:rt(r(netMax+vatMax),c.roundTo??50)}
}
