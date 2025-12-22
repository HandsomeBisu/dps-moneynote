import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableMonths: string[]; // Format: "YYYY-MM"
  selectedMonthKey: string;
  onSelect: (key: string) => void;
}

const MonthPickerSheet: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  availableMonths, 
  selectedMonthKey, 
  onSelect 
}) => {
  const [animationClass, setAnimationClass] = useState('translate-y-full');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimationClass('translate-y-0'), 10);
    } else {
      setAnimationClass('translate-y-full');
    }
  }, [isOpen]);

  const handleSelect = (key: string) => {
    onSelect(key);
    onClose();
  };

  const formatMonthText = (key: string) => {
    const [y, m] = key.split('-');
    return `${y}년 ${m}월`;
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
          relative w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl 
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] max-h-[70vh] flex flex-col
          ${animationClass}
        `}
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
        
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">월 선택</h2>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {availableMonths.map((key) => {
            const isSelected = selectedMonthKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`
                  w-full flex items-center justify-between px-5 py-4 rounded-2xl text-left transition-all active:scale-[0.98]
                  ${isSelected ? 'bg-blue-50 text-blue-600' : 'bg-white hover:bg-gray-50 text-gray-800'}
                `}
              >
                <span className={`text-lg ${isSelected ? 'font-bold' : 'font-medium'}`}>
                  {formatMonthText(key)}
                </span>
                {isSelected && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Bottom safe area spacer */}
        <div className="h-6 shrink-0 sm:hidden"></div>
      </div>
    </div>
  );
};

export default MonthPickerSheet;