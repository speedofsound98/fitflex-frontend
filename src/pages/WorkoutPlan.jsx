// src/pages/WorkoutPlan.jsx — upload & display workout / training plans
import React, { useState, useRef } from 'react';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

const PHASE_COLORS = {
  Base:  { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Build: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  Peak:  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Taper: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const RUN_TYPE_COLORS = {
  'Easy Run':  'bg-green-50 text-green-700 border-green-200',
  'Long Run':  'bg-blue-50 text-blue-700 border-blue-200',
  'Tempo':     'bg-orange-50 text-orange-700 border-orange-200',
  'Intervals': 'bg-red-50 text-red-700 border-red-200',
  'Fartlek':   'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Strides':   'bg-teal-50 text-teal-700 border-teal-200',
  'Rest / Cross-train': 'bg-gray-50 text-gray-500 border-gray-200',
};

function runTypeBadge(text) {
  if (!text) return null;
  const key = Object.keys(RUN_TYPE_COLORS).find(k => text.includes(k));
  const cls = key ? RUN_TYPE_COLORS[key] : 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-block border rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

// ── Detect if this looks like a training plan sheet ──
function isTrainingPlan(rows) {
  const flat = rows.flat().join(' ').toLowerCase();
  return flat.includes('week') || flat.includes('phase') || flat.includes('run') || flat.includes('km');
}

// ── Try to find the header row (row with most non-empty cells) ──
function findHeaderRow(rows) {
  let best = 0, bestCount = 0;
  rows.forEach((r, i) => {
    const count = r.filter(c => c !== '').length;
    if (count > bestCount) { bestCount = count; best = i; }
  });
  return best;
}

// ── Render a training plan with rich cards ──
function TrainingPlanView({ rows }) {
  const headerIdx = findHeaderRow(rows);
  const headers = rows[headerIdx].map(h => String(h).trim());
  const dataRows = rows.slice(headerIdx + 1).filter(r => r.some(c => c !== ''));

  // Find column indices by fuzzy header matching
  function col(keywords) {
    return headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k)));
  }

  const colWk     = col(['wk', 'week #', '#']);
  const colDate   = col(['week of', 'date', 'start']);
  const colPhase  = col(['phase']);
  const colFocus  = col(['focus', 'goal', 'weekly goal', 'phase focus']);
  const colR1km   = col(['run 1\nkm', 'run 1 km', 'run1 km']);
  const colR1type = col(['run 1 type', 'run 1\ntype']);
  const colR2km   = col(['run 2\nkm', 'run 2 km', 'run2 km']);
  const colR2type = col(['run 2 type', 'run 2\ntype']);
  const colR3km   = col(['run 3\nkm', 'run 3 km', 'run3 km']);
  const colR3type = col(['run 3 type', 'run 3\ntype']);
  const colTotal  = col(['total\nkm', 'total km', 'total']);

  const hasRuns = colR1km !== -1 || colR2km !== -1;

  if (!hasRuns) return <GenericTableView rows={rows} />;

  const phases = [...new Set(dataRows.map(r => String(r[colPhase] || '')).filter(Boolean))];
  const [activePhase, setActivePhase] = useState('');

  const visible = activePhase
    ? dataRows.filter(r => String(r[colPhase]) === activePhase)
    : dataRows;

  const totalKm = dataRows.reduce((sum, r) => sum + (Number(r[colTotal]) || 0), 0);

  function cell(r, idx) { return idx !== -1 ? r[idx] : ''; }

  return (
    <div>
      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{dataRows.length}</p>
          <p className="text-xs text-gray-500">Weeks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{Math.round(totalKm)}</p>
          <p className="text-xs text-gray-500">Total km</p>
        </div>
        {phases.map(p => {
          const c = PHASE_COLORS[p] || { bg: 'bg-gray-100', text: 'text-gray-700' };
          const phaseKm = dataRows.filter(r => String(r[colPhase]) === p)
            .reduce((s, r) => s + (Number(r[colTotal]) || 0), 0);
          return (
            <div key={p} className="text-center">
              <p className={`text-2xl font-bold ${c.text}`}>{Math.round(phaseKm)}</p>
              <p className="text-xs text-gray-500">{p} km</p>
            </div>
          );
        })}
      </div>

      {/* Phase filter */}
      {phases.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button onClick={() => setActivePhase('')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border
              ${!activePhase ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            All weeks
          </button>
          {phases.map(p => {
            const c = PHASE_COLORS[p] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
            return (
              <button key={p} onClick={() => setActivePhase(activePhase === p ? '' : p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border flex items-center gap-1.5
                  ${activePhase === p ? `${c.bg} ${c.text} border-current` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                {p}
              </button>
            );
          })}
        </div>
      )}

      {/* Week cards */}
      <div className="space-y-3">
        {visible.map((r, i) => {
          const phase = String(cell(r, colPhase));
          const c = PHASE_COLORS[phase] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
          const runs = [
            colR1km !== -1 && { km: cell(r, colR1km), type: cell(r, colR1type) },
            colR2km !== -1 && { km: cell(r, colR2km), type: cell(r, colR2type) },
            colR3km !== -1 && { km: cell(r, colR3km), type: cell(r, colR3type) },
          ].filter(Boolean).filter(run => run.km || run.type);

          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                  {phase || '—'}
                </span>
                {colWk !== -1 && (
                  <span className="text-sm font-bold text-gray-800">Week {cell(r, colWk)}</span>
                )}
                {colDate !== -1 && cell(r, colDate) && (
                  <span className="text-xs text-gray-400">
                    {cell(r, colDate) instanceof Date
                      ? cell(r, colDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : String(cell(r, colDate))}
                  </span>
                )}
                {colTotal !== -1 && cell(r, colTotal) !== '' && (
                  <span className="ml-auto text-sm font-bold text-blue-600">{cell(r, colTotal)} km total</span>
                )}
              </div>

              <div className="px-5 py-3">
                {colFocus !== -1 && cell(r, colFocus) && (
                  <p className="text-sm text-gray-600 mb-3 italic">{String(cell(r, colFocus))}</p>
                )}
                {runs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {runs.map((run, j) => (
                      <div key={j} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                        {run.km !== '' && run.km !== 0 && (
                          <span className="font-bold text-gray-800 text-sm">{run.km} km</span>
                        )}
                        {run.type && runTypeBadge(String(run.type))}
                      </div>
                    ))}
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

// ── Generic table for non-plan sheets ──
function GenericTableView({ rows }) {
  if (!rows.length) return <p className="text-gray-400 text-sm">Empty sheet.</p>;
  const headerIdx = findHeaderRow(rows);
  const headers = rows[headerIdx];
  const dataRows = rows.slice(headerIdx + 1);

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                {String(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} className="border-b border-gray-50 hover:bg-gray-50 transition">
              {headers.map((_, ci) => (
                <td key={ci} className="px-4 py-2.5 text-gray-600">
                  {row[ci] instanceof Date
                    ? row[ci].toLocaleDateString()
                    : String(row[ci] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
          <p className="text-gray-500 mt-1">Upload an Excel or CSV file with your workout or running plan to view it here.</p>
        </div>

        {/* Upload area */}
        <div
          className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-8 text-center mb-8 cursor-pointer hover:border-blue-400 transition"
          onClick={() => inputRef.current?.click()}
        >
          <div className="text-4xl mb-3">📊</div>
          <p className="font-semibold text-gray-700 mb-1">
            {uploading ? 'Parsing your plan…' : plan ? 'Upload a different file' : 'Drop your training plan here'}
          </p>
          <p className="text-sm text-gray-400 mb-4">Excel (.xlsx, .xls) or CSV — max 10 MB</p>
          <button
            type="button"
            disabled={uploading}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {uploading ? '⏳ Loading…' : '📂 Choose file'}
          </button>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-6">{error}</div>
        )}

        {plan && (
          <>
            {/* File name + sheet tabs */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-sm text-gray-500">📁 {fileName}</p>
              {plan.sheets.length > 1 && (
                <div className="flex gap-2">
                  {plan.sheets.map((s, i) => (
                    <button key={i} onClick={() => setActiveSheet(i)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition border
                        ${activeSheet === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sheet content */}
            {sheet && (
              isTrainingPlan(sheet.rows)
                ? <TrainingPlanView rows={sheet.rows} />
                : <GenericTableView rows={sheet.rows} />
            )}
          </>
        )}

        {/* Empty state hint */}
        {!plan && !uploading && (
          <div className="text-center text-gray-400 text-sm mt-4">
            Supports multi-sheet Excel files — each sheet gets its own tab above.
          </div>
        )}
      </div>
    </div>
  );
}
