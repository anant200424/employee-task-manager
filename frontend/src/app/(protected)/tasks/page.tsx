import { TasksContent } from "@/features/tasks/TasksContent";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tasks | EmpSphere",
  description: "Manage and track your tasks.",
};

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading tasks workspace...</div>}>
      <TasksContent />
    </Suspense>
  );
}

