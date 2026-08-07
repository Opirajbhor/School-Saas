// "use client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Sheet,
//   SheetClose,
//   SheetContent,
//   SheetDescription,
//   SheetFooter,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import { Spinner } from "@/components/ui/spinner";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { MdEditNote } from "react-icons/md";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   NativeSelect,
//   NativeSelectOption,
// } from "@/components/ui/native-select";
// import {
//   academicSessionType,
//   academicSessionZod,
// } from "@/src/validation/academicSessions.zod";
// import { handleCrudAction } from "@/src/lib/crud-funtions/handle-crud-action";
// import { acadecmicSession } from "@/src/server-actions/academicSession.action";

// export default function EditSession({
//   sessions,
//   setSessions,
// }: academicSessionType) {
//   const form = useForm<academicSessionType>({
//     resolver: zodResolver(academicSessionZod),
//     defaultValues: {},
//   });
//   const { isSubmitting } = form.formState;

//   //   edit button
//   const editBtn = async (data: academicSessionType) => {
//     await handleCrudAction(acadecmicSession, data, {
//       successMessage: "Session updated Successfully",
//       onSuccess: (item) => {
//         setSessions((prev) => [...(prev || []), item]);
//         form.reset();
//       },
//     });
//   };
//   return (
//     <Sheet>
//       <SheetTrigger asChild>
//         <Button className="cursor-pointer ml-3  text-xl" variant="default">
//           <MdEditNote />
//         </Button>
//       </SheetTrigger>
//       <SheetContent>
//         <SheetHeader>
//           <SheetTitle>Edit Academic Session </SheetTitle>
//           <SheetDescription>
//             Make changes to Academic Session. Click save when you&apos;re done.
//           </SheetDescription>
//         </SheetHeader>

//         <form onSubmit={form.handleSubmit(editBtn)}>
//           <Card className="overflow-hidden ">
//             <CardContent className="p-0 h-full flex flex-col">
//               <div className="flex-1 overflow-y-auto p-6 space-y-5">
//                 <div className="space-y-2">
//                   <Label htmlFor="nameEnglish">Session Name</Label>
//                   <Input
//                     id="nameEnglish"
//                     {...form.register("year")}
//                     defaultValue={sessions.year}
//                   />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <SheetFooter className="grid grid-cols-2 items-center justify-center">
//             <Button type="button" disabled={isSubmitting} variant="default">
//               {isSubmitting && <Spinner />} Save Changes
//             </Button>
//             <SheetClose asChild>
//               <Button variant="outline">Close</Button>
//             </SheetClose>
//           </SheetFooter>
//         </form>
//       </SheetContent>
//     </Sheet>
//   );
// }
