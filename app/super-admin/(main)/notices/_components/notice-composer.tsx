"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageSquare, Plus, SpinnerGap, X } from "@phosphor-icons/react/ssr";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  NOTICE_PRIORITIES,
  PRIORITY_LABELS,
} from "../_schema/notice.zod";
import { createNotice } from "../_actions/notice.action";

type Attachment = { url: string; name: string; mime?: string | null; size?: number | null };

const MAX_FILES = 5;

/** Compose a notice: scheduled publishing, audience picker, pin and expiry. */
export function NoticeComposer({
  institutes,
}: {
  institutes: { id: string; name: string; district: string }[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [audience, setAudience] = useState<"ALL" | "SELECTED">("ALL");
  const [instituteIds, setInstituteIds] = useState<string[]>([]);
  const [publishAt, setPublishAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  // Date.now() is impure, so the scheduled flag is derived in the handler and
  // stored, rather than called on every render
  const [scheduled, setScheduled] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [files, setFiles] = useState<Attachment[]>([]);

  const reset = () => {
    setTitle("");
    setBody("");
    setPriority("NORMAL");
    setAudience("ALL");
    setInstituteIds([]);
    setExpiresAt("");
    setPinned(false);
    setFiles([]);
  };

  const uploadFile = async (file: File) => {
    if (files.length >= MAX_FILES) {
      toast.error(`Up to ${MAX_FILES} attachments`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Attachments are images for now");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "notices");

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        toast.error(data.error ?? "Upload failed");
        return;
      }
      setFiles((current) => [
        ...current,
        { url: data.url!, name: file.name, mime: file.type, size: file.size },
      ]);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const insert = (snippet: string) => {
    setBody((current) => `${current}${current.endsWith("\n") || current === "" ? "" : "\n"}${snippet}`);
  };

  const submit = async () => {
    if (title.trim().length < 4) {
      toast.error("Give the notice a title");
      return;
    }
    if (body.trim().length < 10) {
      toast.error("Write the notice body");
      return;
    }
    if (audience === "SELECTED" && instituteIds.length === 0) {
      toast.error("Pick at least one institute");
      return;
    }

    setBusy(true);
    const result = await createNotice({
      title,
      body,
      priority: priority as "NORMAL" | "IMPORTANT" | "URGENT",
      audience,
      instituteIds,
      publishAt: new Date(publishAt).toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      pinned,
      attachments: files,
    });
    setBusy(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not create the notice");
      return;
    }

    toast.success(
      result.data.scheduled
        ? "Notice scheduled — it publishes on its date"
        : "Notice published",
    );
    reset();
    setOpen(false);
    router.refresh();
  };

  const field =
    "h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus-visible:border-ring";

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          New notice
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New notice</DialogTitle>
          <DialogDescription>
            Sends to every institute or a chosen few. A future publish date
            schedules it; an expiry date archives it automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={140}
              placeholder="e.g. Annual exam marks entry closes on 30 November"
              className={field}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Body</label>
              <div className="flex items-center gap-1">
                {[
                  { label: "B", insert: "**bold**", className: "font-semibold" },
                  { label: "I", insert: "*italic*", className: "italic" },
                  { label: "H", insert: "## Heading", className: "" },
                  { label: "•", insert: "- bullet", className: "" },
                ].map((tool) => (
                  <button
                    key={tool.label}
                    type="button"
                    onClick={() => insert(tool.insert)}
                    className={`h-6 w-6 rounded border text-[11px] ${tool.className} hover:bg-muted`}
                    title={`Insert ${tool.insert}`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={7}
              maxLength={8000}
              placeholder={"Write the notice…\n\n**Bold**, *italic*, - bullets and ## headings are supported."}
              className="resize-y text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Priority
              </label>
              <select
                className={field}
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                {NOTICE_PRIORITIES.map((option) => (
                  <option key={option} value={option}>
                    {PRIORITY_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Audience
              </label>
              <select
                className={field}
                value={audience}
                onChange={(event) =>
                  setAudience(event.target.value as "ALL" | "SELECTED")
                }
              >
                <option value="ALL">All institutes</option>
                <option value="SELECTED">Selected institutes</option>
              </select>
            </div>
          </div>

          {audience === "SELECTED" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  Institutes
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setInstituteIds(
                      instituteIds.length === institutes.length
                        ? []
                        : institutes.map((i) => i.id),
                    )
                  }
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {instituteIds.length === institutes.length
                    ? "Clear"
                    : "Select all"}
                </button>
              </div>

              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-1.5">
                {institutes.length === 0 ? (
                  <p className="p-2 text-[11px] text-muted-foreground">
                    No institutes yet.
                  </p>
                ) : (
                  institutes.map((institute) => {
                    const checked = instituteIds.includes(institute.id);
                    return (
                      <label
                        key={institute.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/60"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setInstituteIds((current) =>
                              event.target.checked
                                ? [...current, institute.id]
                                : current.filter((id) => id !== institute.id),
                            )
                          }
                          className="size-3.5 accent-[var(--primary)]"
                        />
                        <span className="flex-1 truncate text-foreground">
                          {institute.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {institute.district}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Publish at
              </label>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(event) => {
                  setPublishAt(event.target.value);
                  setScheduled(
                    new Date(event.target.value).getTime() > Date.now(),
                  );
                }}
                className={field}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Expires (optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className={field}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
              className="size-3.5 accent-[var(--primary)]"
            />
            Pin to the top of the institute list
          </label>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Attachments
              </label>
              <span className="text-[11px] text-muted-foreground">
                {files.length}/{MAX_FILES}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {files.map((file) => (
                <span
                  key={file.url}
                  className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-1 text-[11px]"
                >
                  <ImageSquare className="size-3 text-muted-foreground" />
                  <span className="max-w-40 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((current) =>
                        current.filter((item) => item.url !== file.url),
                      )
                    }
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || files.length >= MAX_FILES}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <SpinnerGap className="animate-spin" />
                ) : (
                  <Plus className="size-3" />
                )}
                Add image
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadFile(file);
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
          <p className="text-[11px] text-muted-foreground">
            {scheduled
              ? "Scheduled — institutes see it on that date"
              : "Publishes immediately"}
          </p>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button size="sm" onClick={submit} disabled={busy || uploading}>
              {busy && <SpinnerGap className="animate-spin" />}
              {scheduled ? "Schedule notice" : "Publish notice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
