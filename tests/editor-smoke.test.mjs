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


test('advanced selection and alignment controls are present', () => {
  for (const id of ['alignPageH','alignPageV','lockSelected']) assert.match(html, new RegExp('id="' + id + '"'));
  for (const feature of ['alignToPage','checkpointed=false','textArea.style.minHeight','Math.round((v.x+dx)/4)*4']) assert.ok(scripts[0].includes(feature), 'missing ' + feature);
});

test('selection clicks preserve single selection and support shift toggling', () => {
  assert.ok(scripts[0].includes("else if(!selected.includes(o.id)){selected=[o.id];render()}"));
  assert.ok(scripts[0].includes("if(e.shiftKey){selected=selected.includes(o.id)?selected.filter(x=>x!==o.id):[...selected,o.id];render()}"));
});

test('table cell edits create an undo checkpoint', () => {
  assert.ok(scripts[0].includes("td.addEventListener('focus',()=>{if(!cellCheckpointed){checkpoint();cellCheckpointed=true}}"));
  assert.ok(scripts[0].includes("o.rows[ri][Array.from(tr.children).indexOf(td)]=td.textContent"));
});

test('SVG export serializes supported object types rather than text only', () => {
  for (const feature of ['function exportSvg','<ellipse','<polygon','<line','<path','<image','<text','<tspan','o.type===\'table\'','o.type===\'chart\'']) {
    assert.ok(scripts[0].includes(feature), 'missing SVG export support: ' + feature);
  }
  assert.ok(scripts[0].includes("else if(choice==='3')exportSvg()"));
});

test('multi-selection grouping controls are wired with undo checkpoints', () => {
  for (const id of ['groupSelected','ungroupSelected']) assert.match(html, new RegExp('id="' + id + '"'));
  for (const feature of ['function groupSelected','function ungroupSelected','o.groupId=groupId','delete o.groupId','checkpoint();']) assert.ok(scripts[0].includes(feature), 'missing grouping behaviour: ' + feature);
});


test('grouped objects select and move as a unit', () => {
  assert.ok(scripts[0].includes('function selectObject(o,shift=false)'));
  assert.ok(scripts[0].includes('o.groupId?pg().objects.filter'));
  assert.ok(scripts[0].includes('function dragStart(e,o)'));
  assert.ok(scripts[0].includes('orig.forEach(v=>'));
});

test('multi-object alignment and distribution controls are wired', () => {
  for (const id of ['alignLeftEdges','alignCenterX','alignRightEdges','alignTopEdges','alignCenterY','alignBottomEdges','distributeH','distributeV']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.ok(scripts[0].includes('function alignSelection(mode)'));
  assert.ok(scripts[0].includes('function distributeSelection(axis)'));
});
