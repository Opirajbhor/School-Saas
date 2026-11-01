import type { CardInstitute, StudentCardData, TeacherCardData } from "../_actions/id-card.action";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

const formatDate = (value: Date | string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/** Shared chrome: institute band, body, footer note. */
function CardShell({
  institute,
  kind,
  children,
  footer,
}: {
  institute: CardInstitute;
  kind: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex h-[54mm] w-[85.6mm] flex-col overflow-hidden rounded-[3mm] border border-neutral-300 bg-white text-neutral-900 shadow-sm print:break-inside-avoid print:rounded-none print:shadow-none">
      {/* institute band */}
      <div className="flex items-center gap-2 bg-[#0f172a] px-2.5 py-1.5 text-white">
        {institute.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={institute.logo}
            alt=""
            className="size-6 shrink-0 rounded-sm bg-white object-contain p-0.5"
          />
        ) : (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-white/15 text-[9px] font-bold">
            {initials(institute.nameEnglish) || "EI"}
          </span>
        )}

        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[8px] font-semibold">
            {institute.nameBangla}
          </p>
          <p className="truncate text-[6.5px] tracking-wide text-white/70 uppercase">
            {institute.nameEnglish}
          </p>
        </div>

        <div className="shrink-0 text-right leading-tight">
          <p className="text-[6px] tracking-wider text-white/60 uppercase">
            {kind}
          </p>
          <p className="text-[7px] font-semibold tabular-nums">
            EIIN {institute.eiin}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-2 px-2.5 py-2">{children}</div>

      <div className="border-t border-dashed border-neutral-300 px-2.5 py-1">
        {footer}
      </div>
    </div>
  );
}

function Photo({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="h-[22mm] w-[16mm] shrink-0 rounded-sm border border-neutral-300 object-cover"
      />
    );
  }

  return (
    <div className="flex h-[22mm] w-[16mm] shrink-0 items-center justify-center rounded-sm border border-neutral-300 bg-neutral-100 text-[10px] font-semibold text-neutral-500">
      {initials(name) || "—"}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1 leading-tight">
      <span className="w-[11mm] shrink-0 text-[6px] tracking-wide text-neutral-500 uppercase">
        {label}
      </span>
      <span className="truncate text-[7.5px] font-medium tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function StudentIdCard({ data }: { data: StudentCardData }) {
  const { institute, student, enrollment } = data;

  return (
    <CardShell
      institute={institute}
      kind="Student ID"
      footer={
        <div className="flex items-end justify-between gap-2">
          <p className="max-w-[46mm] text-[5.5px] leading-tight text-neutral-500">
            {institute.upazila}, {institute.district}, {institute.division} ·{" "}
            {institute.phone}
          </p>
          <div className="text-center leading-tight">
            <div className="h-[4mm] w-[20mm] border-b border-neutral-400" />
            <p className="text-[5px] tracking-wide text-neutral-500 uppercase">
              Head teacher
            </p>
          </div>
        </div>
      }
    >
      <Photo src={student.photoUrl} name={student.englishName} />

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-[9px] leading-tight font-bold uppercase">
          {student.englishName}
        </p>
        {student.banglaName && (
          <p className="truncate text-[7.5px] leading-tight text-neutral-600">
            {student.banglaName}
          </p>
        )}

        <div className="mt-1 space-y-0.5">
          <Field
            label="Class"
            value={
              enrollment
                ? `${enrollment.className} · ${enrollment.sectionName}`
                : "—"
            }
          />
          <Field label="Roll" value={enrollment?.roll ?? "—"} />
          <Field label="ID" value={student.studentId} />
          <Field
            label="Session"
            value={enrollment?.sessionYear ?? "—"}
          />
          {enrollment?.groupName && (
            <Field label="Group" value={enrollment.groupName} />
          )}
          <Field label="Guardian" value={student.phone} />
        </div>
      </div>

      <div className="w-[13mm] shrink-0 text-right">
        <p className="text-[5.5px] tracking-wide text-neutral-500 uppercase">
          D.O.B
        </p>
        <p className="text-[6.5px] tabular-nums">{formatDate(student.dateOfBirth)}</p>
        <p className="mt-1 text-[5.5px] tracking-wide text-neutral-500 uppercase">
          Blood
        </p>
        <p className="text-[6.5px]">—</p>
      </div>
    </CardShell>
  );
}

export function TeacherIdCard({ data }: { data: TeacherCardData }) {
  const { institute, teacher } = data;

  return (
    <CardShell
      institute={institute}
      kind="Teacher ID"
      footer={
        <div className="flex items-end justify-between gap-2">
          <p className="max-w-[46mm] text-[5.5px] leading-tight text-neutral-500">
            {institute.upazila}, {institute.district}, {institute.division} ·{" "}
            {institute.phone}
          </p>
          <div className="text-center leading-tight">
            <div className="h-[4mm] w-[20mm] border-b border-neutral-400" />
            <p className="text-[5px] tracking-wide text-neutral-500 uppercase">
              Head teacher
            </p>
          </div>
        </div>
      }
    >
      <Photo src={teacher.photoUrl} name={teacher.nameEnglish} />

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-[9px] leading-tight font-bold uppercase">
          {teacher.nameEnglish}
        </p>
        <p className="truncate text-[7.5px] leading-tight text-neutral-600">
          {teacher.nameBangla}
        </p>

        <div className="mt-1 space-y-0.5">
          <Field label="Role" value={teacher.designation} />
          <Field label="Mobile" value={teacher.mobile} />
          <Field label="Email" value={teacher.email} />
          <Field label="Gender" value={teacher.gender} />
        </div>
      </div>

      <div className="w-[13mm] shrink-0 text-right">
        <p className="text-[5.5px] tracking-wide text-neutral-500 uppercase">
          Card
        </p>
        <p className="text-[6.5px] tabular-nums">
          {teacher.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </CardShell>
  );
}
