import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SearchableProductSelect } from '../ui/SearchableProductSelect';
import { api } from '../../lib/api';
import { StockMovementType, Product, BulkCreateMovementItem } from '../../types';
import { PlusIcon, Trash2Icon, AlertCircleIcon, LayersIcon, PrinterIcon } from 'lucide-react';
import { printReceipt } from '../../lib/printer';

interface BulkMovementRow extends BulkCreateMovementItem {
  id: string; // local key
  unitCostStr: string;
  qtyStr: string;
}

interface BulkStockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  products?: Product[];
}

export function BulkStockMovementModal({
  isOpen,
  onClose,
  onSuccess,
  products
}: BulkStockMovementModalProps) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // All movement types are "IN" by default
  const [rows, setRows] = useState<BulkMovementRow[]>([
    {
      id: 'row-1',
      product: 0,
      movement_type: 'IN', // Default "IN"
      quantity: '',
      qtyStr: '',
      unitCostStr: '',
      notes: ''
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setReferenceNumber('');
    setNotes('');
    setRows([
      {
        id: `row-${Date.now()}`,
        product: 0,
        movement_type: 'IN',
        quantity: '',
        qtyStr: '',
        unitCostStr: '',
        notes: ''
      }
    ]);
    setError('');
    setIsLoading(false);
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        product: 0,
        movement_type: 'IN', // default IN
        quantity: '',
        qtyStr: '',
        unitCostStr: '',
        notes: ''
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: string, updates: Partial<BulkMovementRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (rows.length === 0) {
      setError('Please add at least one product movement row.');
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.product || row.product <= 0) {
        setError(`Row #${i + 1}: Please select a product from the dropdown.`);
        return;
      }
      const q = parseFloat(row.qtyStr);
      if (isNaN(q) || q <= 0) {
        setError(`Row #${i + 1}: Please enter a valid quantity greater than 0.`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const formattedMovements = rows.map((r) => {
        const item: any = {
          product: r.product,
          movement_type: r.movement_type || 'IN',
          quantity: parseFloat(r.qtyStr).toFixed(3)
        };
        // Unit cost is always optional
        if (r.unitCostStr && r.unitCostStr.trim() && !isNaN(parseFloat(r.unitCostStr))) {
          item.unit_cost = parseFloat(r.unitCostStr).toFixed(2);
        }
        if (r.notes && r.notes.trim()) {
          item.notes = r.notes.trim();
        }
        return item;
      });

      const payload = {
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        movements: formattedMovements
      };

      const res = await api.bulkCreateStockMovements(payload);
      onSuccess(res.message || `Successfully recorded ${res.count || rows.length} stock movements.`);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit bulk stock movements.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInwardSheet = async () => {
    const validRows = rows.filter((r) => r.product > 0);
    if (validRows.length === 0) {
      setError('Please select at least one product before printing inward sheet.');
      return;
    }

    const itemsHtml = validRows
      .map((r, i) => {
        const prod = products?.find((p) => p.id === r.product);
        const prodName = prod?.name || `Product #${r.product}`;
        const prodBarcode = prod?.barcode || '-';
        const prodUnit = prod?.unit_abbreviation || '';
        const qty = parseFloat(r.qtyStr) || 0;
        const cost = r.unitCostStr ? parseFloat(r.unitCostStr) : null;
        const total = cost !== null ? (qty * cost).toFixed(2) : '-';

        return `<tr>
          <td>${i + 1}</td>
          <td><strong>${prodName}</strong><br/><small>${prodBarcode}</small></td>
          <td class="center">${r.movement_type || 'IN'}</td>
          <td class="text-right">${qty.toFixed(2)} ${prodUnit}</td>
          <td class="text-right">${cost !== null ? cost.toFixed(2) : '-'}</td>
          <td class="text-right">${total}</td>
        </tr>`;
      })
      .join('');

    const html = `
      <div class="center bold" style="font-size:15px; margin-bottom:4px;">MEDIFLEX PHARMACY</div>
      <div class="center" style="font-size:11px; margin-bottom:8px;">STOCK INWARD NOTE / GRN</div>
      <div class="separator"></div>
      <div class="row"><span>Ref #:</span><span>${referenceNumber || 'N/A'}</span></div>
      <div class="row"><span>Date:</span><span>${new Date().toLocaleString()}</span></div>
      ${notes ? `<div class="row"><span>Notes:</span><span>${notes}</span></div>` : ''}
      <div class="separator"></div>
      <table>
        <thead>
          <tr>
            <th style="width:20px;">#</th>
            <th>Item</th>
            <th class="center" style="width:35px;">Type</th>
            <th class="text-right" style="width:50px;">Qty</th>
            <th class="text-right" style="width:50px;">Cost</th>
            <th class="text-right" style="width:55px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div class="separator"></div>
      <div class="row bold"><span>Total Items:</span><span>${validRows.length}</span></div>
      <div class="separator"></div>
      <div style="margin-top:20px; font-size:10px;">
        <div style="display:flex; justify-content:space-between; margin-top:25px;">
          <div>Received By: ________________</div>
          <div>Authorized By: ________________</div>
        </div>
      </div>
    `;

    await printReceipt({
      html,
      title: `Stock Inward Note - ${referenceNumber || 'Shipment'}`,
      silent: true
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Bulk Stock Movements (Batch Inward / Shipment)"
      size="full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Shipment Header Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Batch Reference Number <span className="text-slate-400 font-normal lowercase">(e.g. Shipment or Delivery Note #)</span>
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. SHIPMENT-2026-04, PO-8821"
              className="w-full h-10 px-3.5 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-xs transition-shadow"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Batch Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Weekly warehouse shipment delivery"
              className="w-full h-10 px-3.5 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-xs transition-shadow"
            />
          </div>
        </div>

        {/* Movements Table Container */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <LayersIcon className="h-4 w-4 text-emerald-600" />
              Movement Items ({rows.length})
            </span>
            <span className="text-xs text-slate-500">
              Movement types default to <strong className="text-emerald-700">Stock In (IN)</strong>. Unit cost is always optional.
            </span>
          </div>

          <div className="overflow-x-auto max-h-[52vh] min-h-[220px]">
            <table className="w-full text-xs text-left min-w-[1100px]">
              <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200 sticky top-0 z-20 backdrop-blur-xs">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center font-bold">#</th>
                  <th className="px-3.5 py-3 min-w-[340px] font-bold">Product (Searchable Dropdown) *</th>
                  <th className="px-3.5 py-3 w-44 font-bold">Movement Type *</th>
                  <th className="px-3.5 py-3 w-36 text-right font-bold">Quantity *</th>
                  <th className="px-3.5 py-3 w-40 text-right font-bold">Unit Cost (LKR - Optional)</th>
                  <th className="px-3.5 py-3 min-w-[220px] font-bold">Item Notes</th>
                  <th className="px-3.5 py-3 w-14 text-center font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3.5 py-2.5 text-center font-mono text-slate-400 font-semibold">
                      {index + 1}
                    </td>

                    {/* Product Selection with Search Bar */}
                    <td className="px-3.5 py-2.5">
                      <SearchableProductSelect
                        value={row.product}
                        products={products}
                        onChange={(prodId) => handleRowChange(row.id, { product: prodId })}
                        placeholder="Search and select product..."
                        required
                      />
                    </td>

                    {/* Movement Type: Default IN */}
                    <td className="px-3.5 py-2.5">
                      <select
                        value={row.movement_type || 'IN'}
                        onChange={(e) =>
                          handleRowChange(row.id, {
                            movement_type: e.target.value as StockMovementType
                          })
                        }
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                        <option value="IN">IN (Stock In)</option>
                        <option value="OUT">OUT (Stock Out)</option>
                        <option value="ADJUSTMENT">ADJUSTMENT</option>
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="px-3.5 py-2.5">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        required
                        value={row.qtyStr}
                        onChange={(e) => handleRowChange(row.id, { qtyStr: e.target.value })}
                        placeholder="0.000"
                        className="w-full h-10 px-3 text-right rounded-lg border border-slate-300 text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </td>

                    {/* Unit Cost (Always Optional) */}
                    <td className="px-3.5 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.unitCostStr}
                        onChange={(e) => handleRowChange(row.id, { unitCostStr: e.target.value })}
                        placeholder="Optional"
                        className="w-full h-10 px-3 text-right rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </td>

                    {/* Notes */}
                    <td className="px-3.5 py-2.5">
                      <input
                        type="text"
                        value={row.notes || ''}
                        onChange={(e) => handleRowChange(row.id, { notes: e.target.value })}
                        placeholder="Optional item note"
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </td>

                    {/* Delete Row */}
                    <td className="px-3.5 py-2.5 text-center">
                      <button
                        type="button"
                        disabled={rows.length <= 1}
                        onClick={() => handleRemoveRow(row.id)}
                        className={`p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ${rows.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                        title="Remove row">
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="text-xs h-9 font-medium border-slate-300">
              <PlusIcon className="h-4 w-4 mr-1 text-emerald-600" />
              Add Another Product Row
            </Button>

            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span>
                Selected products:{' '}
                <strong className="text-slate-800">
                  {rows.filter((r) => r.product > 0).length}
                </strong>{' '}
                of {rows.length}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintInwardSheet}
            disabled={isLoading}
            className="text-xs text-slate-700 border-slate-300 hover:bg-slate-50"
            title="Print inward note">
            <PrinterIcon className="h-4 w-4 mr-1.5 text-emerald-600" />
            Print Sheet
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5">
              Submit Bulk Stock In ({rows.length} Items)
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
