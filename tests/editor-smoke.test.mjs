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

test('selection clicks preserve single selection and support grouped shift toggling', () => {
  assert.ok(scripts[0].includes('function selectObject(o,shift=false)'));
  assert.ok(scripts[0].includes('if(e.shiftKey)selectObject(o,true)'));
  assert.ok(scripts[0].includes('else selected=members;render()'));
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

test('duplicating a group creates a separate linked group', () => {
  assert.ok(scripts[0].includes('const originals=pg().objects.filter(o=>selected.includes(o.id)),groupMap=new Map()'));
  assert.ok(scripts[0].includes('if(!groupMap.has(o.groupId))groupMap.set(o.groupId,uid())'));
  assert.ok(scripts[0].includes('c.groupId=groupMap.get(o.groupId)'));
});

test('multi-selection inspector applies compatible edits to every selected object', () => {
  assert.ok(scripts[0].includes('const items=pg().objects.filter(x=>selected.includes(x.id))'));
  assert.ok(scripts[0].includes('targets.forEach(target=>target[key]='));
  assert.ok(scripts[0].includes('targets.forEach(target=>target.text=textArea.value)'));
  assert.ok(scripts[0].includes('edits apply to all compatible objects'));
});

test('image fit mode is editable and preserved in exports', () => {
  assert.ok(scripts[0].includes("im.style.objectFit=o.fit||'cover'"));
  assert.ok(scripts[0].includes("fitSelect.value=o.fit||'cover'"));
  assert.ok(scripts[0].includes("o.fit==='contain'?'xMidYMid meet':'xMidYMid slice'"));
  assert.ok(scripts[0].includes("object-fit:'+(o.fit||'cover')"));
});


test('layers can be reordered by drag and accessible move controls', () => {
  assert.ok(scripts[0].includes('row.draggable=true'));
  assert.ok(scripts[0].includes("addEventListener('drop'"));
  assert.ok(scripts[0].includes('function moveLayer(id,direction)'));
  assert.ok(scripts[0].includes("up.textContent='↑'"));
  assert.ok(scripts[0].includes("down.textContent='↓'"));
});


test('selected objects support proportional group resize and rotation handles', () => {
  assert.ok(scripts[0].includes('function resizeStart(e,o)'));
  assert.ok(scripts[0].includes('const targets=pg().objects.filter(x=>selected.includes(x.id)&&!x.locked)'));
  assert.ok(scripts[0].includes('function rotateStart(e,o)'));
  assert.ok(scripts[0].includes("rotate.className='rotate-handle'"));
  assert.ok(scripts[0].includes('x.rotation=v.rotation+delta'));
});


test('chart data and title can be edited in the inspector', () => {
  assert.ok(scripts[0].includes("valuesLabel.textContent='Chart values · comma separated'"));
  assert.ok(scripts[0].includes("valuesInput.value=(o.values||[]).join(', ')"));
  assert.ok(scripts[0].includes('x.values=[...values]'));
});
