const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/services/voice-session.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText;

function setup({ supported = true, secure = true, throws = false } = {}) {
  const instances = [], transcripts = [], listening = [], errors = [];
  const timers = new Map();
  let timerId = 0;
  class Recognition {
    constructor() { instances.push(this); }
    start() { if (throws) throw new Error('unavailable'); }
    abort() { this.aborted = true; }
  }
  const exports = {};
  vm.runInNewContext(source, {
    exports, window: { isSecureContext: secure, SpeechRecognition: supported ? Recognition : undefined },
    setTimeout: (callback, ms) => { timers.set(++timerId, { callback, ms }); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  });
  const controller = exports.startContinuousVoiceSession('tìm',
    (value) => transcripts.push(value), (value) => listening.push(value), (value) => errors.push(value));
  const runTimer = (ms) => {
    const timer = [...timers].find(([, value]) => value.ms === ms);
    assert.ok(timer, `Expected ${ms}ms timer`);
    timers.delete(timer[0]); timer[1].callback();
  };
  const result = (text, isFinal) => ({ 0: { transcript: text }, isFinal });
  return { controller, instances, transcripts, listening, errors, timers, runTimer, result };
}

test('unsupported browsers display an error instead of silently doing nothing', () => {
  const state = setup({ supported: false });
  assert.equal(state.controller.isSupported, false);
  assert.match(state.errors[0], /không hỗ trợ/);
  assert.deepEqual(state.listening, [false]);
});

test('insecure origins display a helpful error', () => {
  const state = setup({ secure: false });
  assert.match(state.errors[0], /HTTPS hoặc localhost/);
  assert.equal(state.instances.length, 0);
});

test('permission denial stops recognition and does not restart it', () => {
  const state = setup();
  state.instances[0].onerror({ error: 'not-allowed' });
  assert.match(state.errors[0], /Micro đang bị chặn/);
  assert.equal(state.instances[0].aborted, true);
  assert.equal(state.timers.size, 0);
  assert.equal(state.listening.at(-1), false);
});

test('network failures display a reason and stop', () => {
  const state = setup();
  state.instances[0].onerror({ error: 'network' });
  assert.match(state.errors[0], /Internet/);
  assert.equal(state.timers.size, 0);
});

test('a missing start event times out instead of leaving the button stuck', () => {
  const state = setup();
  state.runTimer(10000);
  assert.match(state.errors[0], /chưa khởi động/);
  assert.equal(state.listening.at(-1), false);
});

test('start exceptions produce an actionable error', () => {
  const state = setup({ throws: true });
  assert.match(state.errors[0], /Không mở được micro/);
  assert.equal(state.timers.size, 0);
});

test('interim/final updates and browser restarts do not duplicate text', () => {
  const state = setup();
  const first = state.instances[0];
  first.onstart();
  assert.equal(first.lang, 'vi-VN');
  first.onresult({ results: [state.result('áo', false)] });
  first.onresult({ results: [state.result('áo trắng', true)] });
  assert.deepEqual(state.transcripts, ['tìm áo', 'tìm áo trắng']);
  first.onend(); state.runTimer(250);
  state.instances[1].onstart();
  state.instances[1].onresult({ results: [state.result('dưới hai triệu', true)] });
  assert.equal(state.transcripts.at(-1), 'tìm áo trắng dưới hai triệu');
  state.controller.stop();
  assert.equal(state.timers.size, 0);
});

test('stop during startup cancels timers and ignores late callbacks', () => {
  const state = setup();
  const lateStart = state.instances[0].onstart;
  state.controller.stop(); lateStart();
  assert.deepEqual(state.listening, [false]);
  assert.equal(state.timers.size, 0);
});

test('repeated empty sessions stop instead of looping forever', () => {
  const state = setup();
  for (let i = 0; i < 2; i++) { state.instances[i].onend(); state.runTimer(250); }
  state.instances[2].onend();
  assert.match(state.errors[0], /Chưa nghe được/);
  assert.equal(state.timers.size, 0);
});
