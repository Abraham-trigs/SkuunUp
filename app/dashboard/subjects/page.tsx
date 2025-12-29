// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   Loader2,
//   Plus,
//   Search,
//   Edit2,
//   Trash2,
//   ChevronLeft,
//   ChevronRight,
//   BookOpen,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useSubjectStore } from "@/app/store/subjectStore.ts";
// import { useClassesStore } from "@/app/store/useClassesStore.ts";
// import { useStaffStore } from "@/app/store/useStaffStore.ts";
// import AddSubjectModal from "./components/AddsubjectModal.tsx";
// import EditSubjectModal from "./components/EditSubjectModal.tsx";
// import ConfirmDeleteModal from "./components/ConfirmDeleteModal.tsx";

// export default function SubjectsPage() {
//   const router = useRouter();

//   // ------------------------- Local UI state -------------------------
//   const [localSearch, setLocalSearch] = useState("");
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [editModal, setEditModal] = useState<{
//     open: boolean;
//     subjectId?: string;
//   }>({ open: false });
//   const [deleteModal, setDeleteModal] = useState<{
//     open: boolean;
//     subjectId?: string;
//     subjectName?: string;
//   }>({ open: false });

//   // ------------------------- Zustand stores -------------------------
//   const {
//     subjects,
//     total,
//     page,
//     limit,
//     loading,
//     fetchSubjects,
//     setPage,
//     setSearch,
//   } = useSubjectStore();
//   const { fetchClasses } = useClassesStore();
//   const { fetchStaff } = useStaffStore();

//   const totalPages = Math.max(1, Math.ceil(total / limit));

//   // ------------------------- Effects -------------------------
//   useEffect(() => {
//     fetchSubjects(page, localSearch);
//     fetchClasses();
//     fetchStaff();
//   }, []);

//   useEffect(() => {
//     const handler = setTimeout(() => setSearch(localSearch), 300);
//     return () => clearTimeout(handler);
//   }, [localSearch]);

//   // ------------------------- Render -------------------------
//   return (
//     <div className="p-4 md:p-8 space-y-8 min-h-screen text-white mt-10">
//       {/* Header Section */}
//       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
//         <div>
//           <h1
//             className="text-4xl font-black tracking-tight"
//             style={{ color: "#BFCDEF" }}
//           >
//             SUBJECTS
//           </h1>
//           <div className="flex items-center gap-2 mt-1">
//             <div
//               className="h-1 w-8 rounded-full"
//               style={{ backgroundColor: "#6BE8EF" }}
//             />
//             <p className="opacity-60 text-xs uppercase tracking-widest font-bold">
//               Academic Curriculum
//             </p>
//           </div>
//         </div>

//         <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
//           <div className="relative flex-1 lg:w-72 group">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:text-[#6BE8EF] transition-colors" />
//             <input
//               type="text"
//               placeholder="Search curriculum..."
//               value={localSearch}
//               onChange={(e) => setLocalSearch(e.target.value)}
//               style={{ backgroundColor: "#1c376e", borderColor: "#BFCDEF33" }}
//               className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#6BE8EF] focus:outline-none transition-all placeholder:text-[#BFCDEF]/20 text-sm"
//             />
//           </div>

//           <button
//             onClick={() => setIsAddModalOpen(true)}
//             style={{ backgroundColor: "#6BE8EF", color: "#03102b" }}
//             className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.03] transition-all shadow-lg shadow-[#6BE8EF]/10"
//           >
//             <Plus className="w-4 h-4" strokeWidth={3} />
//             Add Subject
//           </button>
//         </div>
//       </div>

//       {/* Table Section */}
//       <div
//         style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
//         className="border rounded-2xl overflow-hidden shadow-2xl transition-all"
//       >
//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr
//                 style={{ backgroundColor: "#1c376e" }}
//                 className="text-[#BFCDEF] uppercase text-[10px] font-black tracking-[0.2em]"
//               >
//                 <th className="px-6 py-4">Subject Name</th>
//                 <th className="px-6 py-4 text-center">Code</th>
//                 <th className="px-6 py-4 hidden md:table-cell">Description</th>
//                 <th className="px-6 py-4 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-white/5">
//               {loading ? (
//                 <tr>
//                   <td colSpan={4} className="py-20 text-center">
//                     <Loader2 className="animate-spin w-8 h-8 mx-auto text-[#6BE8EF] opacity-50" />
//                   </td>
//                 </tr>
//               ) : subjects.length > 0 ? (
//                 subjects.map((subject) => (
//                   <tr
//                     key={subject.id}
//                     className="group hover:bg-white/5 transition-all cursor-pointer"
//                     onClick={() =>
//                       router.push(`/dashboard/subjects/${subject.id}`)
//                     }
//                   >
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-3">
//                         <div className="p-2 rounded-lg bg-[#1c376e]/50 text-[#6BE8EF]">
//                           <BookOpen size={16} />
//                         </div>
//                         <span className="font-bold text-[#BFCDEF] group-hover:text-[#6BE8EF] transition-colors">
//                           {subject.name}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-center">
//                       <span className="bg-[#BFCDEF]/10 text-[#BFCDEF] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-[#BFCDEF]/10">
//                         {subject.code || "N/A"}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 hidden md:table-cell max-w-xs truncate opacity-60 text-sm italic">
//                       {subject.description || "No description provided"}
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex justify-end gap-2">
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             setEditModal({ open: true, subjectId: subject.id });
//                           }}
//                           className="p-2 rounded-lg hover:bg-white/10 text-[#BFCDEF] transition-colors"
//                         >
//                           <Edit2 size={16} />
//                         </button>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             setDeleteModal({
//                               open: true,
//                               subjectId: subject.id,
//                               subjectName: subject.name,
//                             });
//                           }}
//                           className="p-2 rounded-lg hover:bg-[#E74C3C]/20 text-[#E74C3C] transition-colors"
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan={4}
//                     className="py-20 text-center opacity-40 italic text-sm"
//                   >
//                     No subjects found in the curriculum
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination Footer */}
//         <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/20">
//           <p className="text-[10px] font-bold text-[#BFCDEF] opacity-40 uppercase tracking-widest">
//             Total Results: {total}
//           </p>
//           <div className="flex items-center gap-2">
//             <button
//               disabled={page === 1}
//               onClick={() => setPage(page - 1)}
//               className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-20 transition-all"
//             >
//               <ChevronLeft size={18} />
//             </button>
//             <div
//               style={{ backgroundColor: "#1c376e", color: "#6BE8EF" }}
//               className="px-4 py-1 rounded-lg text-xs font-black border border-[#6BE8EF]/20"
//             >
//               {page} / {totalPages}
//             </div>
//             <button
//               disabled={page === totalPages || totalPages === 0}
//               onClick={() => setPage(page + 1)}
//               className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-20 transition-all"
//             >
//               <ChevronRight size={18} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Modals Container */}
//       {isAddModalOpen && (
//         <AddSubjectModal
//           isOpen={isAddModalOpen}
//           onClose={() => setIsAddModalOpen(false)}
//           onSuccess={() => fetchSubjects(page, localSearch)}
//         />
//       )}

//       {editModal.open && editModal.subjectId && (
//         <EditSubjectModal
//           isOpen={editModal.open}
//           subjectId={editModal.subjectId}
//           onClose={() => setEditModal({ open: false })}
//           onSuccess={() => fetchSubjects(page, localSearch)}
//         />
//       )}

//       {deleteModal.open && deleteModal.subjectId && (
//         <ConfirmDeleteModal
//           subjectId={deleteModal.subjectId}
//           subjectName={deleteModal.subjectName || "this subject"}
//           onClose={() => setDeleteModal({ open: false })}
//           onSuccess={() => {
//             setDeleteModal({ open: false });
//             fetchSubjects(page, localSearch);
//           }}
//         />
//       )}
//     </div>
//   );
// }
