import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const icons = Object.fromEntries(['ArrowRight','ArrowUpRight','BookOpen','Check','FileText','GitBranch','Plus','Search','X','ArrowDownAZ','SlidersHorizontal'].map(name=>[name, props=>React.createElement('svg', props)]));
const ui = {
  Cover: ({title}) => React.createElement('span',null,title),
  StoryCard: ({story}) => React.createElement('article',{'data-story-id':story.id},story.title),
  PageHeading: ({title,children}) => React.createElement('header',null,title,children),
};
const mocks = {
  'next/link': {__esModule:true,default:props=>React.createElement('a',props)},
  'lucide-react':icons,
  '@/components/reader/design-ui':ui,
  './design-ui':ui,
  '@/lib/story-taxonomy':{storyGenreLabel:value=>({fantasi:'Fantasi',misteri:'Misteri'}[value]||value)},
  '@/app/studio/actions':{createStory:async()=>{}},
  '@/components/admin/story-taxonomy-fields':{__esModule:true,default:()=>null},
  '@/components/submit-button':{__esModule:true,default:({children})=>React.createElement('button',null,children)},
};
function load(path){
  const source=new URL(path,import.meta.url);const require=createRequire(source);
  const compiled=ts.transpileModule(readFileSync(source,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const mod={exports:{}};new Function('require','module','exports',compiled)(name=>mocks[name]??require(name),mod,mod.exports);return mod.exports.default;
}
const Studio = load('../src/components/studio/studio-library.tsx');
const Explore = load('../src/components/reader/explore.tsx');
const stories=[
  {id:'a',slug:'atlas',title:'Atlas Musim Terakhir',status:'published',default_format:'web_novel',cover_path:null,description:'Peta musim',genres:['fantasi'],tags:['peta']},
  {id:'b',slug:'arsip',title:'Arsip Kota',status:'draft',default_format:'comic',cover_path:null,description:'Arsip rahasia',genres:['misteri'],tags:['arsip']},
];
const storyTitles=renderer=>renderer.root.findAllByType('h3').map(node=>node.children[0].props?.children).filter(Boolean);
const change=async(renderer,label,value)=>act(async()=>renderer.root.findByProps({'aria-label':label}).props.onChange({target:{value}}));

test('Studio mencari judul tanpa membedakan huruf dan memadukan filter status',async()=>{
 let renderer;await act(async()=>{renderer=create(React.createElement(Studio,{stories,admin:true}));});
 assert.deepEqual(storyTitles(renderer),['Atlas Musim Terakhir','Arsip Kota']);
 await change(renderer,'Cari cerita di Studio',' ATLAS ');
 assert.deepEqual(storyTitles(renderer),['Atlas Musim Terakhir']);
 await act(async()=>renderer.root.findAllByType('button').find(node=>node.props['aria-pressed']!==undefined&&node.children[0]==='Draf').props.onClick());
 assert.equal(storyTitles(renderer).length,0);
 await act(async()=>renderer.root.findAllByType('button').find(node=>node.children[0]==='Hapus filter').props.onClick());
 assert.deepEqual(storyTitles(renderer),['Atlas Musim Terakhir','Arsip Kota']);
 await act(async()=>renderer.unmount());
});
test('katalog menggabungkan pencarian genre dengan format dan menampilkan satu hasil per cerita',async()=>{
 let renderer;await act(async()=>{renderer=create(React.createElement(Explore,{stories,initial:{}}));});
 const ids=()=>renderer.root.findAllByType('article').map(node=>node.props['data-story-id']);
 assert.deepEqual(ids(),['a','b']);
 await change(renderer,'Cari cerita','Fantasi');assert.deepEqual(ids(),['a']);
 await act(async()=>renderer.root.findAllByType('button').find(node=>node.children[0]==='Komik').props.onClick());
 assert.deepEqual(ids(),[]);
 await act(async()=>renderer.root.findAllByType('button').find(node=>node.children[0]==='Tampilkan semua cerita').props.onClick());
 assert.deepEqual(ids(),['a','b']);
 await act(async()=>renderer.unmount());
});
