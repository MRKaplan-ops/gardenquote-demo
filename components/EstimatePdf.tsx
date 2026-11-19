import {Document,Page,Text,View,Image,StyleSheet} from '@react-pdf/renderer'
import {estimate,type Company,type Item} from '@/lib/pricing/engine'
import {money} from '@/lib/i18n'
const s=StyleSheet.create({p:{padding:36,fontSize:10,fontFamily:'Helvetica'},h:{fontSize:18,marginBottom:4},r:{flexDirection:'row',justifyContent:'space-between',borderBottom:'1pt solid #ddd',paddingVertical:3},img:{width:150,height:110,marginRight:6,objectFit:'cover'}})
export function EstimatePdf({c,items,desc,images,notes,t}:{c:Company;items:Item[];desc:string;images:string[];notes:string[];t:(k:string)=>string}){
 const e=estimate(c,items),m=(n:number)=>money(n,c.currency,c.locale)
 return <Document title={`${c.name} estimate`}><Page size="A4" style={s.p}>
  <Text style={[s.h,{color:c.color}]}>{c.name}</Text><Text>{c.email} · {c.phone}</Text>
  <Text style={{marginTop:14,fontSize:12}}>{t('desc')}</Text><Text>{desc||'-'}</Text>
  {images.length>0&&<View style={{flexDirection:'row',marginTop:8}}>{images.slice(0,3).map((u,i)=><Image key={i} src={u} style={s.img}/>)}</View>}
  <Text style={{marginTop:14,fontSize:12}}>{t('cats')}</Text>
  {e.lines.map(l=><View key={l.activity.id} style={s.r}><Text>{l.activity.name} ({l.qtyMin===l.qtyMax?l.qtyMin:`${l.qtyMin}–${l.qtyMax}`} {l.activity.unit} × {m(l.activity.price)})</Text><Text>{m(l.subMin)} – {m(l.subMax)}</Text></View>)}
  <View style={s.r}><Text>{t('callout')}</Text><Text>{m(e.callout)}</Text></View><View style={s.r}><Text>{t('vat')} ({c.vat}%)</Text><Text>{m(e.vatMin)} – {m(e.vatMax)}</Text></View>
  <View style={[s.r,{fontSize:13}]}><Text>{t('total')}</Text><Text>{m(e.totalMin)} – {m(e.totalMax)}</Text></View>
  <Text style={{marginTop:14,fontSize:12}}>{t('assumptions')}</Text>{notes.map((n,i)=><Text key={i}>• {n}</Text>)}
  <Text style={{marginTop:18,fontSize:9}}>{t('disclaimer')}</Text></Page></Document>}
