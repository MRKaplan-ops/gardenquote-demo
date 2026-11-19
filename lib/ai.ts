// AI only interprets the project. It NEVER supplies prices; quantities map to the company's activity ids.
export type Input={types:string[];areas:Record<string,number>;desc:string;area:number|null;remove:boolean;access:string;materials:string;time:string;activities:{id:string;name:string;unit:string}[]}
export type Analysis={mode:'demo'|'ai';items:{activityId:string;qtyMin:number;qtyMax:number;source:'customer'|'assumed';variant?:string}[];assumptions:string[];missing:string[];questions:string[];confidence:'low'|'medium'|'high'}
export const PRIMARY=['paving','artificial','lawn','planting','canopy']
export const TYPE_CATS:Record<string,string[]>={garden:['lawn','planting'],makeover:['paving','lawn','planting'],pruning:['clearance'],paving:['paving'],lawn:['lawn'],artificial:['artificial'],fence:['fence'],planting:['planting'],renovation:['planting','clearance'],canopy:['canopy'],other:[]}
const KW:[RegExp,string][]=[[/keramisch|tegel|bestrating|klinker|terras|tile|paving|patio|terrace/i,'paving'],[/gazon|graszod|\bgras\b|lawn|turf|sod/i,'lawn'],[/schutting|hekwerk|afrastering|fence/i,'fence'],[/overkapping|veranda|pergola|canopy/i,'canopy'],[/border|beplant|planten|hagen|hedge/i,'planting'],[/leeghalen|snoei|opruim|rooien|clearance|pruning/i,'clearance'],[/slopen|sloop|afbreken|weghalen|verwijder|demolish|remove/i,'remove']]
const OLD='(oude|bestaande|existing|old)\\s+(bestrating|tegels?|klinkers|paving|tiles)',ART=/kunstgras|artificial (grass|turf)/i
const NEG=/laten staan|laat staan|blijft|blijven|behouden|behoud|niet vervangen|\b(geen|no|not|keep)\b/i
const BROAD=['garden','renovation','makeover'] // broad types only supply defaults when the text names nothing specific
export function detect(types:string[],desc:string,remove:boolean){
 const clean=desc.split(/[.;!?\n,]+|\s+(?:en|maar|and|but)\s+/i).filter(x=>!NEG.test(x)).join('. ')
 let rem=remove||new RegExp(OLD,'i').test(clean)
 const d=clean.replace(new RegExp(OLD,'gi'),' '),kw=new Set<string>()
 if(ART.test(d))kw.add('artificial')
 const d2=d.replace(new RegExp(ART.source,'gi'),' ')
 for(const [re,id] of KW)if(re.test(d2)){if(id==='remove')rem=true;else kw.add(id)}
 const cats=new Set<string>([...types.filter(x=>!BROAD.includes(x)).flatMap(x=>TYPE_CATS[x]??[]),...kw])
 if(![...cats].some(x=>PRIMARY.includes(x)))types.filter(x=>BROAD.includes(x)).flatMap(x=>TYPE_CATS[x]??[]).forEach(x=>cats.add(x))
 return {cats,rem,ceramic:/keramisch|ceramic|porcelain/i.test(d2)}}
type Q={lo:number;hi:number;src:'customer'|'assumed'}
export function demo(i:Input):Analysis{
 const {cats,rem,ceramic}=detect(i.types,i.desc,i.remove),q:Record<string,Q>={},given=i.areas||{},total=i.area&&i.area>0?i.area:0
 let defaulted=false,split=false
 const P=PRIMARY.filter(x=>cats.has(x)),rest=P.filter(x=>!(given[x]>0))
 const left=Math.max(0,total-P.filter(x=>given[x]>0).reduce((n,x)=>n+given[x],0))
 const dflt=(v:number):Q=>{defaulted=true;return {lo:Math.round(v*.6),hi:Math.round(v*1.4),src:'assumed'}}
 const W=(x:string)=>x==='planting'?10:x==='canopy'?20:45,sw=rest.reduce((n,x)=>n+W(x),0)||1
 for(const x of P){
  if(given[x]>0)q[x]={lo:given[x],hi:given[x],src:'customer'}
  else if(total>0&&left>0){const v=Math.round(left*W(x)/sw),one=rest.length===1;if(!one)split=true;q[x]=one?{lo:v,hi:v,src:'customer'}:{lo:Math.round(v*.93),hi:Math.round(v*1.07),src:'assumed'}}
  else q[x]=dflt(25)}
 if(cats.has('fence'))q.fence=given.fence>0?{lo:given.fence,hi:given.fence,src:'customer'}:dflt(10)
 const sum=(ids:string[]):Q|null=>{const h=ids.filter(x=>q[x]);return h.length?{lo:h.reduce((n,x)=>n+q[x].lo,0),hi:h.reduce((n,x)=>n+q[x].hi,0),src:h.every(x=>q[x].src==='customer')?'customer':'assumed'}:null}
 if(rem)q.remove=sum(['paving','artificial','lawn'])??(total>0?{lo:total,hi:total,src:'customer'}:dflt(25))
 if(['artificial','lawn','planting'].some(x=>cats.has(x)))q.soil=sum(['artificial','lawn','planting'])!
 if(cats.has('clearance')){const b=Math.max(2,Math.ceil((total||sum(P)?.hi||20)/10));q.clearance={lo:b,hi:Math.ceil(b*1.5),src:'assumed'}}
 if(!Object.keys(q).length)q.clearance=dflt(6)
 const items=['clearance','remove','soil','paving','artificial','lawn','planting','canopy','fence'].filter(id=>q[id]&&i.activities.some(a=>a.id===id)).map(id=>({activityId:id,qtyMin:q[id].lo,qtyMax:q[id].hi,source:q[id].src,variant:id==='paving'&&ceramic?'ceramic':undefined}))
 return {mode:'demo',items,assumptions:[...(defaulted?['a_area']:[]),...(split?['a_split']:[]),...(i.access==='hard'?['a_access']:[]),'a_excl'],missing:defaulted?['m_dims']:[],questions:['q_hidden','q_soil'],confidence:defaulted?'low':'medium'}}
export async function analyze(i:Input,images:Buffer[]):Promise<Analysis>{
 const key=process.env.ANTHROPIC_API_KEY;if(!key)return demo(i)
 try{
  const prompt=`You assist a landscaping estimate. Return ONLY JSON: {"items":[{"activityId":string,"qtyMin":number,"qtyMax":number}],"assumptions":string[],"missing":string[],"questions":string[],"confidence":"low|medium|high"}. Use ONLY these activityIds: ${JSON.stringify(i.activities)}. Never output prices. Do not invent exact measurements; give ranges if unsure. Customer area (m²): ${i.area??'unknown'}. Project types: ${i.types.join(',')}. Sub-areas (m²/m): ${JSON.stringify(i.areas)}. Remove old: ${i.remove}. Description: ${i.desc.slice(0,1500)}`
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-sonnet-5-5',max_tokens:1000,messages:[{role:'user',content:[...images.map(b=>({type:'image',source:{type:'base64',media_type:'image/jpeg',data:b.toString('base64')}})),{type:'text',text:prompt}]}]})})
  if(!r.ok)throw new Error('provider '+r.status)
  const d=await r.json();const j=JSON.parse(String(d.content?.[0]?.text).replace(/```json|```/g,'').trim())
  const items=(j.items||[]).filter((x:any)=>i.activities.some(a=>a.id===x.activityId)&&isFinite(x.qtyMin)&&isFinite(x.qtyMax)).map((x:any)=>({activityId:x.activityId,qtyMin:Math.max(0,+x.qtyMin),qtyMax:Math.max(0,+x.qtyMax),source:(i.area?'customer':'assumed') as 'customer'|'assumed'}))
  const s=(a:any)=>(Array.isArray(a)?a:[]).slice(0,8).map((x:any)=>String(x).slice(0,200))
  return {mode:'ai',items,assumptions:[...s(j.assumptions),'a_excl'],missing:s(j.missing),questions:s(j.questions),confidence:['low','medium','high'].includes(j.confidence)?j.confidence:'low'}
 }catch(e){console.error('AI provider failed');return demo(i)} // never log content
}
