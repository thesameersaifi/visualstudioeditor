import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)].map(m => m[1]);

test('editor has one executable application script', () => {
  assert.equal(scripts.length, 1, 'expected one inline application script');
  assert.doesNotThrow(() => new vm.Script(scripts[0]), 'application JavaScript must parse');
});

test('core editor controls are present', () => {
  for (const id of ['paper','pages','layerList','properties','addPage','duplicatePage','deletePage','undo','redo','exportBtn','pdfBtn','importBtn','buildNotesPack']) {
    assert.match(html, new RegExp('id="' + id + '"'), 'missing #' + id);
  }
});

test('academic studio exposes all nine page layouts', () => {
  for (const kind of ['cover','contents','unit','concept','comparison','numerical','flow','revision','practice']) {
    assert.match(html, new RegExp('data-academic="' + kind + '"'));
    assert.match(scripts[0], new RegExp(kind + ':'));
  }
});

test('project persistence and import/export paths exist', () => {
  for (const fragment of ['localStorage.setItem','localStorage.getItem','JSON.stringify','JSON.parse','FileReader','buildPrintWindow']) {
    assert.ok(html.includes(fragment), 'missing expected capability: ' + fragment);
  }
});

test('no accidental escaped line-break tokens remain in executable code', () => {
  assert.doesNotMatch(scripts[0], /\\n(?:load|function|else)\\b/);
});
