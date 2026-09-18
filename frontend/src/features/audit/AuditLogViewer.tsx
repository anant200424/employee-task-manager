"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { auditApi } from "@/lib/api";
import { AuditLogItem, AuditLogPagination } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { isAdminUser } from "@/lib/roleUtils";
import { toast } from "react-hot-toast";

export const AuditLogViewer = () => {
  const { user, isLoading: authLoading } = useAuth();
  const isAuthorizedAdmin = isAdminUser(user);

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<AuditLogPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Filter States
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(
    async (page = 1) => {
      if (!isAuthorizedAdmin) return;
      try {
        setLoading(true);
        const params: Record<string, any> = { page, limit: 20 };
        if (search.trim()) params.search = search.trim();
        if (actionFilter !== "all") params.action = actionFilter;
        if (resourceFilter !== "all") params.resourceType = resourceFilter;

        const data = await auditApi.getAuditLogs(params);
        if (data) {
          setLogs(data.logs || []);
          if (data.pagination) setPagination(data.pagination);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load audit events.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthorizedAdmin, search, actionFilter, resourceFilter]
  );

  useEffect(() => {
    if (!authLoading && isAuthorizedAdmin) {
      fetchLogs(1);
      auditApi
        .getAuditActions()
        .then((actions) => setAvailableActions(actions || []))
        .catch(() => {});
    }
  }, [authLoading, isAuthorizedAdmin, fetchLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs(pagination.page);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("FAILED") || action.includes("DEACTIVATED") || action.includes("BLOCKED")) {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60";
    }
    if (action.includes("SUCCESS") || action.includes("RESTORED") || action.includes("UNBLOCKED")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60";
    }
    if (action.includes("CREATED") || action.includes("REGISTERED")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/60";
    }
    if (action.includes("STATUS") || action.includes("UPDATED")) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60";
    }
    return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800";
  };

  if (!authLoading && user && !isAuthorizedAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F4F6FA] dark:bg-[#0B0F17]">
        <Topbar title="Security & Audit Trail" />
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex items-center justify-center max-w-xl mx-auto w-full">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Access Restricted
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Enterprise Audit Logs and compliance event ledgers are strictly restricted to authorized Administrators. If you believe this is an error, please reach out to your security administrator.
            </p>
            <div className="pt-2">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4d51db] text-white text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6FA] dark:bg-[#0B0F17]">
      <Topbar title="Security & Audit Trail" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header summary banner */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-[#5B5FEF]">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Enterprise Audit Logs
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Immutable security and compliance event ledger tracking administrative operations, task lifecycle, and authentication events.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Refresh logs"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#5B5FEF]" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Search audit ledger by action, actor, or resource ID"
              placeholder="Search by action, actor, or resource ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter audit logs by action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Actions</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter audit logs by resource type"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Resources</option>
              <option value="task">Tasks</option>
              <option value="user">Users</option>
              <option value="auth">Authentication</option>
              <option value="security">Security</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">IP / Client</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#5B5FEF] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Loading audit ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          No audit events recorded
                        </span>
                        <span className="text-xs">
                          Events will automatically populate as administrative and task operations occur.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="capitalize font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                            {log.resourceType}
                          </span>
                          {log.resourceId && (
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                              {log.resourceId.slice(-6)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {log.actorName || "System"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {log.actorEmail || log.actorRole}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10.5px] text-slate-400">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#5B5FEF] bg-[#5B5FEF]/10 hover:bg-[#5B5FEF]/20 transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Showing {logs.length} of {pagination.total} audit events
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${getActionBadgeColor(
                    selectedLog.action
                  )}`}
                >
                  {selectedLog.action}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Actor</span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {selectedLog.actorName} ({selectedLog.actorRole})
                  </span>
                  <span className="block text-slate-400 text-[10px]">{selectedLog.actorEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Resource</span>
                  <span className="font-semibold text-slate-800 dark:text-white capitalize">
                    {selectedLog.resourceType}
                  </span>
                  <span className="block text-slate-400 text-[10px] font-mono">
                    ID: {selectedLog.resourceId || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">
                  Metadata & Event Diff
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                IP: {selectedLog.ipAddress || "N/A"} | UA: {selectedLog.userAgent?.slice(0, 50)}...
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
