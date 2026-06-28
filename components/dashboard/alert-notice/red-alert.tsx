import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlertIcon } from "lucide-react";

const RedAlert = ({
  title = "Something is Wrong",
  description = "Something went wrong. Please try again o.",
}) => {
  return (
    <Alert className="bg-destructive/10 text-destructive border-none">
      <TriangleAlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="text-destructive/80">
        {description}
      </AlertDescription>
    </Alert>
  );
};

export default RedAlert;
