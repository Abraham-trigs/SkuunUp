"use client";

import { useState, useEffect } from "react";
import { useLibraryStore } from "@/app/store/useLibraryStore";
import { X, Book, Hash, User, Layers, Copy, Trash2 } from "lucide-react";

interface Props {
  book: any;
  onClose: () => void;
}

export default function BookModal({ book, onClose }: Props) {
  const { createBook, updateBook, deleteBook } = useLibraryStore();
  const [form, setForm] = useState({
    title: "",
    isbn: "",
    authorId: "",
    categoryId: "",
    totalCopies: 1,
  });

  useEffect(() => {
    if (book && book.id) {
      setForm({
        title: book.title || "",
        isbn: book.isbn || "",
        authorId: book.authorId || "",
        categoryId: book.categoryId || "",
        totalCopies: book.totalCopies || 1,
      });
    } else {
      setForm({
        title: "",
        isbn: "",
        authorId: "",
        categoryId: "",
        totalCopies: 1,
      });
    }
  }, [book]);

  const handleSubmit = async () => {
    if (book?.id) await updateBook(book.id, form);
    else await createBook(form);
    onClose();
  };

  const handleDelete = async () => {
    if (book?.id && confirm("Are you sure you want to delete this book?")) {
      await deleteBook(book.id);
      onClose();
    }
  };

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div
        style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
        className="relative w-full max-w-md rounded-2xl border shadow-2xl p-8 animate-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2
              style={{ color: "#BFCDEF" }}
              className="text-xl font-black uppercase tracking-tighter"
            >
              {book?.id ? "Edit Resource" : "Archive Resource"}
            </h2>
            <div
              className="h-1 w-12 rounded-full"
              style={{ backgroundColor: "#6BE8EF" }}
            />
          </div>
          <button
            onClick={onClose}
            className="text-[#BFCDEF] opacity-40 hover:opacity-100 transition-opacity p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Title Input */}
          <div className="group">
            <label
              style={{ color: "#BFCDEF" }}
              className="block mb-1.5 text-[10px] font-black uppercase tracking-widest opacity-70"
            >
              Book Title
            </label>
            <div className="relative">
              <Book
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6BE8EF] opacity-40"
              />
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="The Great Gatsby"
                style={{
                  backgroundColor: "#1c376e",
                  color: "#BFCDEF",
                  borderColor: "#BFCDEF33",
                }}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* ISBN */}
            <div className="group">
              <label
                style={{ color: "#BFCDEF" }}
                className="block mb-1.5 text-[10px] font-black uppercase tracking-widest opacity-70"
              >
                ISBN
              </label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6BE8EF] opacity-40"
                />
                <input
                  value={form.isbn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isbn: e.target.value }))
                  }
                  placeholder="978-0..."
                  style={{
                    backgroundColor: "#1c376e",
                    color: "#BFCDEF",
                    borderColor: "#BFCDEF33",
                  }}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] transition-all text-sm"
                />
              </div>
            </div>

            {/* Copies */}
            <div className="group">
              <label
                style={{ color: "#BFCDEF" }}
                className="block mb-1.5 text-[10px] font-black uppercase tracking-widest opacity-70"
              >
                Copies
              </label>
              <div className="relative">
                <Copy
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6BE8EF] opacity-40"
                />
                <input
                  type="number"
                  value={form.totalCopies}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      totalCopies: Number(e.target.value),
                    }))
                  }
                  style={{
                    backgroundColor: "#1c376e",
                    color: "#BFCDEF",
                    borderColor: "#BFCDEF33",
                  }}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Author */}
          <div className="group">
            <label
              style={{ color: "#BFCDEF" }}
              className="block mb-1.5 text-[10px] font-black uppercase tracking-widest opacity-70"
            >
              Author ID
            </label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6BE8EF] opacity-40"
              />
              <input
                value={form.authorId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, authorId: e.target.value }))
                }
                placeholder="AUT-001"
                style={{
                  backgroundColor: "#1c376e",
                  color: "#BFCDEF",
                  borderColor: "#BFCDEF33",
                }}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] transition-all text-sm"
              />
            </div>
          </div>

          {/* Category */}
          <div className="group">
            <label
              style={{ color: "#BFCDEF" }}
              className="block mb-1.5 text-[10px] font-black uppercase tracking-widest opacity-70"
            >
              Category ID
            </label>
            <div className="relative">
              <Layers
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6BE8EF] opacity-40"
              />
              <input
                value={form.categoryId || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                placeholder="CAT-01"
                style={{
                  backgroundColor: "#1c376e",
                  color: "#BFCDEF",
                  borderColor: "#BFCDEF33",
                }}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-10">
          <button
            onClick={handleSubmit}
            style={{ backgroundColor: "#6BE8EF", color: "#03102b" }}
            className="w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#6BE8EF]/10"
          >
            {book?.id ? "Update Archive" : "Commit to Library"}
          </button>

          <div className="flex gap-3">
            {book?.id && (
              <button
                onClick={handleDelete}
                style={{ backgroundColor: "#E74C3C20", color: "#E74C3C" }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-[#E74C3C40] hover:bg-[#E74C3C] hover:text-white transition-all"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
            <button
              onClick={onClose}
              style={{ color: "#BFCDEF" }}
              className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors border border-transparent"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
