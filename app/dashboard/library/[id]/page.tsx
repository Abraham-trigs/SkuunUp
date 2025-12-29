"use client";

import { useEffect } from "react";
import { useLibraryStore } from "@/app/store/useLibraryStore.ts";
import BookModal from "../components/BookModal.tsx";
import {
  Search,
  Plus,
  BookOpen,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useModal } from "@/app/dashboard/components/common/useModal";
import { Pagination } from "@/app/dashboard/components/common/Pagination";

export default function BooksPage() {
  const {
    books,
    fetchBooks,
    page,
    setPage,
    totalPages,
    loading,
    search,
    setSearch,
  } = useLibraryStore();

  // Use reusable modal hook for BookModal
  const bookModal = useModal();

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchBooks();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen text-white mt-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ color: "#BFCDEF" }}
          >
            LIBRARY
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="h-1 w-8 rounded-full"
              style={{ backgroundColor: "#6BE8EF" }}
            />
            <p className="opacity-60 text-xs uppercase tracking-widest font-bold">
              Catalog Management
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 lg:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:text-[#6BE8EF] transition-colors" />
            <input
              value={search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search catalog..."
              style={{ backgroundColor: "#1c376e", borderColor: "#BFCDEF33" }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#6BE8EF] focus:outline-none transition-all placeholder:text-[#BFCDEF]/20 text-sm"
            />
          </div>

          {/* Add Book */}
          <button
            type="button"
            onClick={() => bookModal.open(null)} // null triggers "Add" state
            style={{ backgroundColor: "#6BE8EF", color: "#03102b" }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.03] transition-all shadow-lg shadow-[#6BE8EF]/10"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Add Book
          </button>
        </div>
      </div>

      {/* Grid Section */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#6BE8EF]" />
          <p
            style={{ color: "#BFCDEF" }}
            className="text-xs font-bold uppercase tracking-widest opacity-60"
          >
            Scanning Archive...
          </p>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-black">
          <p>No books in the catalog</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((b) => (
            <div
              key={b.id}
              style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
              className="group relative p-6 rounded-2xl border shadow-xl hover:shadow-[#6BE8EF]/5 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-[#1c376e]/50 text-[#6BE8EF]">
                  <BookOpen size={20} />
                </div>
                <button
                  type="button"
                  onClick={() => bookModal.open(b)}
                  className="p-2 rounded-lg hover:bg-white/10 text-[#BFCDEF] opacity-40 group-hover:opacity-100 transition-all"
                >
                  <Edit3 size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black leading-tight text-[#BFCDEF] group-hover:text-[#6BE8EF] transition-colors line-clamp-1 uppercase tracking-tight">
                  {b.title}
                </h3>
                <p className="text-xs font-bold text-[#BFCDEF] opacity-40 uppercase tracking-widest">
                  By {b.author.name}
                </p>

                <div className="pt-4 flex items-center justify-between border-t border-white/5 mt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase opacity-40 font-bold tracking-tighter">
                      ISBN Reference
                    </span>
                    <span className="text-xs font-mono text-[#BFCDEF]">
                      {b.isbn}
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#BFCDEF]/10 px-2 py-1 rounded border border-[#BFCDEF]/10 font-bold">
                    RES-{b.id.slice(0, 4)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {books.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages()}
          onPrev={() => {
            if (page > 1) {
              setPage(page - 1);
              fetchBooks();
            }
          }}
          onNext={() => {
            if (page < totalPages()) {
              setPage(page + 1);
              fetchBooks();
            }
          }}
        />
      )}

      {/* Modal */}
      {bookModal.isOpen && (
        <BookModal
          book={bookModal.data} // type: Book | null
          onClose={() => bookModal.close()}
        />
      )}
    </div>
  );
}
