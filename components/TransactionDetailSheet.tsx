import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatTime } from '../utils/format';
import { deleteTransaction } from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEdit: (transaction: Transaction) => void;
}

const TransactionDetailSheet: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onEdit 
}) => {
  const [animationClass, setAnimationClass] = useState('translate-y-full');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimationClass('translate-y-0'), 10);
    } else {
      setAnimationClass('translate-y-full');
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!transaction) return;
    if (window.confirm('정말 이 내역을 삭제하시겠습니까?')) {
      await deleteTransaction(transaction.id);
      onClose();
    }
  };

  if (!isOpen && animationClass === 'translate-y-full') return null;
  if (!transaction && isOpen) return null;

  const isIncome = transaction?.type === 'income';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      <div 
        className={`
          relative w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] p-6 shadow-2xl 
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${animationClass}
        `}
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
        
        {transaction && (
          <div className="text-center mb-8">
            <div className="text-sm text-gray-500 font-medium mb-2">
              {transaction.date.getFullYear()}년 {transaction.date.getMonth() + 1}월 {transaction.date.getDate()}일 · {formatTime(transaction.date)}
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
               <span className="text-3xl">
                 {isIncome ? '💰' : '💸'}
               </span>
               <h2 className="text-2xl font-bold text-gray-900">{transaction.description}</h2>
            </div>
            <div className={`text-4xl font-bold ${isIncome ? 'text-blue-500' : 'text-gray-900'}`}>
              {isIncome ? '' : '-'}{formatCurrency(transaction.amount)}원
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => transaction && onEdit(transaction)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-xl transition-colors"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 font-bold py-4 rounded-xl transition-colors"
          >
            삭제
          </button>
        </div>
        
        <div className="h-4 sm:hidden"></div>
      </div>
    </div>
  );
};

export default TransactionDetailSheet;