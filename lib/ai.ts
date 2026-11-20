// AI only interprets the project. It NEVER supplies prices; quantities map to the company's activity ids.
export type Input={types:string[];areas:Record<string,number>;desc:string;area:number|null;remove:boolean;access:string;materials:string;time:string;activities:{id:string;name:string;unit:string}[]}
export type Analysis={mode:'demo'|'ai';summary?:string;items:{activityId:string;qtyMin:number;qtyMax:number;source:'customer'|'assumed';variant?:string}[];assumptions:string[];missing:string[];questions:string[];confidence:'low'|'medium'|'high'}
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
 const dflt=(v:number):Q=>{defaulted=true;return {lo:v,hi:v,src:'assumed'}}
 const W=(x:string)=>x==='planting'?10:x==='canopy'?20:45,sw=rest.reduce((n,x)=>n+W(x),0)||1
 for(const x of P){
  if(given[x]>0)q[x]={lo:given[x],hi:given[x],src:'customer'}
  else if(total>0&&left>0){const v=Math.round(left*W(x)/sw),one=rest.length===1;if(!one)split=true;q[x]=one?{lo:v,hi:v,src:'customer'}:{lo:v,hi:v,src:'assumed'}}
  else q[x]=dflt(25)}
 if(cats.has('fence'))q.fence=given.fence>0?{lo:given.fence,hi:given.fence,src:'customer'}:dflt(10)
 const sum=(ids:string[]):Q|null=>{const h=ids.filter(x=>q[x]);return h.length?{lo:h.reduce((n,x)=>n+q[x].lo,0),hi:h.reduce((n,x)=>n+q[x].hi,0),src:h.every(x=>q[x].src==='customer')?'customer':'assumed'}:null}
 if(rem)q.remove=sum(['paving','artificial','lawn'])??(total>0?{lo:total,hi:total,src:'customer'}:dflt(25))
 if(['artificial','lawn','planting'].some(x=>cats.has(x)))q.soil=sum(['artificial','lawn','planting'])!
 if(cats.has('clearance')){const b=Math.max(2,Math.ceil((total||sum(P)?.hi||20)/10));q.clearance={lo:b,hi:b,src:'assumed'}}
 if(!Object.keys(q).length)q.clearance=dflt(6)
 const items=['clearance','remove','soil','paving','artificial','lawn','planting','canopy','fence'].filter(id=>q[id]&&i.activities.some(a=>a.id===id)).map(id=>({activityId:id,qtyMin:q[id].lo,qtyMax:q[id].hi,source:q[id].src,variant:id==='paving'&&ceramic?'ceramic':undefined}))
 return {mode:'demo',items,assumptions:[...(defaulted?['a_area']:[]),...(split?['a_split']:[]),...(i.access==='hard'?['a_access']:[]),...(rem?['a_remove']:[]),'a_excl'],missing:defaulted?['m_dims']:[],questions:['q_hidden','q_soil'],confidence:defaulted?'low':'medium'}}
const PROMPT=(i:Input,insp:boolean)=>`Je bent een ervaren Nederlandse tuinontwerper en calculator. Je krijgt foto's van de HUIDIGE tuin${insp?' en daarna INSPIRATIEFOTO\'S (alleen stijlwensen, niet meten)':''}. Geef per werkzaamheid één puntwaarde (één getal, GEEN bandbreedte) en schat met Nederlandse referentie-objecten die zichtbaar zijn: schuttingpanelen zijn 1,80 m breed, standaard tuintegels 30x30 of 60x60 cm, achterdeuren ca. 0,95 m breed. Gok nooit wild. Klantmaten zijn de waarheid. Antwoord ALLEEN met JSON: {"summary":"precies 2 vriendelijke Nederlandse zinnen over wat je in de tuin ziet","items":[{"activityId":string,"qty":number}],"assumptions":string[],"missing":string[],"questions":string[],"confidence":"low|medium|high"}. Gebruik ALLEEN deze activityIds: ${JSON.stringify(i.activities)} (m² oppervlakte, m strekkende meter, h uren). Geef NOOIT prijzen. Klant: doelen ${i.types.join(',')}; totale oppervlakte ${i.area??'onbekend'}; deelmaten ${JSON.stringify(i.areas)}; oud materiaal verwijderen: ${i.remove}; omschrijving: ${i.desc.slice(0,1500)}. Neem niets op wat "laten staan" of "behouden" moet worden.`
const b64=(b:Buffer)=>b.toString('base64')
async function ask(prompt:string,imgs:Buffer[],insp:Buffer[]):Promise<string>{
 const ak=process.env.ANTHROPIC_API_KEY,ok=process.env.OPENAI_API_KEY
 if(ak){const im=(b:Buffer)=>({type:'image',source:{type:'base64',media_type:'image/jpeg',data:b64(b)}})
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':ak,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-sonnet-5-5',max_tokens:1200,messages:[{role:'user',content:[{type:'text',text:'Huidige tuin:'},...imgs.map(im),...(insp.length?[{type:'text',text:'Inspiratie:'},...insp.map(im)]:[]),{type:'text',text:prompt}]}]})})
  if(!r.ok)throw new Error('anthropic '+r.status);return String((await r.json()).content?.[0]?.text)}
 if(ok){const im=(b:Buffer)=>({type:'image_url',image_url:{url:'data:image/jpeg;base64,'+b64(b)}})
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+ok,'content-type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_VISION_MODEL||'gpt-4o',max_tokens:1200,response_format:{type:'json_object'},messages:[{role:'user',content:[{type:'text',text:prompt},...imgs.map(im),...insp.map(im)]}]})})
  if(!r.ok)throw new Error('openai '+r.status);return String((await r.json()).choices?.[0]?.message?.content)}
 throw new Error('no key')}
export async function analyze(i:Input,images:Buffer[],insp:Buffer[]=[]):Promise<Analysis>{
 if(!process.env.ANTHROPIC_API_KEY&&!process.env.OPENAI_API_KEY)return demo(i)
 try{
  const j=JSON.parse((await ask(PROMPT(i,insp.length>0),images,insp)).replace(/```json|```/g,'').trim())
  const items=(Array.isArray(j.items)?j.items:[]).flatMap((x:any)=>{const a=i.activities.find(y=>y.id===x.activityId);const v=x.qty!==undefined?+x.qty:(+x.qtyMin+ +x.qtyMax)/2;if(!a||!isFinite(v))return []
   const g=i.areas[a.id];if(g>0)return [{activityId:a.id,qtyMin:g,qtyMax:g,source:'customer' as const}]
   let mid=Math.max(0,v);if(a.unit==='m²'&&i.area&&i.area>0)mid=Math.min(mid,i.area*1.1)
   const p=a.unit==='h'?Math.round(mid*2)/2:Math.round(mid);return [{activityId:a.id,qtyMin:p,qtyMax:p,source:'assumed' as const}]})
  if(!items.length)throw new Error('empty')
  const s=(a:any)=>(Array.isArray(a)?a:[]).slice(0,8).map((x:any)=>String(x).slice(0,200))
  return {mode:'ai',summary:String(j.summary||'').slice(0,400),items,assumptions:[...s(j.assumptions),...(i.access==='hard'?['a_access']:[]),...(i.remove?['a_remove']:[]),'a_excl'],missing:s(j.missing),questions:s(j.questions),confidence:['low','medium','high'].includes(j.confidence)?j.confidence:'low'}
 }catch{console.error('AI provider failed');return demo(i)} // never log content
}
