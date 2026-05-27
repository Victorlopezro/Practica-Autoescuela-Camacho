'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ── Types ──────────────────────────────────────────────────── */

export interface BlockData {
  id: string;
  start: string;
  end: string;
  track: string;
  saved: boolean;
}

interface ScheduleBlockEditorProps {
  teacherId: string;
  dayIndex: number;
  dayLabel: string;
  blocks: BlockData[];
  isSaving: boolean;
  maxBlocks?: number;
  onSave: (dayIndex: number, block: BlockData) => Promise<void>;
  onRemove: (dayIndex: number, block: BlockData) => Promise<void>;
  onAdd: (dayIndex: number) => void;
  onUpdate: (dayIndex: number, blockId: string, field: 'start' | 'end' | 'track', value: string) => void;
}

/* ── Constants ──────────────────────────────────────────────── */

const TRACK_OPTIONS = [
  { value: '', label: 'General' },
  { value: 'pista', label: 'Pista (30 min)' },
  { value: 'circulacion', label: 'Circulación (45 min)' },
] as const;

/* ── Component ──────────────────────────────────────────────── */

export function ScheduleBlockEditor({
  dayIndex,
  dayLabel,
  blocks,
  isSaving,
  maxBlocks = 2,
  onSave,
  onRemove,
  onAdd,
  onUpdate,
}: ScheduleBlockEditorProps) {
  const [error, setError] = useState('');

  function handleSave(block: BlockData) {
    if (block.start >= block.end) {
      setError(`La hora de inicio debe ser anterior a la de fin en ${dayLabel}`);
      return;
    }
    setError('');
    onSave(dayIndex, block);
  }

  function handleRemove(block: BlockData) {
    setError('');
    onRemove(dayIndex, block);
  }

  function handleAdd() {
    setError('');
    onAdd(dayIndex);
  }

  const inputClass =
    'flex-1 min-w-[100px] px-2 py-1 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface';

  const selectClass =
    'px-2 py-1 text-xs border border-outline-variant/50 rounded-lg bg-white text-on-surface w-auto';

  return (
    <div className="space-y-2">
      {blocks.map((block) => (
        <div
          key={block.id}
          className={cn(
            'flex items-center gap-2 flex-wrap',
            block.saved && 'opacity-90',
          )}
        >
          <select
            value={block.track}
            onChange={(e) => onUpdate(dayIndex, block.id, 'track', e.target.value)}
            className={selectClass}
          >
            {TRACK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="time"
            value={block.start}
            onChange={(e) => onUpdate(dayIndex, block.id, 'start', e.target.value)}
            className={inputClass}
          />

          <span className="text-outline text-sm flex-shrink-0">a</span>

          <input
            type="time"
            value={block.end}
            onChange={(e) => onUpdate(dayIndex, block.id, 'end', e.target.value)}
            className={inputClass}
          />

          <Button
            variant={block.saved ? 'outline' : 'default'}
            size="sm"
            onClick={() => handleSave(block)}
            disabled={isSaving}
          >
            {block.saved ? 'Actualizar' : 'Guardar'}
          </Button>

          <button
            onClick={() => handleRemove(block)}
            className="flex-shrink-0 p-1 text-error hover:text-error/80 transition-colors text-sm"
            title="Eliminar bloque"
          >
            ✕
          </button>
        </div>
      ))}

      {error && (
        <p className="text-xs text-error mt-1">{error}</p>
      )}

      {blocks.length < maxBlocks && (
        <button
          onClick={handleAdd}
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          + Añadir bloque
        </button>
      )}
    </div>
  );
}
