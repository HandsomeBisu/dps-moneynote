import React, { useEffect, useMemo, useState } from 'react';
import { subscribeTransactions, auth, logout } from './services/firebase';
import { onAuthStateChanged, User } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { Transaction, DailyGroup } from './types';
import { formatCurrency, formatDateTitle } from './utils/format';
import TransactionItem from './components/TransactionItem';
import AddTransactionSheet from './components/AddTransactionSheet';
import LoginScreen from './components/LoginScreen';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribeData = subscribeTransactions(user.uid, (data) => {
      setTransactions(data);
      setIsLoading(false);
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

  // Calculate Total Balance (Simple Income - Expense)
  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);
  }, [transactions]);

  // Calculate Monthly Expense (Expense only)
  const monthlyExpense = useMemo(() => {
    const now = new Date();
    return transactions.reduce((acc, curr) => {
      const isSameMonth = curr.date.getMonth() === now.getMonth() && curr.date.getFullYear() === now.getFullYear();
      if (isSameMonth && curr.type === 'expense') {
        return acc + curr.amount;
      }
      return acc;
    }, 0);
  }, [transactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: DailyGroup } = {};
    
    transactions.forEach(t => {
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
  }, [transactions]);

  // Render Logic

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
        
        {/* Main Balance Card */}
        <section className="mb-8">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-500">이번 달 쓴 돈</span>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-bold text-gray-900 tracking-tight">
                 {formatCurrency(monthlyExpense)}
               </span>
               <span className="text-xl font-bold text-gray-900">원</span>
            </div>
          </div>
          
          {/* Mini Dashboard / Current Balance */}
          <div className="mt-6 bg-white p-5 rounded-[24px] shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.99] transition-transform">
             <div>
               <div className="text-xs font-semibold text-gray-400 mb-1">현재 잔액</div>
               <div className="text-lg font-bold text-gray-800">{formatCurrency(totalBalance)}원</div>
             </div>
             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
             </div>
          </div>
        </section>

        {/* Transactions List */}
        <section className="space-y-6">
          {isLoading ? (
             // Skeleton Loader
             [1, 2, 3].map(i => (
               <div key={i} className="animate-pulse space-y-4">
                 <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                 <div className="h-16 bg-white rounded-2xl"></div>
                 <div className="h-16 bg-white rounded-2xl"></div>
               </div>
             ))
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-500 font-medium">아직 내역이 없어요.</p>
              <p className="text-gray-400 text-sm mt-1">아래 + 버튼을 눌러 기록해보세요.</p>
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
                      <TransactionItem transaction={t} />
                      {/* Separator if not last item */}
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
          onClick={() => setIsAddSheetOpen(true)}
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
        onClose={() => setIsAddSheetOpen(false)} 
      />
    </div>
  );
};

export default App;