import {Document,Page,Text,View,Image,StyleSheet} from '@react-pdf/renderer'
import {estimate,type Company,type Item} from '@/lib/pricing/engine'
import {money,actName,unitLabel} from '@/lib/i18n'
const s=StyleSheet.create({p:{padding:36,fontSize:10,fontFamily:'Helvetica'},h:{fontSize:18,marginBottom:4},r:{flexDirection:'row',justifyContent:'space-between',borderBottom:'1pt solid #ddd',paddingVertical:3},img:{width:150,height:110,marginRight:6,objectFit:'cover'}})
export function EstimatePdf({c,items,desc,images,notes,t,lang,mult,tierName}:{lang:string;mult:number;tierName:string;c:Company;items:Item[];desc:string;images:string[];notes:string[];t:(k:string)=>string}){
 const e=estimate(c,items,mult),m=(n:number)=>money(n,c.currency,c.locale),m0=(n:number)=>money(n,c.currency,c.locale,0)
 return <Document title={`${c.name} estimate`}><Page size="A4" style={s.p}>
  <Text style={[s.h,{color:c.color}]}>{c.name}</Text><Text>{c.email} · {c.phone}{c.contact?` · ${c.contact}`:''}</Text><Text>{tierName}</Text>
  <Text style={{marginTop:14,fontSize:12}}>{t('desc')}</Text><Text>{desc||'-'}</Text>
  {images.length>0&&<View style={{flexDirection:'row',marginTop:8}}>{images.slice(0,3).map((u,i)=><Image key={i} src={u} style={s.img}/>)}</View>}
  <Text style={{marginTop:14,fontSize:12}}>{t('cats')}</Text>
  {e.lines.map(l=><View key={l.activity.id} style={s.r}><Text>{actName(l.activity,lang,l.variant)} ({l.qtyMin===l.qtyMax?l.qtyMin:`${l.qtyMin}–${l.qtyMax}`} {unitLabel(l.activity.unit,lang)} × {m(l.activity.price)})</Text><Text>{m(l.subMin)} – {m(l.subMax)}</Text></View>)}
  <View style={s.r}><Text>{t('callout')}</Text><Text>{m(e.callout)}</Text></View><View style={s.r}><Text>{t('vat')} ({c.vat}%)</Text><Text>{m(e.vatMin)} – {m(e.vatMax)}</Text></View>
  <View style={[s.r,{fontSize:13}]}><Text>{t('total')}</Text><Text>{m0(e.roundedMin)} – {m0(e.roundedMax)}</Text></View>
  <Text style={{marginTop:14,fontSize:12}}>{t('assumptions')}</Text>{notes.map((n,i)=><Text key={i}>• {n}</Text>)}
  <Text style={{marginTop:18,fontSize:9}}>{t('disclaimer')}</Text></Page></Document>}
