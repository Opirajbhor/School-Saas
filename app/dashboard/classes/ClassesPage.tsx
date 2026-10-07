import { SpinnerCustom } from "@/components/Spinner";
import { DataTable } from "@/components/table/tanstack/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { columns } from "./_table/columns";
import { getClasses } from "./_actions/classes.action";

export default async function ClassesPage() {
  const result = await getClasses();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const classes = result.data;
  const allSections = classes?.flatMap((cls) => cls.sections || []) ?? [];

  return (
    <div className="max-w-7xl lg:w-full mx-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-1">
            Classes & Sections Management
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage academic classes, sections.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5 mb-5 items-center justify-center w-full">
        {/* class  stats*/}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Classes</p>
            <h2 className="mt-2 text-3xl font-bold">{classes?.length}</h2>
          </CardContent>
        </Card>
        {/* sections stats*/}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Sections</p>
            <h2 className="mt-2 text-3xl font-bold">{allSections?.length}</h2>
          </CardContent>
        </Card>
      </div>
      {/* ....... */}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Data Table Section */}
        <div className="lg:col-span-4">
          <DataTable columns={columns} data={classes} />
        </div>
      </div>
    </div>
  );
}
