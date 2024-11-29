import { Alert, AlertDescription, AlertTitle } from "./alert"
import { cn } from "@/utils/ui"
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons"

export function Notification({ title, message, variant = "default", className, ...props }) {
  return (
    <Alert
      variant={variant}
      className={cn(
        "fixed top-4 right-4 w-96 transition-all duration-300 animate-in fade-in slide-in-from-top-2",
        className
      )}
      {...props}
    >
      {variant === "success" && (
        <CheckCircledIcon className="h-4 w-4 text-green-600" />
      )}
      {variant === "error" && (
        <CrossCircledIcon className="h-4 w-4 text-red-600" />
      )}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
