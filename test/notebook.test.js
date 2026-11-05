'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../static/app.js'),'utf8');
function object(name, globals) {
  const start = source.indexOf(`const ${name} = {`), end = source.indexOf('\n};', start)+3;
  const context = vm.createContext(globals);
  vm.runInContext(source.slice(start,end)+`;globalThis.result=${name};`,context);
  return context.result;
}
test('spelling word tabs never expose unpassed answers, including aria text', () => {
  const host = {innerHTML:'',querySelector:()=>null}, count = {};
  const study = object('Study',{Set,IS_ANDROID_APP:false,$:sel=>sel==='#notebookTrail'?host:count,
    wordHeadword:word=>word.word, esc:s=>String(s)});
  Object.assign(study,{mode:'spelling',roundWords:[{id:1,word:'secretanswer'},{id:2,word:'alreadyknown'}],
    current:{id:1},total:2,reinforcement:{2:{passed:true}},deferredIds:new Set()});
  study.renderNotebookTrail();
  assert.equal(host.innerHTML.includes('secretanswer'),false);
  assert.ok(host.innerHTML.includes('alreadyknown'));
  assert.ok(host.innerHTML.includes('词签 01'));
  assert.equal(count.textContent,'1 / 2 已通过');
});
test('only owned cards can apply a complete theme and classic reset removes all overrides', () => {
  const themes = require('../static/cards/themes.json');
  const props = new Map(), classes = new Set(), snapshots = [];
  const journal = object('Journal',{IS_ANDROID_APP:false,window:{MociThemeBridge:{save:value=>snapshots.push(value)}},Cards:{cardFocus:()=> '50% 40%'},document:{documentElement:{style:{
    setProperty:(key,value)=>props.set(key,value), removeProperty:key=>props.delete(key)},
    classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key)}}},Study:{refreshNotebookArt(){}}});
  journal.themes = themes;
  journal.renderThemeCopy = () => {};
  journal.applyTheme({palette:'library',owned:false});
  assert.equal(props.size,0);
  journal.applyTheme({palette:'library',owned:true});
  assert.equal(props.get('--theme-accent'),themes.library.accent);
  assert.equal(props.get('--theme-art'),'url("/cards/original/library.webp")');
  assert.equal(classes.has('has-card-theme'),true);
  assert.equal(props.get('--theme-header-position'),'50% 40%');
  assert.equal(snapshots.at(-1).palette,'library');
  journal.applyTheme(null);
  assert.equal(props.size,0);
  assert.equal(classes.has('has-card-theme'),false);
  assert.equal(snapshots.at(-1),null);
});
test('every illustration theme provides readable paper text and white button text', () => {
  const themes = require('../static/cards/themes.json');
  const luminance = hex => {
    const values = hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return values[0]*.2126+values[1]*.7152+values[2]*.0722;
  };
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  assert.equal(Object.keys(themes).length,62);
  for (const [palette,theme] of Object.entries(themes)) {
    assert.ok(fs.existsSync(require('node:path').join(__dirname,'../static/cards/original',palette+'.webp')));
    assert.ok(contrast(theme.paper,theme.muted)>=4.5,palette+' secondary text');
    assert.ok(contrast(theme.paper,theme.ink)>=7,palette+' main text');
    assert.ok(contrast(theme.accent,'#ffffff')>=4.5,palette+' primary buttons');
  }
});
