"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { MapPin, Users, Clock, Loader2, Edit2 } from "lucide-react";

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
    <div className="min-h-screen bg-transparent pb-12">
      <Topbar
        title="Company Events"
        subtitle="Keep track of upcoming meetings, workshops, and company-wide events."
      />

      <main className="px-5 sm:px-7 lg:px-8 space-y-6 max-w-[1600px] mx-auto mt-6 animate-in fade-in duration-500">
        
        {/* Calendar Overview Card */}
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
             <h2 className="text-[24px] font-black text-slate-900">October 2026</h2>
             <p className="text-[14px] font-medium text-slate-500 mt-1">You have {events.length} upcoming events.</p>
           </div>
           <div className="flex items-center gap-3">
             <button onClick={() => alert("Syncing calendar to Google/Outlook...")} className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[13px] font-bold rounded-xl transition-colors border border-slate-200">
               Sync Calendar
             </button>
             {isAdmin && (
               <button onClick={() => handleOpenModal()} className="bg-[#5B5FEF] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-md shadow-[#5B5FEF]/20 transition-all">
                 + Create Event
               </button>
             )}
           </div>
        </div>

        {/* Events Timeline/List */}
        <div className="space-y-4">
          <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-wider pl-2">Upcoming</h3>
          
          <div className="grid grid-cols-1 gap-4">
             {events.length === 0 ? (
               <div className="text-center py-12 bg-white rounded-[20px] border border-slate-100">
                 <p className="text-slate-500 font-medium">No events found. Create one to get started!</p>
               </div>
             ) : (
               events.map((event) => {
                 const typeColors = {
                   "Company": "bg-purple-100 text-purple-700",
                   "Team": "bg-blue-100 text-blue-700",
                   "Workshop": "bg-amber-100 text-amber-700",
                   "HR": "bg-emerald-100 text-emerald-700"
                 }[event.type] || "bg-slate-100 text-slate-700";

                 const dateParts = event.date.split(" ");
                 const monthStr = dateParts[0] ? dateParts[0].substring(0, 3) : "Day";
                 const dayStr = dateParts[1] ? dateParts[1].replace(",", "") : "00";

                 return (
                   <div key={event.id} onClick={isAdmin ? () => handleOpenModal(event) : undefined} className={`bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 hover:border-[#5B5FEF]/30 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 group ${isAdmin ? "cursor-pointer" : ""}`}>
                      
                      {/* Date Block */}
                      <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 group-hover:bg-[#5B5FEF] group-hover:border-[#5B5FEF] group-hover:text-white transition-colors">
                         <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">{monthStr}</span>
                         <span className="text-[28px] font-black leading-none mt-0.5">{dayStr}</span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-3 mb-2">
                           <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${typeColors}`}>
                             {event.type}
                           </span>
                         </div>
                         <h4 className="text-[18px] font-extrabold text-slate-900 group-hover:text-[#5B5FEF] transition-colors truncate">
                           {event.title}
                         </h4>
                         
                         <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-[13px] font-medium text-slate-500">
                            <div className="flex items-center gap-1.5">
                               <Clock className="w-4 h-4 text-slate-400" />
                               {event.time}
                            </div>
                            <div className="flex items-center gap-1.5">
                               <MapPin className="w-4 h-4 text-slate-400" />
                               {event.location}
                            </div>
                            <div className="flex items-center gap-1.5">
                               <Users className="w-4 h-4 text-slate-400" />
                               {event.attendees} attending
                            </div>
                         </div>
                      </div>

                      {/* Action */}
                      {isAdmin && (
                        <div className="shrink-0 flex items-center justify-end">
                           <button className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-[#5B5FEF] group-hover:text-[#5B5FEF] group-hover:bg-[#EEF0FF] transition-all">
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
      </main>

      {/* CREATE / EDIT EVENT MODAL */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[520px] rounded-[24px] bg-white shadow-2xl overflow-hidden">
            <div className="bg-white px-7 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[20px] font-extrabold text-slate-900">{editingEvent ? "Edit Event" : "Create New Event"}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveEvent} className="p-7 space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Event Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Q4 Townhall" className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Date *</label>
                  <input type="text" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} placeholder="e.g. Oct 25, 2026" className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Time *</label>
                  <input type="text" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} placeholder="e.g. 10:00 AM - 11:30 AM" className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Location *</label>
                <input type="text" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Virtual (Zoom) or Main Townhall" className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Event Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all cursor-pointer">
                    <option value="Company">Company</option>
                    <option value="Team">Team</option>
                    <option value="Workshop">Workshop</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Est. Attendees</label>
                  <input type="number" value={formData.attendees} onChange={(e) => setFormData({...formData, attendees: parseInt(e.target.value) || 0})} className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
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
