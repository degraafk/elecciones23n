import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Party } from '../data/parliamentData';

interface AddPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddParty: (party: { name: string; abbreviation: string; color: string }) => void;
  existingParties: Party[];
  customParties: Party[];
  onDeleteCustomParty?: (partyId: string) => void;
}

const PRESET_COLORS = [
  '#0f766e', // Teal
  '#7c3aed', // Violet
  '#0284c7', // Sky
  '#db2777', // Pink
  '#ea580c', // Orange
  '#16a34a', // Emerald
  '#b45309', // Amber
  '#4f46e5', // Indigo
  '#be123c', // Rose
  '#334155', // Slate
  '#854d0e', // Bronze
  '#059669', // Mint
];

export const AddPartyModal: React.FC<AddPartyModalProps> = ({
  isOpen,
  onClose,
  onAddParty,
  existingParties,
  customParties,
  onDeleteCustomParty
}) => {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [color, setColor] = useState('#0f766e');
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setAbbreviation('');
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
      setError('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAbbr = abbreviation.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanAbbr) {
      setError('Por favor indica las siglas o abreviatura del partido.');
      return;
    }

    if (!cleanName) {
      setError('Por favor indica el nombre del partido.');
      return;
    }

    // Check duplicate abbreviation
    const exists = existingParties.some(
      (p) => p.id.toUpperCase() === cleanAbbr || p.name.toUpperCase() === cleanAbbr
    );
    if (exists) {
      setError(`Ya existe un partido con las siglas "${cleanAbbr}".`);
      return;
    }

    onAddParty({
      name: cleanName,
      abbreviation: cleanAbbr,
      color: color.trim()
    });

    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in-view"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-party-title"
    >
      <div
        className="relative w-full max-w-[440px] bg-white rounded-2xl border border-[#e9e7e0] shadow-[0_25px_50px_-12px_rgba(20,20,20,0.25)] overflow-hidden flex flex-col max-h-[88vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#fafaf8] border-b border-[#e9e7e0] flex items-center justify-between gap-3">
          <div>
            <h3 id="add-party-title" className="text-xl font-bold tracking-tight text-[#17171a] m-0">
              Añadir partido
            </h3>
            <p className="text-xs text-[#77756d] m-0 mt-0.5">
              Personaliza el nombre, siglas y color corporativo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#77756d] hover:text-[#17171a] hover:bg-black/5 active:scale-95 transition-all cursor-pointer text-lg leading-none"
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="text-xs font-semibold text-[#c4281c] bg-[#fdf1ef] border border-[#f5c2bd] px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Abbreviation field */}
          <div>
            <label className="block text-xs font-bold text-[#17171a] uppercase tracking-wide mb-1.5">
              Abreviatura / Siglas <span className="text-[#c4281c]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="Ej. SALF, PACMA, VERDES"
              value={abbreviation}
              onChange={(e) => {
                setAbbreviation(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-[#e9e7e0] bg-[#fafaf8] text-[#17171a] placeholder-[#a19e93] focus:bg-white focus:outline-none focus:border-[#17171a] focus:ring-2 focus:ring-[#17171a]/10 transition-all uppercase"
            />
            <span className="text-[11px] text-[#77756d] mt-1 block">
              Se mostrará en las columnas de la tabla y en las fichas de pactos.
            </span>
          </div>

          {/* Full Name field */}
          <div>
            <label className="block text-xs font-bold text-[#17171a] uppercase tracking-wide mb-1.5">
              Nombre completo <span className="text-[#c4281c]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Se Acabó La Fiesta"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full text-sm px-3 py-2 rounded-xl border border-[#e9e7e0] bg-[#fafaf8] text-[#17171a] placeholder-[#a19e93] focus:bg-white focus:outline-none focus:border-[#17171a] focus:ring-2 focus:ring-[#17171a]/10 transition-all"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-bold text-[#17171a] uppercase tracking-wide mb-1.5">
              Color identificativo
            </label>
            <div className="flex items-center gap-3 mb-2.5">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-[#e9e7e0] p-0.5 bg-white"
                title="Seleccionar color personalizado"
              />
              <input
                type="text"
                value={color.toUpperCase()}
                onChange={(e) => setColor(e.target.value)}
                className="w-28 text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-[#e9e7e0] bg-[#fafaf8] text-[#17171a] focus:bg-white focus:outline-none focus:border-[#17171a]"
                placeholder="#000000"
              />
              <span className="text-xs text-[#77756d]">Haz clic para personalizar</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                    color.toLowerCase() === preset.toLowerCase()
                      ? 'scale-125 border-[#17171a] shadow-xs'
                      : 'border-white/50 hover:scale-110'
                  }`}
                  style={{ backgroundColor: preset }}
                  title={preset}
                />
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="pt-2 border-t border-[#e9e7e0]">
            <span className="text-[11px] font-semibold text-[#77756d] uppercase tracking-wide block mb-1.5">
              Vista previa
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#e9e7e0] bg-[#fafaf8]">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-inner"
                style={{ backgroundColor: color }}
              />
              <span className="text-[#17171a]">{abbreviation.trim() || 'SIGLAS'}</span>
              <b className="text-[#77756d] tabular-nums">0</b>
            </div>
          </div>

          {/* Custom Parties list (if any exist) */}
          {customParties && customParties.length > 0 && (
            <div className="pt-3 border-t border-[#e9e7e0]">
              <span className="text-[11px] font-semibold text-[#77756d] uppercase tracking-wide block mb-1.5">
                Partidos añadidos en esta sesión ({customParties.length})
              </span>
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {customParties.map((cp) => (
                  <div
                    key={cp.id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#fafaf8] border border-[#e9e7e0]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cp.color }}
                      />
                      <span className="font-semibold text-[#17171a]">{cp.name}</span>
                      {cp.fullName && (
                        <span className="text-[#77756d] text-[11px]">({cp.fullName})</span>
                      )}
                    </div>
                    {onDeleteCustomParty && (
                      <button
                        type="button"
                        onClick={() => onDeleteCustomParty(cp.id)}
                        className="text-[11px] text-[#c4281c] hover:underline cursor-pointer"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#e9e7e0] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-[#e9e7e0] bg-white text-[#17171a] hover:bg-[#fafaf8] active:scale-95 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#17171a] text-white hover:bg-[#34343a] active:scale-95 transition-all cursor-pointer"
            >
              Añadir partido
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
