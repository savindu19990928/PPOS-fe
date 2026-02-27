import React, { useState } from 'react';
import { Trash2Icon, PlusIcon, MinusIcon } from 'lucide-react';
import { CartItem } from '../../types';
import { Button } from '../ui/Button';
interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
}
export function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartProps) {
  // Track which item is being edited and its temporary input value
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const handleStartEdit = (item: CartItem) => {
    setEditingId(item.id);
    setEditValue(String(item.quantity));
  };
  const handleCommitEdit = (item: CartItem) => {
    const maxStock = parseFloat(item.current_stock);
    let newQty = parseInt(editValue, 10);
    if (isNaN(newQty) || newQty < 1) newQty = 1;
    if (newQty > maxStock) newQty = Math.floor(maxStock);
    const delta = newQty - item.quantity;
    if (delta !== 0) {
      onUpdateQuantity(item.id, delta);
    }
    setEditingId(null);
    setEditValue('');
  };
  const handleKeyDown = (e: React.KeyboardEvent, item: CartItem) => {
    if (e.key === 'Enter') {
      handleCommitEdit(item);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  };
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 sm:p-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
          <span className="text-xl sm:text-2xl">🛒</span>
        </div>
        <p className="text-base sm:text-lg font-medium">Cart is empty</p>
        <p className="text-xs sm:text-sm">Scan a product to start sale</p>
      </div>);

  }
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
        {items.map((item) => {
          const maxStock = parseFloat(item.current_stock);
          const atMax = item.quantity >= maxStock;
          const isEditing = editingId === item.id;
          return (
            <div
              key={item.id}
              className="p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-emerald-200 transition-colors">

              {/* Mobile: Stack layout, Desktop: Row layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                {/* Product info */}
                <div className="flex-1 min-w-0 sm:mr-4">
                  <h4 className="font-medium text-slate-900 truncate text-sm sm:text-base">
                    {item.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {parseFloat(item.selling_price).toFixed(2)} /{' '}
                    {item.unit_abbreviation}
                  </p>
                  {atMax &&
                  <p className="text-xs text-amber-600 font-medium mt-0.5">
                      Max stock reached
                    </p>
                  }
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                  {/* Quantity controls */}
                  <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-sm">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="p-1 sm:p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-l-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={item.quantity <= 1}>

                      <MinusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    {isEditing ?
                    <input
                      type="number"
                      min="1"
                      max={Math.floor(maxStock)}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleCommitEdit(item)}
                      onKeyDown={(e) => handleKeyDown(e, item)}
                      autoFocus
                      className="w-10 sm:w-12 text-center font-medium text-slate-900 text-xs sm:text-sm bg-white outline-none border-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /> :


                    <button
                      onClick={() => handleStartEdit(item)}
                      className="w-10 sm:w-12 text-center font-medium text-slate-900 text-xs sm:text-sm cursor-text hover:bg-emerald-50 transition-colors py-0.5"
                      title="Click to type quantity">

                        {item.quantity}
                      </button>
                    }
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className={`p-1 sm:p-1.5 rounded-r-md transition-colors ${atMax ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                      disabled={atMax}>

                      <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right w-16 sm:w-20">
                    <p className="font-bold text-emerald-700 text-sm sm:text-base">
                      {item.subtotal.toFixed(2)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">

                    <Trash2Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>);

        })}
      </div>

      <div className="p-2 sm:p-4 bg-slate-50 border-t border-slate-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearCart}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full mb-2 text-xs sm:text-sm">

          Clear Cart
        </Button>
      </div>
    </div>);

}