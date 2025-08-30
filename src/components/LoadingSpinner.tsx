import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        <div className="mt-4 text-emerald-400 font-clean text-center">Loading...</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
