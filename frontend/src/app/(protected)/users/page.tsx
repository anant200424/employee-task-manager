"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Mail, Phone, MoreHorizontal, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface UserItem {
  id: number | string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      if (res.data?.data?.users) {
        const mappedUsers: UserItem[] = res.data.data.users.map((u: any) => ({
          id: u._id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Teammate",
          role: u.role || "Software Engineer",
          email: u.email || "",
          phone: `${u.dialCode || ""} ${u.phoneNumber || ""}`.trim() || "No phone",
          status: "Online",
        }));
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.error("Failed to load users directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    status: "Online"
  });

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      role: "",
      email: "",
      phone: "",
      status: "Online"
    });
    setShowAddModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      const newUser = { ...formData, id: Date.now() };
      setUsers(prev => [newUser, ...prev]);
      setIsSaving(false);
      setShowAddModal(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <Topbar
        title="Team Directory"
        subtitle="View and manage members of your organization."
      />

      <main className="px-5 sm:px-7 lg:px-8 space-y-6 max-w-[1600px] mx-auto mt-6 animate-in fade-in duration-500">
        
        {/* Filters / Search Bar (Mock) */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex gap-2">
             <button className="px-4 py-2 bg-[#EEF0FF] text-[#5B5FEF] text-[13px] font-bold rounded-xl">All Members ({users.length})</button>
             <button onClick={() => alert("Filter: Engineering")} className="px-4 py-2 text-slate-500 hover:bg-slate-50 text-[13px] font-bold rounded-xl transition-colors">Engineering</button>
             <button onClick={() => alert("Filter: Design")} className="px-4 py-2 text-slate-500 hover:bg-slate-50 text-[13px] font-bold rounded-xl transition-colors">Design</button>
           </div>
           <button onClick={handleOpenAddModal} className="bg-[#5B5FEF] hover:bg-[#4F46E5] text-white px-5 py-2 rounded-xl text-[13px] font-bold shadow-md shadow-[#5B5FEF]/20 transition-all">
             + Add User
           </button>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#5B5FEF]" />
            <p className="text-[14px] font-semibold text-slate-500">Loading members...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {users.map(user => (
              <div key={user.id} className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 hover:border-[#5B5FEF]/30 hover:shadow-md transition-all group">
                 <div className="flex items-start justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#EEF0FF] to-[#DDE2FF] flex items-center justify-center text-[#5B5FEF] font-black text-lg border-2 border-white shadow-sm relative">
                         {user.name.charAt(0).toUpperCase()}
                         <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${user.status === "Online" ? "bg-emerald-500" : user.status === "Offline" ? "bg-slate-300" : "bg-amber-500"}`} />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-extrabold text-slate-900 group-hover:text-[#5B5FEF] transition-colors">{user.name}</h3>
                        <p className="text-[13px] font-medium text-slate-500 mt-0.5">{user.role}</p>
                      </div>
                   </div>
                   <button onClick={() => alert(`More options for ${user.name}`)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer">
                      <MoreHorizontal className="w-5 h-5" />
                   </button>
                 </div>

                 <div className="mt-6 space-y-3">
                   <div className="flex items-center gap-3 text-[13px] font-medium text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="truncate">{user.email}</span>
                   </div>
                   <div className="flex items-center gap-3 text-[13px] font-medium text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span>{user.phone}</span>
                   </div>
                 </div>
                 
                 <div className="mt-6 pt-5 border-t border-slate-100 flex gap-3">
                   <button onClick={() => alert(`Viewing profile for ${user.name}`)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">View Profile</button>
                   <button onClick={() => alert(`Opening chat with ${user.name}`)} className="flex-1 py-2.5 rounded-xl bg-[#EEF0FF] text-[#5B5FEF] text-[13px] font-bold hover:bg-[#DDE2FF] transition-colors cursor-pointer">Message</button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* =========================================================
          ADD USER MODAL
      ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-[480px] rounded-[24px] bg-white shadow-2xl overflow-hidden">
            <div className="bg-white px-7 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[20px] font-extrabold text-slate-900">Add New Team Member</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveUser} className="p-7 space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Full Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Jane Doe" className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Job Title/Role *</label>
                <input type="text" required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} placeholder="e.g. Frontend Developer" className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Email Address *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="e.g. jane@empsphere.com" className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 (555) 000-0000" className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Initial Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all cursor-pointer">
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="In a meeting">In a meeting</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4F46E5] text-white text-[14px] font-bold shadow-md shadow-[#5B5FEF]/20 transition-all cursor-pointer disabled:opacity-50">
                  {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
