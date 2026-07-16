// src/components/Toggle.jsx — reusable on/off switch in the brand style
import React from 'react';

export default function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition disabled:opacity-50
        ${checked ? 'bg-brand-500' : 'bg-ink-200'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
        ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
