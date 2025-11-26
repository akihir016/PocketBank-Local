
import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle, X, Settings, Download, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';
import BankCard from './components/BankCard';
import TransactionList from './components/TransactionList';
import Charts from './components/Charts';
import AdvisorChat from './components/AdvisorChat';
import { BudgetState, EXPENSE_CATEGORIES } from './server/types';
import * as api from './services/apiService';

const App: React.FC = () => {
  const [state, setState] = useState<BudgetState | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Form states
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);

  // Settings Form State
  const [newBudgetInput, setNewBudgetInput] = useState('');
  const [newCurrencyInput, setNewCurrencyInput] = useState('');

  // Initial data fetch and WebSocket setup
  useEffect(() => {
    // Fetch initial state from the server
    api.getAppState().then(initialState => {
        setState(initialState);
        setNewBudgetInput(initialState.initialBudget.toString());
        setNewCurrencyInput(initialState.currency);
    }).catch(console.error);

    // Connect to the WebSocket for real-time updates
    const socket = io('http://localhost:3001');
    socket.on('banking_update', (newState: BudgetState) => {
        setState(newState);
    });

    return () => {
        socket.disconnect();
    };
  }, []);

  // Pre-fill budget and currency input when settings opens
  useEffect(() => {
    if (showSettingsModal && state) {
      setNewBudgetInput(state.initialBudget.toString());
      setNewCurrencyInput(state.currency);
    }
  }, [showSettingsModal, state]);

  const handleAddTransaction = async () => {
    if (!amount || !desc) return;
    try {
        await api.addTransaction({ amount, desc, category });
        setAmount('');
        setDesc('');
        setShowAddModal(false);
    } catch (error) {
        console.error(error);
        alert('Failed to add transaction.');
    }
  };

  const handleTopUp = async () => {
    if (!amount) return;
    try {
        await api.topUp(amount);
        setAmount('');
        setShowTopUpModal(false);
    } catch (error) {
        console.error(error);
        alert('Failed to top up.');
    }
  };

  const handleUpdateBudget = async () => {
    try {
        await api.updateBudget({ newBudgetInput, newCurrencyInput });
        setShowSettingsModal(false);
    } catch (error) {
        console.error(error);
        alert('Failed to update budget.');
    }
  };

  const handleResetApp = async () => {
    if (confirm("Are you sure you want to reset all data for everyone?")) {
        try {
            await api.resetApp();
            setShowSettingsModal(false);
        } catch (error) {
            console.error(error);
            alert('Failed to reset app.');
        }
    }
  };

  const handleExportCSV = () => {
    if (!state || state.transactions.length === 0) {
      alert("No transactions to export yet.");
      return;
    }

    const headers = ["Date", "Time", "Description", "Category", "Type", "Amount", "Currency"];
    const rows = state.transactions.map(t => {
        const dateObj = new Date(t.date);
        return [
            dateObj.toLocaleDateString(),
            dateObj.toLocaleTimeString(),
            `"${t.description.replace(/"/g, '""')}"`, // Corrected escaping for double quotes within description
            t.category,
            t.type,
            t.amount.toFixed(2),
            state.currency
        ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n"); // Corrected newline escaping
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pocketbank_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (!state) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-500">Connecting to server...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-safe">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              PocketBank
            </h1>
            <div className="flex gap-2">
               <button 
                 onClick={() => setShowSettingsModal(true)}
                 className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                 aria-label="Settings"
               >
                 <Settings className="w-5 h-5" />
               </button>
               
               <button 
                 onClick={() => setShowChatModal(true)}
                 className="p-2 rounded-full hover:bg-brand-50 text-brand-600 transition-colors"
                 aria-label="Chat"
               >
                 <MessageSquare className="w-5 h-5" />
               </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 pb-32 transition-all duration-500 ease-in-out">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 mb-6 lg:mb-0">
                 <div className="max-w-md mx-auto lg:max-w-none w-full">
                    <BankCard 
                      balance={state.currentBalance}
                      budget={state.initialBudget}
                      currency={state.currency}
                      onTopUp={() => setShowTopUpModal(true)}
                    />
                 </div>
                 <div className="max-w-md mx-auto lg:max-w-none w-full">
                    {state.transactions.length > 0 && (
                        <Charts transactions={state.transactions} />
                    )}
                 </div>
            </div>
            <div className="lg:col-span-7 space-y-6 max-w-md md:max-w-2xl lg:max-w-none mx-auto w-full">
                <div className="flex items-center justify-between pt-2 lg:pt-0 bg-gray-50/95 backdrop-blur lg:static sticky top-0 z-10 py-2 lg:py-0">
                  <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{state.transactions.length}</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setShowAddModal(true)}
                        className="hidden lg:flex items-center gap-1 text-sm text-brand-600 font-medium bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Expense
                      </button>
                      {state.transactions.length > 0 && (
                         <button 
                            onClick={handleExportCSV}
                            className="flex items-center gap-1 text-sm text-brand-600 font-medium hover:text-brand-700 active:opacity-70 transition-opacity"
                         >
                            <Download className="w-4 h-4" />
                            Export
                         </button>
                      )}
                  </div>
                </div>
                <TransactionList transactions={state.transactions} currency={state.currency} />
            </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-lg shadow-brand-600/40 transition-transform active:scale-95 flex items-center justify-center"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {/* Modals */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-10 duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold">Add Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 text-lg">{state.currency}</span>
                  <input type="number" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-gray-50" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-gray-50" placeholder="What did you buy?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} className={`px-2 py-2 text-xs rounded-lg border transition-colors ${category === cat ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleAddTransaction} className="w-full bg-brand-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all mt-4">Add Transaction</button>
            </div>
          </div>
        </div>
      )}

      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2"><AlertCircle className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold text-gray-900">Low Balance!</h3>
            <p className="text-gray-500">Your virtual bank is running dry. Add funds to keep playing.</p>
            <div className="relative mt-4">
               <span className="absolute left-4 top-3 text-gray-400 text-lg">{state.currency}</span>
               <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="Amount to add" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowTopUpModal(false)} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl">Cancel</button>
              <button onClick={handleTopUp} className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl shadow-lg shadow-red-600/20">Top Up</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center"><h3 className="text-xl font-bold text-gray-900">Settings</h3><button onClick={() => setShowSettingsModal(false)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget Goal</label>
                   <div className="relative">
                       <span className="absolute left-3 top-3 text-gray-400 text-lg">{newCurrencyInput}</span>
                       <input type="number" inputMode="decimal" value={newBudgetInput} onChange={(e) => setNewBudgetInput(e.target.value)} className="w-full pl-8 pr-4 py-3 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. 2000" />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Currency Symbol</label>
                   <div className="flex gap-2">
                       {['$', '€', '£', '¥', '₹'].map(cur => (<button key={cur} onClick={() => setNewCurrencyInput(cur)} className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold transition-colors ${newCurrencyInput === cur ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{cur}</button>))}
                       <input type="text" maxLength={3} value={newCurrencyInput} onChange={(e) => setNewCurrencyInput(e.target.value)} className="w-16 px-2 py-2 text-center border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Other" />
                   </div>
                </div>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-100">
               <button onClick={handleResetApp} className="w-full py-3 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Reset All Data</button>
            </div>
            <button onClick={handleUpdateBudget} className="w-full py-3 bg-brand-600 text-white font-medium rounded-xl shadow-lg shadow-brand-600/20 active:scale-95 transition-transform">Save Changes</button>
          </div>
        </div>
      )}

      {showChatModal && (
        <AdvisorChat onClose={() => setShowChatModal(false)} />
      )}

    </div>
  );
};

export default App;
