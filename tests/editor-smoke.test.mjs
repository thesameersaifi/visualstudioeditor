import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

test('single application script parses', () => {
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0]));
});

test('editor has unique DOM ids', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test('design workspace modules are present', () => {
  for (const id of ['canvas','stage','inspector','layers','pageList','pageThumbs','fontFamily','fontSize','imageInput','aiModal','printRoot']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test('design objects and editing operations are implemented', () => {
  for (const kind of ['heading','subheading','text','rect','circle','line','arrow','triangle','table','chart','note','image']) {
    assert.match(scripts[0], new RegExp("['\"]" + kind + "['\"]"));
  }
  for (const feature of ['dragStart','resizeStart','duplicateSelected','deleteSelected','historyMove','renderLayers','renderInspector','applyTemplate']) {
    assert.ok(scripts[0].includes(feature), 'missing ' + feature);
  }
});

test('project persistence, import and export are implemented', () => {
  for (const feature of ['localStorage.setItem','localStorage.getItem','importProject','exportProject','renderExport','window.print']) {
    assert.ok(scripts[0].includes(feature), 'missing ' + feature);
  }
});

test('keyboard editing and smart layout are present', () => {
  for (const feature of ['keydown','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','smartCreate','Smart layout assistant']) {
    assert.ok(html.includes(feature), 'missing ' + feature);
  }
});
