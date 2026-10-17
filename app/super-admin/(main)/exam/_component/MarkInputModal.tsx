"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdEditNote } from "react-icons/md";
import { useEffect, useState } from "react";
import {
  FormProvider,
  useForm,
  useWatch,
  useFieldArray,
} from "react-hook-form";
import { defaultMarkZod, InputDefaultMarkType } from "../_schema/markInput.zod";
import { useQuery } from "@tanstack/react-query";
import { getDefaultMarkTypes } from "../_actions/exam.action";
import { OutputExamMarkTypes } from "../_schema/exam.zod";

export default function MarkInputModal({
  item,
}: {
  item: { id: string; name: string };
}) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<Record<number, boolean>>({});

  const { data: markTypes = [] } = useQuery<OutputExamMarkTypes[]>({
    queryKey: ["marktypes"],
    queryFn: async () => {
      const result = await getDefaultMarkTypes();
      if (!result.success) throw new Error(result.error);
      return result.data as OutputExamMarkTypes[];
    },
  });

  const form = useForm<InputDefaultMarkType>({
    resolver: zodResolver(defaultMarkZod),
    defaultValues: {
      subjectid: item.id,
      subjectName: item.name,
      marks: [],
      status: "ACTIVE",
    },
  });

  // Populate field array once markTypes resolves
  useEffect(() => {
    if (markTypes.length > 0) {
      form.reset({
        subjectid: item.id,
        subjectName: item.name,
        marks: markTypes.map((t) => ({
          markTypeId: t.id,
          fullMark: 0,
          passMark: 0,
        })),
        status: "ACTIVE",
      });
    }
  }, [markTypes, form, item.id, item.name]);

  const { fields } = useFieldArray({ control: form.control, name: "marks" });
  const fullMarks = useWatch({ control: form.control, name: "marks" });
  const { isSubmitting } = form.formState;

  const toggleType = (i: number) => {
    setEnabled((prev) => {
      const next = { ...prev, [i]: !prev[i] };
      if (!next[i]) {
        // clear values when toggled off
        form.setValue(`marks.${i}.fullMark`, 0, { shouldValidate: true });
        form.setValue(`marks.${i}.passMark`, 0, { shouldValidate: false });
      }
      return next;
    });
  };

  // ✅ Filter out empty mark types (fullMark === 0) before sending
  const submit = (data: InputDefaultMarkType) => {
    const cleaned = {
      ...data,
      marks: data.marks.filter((m) => Number(m.fullMark) > 0),
    };
    console.log("submit data:", cleaned);
    // TODO: call server action with `cleaned`
  };

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <MdEditNote className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-150 p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="font-bold text-primary">
            {" "}
            {item.name}
          </DialogTitle>
          <DialogDescription>
            Enable the mark types this subject uses. Pass mark auto-calculates
            at 33%.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(submit, (err) => console.log(err))}>
            <div className="px-6 py-3 max-h-[60vh] overflow-y-auto">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_88px_88px_44px] gap-3 px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Type</span>
                <span className="text-center">Full</span>
                <span className="text-center">Pass</span>
                <span className="text-center">On</span>
              </div>

              <div className="divide-y">
                {fields.map((field, i) => {
                  const isOn = !!enabled[i];
                  const fullMark = Number(fullMarks?.[i]?.fullMark ?? 0);
                  const passMark = Math.round(fullMark * 0.33);
                  const type = markTypes[i];
                  const short = (type?.name ?? "??").slice(0, 3).toUpperCase();

                  return (
                    <div
                      key={field.id}
                      className={`grid grid-cols-[1fr_88px_88px_44px] items-center gap-3 px-2 py-3 rounded-lg transition-colors ${
                        isOn ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Type label */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`h-7 w-7 rounded-md grid place-items-center text-[10px] font-bold shrink-0 ${
                            isOn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {short}
                        </span>
                        <span
                          className={`text-sm font-medium truncate ${
                            isOn ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {type?.name ?? "Unknown"}
                        </span>
                      </div>

                      {/* Full mark — writes fullMark + passMark into RHF */}
                      {isOn ? (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0"
                          {...form.register(`marks.${i}.fullMark`, {
                            valueAsNumber: true,
                            onChange: (e) => {
                              const val = Number(e.target.value) || 0;
                              form.setValue(
                                `marks.${i}.passMark`,
                                Math.round(val * 0.33),
                                { shouldValidate: false },
                              );
                            },
                          })}
                          className="h-8 text-center text-sm px-2"
                          aria-label={`${type?.name} full mark`}
                        />
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-1.5">
                          —
                        </div>
                      )}

                      {/* Pass mark — read-only, derived from fullMark */}
                      <div className="text-center text-sm rounded-lg border bg-muted/50 px-2 py-1.5 text-muted-foreground">
                        {isOn ? passMark : "—"}
                      </div>

                      <label className="relative inline-flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isOn}
                          onChange={() => toggleType(i)}
                          aria-label={`Enable ${type?.name}`}
                        />
                        <span
                          className={`relative w-9 h-5 rounded-full transition-colors ${
                            isOn ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                              isOn ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t  flex flex-row items-center justify-between sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {enabledCount}
                </span>{" "}
                of {fields.length} types enabled
              </p>
              <div className="flex items-center gap-2">
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </DialogClose>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting && <Spinner />} Save marks
                </Button>
              </div>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
