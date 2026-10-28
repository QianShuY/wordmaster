'use strict';
// Loopback GET-only timing. This is an API baseline, not a browser FPS/startup test.
const fs = require('node:fs'), path = require('node:path');
async function measure() {
  const clientDate = process.env.WORDMASTER_MEASURE_DATE || new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai'}).format(new Date());
  if(!/^\d{4}-\d{2}-\d{2}$/.test(clientDate)||new Date(clientDate+'T00:00:00Z').toISOString().slice(0,10)!==clientDate)throw new Error('Invalid measurement date');
  const base = new URL(process.env.WORDMASTER_MEASURE_URL || 'http://127.0.0.1:3456');
  if (!['127.0.0.1','localhost','[::1]'].includes(base.hostname) || base.username || base.password) throw new Error('Measurements must target local loopback');
  const get = async route => {
    const start = performance.now();
    const res = await fetch(new URL(route,base),{signal:AbortSignal.timeout(15000)});
    const bytes = (await res.arrayBuffer()).byteLength;
    if (!res.ok) throw new Error(`${route}: ${res.status}`);
    return { ms: Number((performance.now()-start).toFixed(2)), bytes };
  };
  const booksResponse = await fetch(new URL('/api/books',base));
  if(!booksResponse.ok) throw new Error('Book list unavailable');
  const books = await booksResponse.json();
  const targets = ['/api/books','/api/stats','/api/adventure/campaign','/api/adventure/pool','/api/desktop/journey'];
  for (const b of books) if(b.is_builtin) {
    targets.push(`/api/desktop/books/${b.id}/words?page_size=40`);
    targets.push(`/api/desktop/books/${b.id}/words?page_size=40&search=read`);
  }
  const results = [];
  for (const route of targets) {
    const first = await get(route), samples = [];
    for(let i=0;i<5;i++) samples.push(await get(route));
    const sorted = samples.map(x=>x.ms).sort((a,b)=>a-b);
    results.push({ route, first_request_ms:first.ms, warm_samples:samples, median_ms:sorted[2], min_ms:sorted[0], max_ms:sorted[4] });
  }
  const asset = path.join(__dirname,'../static/adventure/assets/mist-campaign-map-v4-dusk.webp');
  const report = { client_date:clientDate, measured_at_utc:new Date().toISOString(), base:base.origin,
    limits:'Warm local HTTP GET API only; first request is not a cold process start. Excludes rendering, image decoding, frame rate and Windows EXE.',
    map_displayed_bytes:fs.existsSync(asset)?fs.statSync(asset).size:null, results };
  const dest = path.join(__dirname,'../output/refinement/api-baseline-'+clientDate.replaceAll('-','')+'.json');
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({file:dest,results:results.map(({route,median_ms,max_ms})=>({route,median_ms,max_ms}))},null,2));
}
if(require.main===module)measure().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={measure};
