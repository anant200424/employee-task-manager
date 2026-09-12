"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useLanguage } from "@/context/LanguageContext";
import {
  Search,
  Book,
  Shield,
  CreditCard,
  Settings as SettingsIcon,
  MessageSquare,
  ChevronDown,
  Mail,
  FileText,
  Compass,
  Keyboard,
} from "lucide-react";

const faqs = [
  {
    question: "How do I reset my password?",
    answer: "You can reset your password by going to the Settings page and selecting the Security tab. Alternatively, you can click 'Forgot password?' on the login screen."
  },
  {
    question: "Where can I find my payslips?",
    answer: "Your payslips are securely stored in the Analytics & Finance section. You can view and download them in PDF format at any time."
  },
  {
    question: "How do I update my profile picture?",
    answer: "Navigate to your Account profile by clicking on your name in the sidebar. Hover over your current profile picture to reveal the 'Update' button."
  },
  {
    question: "Can I switch between Light and Dark mode?",
    answer: "Yes! There is a sun/moon toggle icon located at the top right of your dashboard in the navigation bar. Click it to instantly switch themes."
  }
];

const categories = [
  { title: "Getting Started", icon: Book, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Account & Security", icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "Billing & Plans", icon: CreditCard, color: "text-amber-500", bg: "bg-amber-500/10" },
  { title: "System Preferences", icon: SettingsIcon, color: "text-purple-500", bg: "bg-purple-500/10" }
];

export default function HelpCenterPage() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent pb-16 transition-colors duration-300">
      <Topbar title={t("help", "Help & Support")} subtitle="Find answers, guides, and support resources." />
      
      <main className="p-6 lg:p-10 relative z-10">
        <div className="max-w-5xl mx-auto space-y-10">
            
            {/* Search Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200/50 dark:border-slate-800 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-[28px] lg:text-[36px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                  How can we help you today?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium mb-8 max-w-2xl mx-auto">
                  Search through our comprehensive guides, FAQs, and documentation to find exactly what you&apos;re looking for.
                </p>
                
                <div className="max-w-2xl mx-auto relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for articles, guides, or keywords..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] focus:border-transparent transition-all shadow-inner text-[15px] font-medium"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-[#5B5FEF] hover:bg-[#4a4ed4] text-white rounded-xl font-bold text-[14px] transition-colors shadow-md shadow-[#5B5FEF]/20">
                    Search
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Categories & Contact */}
              <div className="lg:col-span-1 space-y-8">
                {/* Categories */}
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mb-4">Categories</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {categories.map((cat, idx) => {
                      const Icon = cat.icon;
                      return (
                        <button 
                          key={idx} 
                          onClick={() => {
                            if (cat.title === "Getting Started") setSearchQuery("password");
                            else if (cat.title === "Account & Security") setSearchQuery("profile");
                            else if (cat.title === "Billing & Plans") setSearchQuery("payslip");
                            else setSearchQuery("Dark mode");
                          }}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#5B5FEF]/30 dark:hover:border-[#5B5FEF]/50 transition-all text-left group cursor-pointer"
                        >
                          <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-5 h-5 ${cat.color}`} />
                          </div>
                          <span className="font-semibold text-[14px] text-slate-700 dark:text-slate-200 group-hover:text-[#5B5FEF] dark:group-hover:text-[#818CF8] transition-colors">
                            {cat.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Interactive Tools Card */}
                <div className="glass-card rounded-3xl p-6 border border-indigo-100 dark:border-slate-800 space-y-3">
                  <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#5B5FEF]" />
                    Interactive Guides & Tools
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[12.5px] font-medium leading-relaxed">
                    Relaunch the interactive guided onboarding or view the keyboard navigation cheat sheet.
                  </p>
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new Event("nexus-start-tour"))}
                      className="w-full py-2.5 px-4 bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Start Guided Tour</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new Event("nexus-open-shortcuts"))}
                      className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                    >
                      <Keyboard className="w-4 h-4 text-slate-400" />
                      <span>Keyboard Shortcuts (?)</span>
                    </button>
                  </div>
                </div>

                {/* Contact Support Card */}
                <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-3xl p-6 shadow-xl relative overflow-hidden text-white">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <MessageSquare className="w-8 h-8 text-blue-400 mb-4 relative z-10" />
                  <h3 className="text-[18px] font-bold mb-2 relative z-10">Still need help?</h3>
                  <p className="text-slate-300 text-[13px] font-medium mb-6 relative z-10 leading-relaxed">
                    Our support team is available 24/7 to assist you with any technical issues or inquiries.
                  </p>
                  <a 
                    href="mailto:support@empsphere.com?subject=Support%20Request%20-%20EmpSphere"
                    className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-[14px] transition-colors flex items-center justify-center gap-2 relative z-10"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Support
                  </a>
                </div>
              </div>

              {/* Right Column: FAQs */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200/50 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-[20px] font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium">Quick answers to common issues.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredFaqs.length > 0 ? (
                      filteredFaqs.map((faq, idx) => (
                        <div 
                          key={idx} 
                          className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                            openFaq === idx 
                              ? "border-[#5B5FEF]/50 bg-[#5B5FEF]/5 dark:bg-[#5B5FEF]/10 shadow-sm" 
                              : "border-slate-200 dark:border-slate-800 bg-transparent hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <button
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                            className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                          >
                            <span className={`font-bold text-[15px] ${openFaq === idx ? "text-[#5B5FEF] dark:text-[#818CF8]" : "text-slate-700 dark:text-slate-200"}`}>
                              {faq.question}
                            </span>
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaq === idx ? "rotate-180 text-[#5B5FEF] dark:text-[#818CF8]" : "text-slate-400"}`} />
                          </button>
                          
                          <div 
                            className={`transition-all duration-300 ease-in-out ${
                              openFaq === idx ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="px-5 pb-5 pt-0">
                              <p className="text-slate-600 dark:text-slate-400 text-[14px] font-medium leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No articles found for &quot;{searchQuery}&quot;</p>
                        <button onClick={() => setSearchQuery("")} className="mt-2 text-[#5B5FEF] hover:underline font-bold text-[13px] cursor-pointer">Clear search</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    );
  }
