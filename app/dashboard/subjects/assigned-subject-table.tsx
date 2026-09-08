"use client";

import StatusToggleModal from "@/components/modal/status-modal";
import { AppTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { ToggleAssignSubjectStatus } from "@/src/server-actions/subjects.action";
import { OutputSubAssignType } from "@/src/validation/subjects.zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";

export function SubjectAssignTable() {
  const [selectedSub, setSelectedSub] = useState<string[]>([]);

  // --------------query ------------------
  const queryClient = useQueryClient();
  // get cached subject data
  const { data: assignSubjects = [] } = useQuery({
    queryKey: ["page-subject", "assignSubjects"],
    queryFn: () =>
      queryClient.getQueryData<OutputSubAssignType[]>([
        "page-subject",
        "assignSubjects",
      ]) ?? [],
  });

  return (
    <div>
      <AppTable
        data={assignSubjects ?? []}
        searchable
        searchPlaceholder="Search Assigned Subjects..."
        searchKeys={["status", "className", "groupName", "subjectName"]}
        selectable
        selectedIds={selectedSub}
        onSelectionChange={setSelectedSub}
        toolbar={
          <>
            <Badge className="p-3 text-md" variant={"outline"}>
              Total Assigned Subjects: {assignSubjects?.length}
            </Badge>
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
            key: "subjectType",
            label: "Subject Type",
          },
          {
            key: "groupName",
            label: "Group Name",
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
            render: (item) => (
              <div className="flex gap-2">
                <StatusToggleModal
                  id={item.id}
                  onDelete={ToggleAssignSubjectStatus}
                  onSuccess={() => {
                    queryClient.invalidateQueries({
                      queryKey: ["page-subject", "assignSubjects"],
                    });
                  }}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
