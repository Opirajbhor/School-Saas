import { SpinnerCustom } from "@/components/Spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/table/tanstack/data-table";
import { columns } from "./_table/columns";
import { getDefaultGroupClasses } from "@/app/super-admin/(main)/groups/_actions/groups.action";
import { OutputGroupClassType } from "@/src/validation/groups.zod";

export default async function GroupsPage() {
  const result = await getDefaultGroupClasses();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const groups = result.data;
  return (
    <div className="max-w-7xl lg:w-full mx-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-1">
            Group Management
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage Academic Groups.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5 mb-5 items-center justify-center w-full">
        {/* groups  stats*/}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Groups</p>
            <h2 className="mt-2 text-3xl font-bold">{groups?.length}</h2>
          </CardContent>
        </Card>
      </div>
      {/* ....... */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Data Table Section */}
        <div className="lg:col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
          {/* Table Header/Toolbar */}
          <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30">
            <div className="text-lg font-semibold text-foreground flex items-center gap-5">
              Academic groups
              <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                {groups?.length} groups
              </Badge>
            </div>
          </div>

          {/* Responsive Table Wrapper */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Data Table Section */}
            <div className="lg:col-span-4">
              <DataTable
                columns={columns}
                data={groups as OutputGroupClassType[]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
