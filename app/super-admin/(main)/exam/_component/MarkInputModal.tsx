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
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FormProvider,
  useForm,
  useWatch,
  useFieldArray,
} from "react-hook-form";
import {
  defaultMarkZod,
  InputDefaultMarkType,
  OutputDefaultMarkTypes,
} from "../_schema/markInput.zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDefaultMarkTypes } from "../_actions/exam.action";
import { OutputExamMarkTypes } from "../_schema/exam.zod";
import { postDefultSubjectMark } from "../_actions/defaultMark.action";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { useRouter } from "next/navigation";

export default function MarkInputModal({
  item,
}: {
  item: OutputDefaultMarkTypes;
}) {
  const [open, setOpen] = useState(false);
  // keyed by markTypeId so the toggles survive a form repopulate
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const populated = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: markTypes = [] } = useQuery<OutputExamMarkTypes[]>({
    queryKey: ["marktypes"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const result = await getDefaultMarkTypes();
      if (!result.success) throw new Error(result.error);
      return result.data as OutputExamMarkTypes[];
    },
  });

  const form = useForm<InputDefaultMarkType>({
    resolver: zodResolver(defaultMarkZod),
    defaultValues: {
      subjectId: item.id,
      subjectName: item.name,
      marks: [],
      status: "ACTIVE",
    },
  });

  const { fields } = useFieldArray({ control: form.control, name: "marks" });
  const fullMarks = useWatch({ control: form.control, name: "marks" });
  const { isSubmitting } = form.formState;

  // Seed the form with every default mark type, pre-filling the ones the
  // subject already saved (so the modal shows the current config).
  const populateForm = useCallback(() => {
    const savedTemplates = new Map<
      string,
      OutputDefaultMarkTypes["markTemplates"][number]
    >(item.markTemplates.map((template) => [template.markType.id, template]));

    form.reset({
      subjectId: item.id,
      subjectName: item.name,
      status: "ACTIVE",
      marks: markTypes.map((type) => {
        const saved = savedTemplates.get(type.id);
        return {
          markTypeId: type.id,
          fullMark: saved?.fullMark ?? 0,
          passMark: saved?.passMark ?? 0,
        };
      }),
    });

    setEnabled(
      Object.fromEntries(
        markTypes.map((type) => [type.id, savedTemplates.has(type.id)]),
      ),
    );
  }, [form, item, markTypes]);

  // runs once per open — mark types may still be loading when the dialog opens
  useEffect(() => {
    if (!open || markTypes.length === 0 || populated.current) return;
    populated.current = true;
    populateForm();
  }, [open, markTypes, populateForm]);

  const handleOpenChange = (value: boolean) => {
    // force a fresh population on every open
    populated.current = false;
    setOpen(value);
  };

  const toggleType = (markTypeId: string, index: number) => {
    const isNextOn = !enabled[markTypeId];

    if (!isNextOn) {
      // clear values when toggled off
      form.setValue(`marks.${index}.fullMark`, 0, { shouldValidate: false });
      form.setValue(`marks.${index}.passMark`, 0, { shouldValidate: false });
    }

    setEnabled((prev) => ({ ...prev, [markTypeId]: isNextOn }));
  };

  const assignBtn = async (data: InputDefaultMarkType) => {
    // only the enabled mark types with a full mark are persisted (DB columns
    // are integers, so both marks are rounded)
    const cleaned: InputDefaultMarkType = {
      ...data,
      marks: data.marks
        .filter((mark) => enabled[mark.markTypeId] && Number(mark.fullMark) > 0)
        .map((mark) => {
          const fullMark = Math.round(Number(mark.fullMark));
          return {
            markTypeId: mark.markTypeId,
            fullMark,
            passMark: Math.round(fullMark * 0.33),
          };
        }),
    };

    await handleCrudAction(postDefultSubjectMark, cleaned, {
      successMessage: `${item.name} mark config saved`,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["marktypes"] });
        setOpen(false);
        router.refresh();
      },
    });
  };

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <form onSubmit={form.handleSubmit(assignBtn)}>
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
                  const mark = fullMarks?.[i];
                  const markTypeId = mark?.markTypeId ?? field.markTypeId;
                  const type = markTypes.find((t) => t.id === markTypeId);
                  const isOn = !!enabled[markTypeId];
                  const fullMark = Number(mark?.fullMark ?? 0) || 0;
                  const passMark = Math.round(fullMark * 0.33);
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
                          step={1}
                          inputMode="numeric"
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
                          onChange={() => toggleType(markTypeId, i)}
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
                {enabledCount === 0 ? (
                  <span className="text-destructive">
                    Enable at least one mark type
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">
                      {enabledCount}
                    </span>{" "}
                    of {fields.length} types enabled
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  disabled={isSubmitting || enabledCount === 0}
                  type="submit"
                  className="cursor-pointer"
                >
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
