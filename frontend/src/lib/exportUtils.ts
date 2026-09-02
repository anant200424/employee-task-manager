import { Task } from "@/types/auth";
import { toast } from "react-hot-toast";

/**
 * Escapes CSV cell values safely (handles commas, quotes, newlines).
 */
function escapeCSV(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Triggers a browser download of text data as a file.
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports tasks list to CSV format with UTF-8 BOM for Excel compatibility.
 */
export function exportTasksToCSV(tasks: Task[], filenamePrefix = "EmpSphere_Tasks") {
  if (!tasks || tasks.length === 0) {
    toast.error("No tasks available to export");
    return;
  }

  const headers = [
    "Task Code",
    "Title",
    "Description",
    "Department",
    "Priority",
    "Status",
    "Due Date",
    "Assigned Employees",
    "Created Date",
  ];

  const rows = tasks.map((task) => {
    const assignees = (task.assignedTo || [])
      .map((a) => (typeof a === "object" ? `${a.firstName} ${a.lastName || ""}`.trim() : a))
      .join("; ");

    const formattedDueDate = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString("en-GB")
      : "No Deadline";

    const formattedCreatedDate = task.createdAt
      ? new Date(task.createdAt).toLocaleDateString("en-GB")
      : "";

    return [
      escapeCSV(task.taskCode || "TSK"),
      escapeCSV(task.title),
      escapeCSV(task.description || ""),
      escapeCSV(task.department || "General"),
      escapeCSV(task.priority?.toUpperCase() || "MEDIUM"),
      escapeCSV(task.status?.toUpperCase().replace("_", " ") || "TODO"),
      escapeCSV(formattedDueDate),
      escapeCSV(assignees || "Unassigned"),
      escapeCSV(formattedCreatedDate),
    ].join(",");
  });

  // UTF-8 BOM (\uFEFF) ensures Excel renders accented characters and special symbols accurately
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
  toast.success(`Exported ${tasks.length} tasks to CSV!`);
}

/**
 * Exports tasks list to formatted JSON file.
 */
export function exportTasksToJSON(tasks: Task[], filenamePrefix = "EmpSphere_Tasks") {
  if (!tasks || tasks.length === 0) {
    toast.error("No tasks available to export");
    return;
  }

  const jsonContent = JSON.stringify(tasks, null, 2);
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_${dateStr}.json`;

  downloadFile(jsonContent, filename, "application/json");
  toast.success(`Exported ${tasks.length} tasks to JSON!`);
}

/**
 * Opens a print dialog formatted for saving as PDF or printing physical report.
 */
export function printTasksReport(tasks: Task[], reportTitle = "Tasks Summary Report") {
  if (!tasks || tasks.length === 0) {
    toast.error("No tasks available to print");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Pop-up blocked. Please allow pop-ups to print reports.");
    return;
  }

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tableRows = tasks
    .map((t) => {
      const assignees = (t.assignedTo || [])
        .map((a) => (typeof a === "object" ? `${a.firstName} ${a.lastName || ""}`.trim() : a))
        .join(", ");
      const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-GB") : "N/A";
      const status = t.status?.replace("_", " ").toUpperCase();
      const priority = t.priority?.toUpperCase();

      return `
        <tr>
          <td style="font-family: monospace; font-weight: bold; color: #4F46E5;">${t.taskCode || "TSK"}</td>
          <td><strong>${t.title}</strong><br><span style="color:#64748B;font-size:11px;">${t.description || ""}</span></td>
          <td>${t.department || "General"}</td>
          <td><span class="badge priority-${t.priority}">${priority}</span></td>
          <td><span class="badge status-${t.status}">${status}</span></td>
          <td>${dueDate}</td>
          <td>${assignees || "Unassigned"}</td>
        </tr>
      `;
    })
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${reportTitle} - EmpSphere</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1E293B; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 20px; font-weight: 900; color: #4F46E5; letter-spacing: -0.5px; }
          .title { font-size: 18px; font-weight: 800; color: #0F172A; }
          .meta { font-size: 12px; color: #64748B; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { background: #F8FAFC; text-align: left; padding: 10px 12px; border-bottom: 2px solid #E2E8F0; font-size: 11px; text-transform: uppercase; color: #475569; }
          td { padding: 10px 12px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; }
          .priority-urgent { background: #FEE2E2; color: #991B1B; }
          .priority-high { background: #FFEDD5; color: #9A3412; }
          .priority-medium { background: #DBEAFE; color: #1E40AF; }
          .priority-low { background: #F1F5F9; color: #475569; }
          .status-completed { background: #DCFCE7; color: #166534; }
          .status-in_progress { background: #E0F2FE; color: #075985; }
          .status-review { background: #F3E8FF; color: #6B21A8; }
          .status-todo { background: #FEF3C7; color: #92400E; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">EmpSphere · Nexus</div>
            <div class="title">${reportTitle}</div>
          </div>
          <div class="meta">
            <div>Generated: ${dateStr}</div>
            <div>Total Tasks: ${tasks.length}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Task Code</th>
              <th>Task Details</th>
              <th>Dept</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Assignees</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Exports employees directory to CSV.
 */
export function exportEmployeesToCSV(employees: any[], filenamePrefix = "EmpSphere_Employees") {
  if (!employees || employees.length === 0) {
    toast.error("No employee records to export");
    return;
  }

  const headers = ["Employee Name", "Role", "Email", "Phone", "Status"];
  const rows = employees.map((e) => [
    escapeCSV(e.name),
    escapeCSV(e.role),
    escapeCSV(e.email),
    escapeCSV(e.phone),
    escapeCSV(e.status || "Active"),
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
  toast.success(`Exported ${employees.length} employees to CSV!`);
}
