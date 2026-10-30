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
import { ShieldOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { demoteToUser } from "../_actions/superadmin.action";

// DeleteModal only inspects thrown errors, but these actions report failure in
// the returned result, so a rejected demotion would still toast as success.
// This checks the result instead.
export default function DemoteButton({
  id,
  email,
}: {
  id: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState(false);
  const queryClient = useQueryClient();

  const handleDemote = async () => {
    setLoad(true);
    try {
      const res = await demoteToUser(id);
      if (!res.success) {
        toast.error(res.error ?? "Failed to demote superadmin");
        return;
      }
      toast.success("Superadmin access removed");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["superadmins"] });
    } catch (error) {
      console.error(error);
      toast.error("Failed to demote superadmin");
    } finally {
      setLoad(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <ShieldOff className="h-4 w-4" />
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Remove superadmin access?</DialogTitle>
          <DialogDescription>
            {email} will lose access to the super-admin panel and become a
            regular user. Their account and data are kept.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={load} onClick={handleDemote} variant="destructive">
            {load && <Spinner />} {load ? "Removing..." : "Remove access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
