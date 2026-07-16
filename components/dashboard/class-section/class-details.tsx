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

import ClassDeleteModal from "./delete-class-modal";
import { classesTypeWithId } from "@/src/validation/classes.zod";
import AddClassSection from "./add-section";

export function ClassDetails({ classData }: { classData: classesTypeWithId }) {
  const { name, isActive, sessionId, id, sections } = classData;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="cursor-pointer h-25 text-xl" variant="outline">
          {name}
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
          <div className="grid grid-cols-3">
            {sections?.map((item, i) => (
              <p className="border p-5 w-auto text-center rounded-2xl " key={i}>
                {item.name}
              </p>
            ))}{" "}
          </div>

          <div>
            <Button className="w-full cursor-pointer mb-3" variant={"outline"}>
              Edit
            </Button>
            <AddClassSection classData={classData} />

            <ClassDeleteModal classId={id!} />
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
