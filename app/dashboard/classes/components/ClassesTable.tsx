"use client";

import React from "react";
import { ClassWithStudents } from "@/app/store/useClassesStore";

interface ClassesTableProps {
  classes: ClassWithStudents[];
  sortBy: "name" | "studentCount";
  sortOrder: "asc" | "desc";
  onSort: (key: "name" | "studentCount") => void;
  onEdit: (cls: ClassWithStudents) => void;
  onDelete: (cls: ClassWithStudents) => void;
  onViewStudents: (cls: ClassWithStudents) => void;
}

export const ClassesTable: React.FC<ClassesTableProps> = ({
  classes,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onViewStudents,
}) => {
  return (
    <div className="overflow-x-auto border rounded-2xl shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c376e]">
            <th
              className="px-6 py-4 cursor-pointer"
              onClick={() => onSort("name")}
            >
              <div className="flex items-center gap-2 text-xs font-black uppercase text-[#BFCDEF]">
                Class Name
                <span className="text-[#6BE8EF]">
                  {sortBy === "name" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
                </span>
              </div>
            </th>
            <th
              className="px-6 py-4 cursor-pointer"
              onClick={() => onSort("studentCount")}
            >
              <div className="flex items-center gap-2 text-xs font-black uppercase text-[#BFCDEF]">
                Students
                <span className="text-[#6BE8EF]">
                  {sortBy === "studentCount"
                    ? sortOrder === "asc"
                      ? "↑"
                      : "↓"
                    : "↕"}
                </span>
              </div>
            </th>
            <th className="px-6 py-4 text-right text-xs font-black uppercase text-[#BFCDEF]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {classes.map((cls) => (
            <tr key={cls.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">{cls.name}</td>
              <td className="px-4 py-2">{cls.students?.length ?? 0}</td>
              <td className="px-4 py-2 flex gap-2 justify-end">
                <button
                  onClick={() => onEdit(cls)}
                  className="px-2 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(cls)}
                  className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => onViewStudents(cls)}
                  className="px-3 py-1 bg-ford-primary text-white rounded hover:bg-ford-secondary"
                >
                  Students
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
