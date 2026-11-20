import {NextRequest,NextResponse} from 'next/server'
import sharp from 'sharp'
export const runtime='nodejs';export const maxDuration=60
const OK=['image/jpeg','image/png','image/webp'],MAX=8*1024*1024
const STY:Record<string,string>={modern:'modern and sleek, large-format grey porcelain tiles, clean lines, low clipped hedges, black slat fence, minimal planters',kids:'child-friendly family garden with realistic artificial grass, safe play area, small wooden playhouse, soft planting',green:'green natural Dutch garden with lawn, mixed flowering borders, native shrubs and a small tree',luxe:'luxury terrace with a modern aluminium pergola, ceramic tiles, ambient lighting, lounge furniture and planters',low:'low-maintenance garden with gravel, stepping stones, ornamental grasses and few evergreen plants'}
let hits:number[]=[] // global limiter, no IPs collected
const demo=()=>NextResponse.json({mode:'demo'})
export async function POST(req:NextRequest){
 const now=Date.now();hits=hits.filter(t=>now-t<60000);if(hits.length>=10)return NextResponse.json({error:'busy'},{status:429});hits.push(now)
 const oa=process.env.OPENAI_API_KEY,rp=process.env.REPLICATE_API_TOKEN
 try{
  const f=await req.formData(),style=String(f.get('style')||'');if(!STY[style])return NextResponse.json({error:'invalid'},{status:400})
  if(!oa&&!rp)return demo()
  const file=f.get('image');let img:Buffer|null=null
  if(file&&typeof file!=='string'){if(!OK.includes(file.type)||file.size>MAX)return NextResponse.json({error:'invalid image'},{status:400});img=await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize(1536,1024,{fit:'inside'}).png().toBuffer()} // EXIF dropped, memory only
  const prompt=`Photorealistic architectural render of a Dutch back garden, ${STY[style]}. Keep the house, layout and camera perspective of the reference. Customer wishes: ${String(f.get('wish')||'').slice(0,500)}. Natural daylight, high detail, no text, no people.`
  if(oa){const model=process.env.OPENAI_IMAGE_MODEL||'gpt-image-1',edit=!!img&&model==='gpt-image-1'
   let r:Response
   if(edit){const fd=new FormData();fd.append('model',model);fd.append('prompt',prompt);fd.append('size','1536x1024');fd.append('image',new Blob([new Uint8Array(img!)],{type:'image/png'}),'garden.png')
    r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+oa},body:fd})}
   else r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+oa,'content-type':'application/json'},body:JSON.stringify(model==='dall-e-3'?{model,prompt,size:'1792x1024',response_format:'b64_json'}:{model,prompt,size:'1536x1024'})})
   if(!r.ok)throw new Error('openai '+r.status);const b=(await r.json()).data?.[0]?.b64_json;if(!b)throw new Error('empty')
   return NextResponse.json({mode:'ai',image:'data:image/png;base64,'+b})}
  const r=await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',{method:'POST',headers:{Authorization:'Bearer '+rp,'content-type':'application/json',Prefer:'wait'},body:JSON.stringify({input:{prompt,aspect_ratio:'3:2',output_format:'png'}})}) // text-to-image only: the reference photo is not used
  if(!r.ok)throw new Error('replicate '+r.status);const u=(await r.json()).output?.[0];if(typeof u!=='string'||!u.startsWith('https://'))throw new Error('empty')
  const im=await fetch(u);if(!im.ok)throw new Error('fetch');return NextResponse.json({mode:'ai',image:'data:image/png;base64,'+Buffer.from(await im.arrayBuffer()).toString('base64')})
 }catch{console.error('visualize provider failed');return demo()} // never log content; UI falls back to demo illustration
}
