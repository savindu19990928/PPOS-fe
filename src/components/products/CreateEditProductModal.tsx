import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { Product, UnitOfMeasure, Supplier } from '../../types';
import {
  PackageIcon,
  BarcodeIcon,
  TagIcon,
  DollarSignIcon,
  ScaleIcon,
  Building2Icon,
  AlertCircleIcon,
  InfoIcon,
  SparklesIcon
} from 'lucide-react';

interface CreateEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product, isEdit: boolean) => void;
  productToEdit?: Product | null;
}

export function CreateEditProductModal({
  isOpen,
  onClose,
  onSuccess,
  productToEdit
}: CreateEditProductModalProps) {
  const isEdit = Boolean(productToEdit);

  // Form states
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<number | ''>('');
  const [supplier, setSupplier] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [minimumStockLevel, setMinimumStockLevel] = useState('50.000');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Reference options
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(false);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch reference data (Units and Suppliers)
  useEffect(() => {
    if (isOpen) {
      setIsLoadingRefs(true);
      Promise.all([
        api.getUnits().catch(() => [] as UnitOfMeasure[]),
        api.getSuppliers().catch(() => [] as Supplier[])
      ])
        .then(([unitsData, suppliersData]) => {
          setUnits(Array.isArray(unitsData) ? unitsData : []);
          const resolvedSuppliers = Array.isArray(suppliersData)
            ? suppliersData
            : (suppliersData as any)?.results || [];
          setSuppliers(resolvedSuppliers);
        })
        .finally(() => {
          setIsLoadingRefs(false);
        });
    }
  }, [isOpen]);

  // Sync form with productToEdit
  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name || '');
        setBarcode(productToEdit.barcode || '');
        setUnitOfMeasure(productToEdit.unit_of_measure || '');
        setSupplier(productToEdit.supplier || '');
        setSellingPrice(productToEdit.selling_price || '');
        setCostPrice(productToEdit.cost_price || '');
        setMinimumStockLevel(productToEdit.minimum_stock_level || '50.000');
        setDescription(productToEdit.description || '');
        setIsActive(productToEdit.is_active !== undefined ? productToEdit.is_active : true);
      } else {
        setName('');
        setBarcode('');
        setUnitOfMeasure(units.length > 0 ? units[0].id : '');
        setSupplier('');
        setSellingPrice('');
        setCostPrice('');
        setMinimumStockLevel('50.000');
        setDescription('');
        setIsActive(true);
      }
      setErrorMessage(null);
    }
  }, [isOpen, productToEdit, units]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }

    if (!unitOfMeasure) {
      setErrorMessage('Please select a unit of measure.');
      return;
    }

    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      setErrorMessage('Please provide a valid selling price greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        unit_of_measure: Number(unitOfMeasure),
        selling_price: parseFloat(sellingPrice).toFixed(2),
        is_active: isActive
      };

      if (barcode.trim()) {
        payload.barcode = barcode.trim();
      } else if (!isEdit) {
        payload.barcode = ''; // Backend will auto-generate barcode with PHARM...
      }

      if (supplier !== '' && supplier !== null) {
        payload.supplier = Number(supplier);
      } else {
        payload.supplier = null;
      }

      if (costPrice && !isNaN(parseFloat(costPrice))) {
        payload.cost_price = parseFloat(costPrice).toFixed(2);
      }

      if (minimumStockLevel && !isNaN(parseFloat(minimumStockLevel))) {
        payload.minimum_stock_level = parseFloat(minimumStockLevel).toFixed(3);
      }

      if (description.trim()) {
        payload.description = description.trim();
      }

      let resultProduct: Product;
      if (isEdit && productToEdit) {
        resultProduct = await api.updateProduct(productToEdit.id, payload);
      } else {
        resultProduct = await api.createProduct(payload);
      }

      onSuccess(resultProduct, isEdit);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product. Please check the inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Product: ${productToEdit?.name}` : 'Create New Product'}
      size="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Product Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <PackageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paracetamol 500mg"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Barcode */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Barcode</label>
              {!isEdit && !barcode && (
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <SparklesIcon className="h-3 w-3" /> Auto-generates if blank
                </span>
              )}
            </div>
            <div className="relative">
              <BarcodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder={isEdit ? 'Barcode' : 'Leave empty to auto-generate'}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Unit of Measure */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <ScaleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                required
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value ? Number(e.target.value) : '')}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition bg-white">
                <option value="">Select Unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Selling Price (Rs.) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cost Price (Rs.)
            </label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Minimum Stock Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Minimum Stock Alert Level
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={minimumStockLevel}
              onChange={(e) => setMinimumStockLevel(e.target.value)}
              placeholder="50"
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supplier (Optional)
            </label>
            <div className="relative">
              <Building2Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value ? Number(e.target.value) : '')}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition bg-white">
                <option value="">No Supplier Assigned</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Indications, dosage details, or manufacturer notes..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Active status */}
          <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-800">Product Status</p>
              <p className="text-[11px] text-slate-500">
                Active products appear in POS cashier catalog and barcode search.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
