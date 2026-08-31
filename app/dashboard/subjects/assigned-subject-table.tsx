"use client";

import { SpinnerCustom } from "@/components/Spinner";
import { AppTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import { getAssignSubjects } from "@/src/server-actions/subjects.action";
import { OutputSubAssignType } from "@/src/validation/subjects.zod";
import { useEffect, useState } from "react";

export function SubjectAssignTable() {
  const [loading, setLoading] = useState<boolean>(true);
  const [subjects, setSubjects] = useState<OutputSubAssignType[] | undefined>(
    undefined,
  );
  const [selectedSub, setSelectedSub] = useState<string[]>([]);

  useEffect(() => {
    async function getlist() {
      await clientReadAction(getAssignSubjects, {
        onSuccess: (data) => {
          setSubjects(data as OutputSubAssignType[]);
        },
        onLoading: setLoading,
      });
    }
    getlist();
  }, []);
  console.log(subjects);
  if (loading) {
    return <SpinnerCustom />;
  }
  return (
    <div>
      <AppTable
        data={subjects ?? []}
        searchable
        searchPlaceholder="Search Assigned Subjects..."
        searchKeys={["status", "className", "groupName", "subjectName"]}
        selectable
        selectedIds={selectedSub}
        onSelectionChange={setSelectedSub}
        toolbar={
          <>
            <Button variant="outline">Export</Button>
          </>
        }
        columns={[
          {
            key: "subjectName",
            label: "Subject Name",
          },

          {
            key: "className",
            label: "Class Name",
          },

          {
            key: "groupName",
            label: "Group Name",
          },

          {
            key: "subjectType",
            label: "Subject Type",
          },

          {
            key: "status",
            label: "Status",
            render: (item) =>
              item.status === "ACTIVE" ? (
                <Badge variant="default">ACTIVE</Badge>
              ) : (
                <span className="text-muted-foreground">INACTIVE</span>
              ),
          },

          {
            key: "actions",
            label: "Actions",
            // render: (item) => (
            //   <div className="flex gap-2">
            //     <StatusToggleModal
            //       id={item.id}
            //       onDelete={ToggleSubjectStatus}
            //       onSuccess={() => {
            //         form.reset();
            //         setSubjects((prev) =>
            //           prev?.map((c) =>
            //             c?.id === item.id
            //               ? {
            //                   ...c,
            //                   status:
            //                     c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            //                 }
            //               : c,
            //           ),
            //         );
            //       }}
            //     />
            //   </div>
            // ),
          },
        ]}
      />
    </div>
  );
}
