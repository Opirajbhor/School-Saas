"use client";

import React from "react";
import {
  Search,
  BookOpen,
  Users,
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Layers,
  UserCircle,
  Book,
  FileText,
  ClipboardList,
  CheckCircle2,
  Bell,
  ChevronDown,
  PenTool,
  RotateCcw,
  Save,
  Send,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";

export default function MarkInputPage() {
  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900">
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <PenTool size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Mark Input
                </h1>
                <p className="text-sm text-slate-500">
                  Enter and manage student marks for exams.
                </p>
              </div>
            </div>

            {/* Step 1: Select Exam & Class */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Select Exam & Class
                    </h2>
                    <p className="text-sm text-slate-500">
                      Choose the exam and class to see available sections and
                      subjects.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Exam
                    </label>
                    <div className="relative">
                      <select className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option>Half-Yearly Examination (2024-25)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Class
                    </label>
                    <div className="relative">
                      <select className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option>Class 10</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                  <button className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 md:h-9.5">
                    <Search size={16} />
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Select Section & Subject */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Select Section & Subject
                    </h2>
                    <p className="text-sm text-slate-500">
                      Choose a section and subject from the list below. Search
                      again to load students and mark configuration.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Section
                    </label>
                    <div className="relative">
                      <select className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option>Section A</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Subject
                    </label>
                    <div className="relative">
                      <select className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option>Mathematics</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                  <button className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 md:h-[38px]">
                    <Search size={16} />
                    Search
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-600">
                        Available Sections
                      </p>
                      <p className="text-lg font-bold text-slate-800">2</p>
                      <p className="text-[11px] text-slate-500">
                        Section A, Section B
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <Book size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-purple-600">
                        Available Subjects
                      </p>
                      <p className="text-lg font-bold text-slate-800">5</p>
                      <p className="text-[11px] text-slate-500">
                        Mathematics, Physics, Chemistry...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 ring-1 ring-green-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200 text-green-700">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-700">
                        Mark Configuration
                      </p>
                      <p className="text-[12px] font-medium text-slate-700 mt-0.5">
                        CQ: 70 (Pass: 23)
                      </p>
                      <p className="text-[12px] font-medium text-slate-700">
                        MCQ: 30 (Pass: 10)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Enter Marks */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Enter Marks
                    </h2>
                    <p className="text-sm text-slate-500">
                      View and enter marks for the selected section and subject.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <span className="text-sm text-slate-500">
                    32 students found
                  </span>
                  <button className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Save size={16} />
                    Save Draft
                  </button>
                  <button className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    <Send size={16} />
                    Submit Marks
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Right: Data Table */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-4 flex items-center">
                      <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by roll or student name..."
                          className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th
                              rowSpan={2}
                              className="px-3 py-3 font-medium border-b border-r border-slate-200 text-center w-16 bg-slate-50/80"
                            >
                              Roll No.
                            </th>
                            <th
                              rowSpan={2}
                              className="px-3 py-3 font-medium border-b border-r border-slate-200 min-w-37.5 bg-slate-50/80"
                            >
                              Student Name
                            </th>
                            <th
                              colSpan={2}
                              className="px-3 py-2 font-medium border-b border-r border-slate-200 text-center bg-slate-50/80"
                            >
                              CQ (70)
                            </th>
                            <th
                              colSpan={2}
                              className="px-3 py-2 font-medium border-b border-r border-slate-200 text-center bg-slate-50/80"
                            >
                              MCQ (30)
                            </th>
                            <th
                              rowSpan={2}
                              className="px-3 py-3 font-medium border-b border-r border-slate-200 text-center w-20 bg-slate-50/80"
                            >
                              Total
                              <br />
                              <span className="text-[10px] font-normal">
                                / 100
                              </span>
                            </th>
                            <th
                              rowSpan={2}
                              className="px-3 py-3 font-medium border-b border-r border-slate-200 min-w-30 bg-slate-50/80"
                            >
                              Remarks
                            </th>
                            <th
                              rowSpan={2}
                              className="px-3 py-3 font-medium border-b border-slate-200 text-center w-12 bg-slate-50/80"
                            >
                              Action
                            </th>
                          </tr>
                          <tr>
                            <th className="px-3 py-2 font-medium border-b border-r border-slate-200 text-center w-24 bg-slate-50/50">
                              Marks
                            </th>
                            <th className="px-3 py-2 font-medium border-b border-r border-slate-200 text-center w-24 bg-slate-50/50">
                              Status
                            </th>
                            <th className="px-3 py-2 font-medium border-b border-r border-slate-200 text-center w-24 bg-slate-50/50">
                              Marks
                            </th>
                            <th className="px-3 py-2 font-medium border-b border-r border-slate-200 text-center w-24 bg-slate-50/50">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <TableRow
                            roll="1"
                            name="Aarav Sharma"
                            cq="58"
                            mcq="26"
                            total="84"
                            cqStatus="present"
                            mcqStatus="present"
                          />
                          <TableRow
                            roll="2"
                            name="Diya Patel"
                            cq="45"
                            mcq="20"
                            total="65"
                            cqStatus="present"
                            mcqStatus="present"
                          />
                          <TableRow
                            roll="3"
                            name="Rohan Verma"
                            cq="62"
                            mcq="28"
                            total="90"
                            cqStatus="present"
                            mcqStatus="present"
                          />
                          <TableRow
                            roll="4"
                            name="Sneha Gupta"
                            cq="50"
                            mcq="22"
                            total="72"
                            cqStatus="present"
                            mcqStatus="present"
                          />
                          <TableRow
                            roll="5"
                            name="Aditya Singh"
                            cq="38"
                            mcq="15"
                            total="53"
                            cqStatus="below"
                            mcqStatus="present"
                            remark="Needs attention"
                          />
                          <TableRow
                            roll="6"
                            name="Ananya Mishra"
                            cq="70"
                            mcq="30"
                            total="100"
                            cqStatus="present"
                            mcqStatus="present"
                          />
                          <TableRow
                            roll="7"
                            name="Kartik Roy"
                            cq="N/A"
                            mcq="N/A"
                            total="-"
                            cqStatus="absent"
                            mcqStatus="absent"
                            remark="Absent"
                          />
                          <TableRow
                            roll="8"
                            name="Ishita Das"
                            cq="55"
                            mcq="25"
                            total="80"
                            cqStatus="present"
                            mcqStatus="present"
                          />
                          <TableRow
                            roll="9"
                            name="Vivaan Jain"
                            cq="42"
                            mcq="18"
                            total="60"
                            cqStatus="present"
                            mcqStatus="present"
                          />
                          <TableRow
                            roll="10"
                            name="Tanya Kapoor"
                            cq="67"
                            mcq="27"
                            total="94"
                            cqStatus="present"
                            mcqStatus="present"
                          />
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span>Showing 1-10 of 32 students</span>
                      <div className="flex items-center gap-1">
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                          disabled
                        >
                          &lt;
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-medium text-white">
                          1
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50">
                          2
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50">
                          3
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50">
                          4
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50">
                          &gt;
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Reusable Table Row for Marks
function TableRow({
  roll,
  name,
  cq,
  mcq,
  total,
  cqStatus,
  mcqStatus,
  remark,
}: {
  roll: string;
  name: string;
  cq: string;
  mcq: string;
  total: string;
  cqStatus: "present" | "absent" | "below";
  mcqStatus: "present" | "absent" | "below";
  remark?: string;
}) {
  return (
    <tr className="hover:bg-slate-50/50">
      <td className="border-r border-slate-100 px-3 py-2 text-center text-slate-500">
        {roll}
      </td>
      <td className="border-r border-slate-100 px-3 py-2 font-medium text-slate-800">
        {name}
      </td>

      {/* CQ */}
      <td className="border-r border-slate-100 px-3 py-2 text-center">
        {cq === "N/A" ? (
          <span className="text-slate-400">N/A</span>
        ) : (
          <input
            type="text"
            defaultValue={cq}
            className="w-14 rounded border border-slate-200 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
      </td>
      <td className="border-r border-slate-100 px-3 py-2 text-center">
        <StatusBadge status={cqStatus} />
      </td>

      {/* MCQ */}
      <td className="border-r border-slate-100 px-3 py-2 text-center">
        {mcq === "N/A" ? (
          <span className="text-slate-400">N/A</span>
        ) : (
          <input
            type="text"
            defaultValue={mcq}
            className="w-14 rounded border border-slate-200 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
      </td>
      <td className="border-r border-slate-100 px-3 py-2 text-center">
        <StatusBadge status={mcqStatus} />
      </td>

      {/* Total & Remarks */}
      <td className="border-r border-slate-100 px-3 py-2 text-center font-medium text-slate-700">
        {total}
      </td>
      <td className="border-r border-slate-100 px-3 py-2 text-xs text-slate-500">
        {remark || "-"}
      </td>

      {/* Action */}
      <td className="px-3 py-2 text-center">
        <button className="text-slate-400 hover:text-slate-700">
          <MoreHorizontal size={16} />
        </button>
      </td>
    </tr>
  );
}

// Reusable Status Badge
function StatusBadge({ status }: { status: "present" | "absent" | "below" }) {
  if (status === "present") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
        Present
      </span>
    );
  }
  if (status === "absent") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
        Absent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
      Below Pass
    </span>
  );
}
