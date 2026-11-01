import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Warning as TriangleAlertIcon } from "@phosphor-icons/react/ssr";


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
