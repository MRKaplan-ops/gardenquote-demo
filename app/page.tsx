'use client'
import {useApp} from '@/components/Providers'
import {Estimate} from '@/components/Estimate'
export default function Home(){const {t}=useApp()
 return <div className="grid items-center gap-10 md:grid-cols-2"><div><h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">{t('tag')}</h1><p className="mt-4 max-w-prose text-lg">{t('sub')}</p>
  <div className="mt-6 flex flex-wrap gap-3"><a className="btn" href="/quote">{t('cta')}</a><a className="btn2" href="/dashboard">{t('cfg')}</a></div></div>
  <div className="rounded-lg border border-stone bg-white p-5"><p className="mb-3 font-medium">{t('example')}</p><Estimate items={[{activityId:'paving',qtyMin:30,qtyMax:30},{activityId:'remove',qtyMin:30,qtyMax:30},{activityId:'soil',qtyMin:30,qtyMax:30}]}/><p className="mt-3 text-xs">{t('disclaimer')}</p></div></div>}
