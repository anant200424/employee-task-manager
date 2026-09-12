/**
 * Global date formatting utilities supporting customizable dateFormat preferences.
 */

export type DateFormatOption = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";

export const getStoredDateFormat = (): DateFormatOption => {
  if (typeof window === "undefined") return "MM/DD/YYYY";
  try {
    const saved = localStorage.getItem("dateFormat");
    if (saved === "DD/MM/YYYY" || saved === "YYYY-MM-DD" || saved === "MM/DD/YYYY") {
      return saved as DateFormatOption;
    }
    const userStr = localStorage.getItem("nexus_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.regionalPreferences?.dateFormat) {
        return user.regionalPreferences.dateFormat as DateFormatOption;
      }
    }
  } catch {}
  return "MM/DD/YYYY";
};

export const formatAppDate = (
  dateInput: string | number | Date | null | undefined,
  customFormat?: DateFormatOption
): string => {
  if (!dateInput) return "—";
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  const format = customFormat || getStoredDateFormat();

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "MM/DD/YYYY":
    default:
      return `${month}/${day}/${year}`;
  }
};
