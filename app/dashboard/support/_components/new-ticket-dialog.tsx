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
  CATEGORY_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "../_schema/ticket.zod";
import { createTicket } from "../_actions/ticket.action";

type Attachment = { url: string; name: string; mime?: string; size?: number };

const MAX_FILES = 3;

/**
 * New ticket dialog. Attachments are screenshots: the file goes to Cloudinary
 * through the existing signed route and only the URL is stored on the ticket.
 */
export function NewTicketDialog({
  canPickScope = false,
  redirectBase = "/dashboard/support",
}: {
  canPickScope?: boolean;
  redirectBase?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("OTHER");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [scope, setScope] = useState<"INSTITUTE" | "PLATFORM">("INSTITUTE");
  const [files, setFiles] = useState<Attachment[]>([]);

  const reset = () => {
    setSubject("");
    setDescription("");
    setCategory("OTHER");
    setPriority("MEDIUM");
    setScope("INSTITUTE");
    setFiles([]);
  };

  const uploadFile = async (file: File) => {
    if (files.length >= MAX_FILES) {
      toast.error(`Up to ${MAX_FILES} attachments`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Attachments are screenshots (images) for now");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "support");

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body,
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

  const submit = async () => {
    if (subject.trim().length < 4) {
      toast.error("Give the ticket a subject");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Describe the problem in a sentence or two");
      return;
    }

    setBusy(true);
    const result = await createTicket({
      subject,
      description,
      category,
      priority,
      scope: canPickScope ? scope : "INSTITUTE",
      attachments: files,
    });
    setBusy(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not create the ticket");
      return;
    }

    toast.success("Ticket created");
    reset();
    setOpen(false);
    router.push(`${redirectBase}/${result.data.id}`);
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
          New ticket
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>
            {canPickScope
              ? "Raise it with your institute, or send it to the platform team."
              : "Your institute sees this ticket and replies on it."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Subject</label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={140}
              placeholder="e.g. Class 9 result shows the wrong GPA"
              className={field}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              What happened?
            </label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={4000}
              rows={4}
              placeholder="What you expected, what you saw, and what you already tried."
              className="resize-y text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Category
              </label>
              <select
                className={field}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {TICKET_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {CATEGORY_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Priority
              </label>
              <select
                className={field}
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                {TICKET_PRIORITIES.map((option) => (
                  <option key={option} value={option}>
                    {option.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {canPickScope && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Send to
              </label>
              <select
                className={field}
                value={scope}
                onChange={(event) =>
                  setScope(event.target.value as "INSTITUTE" | "PLATFORM")
                }
              >
                <option value="INSTITUTE">My institute</option>
                <option value="PLATFORM">Platform team (superadmin)</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Attachments
              </label>
              <span className="text-[11px] text-muted-foreground">
                {files.length}/{MAX_FILES} · screenshots
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
                Add screenshot
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

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={submit} disabled={busy || uploading}>
            {busy && <SpinnerGap className="animate-spin" />}
            Create ticket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
