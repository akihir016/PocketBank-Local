import React from 'react';
import { CreditCard, Wallet, Wifi } from 'lucide-react';

interface BankCardProps {
  balance: number;
  currency: string;
  budget: number;
  onTopUp: () => void;
}

const BankCard: React.FC<BankCardProps> = ({ balance, currency, budget, onTopUp }) => {
  const percentage = Math.min(100, Math.max(0, (balance / budget) * 100));
  const isLow = percentage < 20;

  return (
    <div className="w-full relative group perspective-1000">
      <div className={`
        relative w-full aspect-[1.586/1] rounded-2xl p-6 text-white shadow-xl transition-all duration-500
        ${isLow ? 'bg-gradient-to-br from-red-600 to-rose-800' : 'bg-gradient-to-br from-brand-600 to-brand-900'}
      `}>
        
        {/* Card Content */}
        <div className="h-full flex flex-col justify-between relative z-10">
          <div className="flex justify-between items-start">
            <Wifi className="w-8 h-8 opacity-75 rotate-90" />
            <span className="font-bold tracking-widest text-lg opacity-80">PocketBank</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs opacity-75 uppercase tracking-wider">Current Balance</p>
            <h2 className="text-4xl font-bold tracking-tight">
              {currency}{balance.toFixed(2)}
            </h2>
            <div className="w-full bg-black/20 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${isLow ? 'bg-red-300' : 'bg-green-400'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex space-x-2 items-center">
               <div className="text-xs opacity-70">
                 Budget: {currency}{budget.toFixed(0)}
               </div>
            </div>
            
            {/* Top Up Button integrated into card logic if low */}
            {balance <= 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onTopUp();
                }}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 animate-pulse"
              >
                <Wallet className="w-4 h-4" />
                Add Funds
              </button>
            )}
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-black/10 blur-2xl" />
      </div>
    </div>
  );
};

export default BankCard;