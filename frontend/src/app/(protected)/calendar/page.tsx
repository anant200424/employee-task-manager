"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Edit2, Loader2, Plus, Calendar as CalendarIcon } from "lucide-react";

interface EventItem {
  id: string | number;
  title: string;
  date: Date;
  time: string;
  location: string;
  attendees: number;
  type: string;
}

// Helper to get days in month
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get starting day of the week (0 = Sunday)
function getStartDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Mock Data
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 1,
      title: "Q4 Townhall",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      time: "10:00 AM - 11:30 AM",
      location: "Main Townhall",
      attendees: 145,
      type: "Company"
    },
    {
      id: 2,
      title: "Team Sync",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 2),
      time: "2:00 PM - 3:00 PM",
      location: "Virtual (Zoom)",
      attendees: 24,
      type: "Team"
    },
  ]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    time: "",
    location: "",
    attendees: 0,
    type: "Company"
  });

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Render Grid
  const renderGrid = () => {
    let days = [];
    
    // Empty slots before 1st day
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/50 dark:bg-slate-800/20 border-r border-b border-slate-200 dark:border-slate-800 p-2"></div>);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateOfCell = new Date(year, month, i);
      const isToday = new Date().toDateString() === dateOfCell.toDateString();
      
      const dayEvents = events.filter(e => e.date.toDateString() === dateOfCell.toDateString());

      days.push(
        <div 
          key={i} 
          onClick={isAdmin ? () => handleDayClick(dateOfCell) : undefined}
          className={`min-h-[120px] bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group relative ${isAdmin ? 'cursor-pointer' : ''}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-bold ${isToday ? 'bg-[#5B5FEF] text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-[#5B5FEF]'}`}>
              {i}
            </span>
            {isAdmin && (
              <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#5B5FEF] transition-opacity">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar pr-1">
            {dayEvents.map(ev => {
               const typeColors = {
                 "Company": "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
                 "Team": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
                 "Workshop": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
                 "HR": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
               }[ev.type] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

               return (
                 <div key={ev.id} className={`text-[11px] font-bold px-2 py-1.5 rounded-lg truncate ${typeColors} shadow-sm border border-black/5 dark:border-white/5`}>
                   {ev.title}
                 </div>
               );
            })}
          </div>
        </div>
      );
    }

    return days;
  };

  const handleDayClick = (date: Date) => {
    if (!isAdmin) return;
    setSelectedDate(date);
    setFormData({ title: "", time: "10:00 AM - 11:00 AM", location: "", attendees: 0, type: "Company" });
    setShowModal(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedDate) return;
    setIsSaving(true);
    
    setTimeout(() => {
      const newEvent: EventItem = {
        ...formData,
        date: selectedDate,
        id: Date.now()
      };
      setEvents(prev => [...prev, newEvent]);
      setIsSaving(false);
      setShowModal(false);
    }, 500);
  };

  return (
    <div className="flex h-screen bg-[#F4F8FB] dark:bg-[#0B1120] overflow-hidden transition-colors duration-300">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar title="Calendar" subtitle="View and manage company schedules and events." />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Calendar Header Controls */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-800">
               <div className="flex items-center gap-6">
                  <h2 className="text-[24px] font-extrabold text-slate-900 dark:text-white w-48">
                    {monthNames[month]} {year}
                  </h2>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm transition-all"><ChevronLeft className="w-5 h-5"/></button>
                    <button onClick={today} className="px-4 py-2 font-bold text-[13px] text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm transition-all">Today</button>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm transition-all"><ChevronRight className="w-5 h-5"/></button>
                  </div>
               </div>
               
               {isAdmin && (
                 <button onClick={() => handleDayClick(new Date())} className="flex items-center gap-2 px-5 py-2.5 bg-[#5B5FEF] hover:bg-[#4a4ed4] text-white text-[14px] font-bold rounded-xl shadow-md shadow-[#5B5FEF]/20 transition-all cursor-pointer">
                   <Plus className="w-4 h-4" /> Add Event
                 </button>
               )}
            </div>

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 overflow-hidden">
               {/* Day Headers */}
               <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                 {dayNames.map(day => (
                   <div key={day} className="p-3 text-center text-[12px] font-extrabold text-slate-500 uppercase tracking-wider">
                     {day}
                   </div>
                 ))}
               </div>
               
               {/* Grid Body */}
               <div className="grid grid-cols-7">
                  {renderGrid()}
               </div>
            </div>

          </div>
        </div>
      </main>

      {/* CREATE EVENT MODAL (Admin Only) */}
      {showModal && isAdmin && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[500px] rounded-[24px] bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-white">Create Event</h3>
                <p className="text-[13px] font-medium text-slate-500 mt-1 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5"/> {selectedDate.toDateString()}</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveEvent} className="p-7 space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Event Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Q4 Townhall" className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Time *</label>
                  <input type="text" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} placeholder="e.g. 10:00 AM - 11:30 AM" className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Event Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[14px] font-bold text-slate-700 dark:text-slate-300 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all cursor-pointer">
                    <option value="Company">Company</option>
                    <option value="Team">Team</option>
                    <option value="Workshop">Workshop</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Virtual (Zoom)" className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4a4ed4] text-white text-[14px] font-bold shadow-md shadow-[#5B5FEF]/20 transition-all cursor-pointer disabled:opacity-50">
                  {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Add to Calendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
