"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  Megaphone,
  MessageSquare,
  Send,
  Loader2,
  Plus,
  FolderKanban,
} from "lucide-react";

interface MessageItem {
  _id: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: "announcement" | "discussion";
  createdAt: string;
}

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  owner: string;
  status: string;
}

const initialProjects: ProjectItem[] = [
  { id: "1", title: "EmpSphere Core Authentication Migration", description: "Securing routes with JWT, MFA, and OTP validation layers.", owner: "Anant Singh", status: "In Progress" },
  { id: "2", title: "Analytics Dashboard Refactor", description: "Transitioning charts from static mockup variables to dynamic Aggregation metrics.", owner: "Lokesh Kumar", status: "Completed" },
  { id: "3", title: "Staff Events & Calendar Integration", description: "Admins manage workspace meetings and schedules in a read-only employee calendar.", owner: "Dev Operations Lead", status: "Planning" }
];

export default function WorkspaceHubPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "Super Administrator" ||
    user?.role === "System Administrator" ||
    ["admin", "super_admin", "system_admin"].includes(user?.systemRole || "") ||
    Boolean(user?.role?.toLowerCase().includes("admin"));

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [newDiscussion, setNewDiscussion] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);
  const [isSubmittingDiscussion, setIsSubmittingDiscussion] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await api.get("/messages");
      if (res.data?.data?.messages) {
        setMessages(res.data.data.messages);
      }
    } catch (err) {
      console.error("Failed to load workspace messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    try {
      setIsSubmittingAnnouncement(true);
      const res = await api.post("/messages", {
        content: newAnnouncement.trim(),
        type: "announcement",
      });
      if (res.data?.data?.message) {
        setMessages((prev) => [res.data.data.message, ...prev]);
        setNewAnnouncement("");
        toast.success("Announcement broadcasted successfully");
      }
    } catch (err) {
      console.error("Failed to post announcement:", err);
      toast.error("Error posting announcement. Only admins are permitted.");
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  const handlePostDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussion.trim()) return;
    try {
      setIsSubmittingDiscussion(true);
      const res = await api.post("/messages", {
        content: newDiscussion.trim(),
        type: "discussion",
      });
      if (res.data?.data?.message) {
        setMessages((prev) => [res.data.data.message, ...prev]);
        setNewDiscussion("");
        toast.success("Message sent to team chat");
      }
    } catch (err) {
      console.error("Failed to post discussion message:", err);
      toast.error("Failed to send chat message");
    } finally {
      setIsSubmittingDiscussion(false);
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || !newProjectDesc.trim()) return;

    const newProject: ProjectItem = {
      id: Date.now().toString(),
      title: newProjectTitle.trim(),
      description: newProjectDesc.trim(),
      owner: user ? `${user.firstName} ${user.lastName}` : "Teammate",
      status: "Planning",
    };

    setProjects((prev) => [newProject, ...prev]);
    setNewProjectTitle("");
    setNewProjectDesc("");
    setShowAddProject(false);
    toast.success("New initiative added to project board");
  };

  const announcements = messages.filter((m) => m.type === "announcement");
  const discussions = messages.filter((m) => m.type === "discussion");

  return (
    <div className="min-h-screen bg-transparent pb-16 transition-colors duration-300">
      <Topbar
        title={t("workspace_hub", "Workspace Hub")}
        subtitle="Stay connected with announcements, team discussions, and initiatives."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B5FEF]" />
          <p className="text-[14px] font-semibold text-slate-500">Loading workspace feed...</p>
        </div>
      ) : (
        <main className="px-5 sm:px-7 lg:px-8 space-y-6 max-w-[1600px] mx-auto mt-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Announcements Board */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col h-[520px]">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-[#5B5FEF]">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white">Admin Announcements</h3>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Official broadcast updates from company management</p>
                </div>
              </div>

              {/* Add Announcement Form (Admins Only) */}
              {isAdmin && (
                <form onSubmit={handlePostAnnouncement} className="mb-4 flex gap-3">
                  <input
                    type="text"
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder="Broadcast an official notice..."
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-[13px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-[#5B5FEF] focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingAnnouncement}
                    className="bg-[#5B5FEF] hover:bg-[#4E52E2] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-md shadow-[#5B5FEF]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isSubmittingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                  </button>
                </form>
              )}

              {/* Announcements Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <Megaphone className="w-8 h-8 opacity-30" />
                    <p className="text-[13px] font-semibold">No announcements have been broadcasted yet.</p>
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann._id} className="bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl p-4 border border-indigo-100/60 dark:border-indigo-900/40 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-black text-[#5B5FEF]">{ann.senderName}</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{ann.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* General Workspace Chat */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col h-[520px]">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white">Workspace Chat</h3>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Team chat channel for developers and staff members</p>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 custom-scrollbar flex flex-col-reverse">
                {discussions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <MessageSquare className="w-8 h-8 opacity-30" />
                    <p className="text-[13px] font-semibold">Start the conversation! Type a message below.</p>
                  </div>
                ) : (
                  discussions.map((msg) => (
                    <div key={msg._id} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-slate-800 dark:text-white">{msg.senderName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase tracking-wide">{msg.senderRole}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handlePostDiscussion} className="flex gap-3">
                <input
                  type="text"
                  value={newDiscussion}
                  onChange={(e) => setNewDiscussion(e.target.value)}
                  placeholder="Ask a question or type a message..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-[13px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isSubmittingDiscussion}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSubmittingDiscussion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>

          </div>

          {/* Company Projects Board */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-amber-600">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white">Workspace Projects Board</h3>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Track company initiatives and coordinate team assignments</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddProject(!showAddProject)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all border border-slate-200/80 dark:border-slate-700 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>

            {/* Add Project Form Drawer */}
            {showAddProject && (
              <form onSubmit={handleAddProject} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 mb-6 space-y-4 animate-in slide-in-from-top duration-300">
                <h4 className="text-[14px] font-bold text-slate-900 dark:text-white">Propose New Workspace Initiative</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="Project Name (e.g. Attendance System v2)"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-[13px] font-medium text-slate-800 dark:text-white focus:border-[#5B5FEF] focus:outline-none transition-all"
                  />
                  <input
                    type="text"
                    required
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Summary of project objectives"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-[13px] font-medium text-slate-800 dark:text-white focus:border-[#5B5FEF] focus:outline-none transition-all"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddProject(false)} className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" className="bg-[#5B5FEF] hover:bg-[#4E52E2] text-white px-5 py-2 rounded-xl text-[12px] font-bold shadow-sm transition-all cursor-pointer active:scale-95">Submit Project</button>
                </div>
              </form>
            )}

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => {
                const statusColors = {
                  "Planning": "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/40",
                  "In Progress": "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
                  "Completed": "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
                }[proj.status] || "bg-slate-50 text-slate-600 border-slate-100";

                return (
                  <div key={proj.id} className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 hover:border-[#5B5FEF]/30 hover:shadow-sm transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors}`}>{proj.status}</span>
                        <span className="text-[11px] font-bold text-slate-400">Lead: {proj.owner}</span>
                      </div>
                      <h4 className="text-[15px] font-black text-slate-900 dark:text-white mb-1">{proj.title}</h4>
                      <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{proj.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </main>
      )}
    </div>
  );
}
