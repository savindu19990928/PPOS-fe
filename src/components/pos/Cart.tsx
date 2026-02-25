import React from 'react';
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
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🛒</span>
        </div>
        <p className="text-lg font-medium">Cart is empty</p>
        <p className="text-sm">Scan a product to start sale</p>
      </div>);

  }
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item) => {
          const maxStock = parseFloat(item.current_stock);
          const atMax = item.quantity >= maxStock;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-emerald-200 transition-colors">

              <div className="flex-1 min-w-0 mr-4">
                <h4 className="font-medium text-slate-900 truncate">
                  {item.name}
                </h4>
                <p className="text-sm text-slate-500">
                  {parseFloat(item.selling_price).toFixed(2)} /{' '}
                  {item.unit_abbreviation}
                </p>
                {atMax &&
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                    Max stock reached
                  </p>
                }
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-sm">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-l-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={item.quantity <= 1}>

                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-medium text-slate-900 text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className={`p-1.5 rounded-r-md transition-colors ${atMax ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                    disabled={atMax}>

                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right w-20">
                  <p className="font-bold text-emerald-700">
                    {item.subtotal.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">

                  <Trash2Icon className="h-4 w-4" />
                </button>
              </div>
            </div>);

        })}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearCart}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full mb-2">

          Clear Cart
        </Button>
      </div>
    </div>);

}