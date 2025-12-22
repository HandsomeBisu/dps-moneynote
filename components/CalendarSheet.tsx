import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatTime } from '../utils/format';
import TransactionItem from './TransactionItem';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[]; // Expects all transactions (with balanceAfter calculated)
  onTransactionClick: (t: Transaction) => void;
}

const CalendarSheet: React.FC<Props> = ({ isOpen, onClose, transactions, onTransactionClick }) => {
  const [animationClass, setAnimationClass] = useState('translate-y-full');
  const [currentDate, setCurrentDate] = useState(new Date()); // For Calendar Navigation
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // User clicked date

  // Animation logic
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimationClass('translate-y-0'), 10);
      // Reset to today when opening
      const today = new Date();
      setCurrentDate(today);
      setSelectedDate(today);
    } else {
      setAnimationClass('translate-y-full');
    }
  }, [isOpen]);

  // Calendar Logic
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentDate]);

  const firstDayOfMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay();
  }, [currentDate]);

  // Identify days with transactions
  const transactionMap = useMemo(() => {
    const map: { [key: number]: boolean } = {};
    transactions.forEach(t => {
      if (
        t.date.getFullYear() === currentDate.getFullYear() &&
        t.date.getMonth() === currentDate.getMonth()
      ) {
        map[t.date.getDate()] = true;
      }
    });
    return map;
  }, [transactions, currentDate]);

  // Filter transactions for the SELECTED date
  const selectedDateTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.date.getFullYear() === selectedDate.getFullYear() &&
      t.date.getMonth() === selectedDate.getMonth() &&
      t.date.getDate() === selectedDate.getDate()
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, selectedDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  if (!isOpen && animationClass === 'translate-y-full') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      <div 
        className={`
          relative w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl 
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] h-[85vh] flex flex-col
          ${animationClass}
        `}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center px-4 mb-2 shrink-0">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <div key={day} className={`text-xs font-medium py-2 ${i === 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 px-4 mb-6 shrink-0">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isSelected = 
              selectedDate.getDate() === day && 
              selectedDate.getMonth() === currentDate.getMonth() &&
              selectedDate.getFullYear() === currentDate.getFullYear();
            const hasData = transactionMap[day];

            return (
              <div 
                key={day} 
                onClick={() => handleDateClick(day)}
                className="h-14 flex flex-col items-center justify-start py-1 cursor-pointer relative"
              >
                <span 
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                    ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  {day}
                </span>
                {hasData && !isSelected && (
                  <span className="w-1 h-1 bg-gray-400 rounded-full mt-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-2 bg-gray-100 shrink-0" />

        {/* Daily Details List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
           <h3 className="text-sm font-bold text-gray-500 mb-4">
             {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
           </h3>
           
           {selectedDateTransactions.length === 0 ? (
             <div className="text-center py-10 text-gray-400 text-sm">
               내역이 없습니다.
             </div>
           ) : (
             selectedDateTransactions.map((t, idx) => (
                <div key={t.id} className="mb-2">
                   <TransactionItem transaction={t} onClick={onTransactionClick} />
                   {idx < selectedDateTransactions.length - 1 && <div className="h-[1px] bg-gray-50 ml-14 my-1" />}
                </div>
             ))
           )}
        </div>

      </div>
    </div>
  );
};

export default CalendarSheet;