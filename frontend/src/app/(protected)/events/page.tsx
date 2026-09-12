"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { MapPin, Users, Clock, Loader2, Edit2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface EventItem {
  id: number | string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: string;
}

const initialEvents: EventItem[] = [
  { id: 1, title: "Q3 All-Hands Meeting", date: "Oct 15, 2026", time: "10:00 AM - 11:30 AM", location: "Main Townhall", attendees: 145, type: "Company" },
  { id: 2, title: "Engineering Sync", date: "Oct 16, 2026", time: "2:00 PM - 3:00 PM", location: "Virtual (Zoom)", attendees: 24, type: "Team" },
  { id: 3, title: "Product Strategy Workshop", date: "Oct 18, 2026", time: "9:00 AM - 1:00 PM", location: "Conference Room A", attendees: 8, type: "Workshop" },
  { id: 4, title: "New Hire Onboarding", date: "Oct 20, 2026", time: "11:00 AM - 12:00 PM", location: "HR Lounge", attendees: 12, type: "HR" },
];

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    attendees: 0,
    type: "Company"
  });

  const handleOpenModal = (event?: EventItem) => {
    if (!isAdmin) return; // Guard clause
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        attendees: event.attendees,
        type: event.type
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: "",
        date: "",
        time: "",
        location: "",
        attendees: 0,
        type: "Company"
      });
    }
    setShowModal(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    
    // Simulate network delay
    setTimeout(() => {
      if (editingEvent) {
        setEvents(prev => prev.map(ev => 
          ev.id === editingEvent.id ? { ...formData, id: ev.id } : ev
        ));
      } else {
        const newEvent = { ...formData, id: Date.now() };
        setEvents(prev => [newEvent, ...prev]);
      }
      setIsSaving(false);
      setShowModal(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-transparent transition-colors duration-300">
      <Topbar
        title="Company Events"
        subtitle="Keep track of upcoming meetings, workshops, and company-wide events."
      />

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* Calendar Overview Hero */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1E293B] to-[#0F172A] dark:from-[#0F172A] dark:to-[#0B1120] p-8 shadow-lg border border-slate-700 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 transition-colors duration-300">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none transition-colors duration-300" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#5B5FEF]/20 dark:bg-[#5B5FEF]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none transition-colors duration-300" />
             
             <div className="relative z-10">
                <h2 className="text-[28px] font-black text-white tracking-tight">October 2026</h2>
                <p className="text-[14.5px] font-medium text-slate-300 mt-1">
                  Scheduled organizational meetings, team reviews, and project milestones.
                </p>
              </div>
             
             <div className="relative z-10 flex items-center gap-3">
               <button onClick={() => toast.success("Syncing events calendar with Google & Outlook Calendar...")} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-[13px] font-bold rounded-xl transition-all border border-white/10 backdrop-blur-sm cursor-pointer">
                 Sync Calendar
               </button>
               {isAdmin && (
                 <button onClick={() => handleOpenModal()} className="bg-[#5B5FEF] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-[0_4px_14px_rgba(91,95,239,0.3)] transition-all active:scale-95">
                   + Create Event
                 </button>
               )}
             </div>
          </div>

          {/* Events Timeline/List */}
          <div className="space-y-4">
            <h3 className="text-[14px] font-extrabold text-slate-500 uppercase tracking-widest pl-2">Upcoming Events</h3>
            
            <div className="grid grid-cols-1 gap-4">
               {events.length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-[24px] shadow-sm border border-slate-200">
                   <p className="text-slate-500 font-medium">No events found. Create one to get started!</p>
                 </div>
               ) : (
                 events.map((event) => {
                   const typeColors = {
                     "Company": "bg-purple-100 text-purple-700 ring-purple-100",
                     "Team": "bg-blue-100 text-blue-700 ring-blue-100",
                     "Workshop": "bg-amber-100 text-amber-700 ring-amber-100",
                     "HR": "bg-emerald-100 text-emerald-700 ring-emerald-100"
                   }[event.type] || "bg-slate-100 text-slate-700 ring-slate-100";

                   const dateParts = event.date.split(" ");
                   const monthStr = dateParts[0] ? dateParts[0].substring(0, 3) : "Day";
                   const dayStr = dateParts[1] ? dateParts[1].replace(",", "") : "00";

                   return (
                     <div key={event.id} onClick={isAdmin ? () => handleOpenModal(event) : undefined} className={`bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-[#5B5FEF] dark:hover:border-[#5B5FEF] hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col md:flex-row md:items-center gap-6 group ${isAdmin ? "cursor-pointer" : ""}`}>
                        
                        {/* Date Block */}
                        <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-[#EEF0FF] dark:bg-[#5B5FEF]/10 border-2 border-white dark:border-slate-800 shadow-sm shrink-0 group-hover:bg-[#5B5FEF] group-hover:text-white text-[#5B5FEF] dark:text-[#818CF8] group-hover:dark:text-white transition-all">
                           <span className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">{monthStr}</span>
                           <span className="text-[28px] font-black leading-none mt-0.5">{dayStr}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-3 mb-2">
                             <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ring-2 ring-offset-1 ${typeColors}`}>
                               {event.type}
                             </span>
                           </div>
                           <h4 className="text-[18px] font-extrabold text-slate-900 dark:text-white group-hover:text-[#5B5FEF] dark:group-hover:text-[#818CF8] transition-colors truncate">
                             {event.title}
                           </h4>
                           
                           <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-[13px] font-bold text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700/50 transition-colors">
                                 <Clock className="w-4 h-4 text-[#5B5FEF] dark:text-[#818CF8]" />
                                 {event.time}
                              </div>
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700/50 transition-colors">
                                 <MapPin className="w-4 h-4 text-[#5B5FEF] dark:text-[#818CF8]" />
                                 {event.location}
                              </div>
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700/50 transition-colors">
                                 <Users className="w-4 h-4 text-[#5B5FEF] dark:text-[#818CF8]" />
                                 {event.attendees} attending
                              </div>
                           </div>
                        </div>

                        {/* Action */}
                        {isAdmin && (
                          <div className="shrink-0 flex items-center justify-end">
                             <button className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:border-transparent group-hover:text-white group-hover:bg-[#5B5FEF] transition-all shadow-sm">
                               <Edit2 className="w-4 h-4" />
                             </button>
                          </div>
                        )}
                     </div>
                   )
                 })
               )}
            </div>
          </div>
        </div>
      </main>

      {/* CREATE / EDIT EVENT MODAL */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[520px] rounded-[24px] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
            <div className="bg-white dark:bg-slate-900 px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-white">{editingEvent ? "Edit Event" : "Create New Event"}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveEvent} className="p-7 space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Event Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Q4 Townhall" className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date *</label>
                  <input type="text" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} placeholder="e.g. Oct 25, 2026" className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Time *</label>
                  <input type="text" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} placeholder="e.g. 10:00 AM - 11:30 AM" className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Location *</label>
                <input type="text" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Virtual (Zoom) or Main Townhall" className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Event Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[14px] font-bold text-slate-700 dark:text-slate-200 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all cursor-pointer">
                    <option value="Company">Company</option>
                    <option value="Team">Team</option>
                    <option value="Workshop">Workshop</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Est. Attendees</label>
                  <input type="number" value={formData.attendees} onChange={(e) => setFormData({...formData, attendees: parseInt(e.target.value) || 0})} className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4F46E5] text-white text-[14px] font-bold shadow-md shadow-[#5B5FEF]/20 transition-all cursor-pointer disabled:opacity-50">
                  {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
