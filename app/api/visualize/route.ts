import {NextRequest,NextResponse} from 'next/server'
import sharp from 'sharp'
export const runtime='nodejs';export const maxDuration=60
const OK=['image/jpeg','image/png','image/webp'],MAX=8*1024*1024
const STY:Record<string,string>={modern:'modern and sleek, large-format grey porcelain tiles, clean lines, low clipped hedges, black slat fence, minimal planters',kids:'child-friendly family garden with realistic artificial grass, safe play area, small wooden playhouse, soft planting',green:'green natural Dutch garden with lawn, mixed flowering borders, native shrubs and a small tree',luxe:'luxury terrace with a modern aluminium pergola/canopy, large-format ceramic tiles, ambient lighting, lounge furniture and planters',low:'low-maintenance garden with gravel, stepping stones, ornamental grasses and few evergreen plants'}
let hits:number[]=[] // global limiter, no IPs collected
const out=(o:object)=>NextResponse.json(o)
type Err={status:number;code?:string;message?:string}
// Minimal parameters only: gpt-image-1 rejects dall-e-3 params (response_format, style, quality=hd); dall-e-3 needs response_format.
async function oai(key:string,prompt:string,imgs:Buffer[],model:string):Promise<string>{
 const size=process.env.OPENAI_IMAGE_SIZE||'1024x1024';let r:Response
 if(model==='gpt-image-1'&&imgs.length){const fd=new FormData();fd.append('model',model);fd.append('prompt',prompt);fd.append('n','1');fd.append('size',size)
  imgs.forEach((b,i)=>fd.append('image[]',new Blob([new Uint8Array(b)],{type:'image/png'}),`i${i}.png`))
  r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+key},body:fd})}
 else r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify(model==='gpt-image-1'?{model,prompt,n:1,size}:{model,prompt,n:1,size:'1024x1024',response_format:'b64_json'})})
 const d:any=await r.json().catch(()=>({}))
 if(!r.ok){const e:Err={status:r.status,code:d?.error?.code||d?.error?.type,message:String(d?.error?.message||'').slice(0,300)};console.error('openai image error',model,e.status,e.code,e.message);throw e} // API error text only, never user content
 const x=d.data?.[0];if(x?.b64_json)return 'data:image/png;base64,'+x.b64_json
 if(typeof x?.url==='string'&&x.url.startsWith('https://')){const im=await fetch(x.url);if(im.ok)return 'data:image/png;base64,'+Buffer.from(await im.arrayBuffer()).toString('base64')}
 throw {status:0,code:'empty'} as Err}
export async function POST(req:NextRequest){
 const now=Date.now();hits=hits.filter(t=>now-t<60000);if(hits.length>=10)return NextResponse.json({error:'busy'},{status:429});hits.push(now)
 const oa=process.env.OPENAI_API_KEY,rp=process.env.REPLICATE_API_TOKEN
 try{
  const f=await req.formData(),style=String(f.get('style')||'');if(!STY[style])return NextResponse.json({error:'invalid'},{status:400})
  if(!oa&&!rp)return out({mode:'off'}) // no provider configured: the UI shows no visual at all
  const files=[...f.getAll('image'),...f.getAll('inspiration')].filter((x):x is File=>typeof x!=='string').slice(0,4)
  const imgs:Buffer[]=[];for(const file of files){if(!OK.includes(file.type)||file.size>MAX)return NextResponse.json({error:'invalid image'},{status:400});imgs.push(await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize(1536,1024,{fit:'inside'}).png().toBuffer())} // EXIF dropped, memory only
  const cur=String(f.get('summary')||'').slice(0,500),wish=String(f.get('wish')||'').slice(0,500)
  const base=`Photorealistic professional architectural photograph of a beautifully renovated Dutch back garden (achtertuin), shot on a full-frame DSLR with a 24mm lens at eye level in soft natural daylight. Style: ${STY[style]}. ${cur?'The current garden: '+cur+' ':''}Customer wishes: ${wish}. Realistic materials and textures, crisp detail, natural shadows, lived-in details, mature planting. NOT an illustration, NOT a cartoon, NOT a 3D render, no text, no people.`
  const pEdit=`${base} The FIRST reference image is the customer's current garden: keep the house, fence and wall positions, proportions and camera angle, and only redesign the garden itself.${imgs.length>1?' The other reference images are style inspiration: take over their materials, colours and mood.':''}`
  if(oa){const m=process.env.OPENAI_IMAGE_MODEL||'gpt-image-1';let last:Err={status:0}
   const tries:[string,string,Buffer[]][]=[[m,imgs.length?pEdit:base,imgs],...(imgs.length&&m==='gpt-image-1'?[[m,base,[]] as [string,string,Buffer[]]]:[]),['dall-e-3',base,[]]]
   for(const [model,p,im] of tries){try{return out({mode:'ai',image:await oai(oa,p,im,model)})}catch(e:any){last={status:e?.status??0,code:e?.code,message:e?.message}}}
   return out({mode:'error',status:last.status,code:last.code,message:last.message})}
  const r=await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',{method:'POST',headers:{Authorization:'Bearer '+rp,'content-type':'application/json',Prefer:'wait'},body:JSON.stringify({input:{prompt:base,aspect_ratio:'3:2',output_format:'png'}})}) // text-to-image: photo not used
  if(!r.ok)return out({mode:'error',status:r.status});const u=(await r.json()).output?.[0];if(typeof u!=='string'||!u.startsWith('https://'))return out({mode:'error',status:0,code:'empty'})
  const im=await fetch(u);if(!im.ok)return out({mode:'error',status:im.status});return out({mode:'ai',image:'data:image/png;base64,'+Buffer.from(await im.arrayBuffer()).toString('base64')})
 }catch{console.error('visualize failed');return out({mode:'error',status:500})}
}
