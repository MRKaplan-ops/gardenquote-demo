import {describe,it,expect} from 'vitest'
import {estimate,type Company} from './engine'
const base:Company={name:'t',color:'#000',email:'',phone:'',currency:'EUR',locale:'en',vat:21,minProject:0,callout:0,marginLow:0,marginHigh:0,activities:[{id:'p',name:'Paving',unit:'m²',price:85},{id:'r',name:'Removal',unit:'m²',price:18},{id:'s',name:'Soil',unit:'m²',price:15}]}
const items=[{activityId:'p',qtyMin:30,qtyMax:30},{activityId:'r',qtyMin:30,qtyMax:30},{activityId:'s',qtyMin:30,qtyMax:30}]
describe('estimate',()=>{
 it('30 m² paving+removal+soil with VAT',()=>{const e=estimate(base,items);expect(e.subMin).toBe(3540);expect(e.vatMin).toBe(743.4);expect(e.totalMax).toBe(4283.4)})
 it('applies margins to a quantity range',()=>{const e=estimate({...base,marginLow:10,marginHigh:20},[{activityId:'p',qtyMin:20,qtyMax:30}]);expect(e.subMin).toBe(1530);expect(e.subMax).toBe(3060)})
 it('applies call-out fee and minimum price',()=>{expect(estimate({...base,callout:50},items).netMin).toBe(3590);expect(estimate({...base,minProject:5000},items).netMax).toBe(5000)})
 it('ignores unknown activities and handles empty input',()=>{expect(estimate(base,[{activityId:'x',qtyMin:1,qtyMax:2}]).totalMax).toBe(0)})
 it('no VAT when 0%',()=>{expect(estimate({...base,vat:0},items).totalMin).toBe(3540)})
})
describe('rounding',()=>{
 it('rounds totals to nearest 50 by default',()=>{expect(estimate(base,items).roundedMax).toBe(4300)})
 it('respects roundTo',()=>{expect(estimate({...base,roundTo:100},items).roundedMax).toBe(4300);expect(estimate({...base,roundTo:0},items).roundedMax).toBe(4283.4)})})
describe('tiers',()=>{it('scales material rates only',()=>{const b={...base,activities:[{id:'paving',name:'x',unit:'m²',price:100},{id:'soil',name:'y',unit:'m²',price:10}]};const e=estimate(b,[{activityId:'paving',qtyMin:10,qtyMax:10},{activityId:'soil',qtyMin:10,qtyMax:10}],1.3);expect(e.subMin).toBe(1400)})})
