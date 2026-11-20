import {NextRequest,NextResponse} from 'next/server'
export const runtime='nodejs';export const maxDuration=60
const STY:Record<string,string>={modern:'modern and sleek, clean lines, black slat fence, minimal planters',kids:'child-friendly family garden with a safe play area and soft planting',green:'green natural Dutch garden with mixed flowering borders, native shrubs and a small tree',luxe:'luxury entertaining garden with a lounge area',low:'low-maintenance garden with few evergreen plants and ornamental grasses'}
const TIER:Record<string,string>={basic:'neat standard concrete paving tiles and a tidy simple lawn, modest planting, no pergola, no feature lighting',comfort:'ceramic tiles, neat realistic artificial grass and tidy planted borders, no pergola',luxury:'large-format luxury ceramic tiles, warm ambient garden lighting and a wooden pergola with a lounge area'}
const V='visualize-dalle3-v10' // version marker returned in every response
let hits:number[]=[] // global limiter, no IPs collected
const out=(o:object)=>NextResponse.json(o)
export async function POST(req:NextRequest){
 const now=Date.now();hits=hits.filter(t=>now-t<60000);if(hits.length>=10)return NextResponse.json({error:'busy'},{status:429});hits.push(now)
 const oa=process.env.OPENAI_API_KEY,rp=process.env.REPLICATE_API_TOKEN
 try{
  const f=await req.formData(),style=String(f.get('style')||''),tier=String(f.get('tier')||'');if(!STY[style]||!TIER[tier])return NextResponse.json({error:'invalid'},{status:400})
  if(!oa&&!rp)return out({mode:'off'}) // no provider configured: the UI shows no visual at all
  const g=(k:string,n:number)=>String(f.get(k)||'').replace(/\s+/g,' ').slice(0,n)
  const prompt=`Photorealistic professional architectural photograph of a renovated Dutch back garden (achtertuin), full-frame DSLR, 24mm lens, eye level, soft natural daylight. Layout, boundaries and proportions of the existing garden: ${g('scene',400)||g('summary',400)||'a typical narrow rectangular Dutch backyard behind a brick terraced house'}. Finishing level: ${TIER[tier]}. Style direction: ${STY[style]}. Inspiration and colour notes: ${g('inspiration',300)||'none'}. Customer wishes: ${g('wish',500)}. Keep it a realistic, buildable Dutch backyard with a brick house, boundary fences and plausible proportions, and strictly match the finishing level above. Loose furniture, barbecues and accessories are only for atmosphere. Realistic materials, natural shadows. NOT an illustration, NOT a cartoon, NOT a 3D render, no text, no people.`.slice(0,3800)
  const cleanPrompt=prompt.replace(/[\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim()
  if(oa){
   const body={model:'gpt-image-1',prompt:cleanPrompt,n:1,size:'1024x1024'} // response_format is rejected by the API (unknown_parameter), so it is not sent
   const r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)})
   const d:any=await r.json().catch(()=>({}))
   if(!r.ok){const e=d?.error||{};console.error('openai image error',r.status,e.code,e.param,String(e.message||'').slice(0,300))
    return out({mode:'error',v:V,status:r.status,code:e.code||e.type||null,param:e.param??null,message:String(e.message||'').slice(0,300),sent:Object.keys(body)})} // sent = keys we posted, proves which code is deployed
   const x=d.data?.[0]
   if(x?.b64_json)return out({mode:'ai',v:V,image:'data:image/png;base64,'+x.b64_json})
   if(typeof x?.url==='string'&&x.url.startsWith('https://')){const im=await fetch(x.url) // download server-side: no CORS or expiring-URL problems in the browser
    if(im.ok)return out({mode:'ai',v:V,image:`data:${im.headers.get('content-type')||'image/png'};base64,`+Buffer.from(await im.arrayBuffer()).toString('base64')})
    console.error('openai image download failed',im.status);return out({mode:'error',v:V,status:im.status,code:'download_failed',param:null,message:'Could not download the generated image'})}
   console.error('openai image error: empty response');return out({mode:'error',v:V,status:0,code:'empty',param:null,message:'OpenAI returned neither b64_json nor url'})}
  const r=await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',{method:'POST',headers:{Authorization:'Bearer '+rp,'content-type':'application/json',Prefer:'wait'},body:JSON.stringify({input:{prompt:cleanPrompt,aspect_ratio:'1:1',output_format:'png'}})})
  if(!r.ok)return out({mode:'error',status:r.status});const u=(await r.json()).output?.[0];if(typeof u!=='string'||!u.startsWith('https://'))return out({mode:'error',status:0,code:'empty'})
  const im=await fetch(u);if(!im.ok)return out({mode:'error',status:im.status});return out({mode:'ai',image:'data:image/png;base64,'+Buffer.from(await im.arrayBuffer()).toString('base64')})
 }catch(e){console.error('visualize failed',e instanceof Error?e.message:'');return out({mode:'error',status:500})} // never log photo or description content
}
