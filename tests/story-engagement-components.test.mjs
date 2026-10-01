import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const rpcCalls = []; let rpcResult = { error: null }; let refreshes = 0;
const mocks = {
  'next/link': { __esModule: true, default: props => React.createElement('a', props) },
  'next/navigation': { useRouter: () => ({ refresh() { refreshes++; } }) },
  'lucide-react': { Star: props => React.createElement('svg', props) },
  '@/lib/supabase/browser': { createClient: () => ({ rpc: async (name, args) => { rpcCalls.push({ name, args }); return rpcResult; } }) },
};
function component(path) {
  const source = new URL(path, import.meta.url); const require = createRequire(source);
  const compiled = ts.transpileModule(readFileSync(source, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => mocks[name] ?? require(name), mod, mod.exports);
  return mod.exports.default;
}
const Rating = component('../src/components/reader/story-rating.tsx');
const Tracker = component('../src/components/reader/read-tracker.tsx');
const props = { storyId: 'story-a', slug: 'a', score: null, signedIn: true, eligible: true, ownStory: false };

test('rating meminta login/aktivitas membaca dan menolak form pada karya sendiri', async () => {
  for (const change of [{ signedIn: false }, { eligible: false }, { ownStory: true }]) {
    let renderer;
    await act(async () => { renderer = create(React.createElement(Rating, { ...props, ...change })); });
    assert.equal(renderer.root.findAllByType('form').length, 0);
    await act(async () => renderer.unmount());
  }
});
test('rating mengirim nilai pilihan lalu memperbarui statistik, kegagalan tetap dapat dicoba', async () => {
  rpcCalls.length = 0; refreshes = 0; rpcResult = { error: null }; let renderer;
  await act(async () => { renderer = create(React.createElement(Rating, props)); });
  await act(async () => renderer.root.findAllByType('input')[3].props.onChange());
  await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }));
  assert.deepEqual(rpcCalls[0], { name: 'rate_story', args: { p_story_id: 'story-a', p_score: 4 } });
  assert.equal(refreshes, 1);
  rpcResult = { error: { message: 'offline' } };
  await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }));
  assert.equal(refreshes, 1);
  assert.equal(renderer.root.findByType('fieldset').props.disabled, false);
  assert.match(renderer.root.findByProps({ role: 'status' }).children.join(''), /belum tersimpan/);
  await act(async () => renderer.unmount());
});
test('tracker mengirim heartbeat hanya saat terlihat/fokus dan berhenti ketika dibongkar', async () => {
  rpcCalls.length = 0; let tick; let cleared = false; const events = new Map();
  globalThis.document = { visibilityState: 'visible', hasFocus: () => true, addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name) };
  globalThis.window = { setInterval: fn => { tick = fn; return 1; }, clearInterval: () => { cleared = true; }, addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name) };
  let renderer;
  try {
    await act(async () => { renderer = create(React.createElement(Tracker, { nodeId: 'node-a' })); });
    assert.deepEqual(rpcCalls[0], { name: 'reader_touch_session', args: { p_node_id: 'node-a' } });
    document.visibilityState = 'hidden';
    await act(async () => events.get('visibilitychange')());
    assert.equal(rpcCalls.at(-1).name, 'reader_pause_session');
    const before = rpcCalls.length;
    await act(async () => tick());
    assert.equal(rpcCalls.length, before);
    document.visibilityState = 'visible';
    await act(async () => events.get('focus')());
    assert.equal(rpcCalls.at(-1).name, 'reader_touch_session');
    await act(async () => renderer.unmount());
    assert.equal(cleared, true); assert.equal(events.size, 0);
    const after = rpcCalls.length;
    await act(async () => tick());
    assert.equal(rpcCalls.length, after);
  } finally { delete globalThis.document; delete globalThis.window; }
});
