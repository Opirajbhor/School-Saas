"use server";
import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Users,
  Layers,
  BookOpen,
  Activity,
} from "lucide-react";
import { getSingleExamData } from "../../_actions/examOverview.action";
import { SpinnerCustom } from "@/components/Spinner";
import { ExamOverViewType } from "../../_schema/exam.zod";

// --- Mock Data ---
const stats = [
  {
    label: "Assigned Classes",
    value: "5",
    subtext: "VI, VII, VIII, IX, X",
    icon: <Users size={18} className="text-blue-600" />,
    bg: "bg-blue-50",
  },
  {
    label: "Total Sections",
    value: "15",
    subtext: "Across all classes",
    icon: <Layers size={18} className="text-blue-600" />,
    bg: "bg-blue-50",
  },
  {
    label: "Total Subjects",
    value: "8",
    subtext: "Per class (average)",
    icon: <BookOpen size={18} className="text-blue-600" />,
    bg: "bg-blue-50",
  },
];

const classDatas = [
  {
    id: 1,
    name: "Class 6",
    sections: "A, B, C",
    subjects: 8,
    students: 86,
    progress: 100,
    status: "Completed",
  },
  {
    id: 2,
    name: "Class 7",
    sections: "A, B, C",
    subjects: 8,
    students: 92,
    progress: 67,
    status: "In Progress",
  },
  {
    id: 3,
    name: "Class 8",
    sections: "A, B, C",
    subjects: 8,
    students: 88,
    progress: 0,
    status: "Not Started",
  },
  {
    id: 4,
    name: "Class 9",
    sections: "A, B",
    subjects: 8,
    students: 64,
    progress: 0,
    status: "Not Started",
  },
  {
    id: 5,
    name: "Class 10",
    sections: "A, B",
    subjects: 8,
    students: 58,
    progress: 50,
    status: "In Progress",
  },
];

export default async function ExamOverview({ id }: { id: string }) {
  const result = await getSingleExamData(id);
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const examData = result.data as ExamOverViewType[];
  const currentData = examData[0];
  if (!currentData) {
    return <div>No exam data found</div>;
  }
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <BookOpen size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">
                    {currentData.name}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Active
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <Calendar size={14} />
                  <span>10 Sep 2024 - 20 Sep 2024</span>
                </div>
              </div>
            </div>

            <button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <ArrowLeft size={16} />
              Back to Exams
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md `}
                >
                  {stat.icon}
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {stat.label}
                </p>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">{stat.subtext}</p>
              </div>
            </div>
          ))}

          {/* Overall Progress Card */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-50">
                <Activity size={18} className="text-green-600" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                Overall Progress
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full">
                  {/* Simple SVG Circular Progress */}
                  <svg
                    className="h-12 w-12 -rotate-90 transform"
                    viewBox="0 0 36 36"
                  >
                    <path
                      className="text-slate-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-green-500"
                      strokeWidth="4"
                      strokeDasharray="60, 100"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-bold text-slate-700">
                    60%
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-right">
                3 of 5 classes
                <br />
                completed
              </p>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-2">
            <button className="border-b-2 border-blue-600 px-4 py-3 text-sm font-semibold text-blue-600">
              Classes Overview
            </button>
            <button className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">
              Mark Entry Progress
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Sections</th>
                  <th className="px-5 py-3 text-center">Subjects</th>
                  <th className="px-5 py-3 text-center">Students</th>
                  <th className="px-5 py-3 min-w-50">Progress</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentData.assignClasses.map((row) => (
                  <tr key={row.class.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {row.class.name}
                    </td>
                    <td className="px-5 py-4">
                      {row.class.sections?.map((s) => s.name).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {row.class?.subjects?.length}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {row.class?.students?.length}
                    </td>

                    {/* Progress Column */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-full max-w-30 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full ${
                              row.progress === 100
                                ? "bg-green-500"
                                : row.progress > 0
                                  ? "bg-blue-600"
                                  : "bg-slate-200"
                            }`}
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-700 w-8">
                          {row.progress}%
                        </span>
                        <StatusBadge status={row.status} />
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="px-5 py-4">
                      <button className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                        Enter Marks
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Reusable Status Badge ---
function StatusBadge({ status }: { status: string }) {
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 border border-green-200">
        Completed
      </span>
    );
  }
  if (status === "In Progress") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
      Not Started
    </span>
  );
}
