import React, { useEffect, useMemo, useState } from 'react';
import { subscribeTransactions, auth, logout } from './services/firebase';
import { onAuthStateChanged, User } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { Transaction, DailyGroup } from './types';
import { formatCurrency, formatDateTitle } from './utils/format';
import TransactionItem from './components/TransactionItem';
import AddTransactionSheet from './components/AddTransactionSheet';
import CalendarSheet from './components/CalendarSheet';
import MonthPickerSheet from './components/MonthPickerSheet';
import TransactionDetailSheet from './components/TransactionDetailSheet';
import LoginScreen from './components/LoginScreen';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State controlled by URL Hash for Back Button support
  const [view, setView] = useState<'main' | 'add' | 'calendar' | 'month' | 'detail'>('main');
  
  const [showButton, setShowButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Selection States
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(''); // Format: "YYYY-MM"
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- History & Navigation Logic ---
  
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#add') setView('add');
      else if (hash === '#calendar') setView('calendar');
      else if (hash === '#month') setView('month');
      else if (hash === '#detail') setView('detail');
      else setView('main');
    };

    // Initialize view based on current hash
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openSheet = (hash: string) => {
    window.location.hash = hash;
  };

  const closeSheet = () => {
    // Only go back if we are currently in a hash state to prevent exiting the app
    if (window.location.hash) {
      window.history.back();
    }
  };

  // Derived states for components
  const isAddSheetOpen = view === 'add';
  const isCalendarOpen = view === 'calendar';
  const isMonthPickerOpen = view === 'month';
  const isDetailSheetOpen = view === 'detail';

  // Monitor Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Subscribe to real-time data ONLY when user is logged in
  useEffect(() => {
    if (!user) {
      setRawTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribeData = subscribeTransactions(user.uid, (data) => {
      // 1. Sort Ascending (Oldest -> Newest) to calculate running balance
      const sortedAsc = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let runningBalance = 0;
      const calculatedTransactions = sortedAsc.map(t => {
        if (t.type === 'income') {
          runningBalance += t.amount;
        } else {
          runningBalance -= t.amount;
        }
        return { ...t, balanceAfter: runningBalance };
      });

      // 2. Set state. We will sort back to Descending for display in derived state.
      setRawTransactions(calculatedTransactions);
      setIsLoading(false);
      
      // Default to current month if not set
      if (!selectedMonthKey) {
        const now = new Date();
        setSelectedMonthKey(`${now.getFullYear()}-${now.getMonth() + 1}`);
      }
    });
    return () => unsubscribeData();
  }, [user]);

  // Handle sticky button visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowButton(false);
      } else {
        setShowButton(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Reset editing transaction when Add Sheet closes
  useEffect(() => {
    if (!isAddSheetOpen) {
      const timer = setTimeout(() => setEditingTransaction(null), 300);
      return () => clearTimeout(timer);
    }
  }, [isAddSheetOpen]);

  // --- Derived Data Calculations ---

  // 1. Available Months for Dropdown
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    rawTransactions.forEach(t => {
      const key = `${t.date.getFullYear()}-${t.date.getMonth() + 1}`;
      monthsSet.add(key);
    });
    
    // Always include current month
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    monthsSet.add(currentKey);

    // Sort Descending (Newest Month first)
    return Array.from(monthsSet).sort((a, b) => {
      const [yA, mA] = a.split('-').map(Number);
      const [yB, mB] = b.split('-').map(Number);
      return yB !== yA ? yB - yA : mB - mA;
    });
  }, [rawTransactions]);

  // 2. Filter Transactions by Selected Month & Sort Descending for Display
  const filteredTransactions = useMemo(() => {
    if (!selectedMonthKey) return [];
    
    const [year, month] = selectedMonthKey.split('-').map(Number);
    
    return rawTransactions
      .filter(t => 
        t.date.getFullYear() === year && 
        (t.date.getMonth() + 1) === month
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first
  }, [rawTransactions, selectedMonthKey]);

  // 3. Calculate Monthly Expense (Expense only in selected month)
  const monthlyExpense = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => {
      if (curr.type === 'expense') {
        return acc + curr.amount;
      }
      return acc;
    }, 0);
  }, [filteredTransactions]);

  // 4. Calculate Total Current Balance (Using the very last transaction in time)
  const totalBalance = useMemo(() => {
    if (rawTransactions.length === 0) return 0;
    return rawTransactions[rawTransactions.length - 1].balanceAfter || 0;
  }, [rawTransactions]);

  // 5. Group by Date for List View
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: DailyGroup } = {};
    
    filteredTransactions.forEach(t => {
      const dateKey = `${t.date.getFullYear()}-${t.date.getMonth()}-${t.date.getDate()}`;
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          displayDate: formatDateTitle(t.date),
          transactions: [],
          dailyTotal: 0
        };
      }
      groups[dateKey].transactions.push(t);
    });

    return Object.values(groups).sort((a, b) => 
      // Sort groups descending by date
      new Date(b.transactions[0].date).getTime() - new Date(a.transactions[0].date).getTime()
    );
  }, [filteredTransactions]);

  // Helper to display current selection text
  const selectedMonthText = useMemo(() => {
    if (!selectedMonthKey) return '';
    const [y, m] = selectedMonthKey.split('-');
    return `${y}년 ${m}월`;
  }, [selectedMonthKey]);

  // --- Handlers ---

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    openSheet('detail');
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    // Push 'add' on top of history. 
    // This allows the Back button to return to 'detail' if it was open, or 'main' depending on flow.
    // If we want to replace 'detail' with 'add' in history, we'd use replace, but push is safer for navigation.
    openSheet('add'); 
  };

  const handleAddSheetClose = () => {
    closeSheet();
    // editingTransaction reset is handled by useEffect
  };

  // --- Render ---

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24 font-sans text-gray-900">
      
      {/* Header / Top Bar */}
      <header className="sticky top-0 z-30 bg-[#F2F4F6]/80 backdrop-blur-md px-5 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">소비</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => logout()}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-2">
        
        {/* Main Balance Card with Custom Month Picker */}
        <section className="mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-gray-500">이번 달 쓴 돈</span>
              
              {/* Styled Chip Button for Month Picker */}
              <button
                onClick={() => openSheet('month')}
                className="flex items-center gap-1 bg-gray-200/50 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full transition-all active:scale-95"
              >
                <span className="text-xs font-bold leading-none pt-0.5">{selectedMonthText}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-bold text-gray-900 tracking-tight">
                 {formatCurrency(monthlyExpense)}
               </span>
               <span className="text-xl font-bold text-gray-900">원</span>
            </div>
          </div>
          
          {/* Mini Dashboard / Current Balance */}
          <div 
            onClick={() => openSheet('calendar')}
            className="mt-6 bg-white p-5 rounded-[24px] shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
          >
             <div>
               <div className="text-xs font-semibold text-gray-400 mb-1">현재 잔액</div>
               <div className="text-lg font-bold text-gray-800">{formatCurrency(totalBalance)}원</div>
             </div>
             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                {/* Calendar Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
             </div>
          </div>
        </section>

        {/* Transactions List */}
        <section className="space-y-6">
          {isLoading ? (
             [1, 2, 3].map(i => (
               <div key={i} className="animate-pulse space-y-4">
                 <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                 <div className="h-16 bg-white rounded-2xl"></div>
                 <div className="h-16 bg-white rounded-2xl"></div>
               </div>
             ))
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-4">💸</div>
              <p className="text-gray-500 font-medium">이 달의 내역이 없어요.</p>
              <p className="text-gray-400 text-sm mt-1">지갑이 편안해하고 있어요.</p>
            </div>
          ) : (
            groupedTransactions.map((group) => (
              <div key={group.date}>
                <h3 className="text-sm font-bold text-gray-500 mb-3 ml-1 sticky top-[60px] bg-[#F2F4F6]/90 py-2 backdrop-blur-sm z-10 w-fit px-2 rounded-lg">
                  {group.displayDate}
                </h3>
                <div className="bg-white rounded-[24px] px-5 py-2 shadow-sm">
                  {group.transactions.map((t, idx) => (
                    <React.Fragment key={t.id}>
                      <TransactionItem 
                        transaction={t} 
                        onClick={handleTransactionClick}
                      />
                      {idx < group.transactions.length - 1 && (
                        <div className="h-[1px] bg-gray-100 ml-14" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <div className={`fixed bottom-6 right-1/2 transform translate-x-1/2 sm:translate-x-0 sm:right-6 sm:bottom-8 z-40 transition-all duration-300 ${showButton ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <button
          onClick={() => {
            setEditingTransaction(null); // Ensure add mode
            openSheet('add');
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg shadow-blue-500/40 transition-all active:scale-90 flex items-center justify-center group"
          aria-label="Add Transaction"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="ml-2 font-bold pr-1">내역 쓰기</span>
        </button>
      </div>

      <AddTransactionSheet 
        isOpen={isAddSheetOpen} 
        onClose={handleAddSheetClose} 
        initialTransaction={editingTransaction}
      />

      <CalendarSheet 
        isOpen={isCalendarOpen}
        onClose={closeSheet}
        transactions={rawTransactions}
        onTransactionClick={handleTransactionClick}
      />

      <MonthPickerSheet
        isOpen={isMonthPickerOpen}
        onClose={closeSheet}
        availableMonths={availableMonths}
        selectedMonthKey={selectedMonthKey}
        onSelect={setSelectedMonthKey}
      />

      <TransactionDetailSheet
        isOpen={isDetailSheetOpen}
        onClose={closeSheet}
        transaction={selectedTransaction}
        onEdit={handleEditClick}
      />
    </div>
  );
};

export default App;