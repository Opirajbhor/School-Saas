import { SpinnerCustom } from "@/components/Spinner";
import { getDefaultSubjectMark } from "../../_actions/defaultMark.action";
import { MarkConfigTable } from "../../_table/mark-config-table";

export default async function DefaultMarkCongfigPage() {
  const result = await getDefaultSubjectMark();

  if (!result.success) {
    return <SpinnerCustom />;
  }

  const subjects = result.data;

  if (subjects.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">No subjects found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center">
        <h1 className="text-center my-5">
          All subjects List ({subjects.length})
        </h1>
      </div>

      <div className="flex items-center justify-center">
        <MarkConfigTable data={subjects} />
      </div>
    </div>
  );
}
