"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { classesTypeWithId } from "@/src/validation/classes.zod";
import AddClassSection from "./add-section";
import DeleteModal from "@/components/modal/delete-modal";
import {
  deleteClass,
  deleteSection,
} from "@/src/server-actions/classes.action";
import { Eye } from "lucide-react";

export function ClassDetails({
  classData,
  setClasses,
}: {
  classData: classesTypeWithId;
  setClasses: React.Dispatch<
    React.SetStateAction<classesTypeWithId[] | undefined>
  >;
}) {
  const { name, isActive, sessionId, id, sections } = classData;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="cursor-pointer text-xl" variant="outline">
          <Eye />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Class Details</SheetTitle>
          <SheetDescription>
            Make changes to Class. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <h2 className="text-xl text-primary-foreground">
            Class Name : {name}
          </h2>
          <h2 className="text-xl text-primary-foreground">
            Session : {sessionId}
          </h2>

          <h2 className="text-xl text-primary-foreground">Students : 380</h2>
          <h2 className="text-xl text-primary-foreground">
            Status :{" "}
            {isActive ? (
              <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 text-sm p-3">
                Active
              </Badge>
            ) : (
              <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 text-sm p-3">
                Disabled
              </Badge>
            )}
          </h2>
          <h2 className="text-xl text-primary-foreground">
            Sections : {sections?.length}
          </h2>
          <div className="grid grid-cols-3  gap-3">
            {sections
              ?.sort((a, b) => a.name.localeCompare(b.name))
              .map((item, i) => (
                <div
                  className="border p-5 w-auto text-center rounded-2xl "
                  key={i}
                >
                  {item.name}
                  <DeleteModal
                    className="w-full"
                    buttonText=""
                    id={item.id!}
                    onDelete={deleteSection}
                    onSuccess={() => {
                      setClasses((prev) =>
                        prev?.map((cls) =>
                          cls.id === id
                            ? {
                                ...cls,
                                sections: cls.sections?.filter(
                                  (s) => s.id !== item.id,
                                ),
                              }
                            : cls,
                        ),
                      );
                    }}
                  />
                </div>
              ))}
          </div>

          <div>
            <Button className="w-full cursor-pointer mb-3" variant={"outline"}>
              Edit
            </Button>
            <AddClassSection classData={classData} setClasses={setClasses} />

            <DeleteModal
              className="w-full"
              buttonText="Delete Class Data"
              id={id!}
              onDelete={deleteClass}
              onSuccess={() => {
                setClasses((prev) => prev?.filter((cls) => cls.id !== id));
              }}
            />
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
