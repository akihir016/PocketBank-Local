import React from 'react';
import { Transaction } from '../types';
import { ArrowDownRight, ArrowUpRight, Coffee, Car, ShoppingBag, Film, Receipt, Activity, Plane, HelpCircle } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  currency: string;
}

const getIcon = (category: string) => {
  switch (category) {
    case 'Food & Drink': return <Coffee className="w-5 h-5" />;
    case 'Transport': return <Car className="w-5 h-5" />;
    case 'Shopping': return <ShoppingBag className="w-5 h-5" />;
    case 'Entertainment': return <Film className="w-5 h-5" />;
    case 'Bills & Utilities': return <Receipt className="w-5 h-5" />;
    case 'Health': return <Activity className="w-5 h-5" />;
    case 'Travel': return <Plane className="w-5 h-5" />;
    default: return <HelpCircle className="w-5 h-5" />;
  }
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions, currency }) => {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <ShoppingBag className="w-12 h-12 mb-2 opacity-20" />
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      {transactions.map((t) => (
        <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${t.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
              {t.type === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : getIcon(t.category)}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 truncate max-w-[160px] sm:max-w-xs">{t.description}</h4>
              <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()} • {t.category}</p>
            </div>
          </div>
          <div className={`font-semibold ${t.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>
            {t.type === 'deposit' ? '+' : '-'}{currency}{t.amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;