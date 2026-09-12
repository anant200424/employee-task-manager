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

function escapeXML(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
 * Exports tasks list to Microsoft Excel (.xls) spreadsheet with styled headers and table structure.
 */
export function exportTasksToExcel(tasks: Task[], filenamePrefix = "EmpSphere_Tasks") {
  if (!tasks || tasks.length === 0) {
    toast.error("No tasks available to export");
    return;
  }

  const tableRows = tasks
    .map((t) => {
      const assignees = (t.assignedTo || [])
        .map((a) => (typeof a === "object" ? `${a.firstName} ${a.lastName || ""}`.trim() : a))
        .join("; ");
      const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-GB") : "No Deadline";
      const createdDate = t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-GB") : "";

      return `<tr>
        <td style="font-family:monospace;font-weight:bold;">${escapeXML(t.taskCode || "TSK")}</td>
        <td><b>${escapeXML(t.title)}</b></td>
        <td>${escapeXML(t.description || "")}</td>
        <td>${escapeXML(t.department || "General")}</td>
        <td style="text-align:center;">${escapeXML(t.priority?.toUpperCase() || "MEDIUM")}</td>
        <td style="text-align:center;">${escapeXML(t.status?.toUpperCase().replace("_", " ") || "TODO")}</td>
        <td>${escapeXML(dueDate)}</td>
        <td>${escapeXML(assignees || "Unassigned")}</td>
        <td>${escapeXML(createdDate)}</td>
      </tr>`;
    })
    .join("");

  const excelContent = `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Tasks</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <style>
        th { background-color: #0052CC; color: #ffffff; font-weight: bold; padding: 8px 12px; border: 1px solid #cbd5e1; }
        td { padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 12px; vertical-align: top; }
        tr:nth-child(even) { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <th>Task Code</th>
            <th>Title</th>
            <th>Description</th>
            <th>Department</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Assigned Employees</th>
            <th>Created Date</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
  </html>`;

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_${dateStr}.xls`;

  downloadFile(excelContent, filename, "application/vnd.ms-excel;charset=utf-8;");
  toast.success(`Exported ${tasks.length} tasks to Excel!`);
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
 * Exports employees directory to CSV with complete columns and UTF-8 BOM.
 */
export function exportEmployeesToCSV(employees: any[], filenamePrefix = "EmpSphere_Employees") {
  if (!employees || employees.length === 0) {
    toast.error("No employee records to export");
    return;
  }

  const headers = [
    "Employee ID",
    "Full Name",
    "Role / Designation",
    "Department",
    "Email Address",
    "Phone Number",
    "Account Status",
    "Joined Date",
  ];

  const rows = employees.map((e) => {
    const joined = e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-GB") : "";
    return [
      escapeCSV(e.employeeId || "EMP"),
      escapeCSV(e.name || `${e.firstName || ""} ${e.lastName || ""}`.trim()),
      escapeCSV(e.role || "Team Member"),
      escapeCSV(e.department || "Engineering"),
      escapeCSV(e.email || ""),
      escapeCSV(e.phone || ""),
      escapeCSV(e.status || (e.isBlocked ? "Blocked" : "Active")),
      escapeCSV(joined),
    ];
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
  toast.success(`Exported ${employees.length} employee records to CSV!`);
}

/**
 * Exports employees directory to formatted Microsoft Excel (.xls) spreadsheet.
 */
export function exportEmployeesToExcel(employees: any[], filenamePrefix = "EmpSphere_Employees") {
  if (!employees || employees.length === 0) {
    toast.error("No employee records to export");
    return;
  }

  const tableRows = employees
    .map((e) => {
      const joined = e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-GB") : "";
      const status = e.status || (e.isBlocked ? "Blocked" : "Active");
      const statusColor = status.toLowerCase() === "active" ? "#10B981" : "#EF4444";

      return `<tr>
        <td style="font-family:monospace;font-weight:bold;color:#4F46E5;">${escapeXML(e.employeeId || "EMP")}</td>
        <td><b>${escapeXML(e.name || `${e.firstName || ""} ${e.lastName || ""}`.trim())}</b></td>
        <td>${escapeXML(e.role || "Team Member")}</td>
        <td>${escapeXML(e.department || "Engineering")}</td>
        <td>${escapeXML(e.email || "")}</td>
        <td>${escapeXML(e.phone || "")}</td>
        <td style="text-align:center;font-weight:bold;color:${statusColor};">${escapeXML(status)}</td>
        <td>${escapeXML(joined)}</td>
      </tr>`;
    })
    .join("");

  const excelContent = `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Employees</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <style>
        th { background-color: #4F46E5; color: #ffffff; font-weight: bold; padding: 10px 14px; border: 1px solid #cbd5e1; font-size: 13px; }
        td { padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 12px; vertical-align: middle; }
        tr:nth-child(even) { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Full Name</th>
            <th>Role</th>
            <th>Department</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Joined Date</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
  </html>`;

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_${dateStr}.xls`;

  downloadFile(excelContent, filename, "application/vnd.ms-excel;charset=utf-8;");
  toast.success(`Exported ${employees.length} employee records to Excel!`);
}

/**
 * Exports employees directory to formatted JSON file.
 */
export function exportEmployeesToJSON(employees: any[], filenamePrefix = "EmpSphere_Employees") {
  if (!employees || employees.length === 0) {
    toast.error("No employee records to export");
    return;
  }

  const jsonContent = JSON.stringify(employees, null, 2);
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_${dateStr}.json`;

  downloadFile(jsonContent, filename, "application/json");
  toast.success(`Exported ${employees.length} employee records to JSON!`);
}

/**
 * Opens a print dialog formatted for saving employee directory as PDF or printing.
 */
export function printEmployeesReport(employees: any[], reportTitle = "Employee Directory Summary Report") {
  if (!employees || employees.length === 0) {
    toast.error("No employee records to print");
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

  const tableRows = employees
    .map((e) => {
      const joined = e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-GB") : "N/A";
      const status = e.status || (e.isBlocked ? "Blocked" : "Active");
      const isBlocked = status.toLowerCase() === "blocked";

      return `
        <tr>
          <td style="font-family: monospace; font-weight: bold; color: #4F46E5;">${e.employeeId || "EMP"}</td>
          <td><strong>${e.name || `${e.firstName || ""} ${e.lastName || ""}`.trim()}</strong></td>
          <td>${e.role || "Team Member"}</td>
          <td>${e.department || "Engineering"}</td>
          <td>${e.email || "—"}</td>
          <td>${e.phone || "—"}</td>
          <td><span class="badge ${isBlocked ? "status-blocked" : "status-active"}">${status}</span></td>
          <td>${joined}</td>
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
          td { padding: 10px 12px; border-bottom: 1px solid #E2E8F0; vertical-align: middle; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; }
          .status-active { background: #DCFCE7; color: #166534; }
          .status-blocked { background: #FEE2E2; color: #991B1B; }
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
            <div>Total Staff: ${employees.length}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Dept</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined Date</th>
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
