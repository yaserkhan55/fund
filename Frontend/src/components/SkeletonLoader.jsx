import React from "react";

export function CampaignCardSkeleton() {
  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-[#E0F2F2] animate-pulse">
      <div className="h-[200px] w-full bg-gray-200"></div>
      <div className="p-5 space-y-4">
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-2 bg-gray-200 rounded-full w-full"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

export function CampaignListSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CampaignCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CampaignDetailsSkeleton() {
  return (
    <div className="bg-[#F1FAFA] min-h-screen pb-8 animate-pulse">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid lg:grid-cols-[3fr,2fr] gap-8">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="h-[400px] bg-gray-200"></div>
          </div>
          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded-full w-full"></div>
            <div className="h-10 bg-gray-200 rounded-2xl w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

