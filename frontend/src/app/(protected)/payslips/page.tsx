"use client";

import { Topbar } from "@/components/dashboard/Topbar";
import { Download, FileText, ChevronRight } from "lucide-react";

const mockPayslips = [
  { id: 1, period: "September 2026", date: "Sep 30, 2026", gross: "$8,500.00", net: "$6,240.50", status: "Paid" },
  { id: 2, period: "August 2026", date: "Aug 31, 2026", gross: "$8,500.00", net: "$6,240.50", status: "Paid" },
  { id: 3, period: "July 2026", date: "Jul 31, 2026", gross: "$8,500.00", net: "$6,240.50", status: "Paid" },
  { id: 4, period: "June 2026", date: "Jun 30, 2026", gross: "$8,500.00", net: "$6,240.50", status: "Paid" },
];

export default function PayslipsPage() {
  return (
    <div className="min-h-screen bg-transparent pb-12">
      <Topbar
        title="Payslips & Compensation"
        subtitle="Access your salary slips, tax documents, and compensation details."
      />

      <main className="px-5 sm:px-7 lg:px-8 space-y-6 max-w-[1600px] mx-auto mt-6 animate-in fade-in duration-500">
        
        {/* Latest Payslip Highlight */}
        <div className="bg-gradient-to-br from-[#5B5FEF] to-[#4338CA] rounded-[24px] p-8 shadow-card text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="relative z-10">
             <span className="bg-white/20 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider mb-4 inline-block">Latest Cycle</span>
             <h2 className="text-[32px] font-black leading-tight">September 2026</h2>
             <p className="text-white/80 text-[14px] font-medium mt-1">Paid directly to your linked bank account on Sep 30, 2026.</p>
             
             <div className="mt-8 flex items-baseline gap-3">
                <span className="text-[48px] font-black">$6,240.50</span>
                <span className="text-white/80 font-bold text-[14px]">Net Pay</span>
             </div>
           </div>
           
           <div className="relative z-10 shrink-0">
             <button onClick={() => alert("Downloading PDF (Mock)...")} className="bg-white hover:bg-slate-50 text-[#5B5FEF] px-8 py-4 rounded-xl text-[14px] font-extrabold shadow-lg transition-all flex items-center gap-3 cursor-pointer">
               <Download className="w-5 h-5" />
               Download PDF
             </button>
           </div>
           
           {/* Decorative BG */}
           <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none">
              <svg viewBox="0 0 200 200" className="absolute right-[-10%] top-[-30%] w-96 h-96 text-white">
                 <path fill="currentColor" opacity="0.5" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.1,-46.3C90.4,-33.5,96,-18,94.9,-2.8C93.8,12.4,85.9,27.1,75.8,39.6C65.7,52.1,53.4,62.4,39.6,70.5C25.8,78.6,10.5,84.5,-4.4,87C-19.3,89.5,-33.8,88.5,-46.4,81.6C-59,74.7,-69.7,61.9,-77.8,47.7C-85.9,33.5,-91.4,18,-91.3,2.8C-91.2,-12.4,-85.5,-27.3,-76.8,-40C-68.1,-52.7,-56.4,-63.2,-43.3,-71.1C-30.2,-79,-15.7,-84.3,-0.6,-83.3C14.5,-82.3,29,-74.9,44.7,-76.4Z" transform="translate(100 100)" />
              </svg>
           </div>
        </div>

        {/* Payslip History */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden mt-6">
           <div className="px-8 py-6 border-b border-slate-100">
              <h3 className="text-[18px] font-extrabold text-slate-900">Payslip History</h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">Review and download past salary slips.</p>
           </div>
           
           <div className="divide-y divide-slate-100">
             {mockPayslips.map((slip) => (
               <div key={slip.id} className="p-6 px-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-[#EEF0FF] group-hover:text-[#5B5FEF] transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-extrabold text-slate-900">{slip.period}</h4>
                      <p className="text-[13px] font-medium text-slate-500 mt-0.5">Paid on {slip.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 md:gap-16 justify-between md:justify-end">
                     <div>
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Gross</p>
                       <p className="text-[14px] font-bold text-slate-700">{slip.gross}</p>
                     </div>
                     <div>
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Net Pay</p>
                       <p className="text-[14px] font-extrabold text-slate-900">{slip.net}</p>
                     </div>
                     <div className="hidden sm:block">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide">
                          {slip.status}
                        </span>
                     </div>
                     
                     <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); alert(`Downloading Payslip for ${slip.period}...`); }} className="text-slate-400 hover:text-[#5B5FEF] p-2 rounded-lg hover:bg-[#EEF0FF] transition-all cursor-pointer">
                          <Download className="w-5 h-5" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                     </div>
                  </div>
               </div>
             ))}
           </div>
           
           <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 text-center">
              <button onClick={() => alert("Loading previous year data...")} className="text-[13px] font-bold text-[#5B5FEF] hover:text-[#4F46E5] transition-colors cursor-pointer">
                 Load Previous Year (2025)
              </button>
           </div>
        </div>
      </main>
    </div>
  );
}
