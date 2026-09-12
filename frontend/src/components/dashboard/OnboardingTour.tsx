"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Check,
  Search,
  LayoutDashboard,
  CheckSquare,
  Sliders,
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // Optional element to highlight
  position: "center" | "top" | "bottom" | "left" | "right";
  icon: any;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to EmpSphere Workspace",
    description:
      "Your modern enterprise operating cockpit. Manage deliverables, monitor departmental velocity, and collaborate with your team in real time.",
    position: "center",
    icon: Sparkles,
  },
  {
    id: "omnisearch",
    title: "Global Omnisearch (Ctrl + K)",
    description:
      "Press Ctrl+K or / anywhere to jump to any page, search team members, create tasks, and execute quick system commands with typo-tolerant search.",
    position: "center",
    icon: Search,
  },
  {
    id: "sidebar",
    title: "Navigation & Department Hubs",
    description:
      "Access your Jira-style Tasks Board, Employee Directory, Company Calendar, and deep Analytics with one click from the left sidebar.",
    position: "center",
    icon: LayoutDashboard,
  },
  {
    id: "deliverables",
    title: "Instant Deliverable Actions",
    description:
      "Update task statuses and priorities with zero wait time thanks to instant optimistic UI feedback. Changes save automatically to the cloud.",
    position: "center",
    icon: CheckSquare,
  },
  {
    id: "settings",
    title: "Display Scaling & Preferences",
    description:
      "Personalize your interface with custom display font scaling (80%–130%), dark/light mode themes, and multi-language support from the top bar.",
    position: "center",
    icon: Sliders,
  },
];

const TOUR_STORAGE_KEY = "nexus_tour_completed";

export const OnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if tour should open automatically
  useEffect(() => {
    const hasCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompleted) {
      // Delay slightly for smooth page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for custom trigger event (e.g. from Help page or Topbar button)
  useEffect(() => {
    const handleStartTour = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener("nexus-start-tour", handleStartTour);
    return () => window.removeEventListener("nexus-start-tour", handleStartTour);
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsOpen(false);
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg glass-modal rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/60 dark:border-slate-700/80 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Ambient Top Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5B5FEF] via-[#7B7FFA] to-emerald-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleComplete}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Skip Tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="space-y-4 pt-1">
          {/* Header Icon + Step Badge */}
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
              <StepIcon className="w-6 h-6" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
              <Compass className="w-3.5 h-3.5 text-[#5B5FEF]" />
              <span>
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
            </div>
          </div>

          {/* Title and Description */}
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {step.title}
            </h3>
            <p className="text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium mt-2">
              {step.description}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5 pt-2">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? "w-8 bg-[#5B5FEF]"
                    : idx < currentStep
                    ? "w-3 bg-emerald-500"
                    : "w-3 bg-slate-200 dark:bg-slate-700"
                }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleComplete}
              className="text-[12.5px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-[12.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white text-[12.5px] font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <span>{currentStep === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}</span>
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
