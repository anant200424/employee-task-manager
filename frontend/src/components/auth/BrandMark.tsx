interface BrandMarkProps {
  variant?: "light" | "dark";
}

export const BrandMark = ({ variant = "dark" }: BrandMarkProps) => {
  const isLight = variant === "light";

  return (
    <div className="flex items-center gap-2.5">
      {/* EmpSphere Two Circles Logo Mark */}
      <div className="relative flex items-center shrink-0">
        <div
          className={`w-6 h-6 rounded-full ${isLight ? "bg-white" : "bg-[#1E293B] dark:bg-indigo-500"}`}
        />
        <div
          className={`w-6 h-6 rounded-full -ml-2.5 ${isLight ? "bg-[#60A5FA]" : "bg-[#4355CC] dark:bg-indigo-300"} opacity-90 mix-blend-multiply`}
        />
      </div>

      {/* Brand Name */}
      <div className="flex flex-col">
        <span
          className={`text-[19px] font-bold tracking-tight leading-none ${
            isLight ? "text-white" : "text-[#0F172A] dark:text-white"
          }`}
        >
          EmpSphere
        </span>
        <span
          className={`text-[9.5px] font-semibold uppercase tracking-[0.14em] mt-0.5 ${
            isLight ? "text-blue-200" : "text-slate-400"
          }`}
        >
          Task Management
        </span>
      </div>
    </div>
  );
};
