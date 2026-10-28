import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Supplier, MarkNextSupplyResponse } from '../../types';
import { api } from '../../lib/api';
import { TruckIcon, CalendarIcon, AlertCircleIcon } from 'lucide-react';

interface MarkNextSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSuccess: (response: MarkNextSupplyResponse) => void;
}

export function MarkNextSupplyModal({
  isOpen,
  onClose,
  supplier,
  onSuccess
}: MarkNextSupplyModalProps) {
  const [supplyDate, setSupplyDate] = useState('');
  const [supplyNotes, setSupplyNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setSupplyDate(supplier.next_supply_date || '');
      setSupplyNotes(supplier.next_supply_notes || '');
      setError(null);
    }
  }, [supplier, isOpen]);

  const handleDatePreset = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const dateStr = d.toISOString().split('T')[0];
    setSupplyDate(dateStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    if (!supplyDate) {
      setError('Next supply delivery date is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.markNextSupplyDate(supplier.id, {
        next_supply_date: supplyDate,
        next_supply_notes: supplyNotes.trim() || undefined
      });

      onSuccess(response);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update next supply date.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!supplier) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule Delivery: ${supplier.name}`}
      size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          <p className="font-semibold text-slate-800">
            Delivery Scheduling & Stock Replenishment
          </p>
          <p className="mt-0.5">
            Marking a delivery date adds this supplier to the Next Supplying Items schedule and automated alert tracking.
          </p>
        </div>

        {/* Quick Date Presets */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Quick Date Shortcuts
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium"
              onClick={() => handleDatePreset(0)}>
              Today
            </button>
            <button
              type="button"
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium"
              onClick={() => handleDatePreset(1)}>
              Tomorrow
            </button>
            <button
              type="button"
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium"
              onClick={() => handleDatePreset(3)}>
              In 3 Days
            </button>
            <button
              type="button"
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium"
              onClick={() => handleDatePreset(7)}>
              In 1 Week
            </button>
            <button
              type="button"
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium"
              onClick={() => handleDatePreset(14)}>
              In 2 Weeks
            </button>
          </div>
        </div>

        {/* Date Input */}
        <Input
          type="date"
          label="Next Supply Date *"
          value={supplyDate}
          onChange={(e) => setSupplyDate(e.target.value)}
          required
        />

        {/* Order Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Expected Delivery Notes & Items
          </label>
          <textarea
            rows={3}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Urgent order for 50 boxes of Insulin Glargine & 100 boxes Amoxicillin"
            value={supplyNotes}
            onChange={(e) => setSupplyNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            <TruckIcon className="h-4 w-4 mr-1.5" />
            Save Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
