import React from 'react';
import { loginWithGoogle } from '../services/firebase';

const LoginScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F2F4F6] p-6">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="mb-8 p-4 bg-blue-100 rounded-3xl text-4xl shadow-sm">
          💸
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          머니노트
        </h1>
        <p className="text-gray-500 font-medium text-lg">
          간편하게 기록하는<br />
          나의 소비 생활
        </p>
      </div>

      <div className="w-full max-w-md mx-auto mb-8">
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-bold py-4 px-6 rounded-2xl shadow-md border border-gray-100 active:scale-[0.98] transition-all"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-6 h-6"
          />
          <span className="text-[17px]">Google로 시작하기</span>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;