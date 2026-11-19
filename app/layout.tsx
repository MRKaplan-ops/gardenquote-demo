import './globals.css'
import {Providers} from '@/components/Providers'
export const metadata={title:'GardenQuote AI',description:'Indicative garden project estimates'}
export default function L({children}:{children:React.ReactNode}){return <html lang="en"><body><Providers>{children}</Providers></body></html>}
