// AI only interprets the project. It NEVER supplies prices; quantities map to the company's activity ids.
export type Input={type:string;desc:string;area:number|null;remove:boolean;access:string;materials:string;time:string;activities:{id:string;name:string;unit:string}[]}
export type Analysis={mode:'demo'|'ai';items:{activityId:string;qtyMin:number;qtyMax:number;source:'customer'|'assumed'}[];assumptions:string[];missing:string[];questions:string[];confidence:'low'|'medium'|'high'}
const MAP:Record<string,string[]>={garden:['soil','planting','lawn'],paving:['paving'],lawn:['lawn','soil'],artificial:['artificial'],fence:['fence'],planting:['soil','planting'],renovation:['clearance','soil','planting'],other:['clearance']}
export function demo(i:Input):Analysis{
 const ids=[...(MAP[i.type]??['clearance'])];if(i.remove&&!ids.includes('remove')&&i.type!=='fence')ids.push('remove')
 const known=i.area!==null&&i.area>0
 const items=ids.filter(id=>i.activities.some(a=>a.id===id)).map(id=>{
  const a=known?i.area!:(id==='fence'?10:25);const hrs=id==='clearance'
  const base=hrs?Math.max(2,Math.ceil(a/10)):a
  return {activityId:id,qtyMin:known?base:Math.round(base*0.6),qtyMax:known?base:Math.round(base*1.4),source:known?'customer' as const:'assumed' as const}})
 const assumptions=[...(known?[]:['a_area']),...(i.access==='hard'?['a_access']:[]),'a_excl']
 return {mode:'demo',items,assumptions,missing:known?[]:['m_dims'],questions:['q_hidden','q_soil'],confidence:known?'medium':'low'}}
export async function analyze(i:Input,images:Buffer[]):Promise<Analysis>{
 const key=process.env.ANTHROPIC_API_KEY;if(!key)return demo(i)
 try{
  const prompt=`You assist a landscaping estimate. Return ONLY JSON: {"items":[{"activityId":string,"qtyMin":number,"qtyMax":number}],"assumptions":string[],"missing":string[],"questions":string[],"confidence":"low|medium|high"}. Use ONLY these activityIds: ${JSON.stringify(i.activities)}. Never output prices. Do not invent exact measurements; give ranges if unsure. Customer area (m²): ${i.area??'unknown'}. Project type: ${i.type}. Remove old: ${i.remove}. Description: ${i.desc.slice(0,1500)}`
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-sonnet-5-5',max_tokens:1000,messages:[{role:'user',content:[...images.map(b=>({type:'image',source:{type:'base64',media_type:'image/jpeg',data:b.toString('base64')}})),{type:'text',text:prompt}]}]})})
  if(!r.ok)throw new Error('provider '+r.status)
  const d=await r.json();const j=JSON.parse(String(d.content?.[0]?.text).replace(/```json|```/g,'').trim())
  const items=(j.items||[]).filter((x:any)=>i.activities.some(a=>a.id===x.activityId)&&isFinite(x.qtyMin)&&isFinite(x.qtyMax)).map((x:any)=>({activityId:x.activityId,qtyMin:Math.max(0,+x.qtyMin),qtyMax:Math.max(0,+x.qtyMax),source:(i.area?'customer':'assumed') as 'customer'|'assumed'}))
  const s=(a:any)=>(Array.isArray(a)?a:[]).slice(0,8).map((x:any)=>String(x).slice(0,200))
  return {mode:'ai',items,assumptions:[...s(j.assumptions),'a_excl'],missing:s(j.missing),questions:s(j.questions),confidence:['low','medium','high'].includes(j.confidence)?j.confidence:'low'}
 }catch(e){console.error('AI provider failed');return demo(i)} // never log content
}
