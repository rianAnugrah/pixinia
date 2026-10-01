import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';

// Run the actual client component with only its external router/RPC replaced.
const source = new URL('../src/components/reader-actions.tsx', import.meta.url);
const require = createRequire(source);
const navigation = [];
let result = { error: null };
let calls = 0;
const rpcArgs = [];
const mocks = {
  'lucide-react': new Proxy({}, { get: () => props => React.createElement('svg', props) }),
  'next/navigation': { useRouter: () => ({ push: url => navigation.push(url), refresh() {} }) },
  'next/link': { __esModule: true, default: props => React.createElement('a', props) },
  '@/lib/supabase/browser': { createClient: () => ({ rpc: (_name, args) => { calls++; rpcArgs.push(args); return { abortSignal: async () => result }; } }) },
  '@/components/reader/coin-confirm-popover': { __esModule: true, default: ({ children }) => React.createElement('section', { role: 'dialog' }, children) },
  '@/components/busy-status': { __esModule: true, default: ({ children }) => React.createElement('span', { role: 'status' }, children) },
};
const compiled = ts.transpileModule(readFileSync(source, 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const componentModule = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => mocks[name] ?? require(name), componentModule, componentModule.exports);
const ReaderActions = componentModule.exports.default;
const coinModule = { exports: {} };
const coinCompiled = ts.transpileModule(readFileSync(new URL('../src/components/coin-action.tsx', import.meta.url), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
new Function('require', 'module', 'exports', coinCompiled)(name => mocks[name] ?? require(name), coinModule, coinModule.exports);
const CoinAction = coinModule.exports.default;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function props(nodeId, progressVersion = 'v1') {
  return { nodeId, progressVersion, storyId: 'story', slug: 'story', signedIn: true, balance: 100,
    choices: [{ id: `${nodeId}-choice`, node_id: nodeId, next_node_id: `${nodeId}-next`, label: `Pilihan ${nodeId}` }],
    targets: { [`${nodeId}-next`]: `${nodeId}-next` }, costs: {} };
}
const button = renderer => renderer.root.findAllByType('button')[0];

test('pilihan bab berikutnya bisa diklik setelah navigasi berhasil', async () => {
  result = { error: null }; calls = 0; navigation.length = 0;
  let renderer;
  await act(async () => { renderer = create(React.createElement(ReaderActions, props('bab-a'))); });
  try {
    await act(async () => { await button(renderer).props.onClick(); });
    assert.equal(calls, 1);
    assert.equal(navigation.at(-1), '/read/story/bab-a-next');
    // Keep the old screen disabled until the destination's server snapshot arrives.
    assert.equal(button(renderer).props.disabled, true);
    await act(async () => { renderer.update(React.createElement(ReaderActions, props('bab-a'))); });
    assert.equal(button(renderer).props.disabled, true);
    await act(async () => { renderer.update(React.createElement(ReaderActions, props('bab-b', 'v2'))); });
    assert.equal(button(renderer).props.disabled, false);
    await act(async () => { await button(renderer).props.onClick(); });
    assert.equal(calls, 2);
    assert.equal(navigation.at(-1), '/read/story/bab-b-next');
  } finally { await act(async () => { renderer.unmount(); }); }
});

test('reset pada bab yang sama menghapus loading dan konflik dari percobaan sebelumnya', async () => {
  result = { error: null }; calls = 0;
  let renderer;
  await act(async () => { renderer = create(React.createElement(ReaderActions, props('bab-a'))); });
  try {
    await act(async () => { await button(renderer).props.onClick(); });
    assert.equal(button(renderer).props.disabled, true);
    await act(async () => { renderer.update(React.createElement(ReaderActions, props('bab-a', 'reset-v2'))); });
    assert.equal(button(renderer).props.disabled, false);
    result = { error: { code: '40001', message: 'Progress changed' } };
    await act(async () => { await button(renderer).props.onClick(); });
    assert.equal(renderer.root.findAllByProps({ role: 'alert' }).length, 1);
    await act(async () => { renderer.update(React.createElement(ReaderActions, props('bab-a', 'reset-v3'))); });
    assert.equal(renderer.root.findAllByProps({ role: 'alert' }).length, 0);
    assert.equal(button(renderer).props.disabled, false);
    result = { error: null };
    await act(async () => { await button(renderer).props.onClick(); });
    assert.equal(calls, 3);
  } finally { await act(async () => { renderer.unmount(); }); }
});

test('pilihan berbayar menunggu konfirmasi dan batal tidak memotong coin', async () => {
  result = { error: null }; calls = 0;
  let renderer;
  await act(async () => { renderer = create(React.createElement(ReaderActions, { ...props('paid'), costs: { 'paid-next': 5 } })); });
  try {
    await act(async () => { await button(renderer).props.onClick(); });
    assert.equal(calls, 0);
    assert.equal(renderer.root.findAllByProps({ role: 'dialog' }).length, 1);
    await act(async () => { renderer.root.findByProps({ className: 'reader-secondary' }).props.onClick(); });
    assert.equal(calls, 0);
    assert.equal(renderer.root.findAllByProps({ role: 'dialog' }).length, 0);
    await act(async () => { await button(renderer).props.onClick(); });
    await act(async () => { await renderer.root.findByProps({ className: 'reader-primary' }).props.onClick(); });
    assert.equal(calls, 1);
    assert.equal(navigation.at(-1), '/read/story/paid-next');
  } finally { await act(async () => { renderer.unmount(); }); }
});

test('saldo kurang menampilkan wallet tanpa mengirim pembelian', async () => {
  calls = 0; let renderer;
  await act(async () => { renderer = create(React.createElement(ReaderActions, { ...props('paid'), balance: 2, costs: { 'paid-next': 5 } })); });
  try {
    await act(async () => { await button(renderer).props.onClick(); });
    assert.equal(calls, 0);
    assert.equal(renderer.root.findByType('a').props.href, '/account');
    assert.equal(renderer.root.findAllByType('button').filter(b => b.props.className === 'reader-primary').length, 0);
  } finally { await act(async () => { renderer.unmount(); }); }
});

test('aksi gratis langsung diproses tanpa membuka konfirmasi', async () => {
  calls = 0; result = { error: null };
  let renderer;
  const freeProps = { rpc: 'coin_reset_chapter', args: { p_node_id: 'node-a' }, label: 'Reset bab · Gratis', cost: 0, balance: 100 };
  await act(async () => { renderer = create(React.createElement(CoinAction, freeProps)); });
  try {
    await act(async () => { await button(renderer).props.onClick(); });
    assert.equal(calls, 1);
    assert.equal(renderer.root.findAllByProps({ role: 'dialog' }).length, 0);
  } finally { await act(async () => { renderer.unmount(); }); }
});

test('retry unlock memakai request yang sama; pindah node memakai request baru', async () => {
  calls = 0; rpcArgs.length = 0; result = { error: { message: 'network timeout' } };
  let renderer;
  const coinProps = id => ({ rpc: 'coin_unlock_node', args: { p_node_id: id }, label: 'Unlock', cost: 5, balance: 100 });
  await act(async () => { renderer = create(React.createElement(CoinAction, coinProps('node-a'))); });
  try {
    await act(async () => { button(renderer).props.onClick(); });
    await act(async () => { await renderer.root.findByProps({ className:'reader-primary' }).props.onClick(); });
    const firstId = rpcArgs[0].p_request_id;
    await act(async () => { await renderer.root.findByProps({ className:'reader-primary' }).props.onClick(); });
    assert.equal(rpcArgs[1].p_request_id, firstId);
    await act(async () => { renderer.update(React.createElement(CoinAction, coinProps('node-b'))); });
    assert.equal(renderer.root.findAllByProps({ role:'dialog' }).length,0);
    await act(async () => { button(renderer).props.onClick(); });
    await act(async () => { await renderer.root.findByProps({ className:'reader-primary' }).props.onClick(); });
    assert.notEqual(rpcArgs[2].p_request_id, firstId);
    assert.equal(rpcArgs[2].p_node_id, 'node-b');
  } finally { await act(async () => { renderer.unmount(); }); }
});
