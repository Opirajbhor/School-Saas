"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ImageSquare,
  SpinnerGap,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";

/**
 * Handle the parent form calls on submit, so a picked photo only reaches
 * Cloudinary when the record is actually being saved.
 */
export type ImageUploadHandle = {
  /** uploads the staged file and returns its URL, or null when nothing is staged */
  upload: () => Promise<string | null>;
  hasPending: () => boolean;
};

/** Downscale before upload: a phone photo is 3-5 MB, a card thumbnail needs ~80 KB. */
async function shrink(file: File, max = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.85);
  });
}

/**
 * Photo picker backed by Cloudinary.
 *
 * Choosing a file only stages it and shows a local preview. The form calls
 * `handleRef.current.upload()` from its submit handler; only then is the file
 * posted to /api/cloudinary/upload, which signs the request server-side.
 */
export function ImageUpload({
  value,
  onChange,
  folder,
  label = "Photo",
  size = "size-24",
  className,
  register,
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  size?: string;
  className?: string;
  /** parent keeps the handle in state and calls upload() on submit */
  register?: (handle: ImageUploadHandle | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // revoke the object URL so a long session does not leak blobs
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const stage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPending(file);
    setPreview(URL.createObjectURL(file));
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPending(null);
    setPreview("");
    onChange("");
  };

  const upload = useCallback(async (): Promise<string | null> => {
    if (!pending) return null;

    setBusy(true);
    try {
      const body = new FormData();
      body.append(
        "file",
        await shrink(pending),
        pending.name.replace(/\.\w+$/, "") + ".jpg",
      );
      body.append("folder", folder);

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        toast.error(data.error ?? "Photo upload failed");
        return null;
      }

      onChange(data.url);
      if (preview) URL.revokeObjectURL(preview);
      setPending(null);
      setPreview("");
      return data.url;
    } catch {
      toast.error("Photo upload failed");
      return null;
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [pending, folder, onChange, preview]);

  // hand the upload back to the form so it can run on submit.
  //
  // The handle must be registered exactly once: `upload` changes identity
  // whenever the parent re-renders (it closes over `onChange`, which is usually
  // an inline arrow), and registering on every change made the parent setState
  // -> re-render -> new `upload` -> cleanup registers null -> setState … an
  // infinite render loop as soon as two uploaders shared a form.
  const uploadRef = useRef(upload);
  const pendingRef = useRef(pending);

  useEffect(() => {
    uploadRef.current = upload;
    pendingRef.current = pending;
  }, [upload, pending]);

  useEffect(() => {
    if (!register) return;
    register({
      upload: () => uploadRef.current(),
      hasPending: () => Boolean(pendingRef.current),
    });
    return () => register(null);
  }, [register]);

  const shown = preview || value || "";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Avatar className={cn(size, "border bg-muted")}>
        {shown ? <AvatarImage src={shown} alt={label} /> : null}
        <AvatarFallback className="bg-muted text-muted-foreground">
          <ImageSquare className="size-6" />
        </AvatarFallback>
      </Avatar>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) stage(file);
        }}
      />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <SpinnerGap className="animate-spin" /> : <UploadSimple />}
          {shown ? "Change" : "Choose"}
        </Button>

        {shown && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={clear}
            aria-label="Remove photo"
          >
            <Trash />
          </Button>
        )}
      </div>

      <p className="max-w-[9rem] text-center text-[11px] leading-tight text-muted-foreground">
        {pending ? "Uploads when you save" : "JPG or PNG · resized to 800px"}
      </p>
    </div>
  );
}
