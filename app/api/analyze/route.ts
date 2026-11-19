import {NextRequest,NextResponse} from 'next/server'
import sharp from 'sharp'
import {analyze,type Input} from '@/lib/ai'
export const runtime='nodejs'
const OK=['image/jpeg','image/png','image/webp'],MAX=8*1024*1024
let hits:number[]=[] // global limiter: no IPs collected
const bad=(m:string,s=400)=>NextResponse.json({error:m},{status:s})
export async function POST(req:NextRequest){
 const now=Date.now();hits=hits.filter(t=>now-t<60000);if(hits.length>=30)return bad('busy',429);hits.push(now)
 if(Number(req.headers.get('content-length')||0)>5*MAX+100000)return bad('too large',413)
 try{
  const f=await req.formData();const p=JSON.parse(String(f.get('payload')||'{}'))
  const acts=Array.isArray(p.activities)?p.activities.slice(0,50).filter((a:any)=>typeof a?.id==='string'&&typeof a?.name==='string').map((a:any)=>({id:a.id.slice(0,40),name:a.name.slice(0,80),unit:String(a.unit||'').slice(0,10)})):[]
  const area=p.area===null||p.area===undefined?null:Number(p.area)
  if((area!==null&&!(area>=0&&area<=100000))||!acts.length)return bad('invalid')
  const files=f.getAll('images').filter((x):x is File=>typeof x!=='string');if(files.length>5)return bad('too many images')
  const bufs:Buffer[]=[]
  for(const file of files){if(!OK.includes(file.type)||file.size>MAX)return bad('invalid image')
   bufs.push(await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize(1400,1400,{fit:'inside'}).jpeg({quality:82}).toBuffer())} // re-encode drops EXIF; memory only, nothing written to disk
  const input:Input={types,areas,desc:String(p.desc||'').slice(0,2000),area,remove:!!p.remove,access:p.access==='hard'?'hard':'easy',materials:String(p.materials||'').slice(0,200),time:String(p.time||'').slice(0,20),activities:acts}
  return NextResponse.json(await analyze(input,bufs))
 }catch{return bad('invalid request')}
}
