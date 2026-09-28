const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/../assets/js/consent.js', 'utf8');
function run({analytics=false,marketing=false,quote=false,age=0,session=new Map(),ga=true}={}) {
  const events={}, nodes=[], buttons={};
  const button = name => buttons[name] ||= { addEventListener(type, fn){this[type]=fn;} };
  const banner={querySelector:button,setAttribute(){},removeAttribute(){}};
  const local = new Map([['ox_consent_v2',JSON.stringify({version:2,updatedAt:new Date().toISOString(),analytics,marketing})]]);
  if(quote) session.set('ox_quote_verified',JSON.stringify({id:'quote-test-123',method:'form',createdAt:Date.now()-age}));
  const storage = m => ({getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});
  const document={currentScript:{dataset:{gaId:ga?'G-FE95SCP0KD':'',adsId:'AW-17989412215',adsConversionLabel:'xpAsCNDgra8cEPfKgoJD'}},
    querySelector:s=>s==='[data-cookie-banner]'?banner:null,body:{dataset:{conversion:'quote'}},documentElement:{dataset:{}},cookie:'',referrer:'https://example.org/?email=private@example.org',
    createElement:()=>({dataset:{}}),head:{append:n=>nodes.push(n)}};
  const window={addEventListener:(n,fn)=>events[n]=fn,dispatchEvent(){}};
  vm.runInNewContext(source,{window,document,location:{origin:'https://osmose-xpert.be',pathname:'/bedankt/',hostname:'osmose-xpert.be',search:'?email=private@example.org&utm_source=google&utm_medium=cpc&utm_campaign=ox_ramen_regio_nl'},localStorage:storage(local),sessionStorage:storage(session),URL,URLSearchParams,Date,CustomEvent:class{},HTMLElement:class{},HTMLInputElement:class{}});
  const calls=()=>window.dataLayer.map(a=>Array.from(a));
  const count=n=>calls().filter(a=>a[0]==='event'&&a[1]===n).length;
  return {window,session,nodes,events,buttons,calls,count};
}
let t=run({quote:true}); assert.equal(t.nodes.length,0);assert.equal(t.count('generate_lead'),0);assert.equal(t.count('conversion'),0);
t=run({analytics:true,quote:true});assert.equal(t.count('generate_lead'),1);assert.equal(t.count('conversion'),0);assert.equal(t.nodes.length,1);
assert(!JSON.stringify(t.calls()).includes('private@example.org'));
t=run({marketing:true,quote:true});assert.equal(t.count('generate_lead'),0);assert.equal(t.count('conversion'),1);
t=run({analytics:true,marketing:true,quote:true});assert.equal(t.nodes.length,1);assert.equal(t.count('generate_lead'),1);assert.equal(t.count('conversion'),1);
t.events['ox:lead-success']();assert.equal(t.count('generate_lead'),1);assert.equal(t.count('conversion'),1);
let reload=run({analytics:true,marketing:true,session:t.session});assert.equal(reload.count('generate_lead'),0);assert.equal(reload.count('conversion'),0);
t=run({analytics:true,quote:true});t.buttons['[data-consent-accept]'].click();assert.equal(t.count('generate_lead'),1);assert.equal(t.count('conversion'),1);
t.buttons['[data-consent-reject]'].click();assert.equal(t.window['ga-disable-G-FE95SCP0KD'],true);
for(const age of [1800001,-1000]){t=run({analytics:true,marketing:true,quote:true,age});assert.equal(t.count('generate_lead'),0);assert.equal(t.count('conversion'),0);}
t=run({analytics:true,marketing:true});assert.equal(t.count('generate_lead'),0);assert.equal(t.count('conversion'),0);
t=run({marketing:true,quote:true,ga:false});assert.equal(t.count('conversion'),1);assert.equal(t.count('generate_lead'),0);
console.log('PASS: denied, analytics-only, ads-only, both, repeat, reload, consent-change, revoke, expired/future, direct thank-you, legacy Ads, no PII');
