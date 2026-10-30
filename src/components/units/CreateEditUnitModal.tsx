import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { UnitOfMeasure, CreateUnitPayload } from '../../types';
import {
  ScaleIcon,
  TagIcon,
  AlertCircleIcon,
  SparklesIcon,
  PackageIcon
} from 'lucide-react';

interface CreateEditUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (unit: UnitOfMeasure, isEdit: boolean) => void;
  unitToEdit?: UnitOfMeasure | null;
}

export function CreateEditUnitModal({
  isOpen,
  onClose,
  onSuccess,
  unitToEdit
}: CreateEditUnitModalProps) {
  const isEdit = Boolean(unitToEdit);

  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (unitToEdit) {
        setName(unitToEdit.name || '');
        setAbbreviation(unitToEdit.abbreviation || '');
      } else {
        setName('');
        setAbbreviation('');
      }
      setErrorMessage(null);
    }
  }, [isOpen, unitToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedAbbr = abbreviation.trim();

    if (!trimmedName) {
      setErrorMessage('Unit name is required.');
      return;
    }

    if (trimmedName.length > 50) {
      setErrorMessage('Unit name cannot exceed 50 characters.');
      return;
    }

    if (!trimmedAbbr) {
      setErrorMessage('Unit abbreviation is required.');
      return;
    }

    if (trimmedAbbr.length > 10) {
      setErrorMessage('Abbreviation cannot exceed 10 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateUnitPayload = {
        name: trimmedName,
        abbreviation: trimmedAbbr
      };

      let result: UnitOfMeasure;
      if (isEdit && unitToEdit) {
        result = await api.updateUnit(unitToEdit.id, payload);
      } else {
        result = await api.createUnit(payload);
      }

      onSuccess(result, isEdit);
      onClose();
    } catch (err: any) {
      const data = err.data;
      if (data?.name) {
        const nameErr = Array.isArray(data.name) ? data.name.join(' ') : data.name;
        setErrorMessage(nameErr);
      } else if (data?.abbreviation) {
        const abbrErr = Array.isArray(data.abbreviation)
          ? data.abbreviation.join(' ')
          : data.abbreviation;
        setErrorMessage(abbrErr);
      } else if (err.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save unit of measure. Please check inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleAbbr = abbreviation.trim() || 'unit';
  const sampleName = name.trim() || 'Unit Name';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Unit of Measure: ${unitToEdit?.name}` : 'Create Unit of Measure'}
      size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Name */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Unit Name <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {name.length}/50
            </span>
          </div>
          <div className="relative">
            <ScaleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tablet, Capsule, Syrup Bottle, Vial, Ampoule"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition bg-white"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Case-insensitive unique name defining how products are packaged or dispensed.
          </p>
        </div>

        {/* Abbreviation */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Abbreviation <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {abbreviation.length}/10
            </span>
          </div>
          <div className="relative">
            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              maxLength={10}
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              placeholder="e.g. tab, cap, btl, vl, amp, strip"
              className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition bg-white"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Short code printed on receipts, customer bills, and shelf labels.
          </p>
        </div>

        {/* Live Preview Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <SparklesIcon className="h-3.5 w-3.5 text-emerald-600" />
            <span>Label & Receipt Preview</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <PackageIcon className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">Paracetamol 500mg</p>
                <p className="text-[11px] text-slate-500">
                  Full unit: <strong className="text-slate-700">{sampleName}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Qty: 2 {sampleAbbr}
              </span>
              <span className="text-[11px] font-mono text-slate-600">
                Rs. 25.00
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Unit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
