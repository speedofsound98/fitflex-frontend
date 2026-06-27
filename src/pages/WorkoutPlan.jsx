// src/pages/WorkoutPlan.jsx
import React, { useState, useRef } from 'react';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

// ── Helpers ──────────────────────────────────────────────────────────────────

function cellStyle(cell) {
  if (!cell) return {};
  const s = {};
  if (cell.bg) s.backgroundColor = cell.bg;
  if (cell.fg) s.color = cell.fg;
  if (cell.bold) s.fontWeight = 'bold';
  return s;
}

function cellText(cell) {
  if (!cell) return '';
  return cell.v ?? '';
}

function isTrainingPlan(rows) {
  const flat = rows.flatMap(r => r.map(c => c?.v || '')).join(' ').toLowerCase();
  return (flat.includes('week') || flat.includes('phase')) && flat.includes('run');
}

function findHeaderRowIdx(rows) {
  let best = 0, bestCount = 0;
  rows.forEach((r, i) => {
    const count = r.filter(c => c?.v?.trim()).length;
    if (count > bestCount) { bestCount = count; best = i; }
  });
  return best;
}

function colIdx(headers, keywords) {
  return headers.findIndex(h =>
    keywords.some(k => (h?.v || '').toLowerCase().includes(k.toLowerCase()))
  );
}

// ── Phase badge colors (fallback if no Excel color) ─────────────────────────
const PHASE_STYLE = {
  Base:  { backgroundColor: '#d6e4f0', color: '#1a3a5c' },
  Build: { backgroundColor: '#d9ead3', color: '#1a4a1a' },
  Peak:  { backgroundColor: '#fce5cd', color: '#7f3000' },
  Taper: { backgroundColor: '#e8d5f5', color: '#4a1a6a' },
};

// ── Training Plan rich view ──────────────────────────────────────────────────
function TrainingPlanView({ rows }) {
  const headerIdx = findHeaderRowIdx(rows);
  const headers = rows[headerIdx] || [];
  const dataRows = rows.slice(headerIdx + 1).filter(r => r.some(c => c?.v?.trim()));

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
  if (!hasRuns) return <GenericTableView rows={rows} />;

  const phases = [...new Set(dataRows.map(r => cellText(r[C.phase])).filter(Boolean))];
  const [activePhase, setActivePhase] = useState('');

  const visible = activePhase
    ? dataRows.filter(r => cellText(r[C.phase]) === activePhase)
    : dataRows;

  const totalKm = dataRows.reduce((s, r) => s + (parseFloat(cellText(r[C.total])) || 0), 0);

  return (
    <div>
      {/* ── Summary bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-extrabold text-gray-900">{dataRows.length}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Weeks</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-extrabold text-blue-600">{Math.round(totalKm)}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Total km</p>
        </div>
        {phases.slice(0, 2).map(p => {
          const km = dataRows.filter(r => cellText(r[C.phase]) === p)
            .reduce((s, r) => s + (parseFloat(cellText(r[C.total])) || 0), 0);
          const style = PHASE_STYLE[p] || { backgroundColor: '#f3f4f6', color: '#374151' };
          return (
            <div key={p} className="rounded-2xl shadow-sm border border-gray-100 p-4 text-center" style={style}>
              <p className="text-3xl font-extrabold">{Math.round(km)}</p>
              <p className="text-xs mt-1 uppercase tracking-wide opacity-70">{p} km</p>
            </div>
          );
        })}
      </div>

      {/* ── Phase filter ── */}
      {phases.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button onClick={() => setActivePhase('')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border
              ${!activePhase ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            All weeks
          </button>
          {phases.map(p => {
            const style = activePhase === p
              ? PHASE_STYLE[p] || { backgroundColor: '#e5e7eb', color: '#374151' }
              : {};
            return (
              <button key={p} onClick={() => setActivePhase(activePhase === p ? '' : p)}
                style={activePhase === p ? style : {}}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border
                  ${activePhase === p ? 'border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {p}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Week cards ── */}
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
          ].filter(r => r.km || r.type).filter(r => cellText(r.km) || cellText(r.type));

          const totalCell = row[C.total];
          const totalVal = cellText(totalCell);

          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
                {phase && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={phaseStyle}>
                    {phase}
                  </span>
                )}
                {C.wk !== -1 && cellText(row[C.wk]) && (
                  <span className="font-bold text-gray-800 text-sm">
                    Week {cellText(row[C.wk])}
                  </span>
                )}
                {C.date !== -1 && cellText(row[C.date]) && (
                  <span className="text-xs text-gray-400">{cellText(row[C.date])}</span>
                )}
                {totalVal && totalVal !== '0' && (
                  <span className="ml-auto text-sm font-bold" style={totalCell?.bg ? cellStyle(totalCell) : { color: '#2563eb' }}>
                    {parseFloat(totalVal) || totalVal} km
                  </span>
                )}
              </div>

              {/* Card body */}
              <div className="px-5 py-3 flex flex-col gap-2">
                {C.focus !== -1 && cellText(row[C.focus]) && (
                  <p className="text-sm text-gray-500 italic">{cellText(row[C.focus])}</p>
                )}
                {runs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {runs.map((run, j) => {
                      const km = cellText(run.km);
                      const type = cellText(run.type);
                      const hasKm = km && km !== '0';
                      if (!hasKm && !type) return null;
                      return (
                        <div key={j}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border"
                          style={{
                            backgroundColor: run.km?.bg || run.type?.bg || '#f9fafb',
                            color: run.km?.fg || run.type?.fg || '#374151',
                            borderColor: run.km?.bg || run.type?.bg || '#e5e7eb',
                          }}>
                          {hasKm && <span className="font-bold">{km} km</span>}
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

// ── Generic table view ───────────────────────────────────────────────────────
function GenericTableView({ rows }) {
  if (!rows.length) return <p className="text-gray-400 text-sm">Empty sheet.</p>;
  const headerIdx = findHeaderRowIdx(rows);
  const headers = rows[headerIdx] || [];
  const dataRows = rows.slice(headerIdx + 1).filter(r => r.some(c => c?.v?.trim()));
  const colCount = Math.max(...rows.map(r => r.length));

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {Array.from({ length: colCount }, (_, i) => (
              <th key={i}
                className="text-left px-4 py-3 font-semibold whitespace-nowrap"
                style={headers[i] ? { ...cellStyle(headers[i]), background: headers[i].bg || '#1a3a5c', color: headers[i].fg || '#ffffff' } : { background: '#1a3a5c', color: '#fff' }}>
                {cellText(headers[i])}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} className="border-t border-gray-50 hover:brightness-95 transition">
              {Array.from({ length: colCount }, (_, ci) => {
                const cell = row[ci];
                return (
                  <td key={ci} className="px-4 py-2.5" style={cellStyle(cell)}>
                    {cellText(cell)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function WorkoutPlan() {
  usePageTitle('My Training Plan');
  const api = import.meta.env.VITE_API_URL;
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);
  const [fileName, setFileName] = useState('');
  const [activeSheet, setActiveSheet] = useState(0);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError(''); setPlan(null);
    setFileName(file.name);
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
      setPlan(data);
      setActiveSheet(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const sheet = plan?.sheets?.[activeSheet];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Training Plan</h1>
          <p className="text-gray-500 mt-1">Upload your workout or running plan — colors and formatting are preserved from your file.</p>
        </div>

        {/* Upload zone */}
        <div
          onClick={() => inputRef.current?.click()}
          className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center mb-8 cursor-pointer transition
            ${uploading ? 'border-blue-300 bg-blue-50' : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/30'}`}
        >
          <div className="text-5xl mb-3">{uploading ? '⏳' : plan ? '📊' : '📂'}</div>
          <p className="font-semibold text-gray-700 mb-1">
            {uploading ? 'Parsing your plan…' : plan ? 'Upload a different file' : 'Upload your training plan'}
          </p>
          <p className="text-sm text-gray-400 mb-4">Excel (.xlsx) or CSV — max 10 MB · Colors preserved</p>
          <button type="button" disabled={uploading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {uploading ? 'Loading…' : 'Choose file'}
          </button>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-6">{error}</div>
        )}

        {plan && (
          <>
            {/* File name + sheet tabs */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <p className="text-sm text-gray-400">📁 {fileName}</p>
              {plan.sheets.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {plan.sheets.map((s, i) => (
                    <button key={i} onClick={() => setActiveSheet(i)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border
                        ${activeSheet === i
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {sheet && (
              isTrainingPlan(sheet.rows)
                ? <TrainingPlanView rows={sheet.rows} />
                : <GenericTableView rows={sheet.rows} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
