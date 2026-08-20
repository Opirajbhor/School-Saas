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
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangleIcon, Trash } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

interface StatusModalProps {
  id: string;
  title?: string;
  description?: string;
  trigger?: ReactNode;
  onStatus: (id: string) => Promise<unknown>;
  onSuccess?: (result?: unknown) => void;
  onError?: (error: unknown) => void;
  successMessage?: string;
  errorMessage?: string;
  variant?: "destructive" | "default" | "outline";
  buttonText?: string;
  loadingText?: string;
  className?: string;
}

export default function StatusModal({
  id,
  title = "Change Item Status ",
  description = "Are you sure you want to Change Status?",
  trigger,
  onStatus,
  onSuccess,
  onError,
  successMessage = "Status Changed Successfully",
  errorMessage = "Error Changing",
  variant = "destructive",
  buttonText = "",
  loadingText = "Changing...",
  className = "",
}: StatusModalProps) {
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState(false);

  const handleStatus = async () => {
    setLoad(true);
    try {
      const result = await onStatus(id);
      toast.success(successMessage);
      onSuccess?.(result);
    } catch (error) {
      toast.error(errorMessage);
      onError?.(error);
      console.error(error);
    } finally {
      setOpen(false);
      setLoad(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className={`${className}`} variant={variant}>
            <Trash className="h-4 w-4" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={`sm:max-w-lg `}>
        <div className="flex items-start space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={load} onClick={handleStatus} variant={variant}>
            {load && <Spinner />} {load ? loadingText : buttonText || "Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
