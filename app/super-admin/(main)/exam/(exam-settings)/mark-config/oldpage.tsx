"use client";
import { SpinnerCustom } from "@/components/Spinner";
import { OutputExamType } from "@/app/dashboard/exam/_schema/exam.zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getClassSubjectWithExamType,
  getDefaultExams,
} from "../../_actions/exam.action";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchData } from "@/src/tanstackQuery/queryReturnDataFn";
import {
  examClassSearchType,
  examClassSearchZod,
} from "../../_schema/exam.zod";
import { ExamConfigTable } from "../../_table/exam-mark-config-column";
import {
  ExamConfigFormValues,
  examConfigZod,
} from "../../_schema/markInput.zod";

export default function Page() {
  // ------------- query fn ---------------
  const { data: examClasses, isPending } = useQuery<OutputExamType[]>({
    queryKey: ["page-exam", "examAssign"],
    queryFn: async () => {
      const result = await getDefaultExams();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as OutputExamType[];
    },
  });
  // ------------------form------------
  const form = useForm({
    resolver: zodResolver(examClassSearchZod),
    defaultValues: {
      classId: "",
      examId: "",
    },
  });
  const { isSubmitting } = form.formState;

  // ----------form Effect------------

  const selectedExam = useWatch({
    control: form.control,
    name: "examId",
  });
  // -----for selected sections------------
  const selectedExamData = examClasses?.find(
    (item) => item.id === selectedExam,
  );

  //   ---------handle button------------
  const addBtn = async (data: examClassSearchType) => {
    searchFn(data);
  };

  const { mutate: searchFn, data: classSubjects } = useMutation({
    mutationFn: (data: examClassSearchType) =>
      fetchData(() => getClassSubjectWithExamType(data)),
    onSuccess: (result) => {
      //   queryClient.setQueryData(["class-subjects", selectedId], result);
    },
  });

  // ================== mark input ===================
  const markInputForm = useForm<ExamConfigFormValues>({
    resolver: zodResolver(examConfigZod),
    defaultValues: {
      subjects: classSubjects?.map((subject) => ({
        subjectId: subject.subjectId,
        marks: Object.fromEntries(
          subject.markTypes
            .filter((type) => type.status === "ACTIVE")
            .map((type) => [
              type.id,
              {
                isEnabled: true,
                fullMark: null,
                passMark: null,
              },
            ]),
        ),
      })),
    },
  });

  const onSubmit = (values: ExamConfigFormValues) => {
  };

  if (isPending) {
    return <SpinnerCustom />;
  }

  return (
    <div>
      <div>
        <h1 className="text-center m-5">Exam Management</h1>
        <div>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(addBtn)}>
              {/* Academic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Exam and Class Information</CardTitle>
                </CardHeader>

                <CardContent className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {/*------------exam----------- */}

                  <FormSelect
                    control={form.control}
                    name="examId"
                    label="Exam"
                    options={
                      examClasses?.map((item) => ({
                        label: item.name,
                        value: item.id,
                      })) ?? []
                    }
                  />
                  {/*------------Class list----------- */}

                  <FormSelect
                    control={form.control}
                    name="classId"
                    label="Class"
                    options={
                      selectedExamData?.assignClasses?.map((item) => ({
                        label: item?.class.name,
                        value: item?.class.id,
                      })) ?? []
                    }
                  />

                  {/* {submit} */}
                  <div className="flex justify-end gap-3">
                    <Button disabled={isSubmitting} type="submit">
                      {isSubmitting && <Spinner />}
                      Search
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </FormProvider>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Data Table Section */}
          <FormProvider {...markInputForm}>
            <form
              onSubmit={markInputForm.handleSubmit(
                (data) => console.log("Valid data:", data),
                (errors) => console.log("Validation errors:", errors),
              )}
            >
              {classSubjects && <ExamConfigTable rows={classSubjects} />}

              <Button type="submit">Save Configuration</Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
