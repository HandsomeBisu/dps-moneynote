import React, { useState, useEffect } from 'react';
import { addTransaction, auth } from '../services/firebase';
import { TransactionType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AddTransactionSheet: React.FC<Props> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationClass, setAnimationClass] = useState('translate-y-full');

  // Handle entry/exit animation
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow render before animating in
      setTimeout(() => setAnimationClass('translate-y-0'), 10);
    } else {
      setAnimationClass('translate-y-full');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    
    // Ensure user is logged in
    const user = auth.currentUser;
    if (!user) {
        alert("로그인이 필요합니다.");
        return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction(user.uid, Number(amount.replace(/,/g, '')), description, type);
      // Reset and close
      setAmount('');
      setDescription('');
      setType('expense');
      onClose();
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val);
  };

  if (!isOpen && animationClass === 'translate-y-full') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* Sheet */}
      <div 
        className={`
          relative w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] p-6 shadow-2xl 
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${animationClass}
        `}
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
        
        <h2 className="text-xl font-bold text-gray-900 mb-6">내역 입력</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Type Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${type === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              소비
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${type === 'income' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              수입
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">금액</label>
            <div className="relative">
              <input
                type="text"
                value={amount ? Number(amount).toLocaleString() : ''}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 border-b-2 border-transparent focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                autoFocus={isOpen}
              />
              <span className="absolute right-0 bottom-3 text-lg font-bold text-gray-900">원</span>
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">내용</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어디서 쓰셨나요?"
              className="w-full bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 font-medium placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!amount || !description || isSubmitting}
            className={`
              w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg
              transition-all duration-200 active:scale-[0.98]
              ${(!amount || !description) ? 'bg-gray-300 shadow-none cursor-not-allowed' : 'bg-blue-500 shadow-blue-500/30 hover:bg-blue-600'}
            `}
          >
            {isSubmitting ? '저장 중...' : '확인'}
          </button>
          
          <div className="h-4 sm:hidden"></div> {/* Safe area spacer */}
        </form>
      </div>
    </div>
  );
};

export default AddTransactionSheet;