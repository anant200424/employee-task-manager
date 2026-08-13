import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface AlertProps {
  variant?: "error" | "success" | "info";
  message: string;
}

const config = {
  error: {
    icon: AlertTriangle,
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  success: {
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  info: {
    icon: Info,
    classes: "bg-brand-50 text-brand-700 border-brand-100",
  },
};

export const Alert = ({ variant = "error", message }: AlertProps) => {
  const { icon: Icon, classes } = config[variant];
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium ${classes}`} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};
