import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-extrabold text-[#4355CC]">404</h1>
      <h2 className="mt-3 text-2xl font-bold text-slate-800">Page Not Found</h2>
      <p className="mt-2 text-slate-500 max-w-md text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/login"
        className="mt-6 rounded-xl bg-[#4355CC] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#3644A8] transition-all shadow-sm"
      >
        Return to Login
      </Link>
    </main>
  );
}
