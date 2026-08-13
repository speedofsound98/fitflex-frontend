// src/pages/WorkoutPlan.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Maximize2, Download, X, ChevronDown, ChevronRight, Loader2,
  FileSpreadsheet, FolderOpen, Tag, CalendarDays, Activity, BarChart3,
  Palette, Pencil, AlertCircle,
} from 'lucide-react';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_COL_WIDTH = 130;
const ROW_HEIGHTS = { compact: 28, normal: 36, tall: 52 };
const PHASE_STYLE = {
  Base:  { backgroundColor: '#d6e4f0', color: '#1a3a5c' },
  Build: { backgroundColor: '#d9ead3', color: '#1a4a1a' },
  Peak:  { backgroundColor: '#fce5cd', color: '#7f3000' },
  Taper: { backgroundColor: '#e8d5f5', color: '#4a1a6a' },
};

// Token hexes for JS/inline-style use (Tailwind classes can't reach here)
const INK_900 = '#15202b';
const BRAND_500 = '#e8702a';
const BRAND_600 = '#d55f1f';

// ── Helpers ───────────────────────────────────────────────────────────────────
function cellStyle(cell) {
  if (!cell) return {};
  const s = {};
  if (cell.bg) s.backgroundColor = cell.bg;
  if (cell.fg) s.color = cell.fg;
  if (cell.bold) s.fontWeight = 'bold';
  return s;
}

function cellText(cell) { return cell?.v ?? ''; }

function isTrainingPlan(rows) {
  const flat = rows.flatMap(r => Array.from(r, c => c?.v || '')).join(' ').toLowerCase();
  return (flat.includes('week') || flat.includes('phase')) && flat.includes('run');
}

function dedupeMergedCells(rows) {
  return rows.map(row => {
    const out = [...row];
    for (let i = 1; i < out.length; i++) {
      if (out[i]?.v && out[i].v === out[i - 1]?.v) out[i] = { ...out[i], v: '' };
    }
    return out;
  });
}

function findHeaderRowIdx(rows) {
  let best = 0, bestCount = 0;
  rows.forEach((r, i) => {
    const distinct = new Set(r.map(c => c?.v?.trim()).filter(Boolean)).size;
    if (distinct > bestCount) { bestCount = distinct; best = i; }
  });
  return best;
}

function colIdx(headers, keywords) {
  return headers.findIndex(h =>
    keywords.some(k => (h?.v || '').toLowerCase().includes(k.toLowerCase()))
  );
}

// ── Spreadsheet View (editable, resizable) ────────────────────────────────────
function SpreadsheetView({ rows, colWidths, rowHeight, onCellEdit, onColResize }) {
  const [editingCell, setEditingCell] = useState(null); // {row, col}
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);
  const dragging = useRef(null);
  const colCount = Math.max(...rows.map(r => r.length), 1);
  const rh = ROW_HEIGHTS[rowHeight] || ROW_HEIGHTS.normal;
  const headerRowIdx = findHeaderRowIdx(rows);

  // ── Column resize ──
  function startResize(e, ci) {
    e.preventDefault();
    dragging.current = { ci, startX: e.clientX, startW: colWidths[ci] || DEFAULT_COL_WIDTH };
    function onMove(me) {
      if (!dragging.current) return;
      const newW = Math.max(60, dragging.current.startW + me.clientX - dragging.current.startX);
      onColResize(dragging.current.ci, newW);
    }
    function onUp() {
      dragging.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ── Cell editing ──
  function startEdit(ri, ci) {
    setEditingCell({ row: ri, col: ci });
    setEditValue(rows[ri]?.[ci]?.v ?? '');
  }
  function commitEdit() {
    if (!editingCell) return;
    onCellEdit(editingCell.row, editingCell.col, editValue);
    setEditingCell(null);
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') setEditingCell(null);
    if (e.key === 'Tab') { e.preventDefault(); commitEdit(); }
  }
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  return (
    <div className="overflow-x-auto rounded-2xl shadow-card" style={{ userSelect: 'none' }}>
      <table className="border-collapse text-sm" style={{ tableLayout: 'fixed', width: 'max-content' }}>
        <colgroup>
          {Array.from({ length: colCount }, (_, ci) => (
            <col key={ci} style={{ width: colWidths[ci] || DEFAULT_COL_WIDTH }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {Array.from({ length: colCount }, (_, ci) => {
              const cell = rows[headerRowIdx]?.[ci];
              return (
                <th key={ci} style={{
                  backgroundColor: cell?.bg || INK_900,
                  color: cell?.fg || '#ffffff',
                  fontWeight: 'bold',
                  height: rh,
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  padding: '0 10px',
                  textAlign: 'left',
                  borderRight: '1px solid rgba(255,255,255,0.15)',
                  boxSizing: 'border-box',
                }}>
                  {cellText(cell)}
                  <div onMouseDown={e => startResize(e, ci)} style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: 6,
                    cursor: 'col-resize', zIndex: 1,
                  }} title="Drag to resize" />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            if (ri === headerRowIdx) return null;
            if (!row.some(c => c?.v?.trim())) return null;
            return (
              <tr key={ri} className="border-t border-ink-50 bg-surface">
                {Array.from({ length: colCount }, (_, ci) => {
                  const cell = row[ci];
                  const isEditing = editingCell?.row === ri && editingCell?.col === ci;
                  return (
                    <td key={ci} style={{
                      ...cellStyle(cell),
                      height: rh,
                      padding: '0 10px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      borderRight: '1px solid #f0f0f0',
                      cursor: 'text',
                      position: 'relative',
                      boxSizing: 'border-box',
                    }} onClick={() => !isEditing && startEdit(ri, ci)}>
                      {isEditing ? (
                        <input ref={inputRef} value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit} onKeyDown={handleKeyDown}
                          style={{
                            position: 'absolute', inset: 0, width: '100%', height: '100%',
                            padding: '0 10px', border: `2px solid ${BRAND_500}`, outline: 'none',
                            background: '#fff', color: '#1a1a1a', fontSize: 'inherit',
                            fontFamily: 'inherit', boxSizing: 'border-box', zIndex: 2,
                          }} />
                      ) : (
                        cellText(cell)
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Run type descriptions for the legend ─────────────────────────────────────
const RUN_TYPE_GUIDE = {
  easy:      'Conversational pace — aerobic base building',
  e:         'Easy pace — aerobic base building',
  long:      'Long slow distance — builds endurance',
  l:         'Long run — builds endurance',
  tempo:     'Comfortably hard — lactate threshold',
  t:         'Tempo — lactate threshold effort',
  intervals: 'Short hard repeats with recovery',
  int:       'Interval repeats with recovery',
  fartlek:   'Varied pace — unstructured speed play',
  hills:     'Hill repeats — strength and form',
  recovery:  'Very easy — active recovery',
  rec:       'Recovery — very easy effort',
  mp:        'Marathon pace effort',
  hmp:       'Half marathon pace effort',
  race:      'Race effort',
  r:         'Race or race-pace effort',
  strides:   'Short accelerations after an easy run',
  cross:     'Cross-training — non-running cardio',
  rest:      'Full rest day',
};

function getRunTypeGuide(label) {
  if (!label) return null;
  const key = label.toLowerCase().trim();
  return RUN_TYPE_GUIDE[key] || null;
}

// ── Card View ─────────────────────────────────────────────────────────────────
function TrainingPlanView({ rows }) {
  const headerIdx = findHeaderRowIdx(rows);
  const headers = rows[headerIdx] || [];
  const dataRows = rows.slice(headerIdx + 1).filter(r => r.some(c => c?.v?.trim()));

  // Hooks must run unconditionally (before any early return)
  const [activePhase, setActivePhase] = useState('');
  const [legendOpen, setLegendOpen] = useState(false);

  const C = {
    wk:     colIdx(headers, ['wk', 'week #']),
    date:   colIdx(headers, ['week of', 'date']),
    phase:  colIdx(headers, ['phase']),
    focus:  colIdx(headers, ['phase focus', 'focus', 'weekly goal']),
    r1km:   colIdx(headers, ['run 1\nkm', 'run 1 km', 'run1 km']),
    r1type: colIdx(headers, ['run 1 type', 'run 1\ntype']),
    r2km:   colIdx(headers, ['run 2\nkm', 'run 2 km']),
    r2type: colIdx(headers, ['run 2 type', 'run 2\ntype']),
    r3km:   colIdx(headers, ['run 3\nkm', 'run 3 km']),
    r3type: colIdx(headers, ['run 3 type', 'run 3\ntype']),
    total:  colIdx(headers, ['total\nkm', 'total km', 'total']),
  };

  const hasRuns = C.r1km !== -1 || C.r2km !== -1;
  if (!hasRuns) return null;

  const phases = [...new Set(dataRows.map(r => cellText(r[C.phase])).filter(Boolean))];
  const visible = activePhase ? dataRows.filter(r => cellText(r[C.phase]) === activePhase) : dataRows;
  const totalKm = dataRows.reduce((s, r) => s + (parseFloat(cellText(r[C.total])) || 0), 0);

  // Collect unique run types with their colors from actual data
  const runTypeMap = new Map(); // label → {bg, fg}
  dataRows.forEach(row => {
    [[C.r1km, C.r1type], [C.r2km, C.r2type], [C.r3km, C.r3type]].forEach(([kmIdx, typeIdx]) => {
      const type = cellText(row[typeIdx]);
      if (type && !runTypeMap.has(type)) {
        runTypeMap.set(type, {
          bg: row[typeIdx]?.bg || row[kmIdx]?.bg || null,
          fg: row[typeIdx]?.fg || row[kmIdx]?.fg || null,
        });
      }
    });
  });

  const READING_GUIDE = [
    { Icon: Tag, title: 'Phase badge', desc: 'training block color coded from your file' },
    { Icon: CalendarDays, title: 'Week / date', desc: 'week number and start date' },
    { Icon: Activity, title: 'Run chips', desc: 'each chip shows distance + type for that session' },
    { Icon: BarChart3, title: 'Total km', desc: 'weekly volume shown top-right of each card' },
    { Icon: Palette, title: 'Colors', desc: 'preserved from your Excel file for at-a-glance intensity' },
    { Icon: Pencil, title: 'Editing', desc: 'switch to Table view to edit cells, then export back to .xlsx' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface rounded-2xl shadow-card p-4 text-center">
          <p className="text-3xl font-display font-bold text-ink-900">{dataRows.length}</p>
          <p className="text-xs text-ink-400 mt-1 uppercase tracking-wide">Weeks</p>
        </div>
        <div className="bg-surface rounded-2xl shadow-card p-4 text-center">
          <p className="text-3xl font-display font-bold text-brand-600">{Math.round(totalKm)}</p>
          <p className="text-xs text-ink-400 mt-1 uppercase tracking-wide">Total km</p>
        </div>
        {phases.slice(0, 2).map(p => {
          const km = dataRows.filter(r => cellText(r[C.phase]) === p)
            .reduce((s, r) => s + (parseFloat(cellText(r[C.total])) || 0), 0);
          // Use first row's actual cell color for this phase if available
          const firstRow = dataRows.find(r => cellText(r[C.phase]) === p);
          const style = firstRow?.[C.phase]?.bg
            ? { backgroundColor: firstRow[C.phase].bg, color: firstRow[C.phase].fg || '#1a3a5c' }
            : PHASE_STYLE[p] || { backgroundColor: '#f3f4f6', color: '#374151' };
          return (
            <div key={p} className="rounded-2xl shadow-card p-4 text-center" style={style}>
              <p className="text-3xl font-display font-bold">{Math.round(km)}</p>
              <p className="text-xs mt-1 uppercase tracking-wide opacity-70">{p} km</p>
            </div>
          );
        })}
      </div>

      {/* ── Guide & Legend toggle ── */}
      <div className="mb-5">
        <button
          onClick={() => setLegendOpen(o => !o)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface shadow-card text-sm font-semibold text-ink-600 hover:text-ink-900 transition"
        >
          {legendOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Guide &amp; Legend
        </button>

        {legendOpen && (
          <div className="mt-3 bg-surface rounded-3xl shadow-card p-5 grid sm:grid-cols-2 gap-6">

            {/* Phases */}
            {phases.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">Training Phases</p>
                <div className="flex flex-col gap-2">
                  {phases.map(p => {
                    const firstRow = dataRows.find(r => cellText(r[C.phase]) === p);
                    const style = firstRow?.[C.phase]?.bg
                      ? { backgroundColor: firstRow[C.phase].bg, color: firstRow[C.phase].fg || '#1a3a5c' }
                      : PHASE_STYLE[p] || { backgroundColor: '#f3f4f6', color: '#374151' };
                    const km = dataRows.filter(r => cellText(r[C.phase]) === p)
                      .reduce((s, r) => s + (parseFloat(cellText(r[C.total])) || 0), 0);
                    const phaseDescriptions = {
                      Base: 'Build aerobic foundation at easy effort',
                      Build: 'Increase volume and introduce quality workouts',
                      Peak: 'Highest training load before taper',
                      Taper: 'Reduce volume, maintain sharpness for race day',
                    };
                    return (
                      <div key={p} className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 min-w-[64px] text-center" style={style}>{p}</span>
                        <span className="text-sm text-ink-500 flex-1">{phaseDescriptions[p] || `${Math.round(km)} km total`}</span>
                        <span className="text-xs text-ink-400 font-medium">{Math.round(km)} km</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Run types */}
            {runTypeMap.size > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">Run Types</p>
                <div className="flex flex-col gap-2">
                  {[...runTypeMap.entries()].map(([type, colors]) => {
                    const desc = getRunTypeGuide(type);
                    return (
                      <div key={type} className="flex items-start gap-3">
                        <span
                          className="text-xs font-bold px-2.5 py-0.5 rounded-xl flex-shrink-0 border"
                          style={{
                            backgroundColor: colors.bg || '#f3f4f6',
                            color: colors.fg || '#374151',
                            borderColor: colors.bg || '#e5e7eb',
                          }}
                        >
                          {type}
                        </span>
                        {desc
                          ? <span className="text-sm text-ink-500">{desc}</span>
                          : <span className="text-sm text-ink-400 italic">No description available</span>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reading the cards guide */}
            <div className="sm:col-span-2 pt-4 border-t border-ink-100">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">Reading the Cards</p>
              <div className="grid sm:grid-cols-3 gap-3 text-sm text-ink-500">
                {READING_GUIDE.map(({ Icon, title, desc }) => (
                  <div key={title} className="flex gap-2 items-start">
                    <Icon className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    <span><strong className="text-ink-700">{title}</strong> — {desc}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {phases.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button onClick={() => setActivePhase('')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition
              ${!activePhase ? 'bg-ink-900 dark:bg-ink-100 text-white' : 'bg-surface text-ink-600 shadow-card hover:text-ink-900'}`}>
            All weeks
          </button>
          {phases.map(p => (
            <button key={p} onClick={() => setActivePhase(activePhase === p ? '' : p)}
              style={activePhase === p ? (PHASE_STYLE[p] || {}) : {}}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition
                ${activePhase === p ? '' : 'bg-surface text-ink-600 shadow-card hover:text-ink-900'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {visible.map((row, i) => {
          const phase = cellText(row[C.phase]);
          const phaseStyle = (row[C.phase]?.bg
            ? { backgroundColor: row[C.phase].bg, color: row[C.phase].fg || '#1a3a5c' }
            : PHASE_STYLE[phase]) || {};
          const runs = [
            { km: row[C.r1km], type: row[C.r1type] },
            { km: row[C.r2km], type: row[C.r2type] },
            { km: row[C.r3km], type: row[C.r3type] },
          ].filter(r => cellText(r.km) || cellText(r.type));
          const totalCell = row[C.total];
          const totalVal = cellText(totalCell);

          return (
            <div key={i} className="bg-surface rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-ink-50">
                {phase && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={phaseStyle}>{phase}</span>}
                {C.wk !== -1 && cellText(row[C.wk]) && <span className="font-bold text-ink-800 text-sm">Week {cellText(row[C.wk])}</span>}
                {C.date !== -1 && cellText(row[C.date]) && <span className="text-xs text-ink-400">{cellText(row[C.date])}</span>}
                {totalVal && totalVal !== '0' && (
                  <span className="ml-auto text-sm font-bold" style={totalCell?.bg ? cellStyle(totalCell) : { color: BRAND_600 }}>
                    {parseFloat(totalVal) || totalVal} km
                  </span>
                )}
              </div>
              <div className="px-5 py-3 flex flex-col gap-2">
                {C.focus !== -1 && cellText(row[C.focus]) && <p className="text-sm text-ink-500 italic">{cellText(row[C.focus])}</p>}
                {runs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {runs.map((run, j) => {
                      const km = cellText(run.km);
                      const type = cellText(run.type);
                      if (!km && !type) return null;
                      return (
                        <div key={j} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border"
                          style={{
                            backgroundColor: run.km?.bg || run.type?.bg || '#f9fafb',
                            color: run.km?.fg || run.type?.fg || '#374151',
                            borderColor: run.km?.bg || run.type?.bg || '#e5e7eb',
                          }}>
                          {km && km !== '0' && <span className="font-bold">{km} km</span>}
                          {type && <span className="opacity-80">{type}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Shared toolbar component ───────────────────────────────────────────────────
function PlanToolbar({ isTP, viewMode, setViewMode, rowHeight, setRowHeight, onFullscreen, onExport, exporting, inFullscreen, onClose }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isTP && (
        <div className="flex rounded-full bg-surface shadow-card overflow-hidden p-1">
          <button onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${viewMode === 'table' ? 'bg-brand-500 text-white' : 'text-ink-600 hover:text-ink-900'}`}>
            Table
          </button>
          <button onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${viewMode === 'cards' ? 'bg-brand-500 text-white' : 'text-ink-600 hover:text-ink-900'}`}>
            Cards
          </button>
        </div>
      )}
      {viewMode === 'table' && (
        <select value={rowHeight} onChange={e => setRowHeight(e.target.value)}
          className="px-3 py-1.5 rounded-full bg-surface shadow-card text-xs text-ink-600 border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition">
          <option value="compact">Compact</option>
          <option value="normal">Normal</option>
          <option value="tall">Tall</option>
        </select>
      )}
      {!inFullscreen && (
        <button onClick={onFullscreen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface shadow-card text-xs font-semibold text-ink-600 hover:text-ink-900 transition"
          title="Full screen (ESC to exit)">
          <Maximize2 className="w-3.5 h-3.5" /> Full screen
        </button>
      )}
      <button onClick={onExport} disabled={exporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition shadow-pill disabled:opacity-50">
        {exporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting…</> : <><Download className="w-3.5 h-3.5" /> Export .xlsx</>}
      </button>
      {inFullscreen && (
        <button onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-ink-900 dark:bg-ink-100 text-white hover:bg-ink-800 dark:hover:bg-ink-200 transition">
          <X className="w-3.5 h-3.5" /> Close
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorkoutPlan() {
  usePageTitle('My Training Plan');
  const api = import.meta.env.VITE_API_URL;
  const fileInputRef = useRef();

  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [activeSheet, setActiveSheet] = useState(0);
  const [editedSheets, setEditedSheets] = useState(null);
  const [colWidths, setColWidths] = useState({});   // { [sheetIdx]: number[] }
  const [rowHeight, setRowHeight] = useState('normal');
  const [viewMode, setViewMode] = useState('table');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setFullscreen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError('');
    setFileName(file.name.replace(/\.xlsx?$/i, ''));
    const form = new FormData();
    form.append('file', file);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${api}/workout-plan/parse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse file');
      const processed = data.sheets.map(s => ({ ...s, rows: dedupeMergedCells(s.rows) }));
      setEditedSheets(processed);
      setActiveSheet(0);
      setColWidths({});
      setViewMode('table');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleCellEdit(sheetIdx, row, col, value) {
    setEditedSheets(prev => prev.map((s, si) => si !== sheetIdx ? s : {
      ...s,
      rows: s.rows.map((r, ri) => ri !== row ? r : r.map((c, ci) => ci !== col ? c : { ...c, v: value })),
    }));
  }

  function handleColResize(sheetIdx, ci, width) {
    setColWidths(prev => {
      const arr = [...(prev[sheetIdx] || [])];
      arr[ci] = width;
      return { ...prev, [sheetIdx]: arr };
    });
  }

  async function handleExport() {
    if (!editedSheets) return;
    setExporting(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${api}/workout-plan/export`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheets: editedSheets, fileName }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fileName || 'training-plan'}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  const sheet = editedSheets?.[activeSheet];
  const isTP = sheet ? isTrainingPlan(sheet.rows) : false;

  function renderViewer() {
    if (!sheet) return null;
    if (viewMode === 'cards' && isTP) {
      const cardResult = <TrainingPlanView rows={sheet.rows} />;
      return cardResult || (
        <SpreadsheetView rows={sheet.rows} colWidths={colWidths[activeSheet] || []}
          rowHeight={rowHeight}
          onCellEdit={(r, c, v) => handleCellEdit(activeSheet, r, c, v)}
          onColResize={(ci, w) => handleColResize(activeSheet, ci, w)} />
      );
    }
    return (
      <SpreadsheetView rows={sheet.rows} colWidths={colWidths[activeSheet] || []}
        rowHeight={rowHeight}
        onCellEdit={(r, c, v) => handleCellEdit(activeSheet, r, c, v)}
        onColResize={(ci, w) => handleColResize(activeSheet, ci, w)} />
    );
  }

  const sheetTabs = editedSheets?.length > 1 ? (
    <div className="flex gap-2 flex-wrap">
      {editedSheets.map((s, i) => (
        <button key={i} onClick={() => setActiveSheet(i)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition
            ${activeSheet === i ? 'bg-brand-500 text-white shadow-pill' : 'bg-surface text-ink-600 shadow-card hover:text-ink-900'}`}>
          {s.name}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      {/* ── Fullscreen overlay ── */}
      {fullscreen && editedSheets && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#f3f3f5', overflowY: 'auto' }}>
          <div style={{ padding: '16px 20px' }}>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="font-semibold text-ink-800 text-sm truncate max-w-xs">
                {fileName}{editedSheets.length > 1 ? ` — ${sheet?.name}` : ''}
              </span>
              <div className="ml-auto">
                <PlanToolbar isTP={isTP} viewMode={viewMode} setViewMode={setViewMode}
                  rowHeight={rowHeight} setRowHeight={setRowHeight}
                  onExport={handleExport} exporting={exporting}
                  inFullscreen onClose={() => setFullscreen(false)} />
              </div>
            </div>
            {sheetTabs && <div className="mb-4">{sheetTabs}</div>}
            {renderViewer()}
          </div>
        </div>
      )}

      {/* ── Normal page ── */}
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 mb-2">Training</p>
            <h1 className="font-display font-bold text-4xl text-ink-900 leading-tight">My Training Plan</h1>
            <p className="text-ink-500 mt-2">Upload your workout or running plan — colors and formatting are preserved.</p>
          </div>

          {/* Upload zone */}
          <div onClick={() => fileInputRef.current?.click()}
            className={`bg-surface rounded-3xl border-2 border-dashed p-8 text-center mb-8 cursor-pointer transition
              ${uploading ? 'border-brand-300 bg-brand-50' : 'border-brand-200 hover:border-brand-400 hover:bg-brand-50/40'}`}>
            <span className="inline-grid place-items-center w-16 h-16 rounded-3xl bg-brand-50 text-brand-500 mx-auto mb-3">
              {uploading ? <Loader2 className="w-7 h-7 animate-spin" /> : editedSheets ? <FileSpreadsheet className="w-7 h-7" /> : <FolderOpen className="w-7 h-7" />}
            </span>
            <p className="font-semibold text-ink-700 mb-1">
              {uploading ? 'Parsing your plan…' : editedSheets ? 'Upload a different file' : 'Upload your training plan'}
            </p>
            <p className="text-sm text-ink-400 mb-4">Excel (.xlsx) or CSV — max 10 MB · Colors preserved</p>
            <button type="button" disabled={uploading}
              className="px-6 py-2.5 bg-brand-500 text-white rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill disabled:opacity-50">
              {uploading ? 'Loading…' : 'Choose file'}
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 text-rose-700 rounded-2xl p-4 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {editedSheets && (
            <>
              {/* Header: file name + sheet tabs + toolbar */}
              <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-ink-400 flex items-center gap-1.5"><FolderOpen className="w-4 h-4" /> {fileName}</p>
                  {sheetTabs}
                </div>
                <PlanToolbar isTP={isTP} viewMode={viewMode} setViewMode={setViewMode}
                  rowHeight={rowHeight} setRowHeight={setRowHeight}
                  onFullscreen={() => setFullscreen(true)}
                  onExport={handleExport} exporting={exporting}
                  inFullscreen={false} />
              </div>

              {viewMode === 'table' && (
                <p className="text-xs text-ink-400 mb-3">
                  Click any cell to edit · Drag column header edges to resize
                </p>
              )}

              {renderViewer()}
            </>
          )}
        </div>
      </div>
    </>
  );
}
