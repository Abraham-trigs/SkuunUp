"use client";

import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string; // optional styling override
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPrev,
  onNext,
  className,
}) => {
  return (
    <div
      className={`flex items-center justify-between px-2 ${className || ""}`}
    >
      <p className="text-xs font-medium opacity-50 text-[#BFCDEF]">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-1 bg-[#1c376e]/50 p-1 rounded-xl border border-[#BFCDEF]/10">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="p-2 rounded-lg hover:bg-[#6BE8EF] hover:text-[#03102b] disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all"
        >
          {"<"}
        </button>

        <div
          className="px-4 py-1.5 rounded-lg text-sm font-bold border border-[#6BE8EF]/20"
          style={{ backgroundColor: "#03102b", color: "#6BE8EF" }}
        >
          {page} / {totalPages}
        </div>

        <button
          onClick={onNext}
          disabled={page === totalPages || totalPages === 0}
          className="p-2 rounded-lg hover:bg-[#6BE8EF] hover:text-[#03102b] disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all"
        >
          {">"}
        </button>
      </div>
    </div>
  );
};
