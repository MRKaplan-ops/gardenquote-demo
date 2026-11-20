import {NextRequest,NextResponse} from 'next/server'
import sharp from 'sharp'
export const runtime='nodejs';export const maxDuration=60
const OK=['image/jpeg','image/png','image/webp'],MAX=8*1024*1024
const STY:Record<string,string>={modern:'modern and sleek, large-format grey porcelain tiles, clean lines, low clipped hedges, black slat fence, minimal planters',kids:'child-friendly family garden with realistic artificial grass, safe play area, small wooden playhouse, soft planting',green:'green natural Dutch garden with lawn, mixed flowering borders, native shrubs and a small tree',luxe:'luxury terrace with a modern aluminium pergola/canopy, large-format ceramic tiles, ambient lighting, lounge furniture and planters',low:'low-maintenance garden with gravel, stepping stones, ornamental grasses and few evergreen plants'}
let hits:number[]=[] // global limiter, no IPs collected
const out=(o:object)=>NextResponse.json(o)
async function oai(key:string,prompt:string,imgs:Buffer[],model:string,fid:boolean){
 let r:Response;const q=process.env.OPENAI_IMAGE_QUALITY||'medium'
 if(imgs.length&&model==='gpt-image-1'){const fd=new FormData();fd.append('model',model);fd.append('prompt',prompt);fd.append('size','1536x1024');fd.append('quality',q);if(fid)fd.append('input_fidelity','high')
  imgs.forEach((b,i)=>fd.append('image[]',new Blob([new Uint8Array(b)],{type:'image/png'}),`i${i}.png`))
  r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+key},body:fd})}
 else r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify(model==='dall-e-3'?{model,prompt,size:'1792x1024',quality:'hd',style:'natural',response_format:'b64_json'}:{model,prompt,size:'1536x1024',quality:q})})
 const d:any=await r.json().catch(()=>({}))
 if(!r.ok)throw Object.assign(new Error('openai'),{status:r.status,code:d?.error?.code})
 const b=d.data?.[0]?.b64_json;if(!b)throw Object.assign(new Error('empty'),{status:0,code:'empty'})
 return 'data:image/png;base64,'+b}
export async function POST(req:NextRequest){
 const now=Date.now();hits=hits.filter(t=>now-t<60000);if(hits.length>=10)return NextResponse.json({error:'busy'},{status:429});hits.push(now)
 const oa=process.env.OPENAI_API_KEY,rp=process.env.REPLICATE_API_TOKEN
 try{
  const f=await req.formData(),style=String(f.get('style')||'');if(!STY[style])return NextResponse.json({error:'invalid'},{status:400})
  if(!oa&&!rp)return out({mode:'off'}) // no provider configured: the UI shows no visual at all (never a drawing)
  const files=[...f.getAll('image'),...f.getAll('inspiration')].filter((x):x is File=>typeof x!=='string').slice(0,4)
  const imgs:Buffer[]=[];for(const file of files){if(!OK.includes(file.type)||file.size>MAX)return NextResponse.json({error:'invalid image'},{status:400});imgs.push(await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize(1536,1024,{fit:'inside'}).png().toBuffer())} // EXIF dropped, memory only
  const hasI=imgs.length>1
  const prompt=`Photorealistic professional photograph of a renovated Dutch back garden, shot on a full-frame DSLR with a 24mm lens at eye level, soft natural daylight. Style: ${STY[style]}. ${imgs.length?"The FIRST reference image is the customer's current garden: keep the house, fence and wall positions, garden proportions and camera angle exactly and only redesign the garden itself.":''} ${hasI?'The other reference images are style inspiration: take over their materials, colours and mood.':''} Customer wishes: ${String(f.get('wish')||'').slice(0,500)}. Realistic materials and textures, natural shadows, lived-in details. NOT an illustration, NOT a cartoon, NOT a 3D render, no text, no people.`
  if(oa){const m=process.env.OPENAI_IMAGE_MODEL||'gpt-image-1';let last:any={}
   for(const [model,fid] of [[m,true],[m,false],['dall-e-3',false]] as [string,boolean][]){try{return out({mode:'ai',image:await oai(oa,prompt,imgs,model,fid)})}catch(e:any){last={status:e?.status,code:e?.code}}}
   console.error('visualize openai failed',last.status,last.code);return out({mode:'error',...last})}
  const r=await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',{method:'POST',headers:{Authorization:'Bearer '+rp,'content-type':'application/json',Prefer:'wait'},body:JSON.stringify({input:{prompt,aspect_ratio:'3:2',output_format:'png'}})}) // text-to-image: photo not used
  if(!r.ok)return out({mode:'error',status:r.status});const u=(await r.json()).output?.[0];if(typeof u!=='string'||!u.startsWith('https://'))return out({mode:'error',status:0,code:'empty'})
  const im=await fetch(u);if(!im.ok)return out({mode:'error',status:im.status});return out({mode:'ai',image:'data:image/png;base64,'+Buffer.from(await im.arrayBuffer()).toString('base64')})
 }catch{console.error('visualize failed');return out({mode:'error',status:500})} // never log content
}
