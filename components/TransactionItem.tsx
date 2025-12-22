import React from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatTime } from '../utils/format';

interface Props {
  transaction: Transaction;
}

const TransactionItem: React.FC<Props> = ({ transaction }) => {
  const isIncome = transaction.type === 'income';
  
  return (
    <div className="flex items-center justify-between py-4 active:bg-gray-50 transition-colors px-1 -mx-1 rounded-lg cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${isIncome ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
          {isIncome ? '💰' : '💸'}
        </div>
        <div className="flex flex-col">
          <span className="text-[17px] font-semibold text-gray-800 leading-snug">
            {transaction.description}
          </span>
          <span className="text-[13px] text-gray-400 font-medium">
            {formatTime(transaction.date)}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-[17px] font-bold ${isIncome ? 'text-blue-500' : 'text-gray-900'}`}>
          {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}원
        </span>
        {/* Optional balance after transaction or other meta could go here */}
      </div>
    </div>
  );
};

export default TransactionItem;