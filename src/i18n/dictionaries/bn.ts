import type { Dictionary } from "./en";

/**
 * Bangla copy. Typed as `Dictionary`, so adding a key to `en.ts` breaks the
 * build here until it is translated — no silent English fallbacks in the UI.
 */
export const bn: Dictionary = {
  lang: {
    label: "ভাষা",
    english: "English",
    bangla: "বাংলা",
  },
  roles: {
    admin: "প্রতিষ্ঠান প্রশাসক",
    teacher: "শিক্ষক",
    superadmin: "প্ল্যাটফর্ম প্রশাসক",
    unknown: "স্কুল ব্যবস্থাপনা",
  },
  topbar: {
    session: "সেশন",
    notifications: "বিজ্ঞপ্তি",
    openNav: "মেনু খুলুন",
    toggleSidebar: "সাইডবার বদলান",
  },
  nav: {
    groups: {
      overview: "সারসংক্ষেপ",
      people: "ব্যক্তিবর্গ",
      academics: "একাডেমিক",
      assessment: "মূল্যায়ন",
    },
    items: {
      dashboard: "ড্যাশবোর্ড",
      students: "শিক্ষার্থী",
      teachers: "শিক্ষক",
      idCards: "আইডি কার্ড",
      classes: "শ্রেণি",
      subjects: "বিষয়",
      groups: "গ্রুপ",
      teacherAssignment: "শিক্ষক নিয়োগ",
      exams: "পরীক্ষা",
      marksEntry: "নম্বর এন্ট্রি",
      results: "ফলাফল",
    },
  },
};
