// One-off: generates a photorealistic "dated Dutch backyard" for the demo button.  Usage: OPENAI_API_KEY=sk-... npm run sample
// Or simply copy any real photo to public/sample-garden.jpg (landscape, JPEG, < 8 MB).
import {writeFileSync,mkdirSync} from 'node:fs'
const key=process.env.OPENAI_API_KEY;if(!key){console.error('Set OPENAI_API_KEY first.');process.exit(1)}
const prompt='Real photograph of a typical dated Dutch terraced-house back garden, about 55 square metres: cracked grey concrete tiles with weeds, patchy tired lawn, overgrown border, old weathered wooden fence, brick rear facade with a sliding glass door, overcast Dutch daylight, shot on a full-frame DSLR with a 24mm lens at eye level, candid, unstyled, no people, no text.'
for(const body of [{model:'gpt-image-1',prompt,size:'1536x1024',quality:'high',output_format:'jpeg'},{model:'dall-e-3',prompt,size:'1792x1024',quality:'hd',style:'natural',response_format:'b64_json'}]){
 const r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify(body)})
 const d=await r.json().catch(()=>({}));const b=d.data?.[0]?.b64_json
 if(r.ok&&b){mkdirSync('public',{recursive:true});writeFileSync('public/sample-garden.jpg',Buffer.from(b,'base64'));console.log('Saved public/sample-garden.jpg ('+body.model+')');process.exit(0)}
 console.error(body.model+' failed:',r.status,d?.error?.code||'')}
process.exit(1)
