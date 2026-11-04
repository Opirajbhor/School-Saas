/**
 * English copy. This file is the shape every other locale copies: `bn.ts` is
 * typed against it, so a missing key is a build error instead of a blank label.
 */
export const en = {
  lang: {
    label: "Language",
    english: "English",
    bangla: "বাংলা",
  },
  roles: {
    admin: "Institute admin",
    teacher: "Teacher",
    superadmin: "Platform admin",
    unknown: "School management",
  },
  topbar: {
    session: "Session",
    notifications: "Notifications",
    openNav: "Open navigation",
    toggleSidebar: "Toggle sidebar",
  },
  nav: {
    groups: {
      overview: "Overview",
      people: "People",
      academics: "Academics",
      assessment: "Assessment",
    },
    items: {
      dashboard: "Dashboard",
      students: "Students",
      teachers: "Teachers",
      idCards: "ID cards",
      classes: "Classes",
      subjects: "Subjects",
      groups: "Groups",
      teacherAssignment: "Teacher assignment",
      exams: "Exams",
      attendance: "Attendance sheets",
      admitCards: "Admit cards",
      routine: "Exam routine",
      marksEntry: "Marks entry",
      results: "Results",
    },
  },
};

export type Dictionary = typeof en;
