"use client";

import React, { useState } from "react";
import {
  useAdmissionStore,
  PreviousSchool,
  FamilyMember,
} from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";
import {
  School,
  Users,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
} from "lucide-react";

export default function StepPreviousFamily() {
  const {
    formData,
    addPreviousSchool,
    removePreviousSchool,
    addFamilyMember,
    removeFamilyMember,
  } = useAdmissionStore();

  const [school, setSchool] = useState<Partial<PreviousSchool>>({});
  const [member, setMember] = useState<Partial<FamilyMember>>({});

  const formatDate = (date?: Date | string) =>
    date ? new Date(date).toISOString().split("T")[0] : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* LEFT COLUMN: Academic History */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-1 rounded-full"
              style={{ backgroundColor: "#6BE8EF" }}
            />
            <span
              style={{ color: "#BFCDEF" }}
              className="text-[10px] font-black uppercase tracking-widest opacity-60"
            >
              Academic History
            </span>
          </div>
        </div>

        {/* Existing Schools List */}
        <div className="space-y-3">
          {formData.previousSchools?.map((s, idx) => (
            <div
              key={idx}
              style={{ backgroundColor: "#1c376e33", borderColor: "#1c376e" }}
              className="flex justify-between items-center p-3 rounded-xl border border-dashed animate-in zoom-in-95"
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#6BE8EF]">
                  {s.name}
                </span>
                <span className="text-[10px] text-[#BFCDEF] opacity-50 uppercase tracking-tighter">
                  {formatDate(s.startDate)} — {formatDate(s.endDate)}
                </span>
              </div>
              <button
                onClick={() => removePreviousSchool(idx)}
                className="p-2 text-[#E74C3C] hover:bg-[#E74C3C]/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* School Form */}
        <div
          style={{ backgroundColor: "#03102b" }}
          className="space-y-4 pt-4 border-t border-[#1c376e]"
        >
          <LabeledInput
            label="School Name"
            value={school.name || ""}
            onChangeValue={(v) => setSchool({ ...school, name: v })}
            placeholder="e.g. Lincoln Academy"
          />
          <div className="grid grid-cols-2 gap-4">
            <LabeledInput
              label="Start Date"
              type="date"
              value={formatDate(school.startDate)}
              onChangeValue={(v) =>
                setSchool({ ...school, startDate: new Date(v) })
              }
            />

            <LabeledInput
              label="End Date"
              type="date"
              value={formatDate(school.endDate)}
              onChangeValue={(v) =>
                setSchool({ ...school, endDate: new Date(v) })
              }
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!school.name || !school.startDate || !school.endDate) return;
              addPreviousSchool(school as PreviousSchool);
              setSchool({});
            }}
            style={{ backgroundColor: "#1c376e", color: "#6BE8EF" }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-125 transition-all border border-[#6BE8EF]/20"
          >
            <Plus size={14} /> Add School
          </button>
        </div>
      </div>

      {/* VERTICAL SEPARATOR */}
      <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-[#1c376e] opacity-50" />

      {/* RIGHT COLUMN: Family Relations */}
      <div className="space-y-6 lg:pl-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-1 rounded-full"
              style={{ backgroundColor: "#6BE8EF" }}
            />
            <span
              style={{ color: "#BFCDEF" }}
              className="text-[10px] font-black uppercase tracking-widest opacity-60"
            >
              Family Relations
            </span>
          </div>
        </div>

        {/* Existing Members List */}
        <div className="space-y-3">
          {formData.familyMembers?.map((f, idx) => (
            <div
              key={idx}
              style={{ backgroundColor: "#1c376e33", borderColor: "#1c376e" }}
              className="flex justify-between items-center p-3 rounded-xl border border-dashed animate-in zoom-in-95"
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#6BE8EF]">
                  {f.name}
                </span>
                <span className="text-[10px] text-[#BFCDEF] opacity-50 uppercase tracking-tighter">
                  {f.relation} • {f.phone}
                </span>
              </div>
              <button
                onClick={() => removeFamilyMember(idx)}
                className="p-2 text-[#E74C3C] hover:bg-[#E74C3C]/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Member Form - Compact Grid */}
        <div className="space-y-4 pt-4 border-t border-[#1c376e]">
          <div className="grid grid-cols-2 gap-4">
            <LabeledInput
              label="Relation"
              value={member.relation || ""}
              onChangeValue={(v) => setMember({ ...member, relation: v })}
              placeholder="Father"
            />
            <LabeledInput
              label="Name"
              value={member.name || ""}
              onChangeValue={(v) => setMember({ ...member, name: v })}
              placeholder="Full Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LabeledInput
              label="Phone"
              value={member.phone || ""}
              onChangeValue={(v) => setMember({ ...member, phone: v })}
              type="tel"
            />
            <div className="flex flex-col group">
              <label
                style={{ color: "#BFCDEF" }}
                className="mb-1.5 text-xs font-black uppercase tracking-[0.15em] opacity-70"
              >
                Status
              </label>
              <div className="relative">
                <select
                  value={
                    member.isAlive === undefined
                      ? ""
                      : member.isAlive
                      ? "Yes"
                      : "No"
                  }
                  onChange={(e) =>
                    setMember({ ...member, isAlive: e.target.value === "Yes" })
                  }
                  style={{
                    backgroundColor: "#1c376e",
                    color: "#BFCDEF",
                    borderColor: "#BFCDEF33",
                  }}
                  className="w-full appearance-none rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-[#6BE8EF] outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    Alive?
                  </option>
                  <option value="Yes" className="bg-[#03102b]">
                    Yes
                  </option>
                  <option value="No" className="bg-[#03102b]">
                    No
                  </option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6BE8EF]"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!member.name || !member.relation) return;
              addFamilyMember(member as FamilyMember);
              setMember({});
            }}
            style={{ backgroundColor: "#6BE8EF", color: "#03102b" }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-[#6BE8EF]/10"
          >
            <Plus size={14} /> Add Member
          </button>
        </div>
      </div>
    </div>
  );
}
