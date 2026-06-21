import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-green-50 shadow-sm flex flex-col h-[380px] animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-6 flex flex-col flex-grow space-y-4">
        <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-150 rounded-lg w-full"></div>
          <div className="h-3 bg-gray-150 rounded-lg w-5/6"></div>
        </div>
      </div>
    </div>
  );
}
