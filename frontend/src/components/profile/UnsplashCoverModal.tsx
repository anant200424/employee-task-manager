"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Check,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";

interface UnsplashPhoto {
  id: string;
  url: string;
  thumbUrl: string;
  title: string;
  category: string;
  author: {
    name: string;
    username: string;
    link: string;
  };
}

// Enterprise curated Unsplash landscape banners with high quality & stability
const CURATED_UNSPLASH_BANNERS: UnsplashPhoto[] = [
  // Workspaces & Modern Offices
  {
    id: "ws-1",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=70",
    title: "Minimalist Modern Office",
    category: "Workspaces",
    author: { name: "Benjamin Child", username: "bchild311", link: "https://unsplash.com/@bchild311" },
  },
  {
    id: "ws-2",
    url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=70",
    title: "Co-working Architecture",
    category: "Workspaces",
    author: { name: "Alesia Kazantceva", username: "itjustflows", link: "https://unsplash.com/@itjustflows" },
  },
  {
    id: "ws-3",
    url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=70",
    title: "Executive Desk Space",
    category: "Workspaces",
    author: { name: "Slava Keyzman", username: "keyzman", link: "https://unsplash.com/@keyzman" },
  },
  {
    id: "ws-4",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=70",
    title: "Corporate Headquarters",
    category: "Architecture",
    author: { name: "Sean Pollock", username: "seanpollock", link: "https://unsplash.com/@seanpollock" },
  },

  // Tech & Cybersecurity
  {
    id: "tech-1",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=70",
    title: "Digital Matrix Code",
    category: "Tech & Code",
    author: { name: "Markus Spiske", username: "markusspiske", link: "https://unsplash.com/@markusspiske" },
  },
  {
    id: "tech-2",
    url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=70",
    title: "Cyber Security Grid",
    category: "Tech & Code",
    author: { name: "FlyD", username: "flyd2069", link: "https://unsplash.com/@flyd2069" },
  },
  {
    id: "tech-3",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=70",
    title: "Hardware & Microchips",
    category: "Tech & Code",
    author: { name: "Alexandre Debiève", username: "alexandre_debieve", link: "https://unsplash.com/@alexandre_debieve" },
  },
  {
    id: "tech-4",
    url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=70",
    title: "Developer Workspace",
    category: "Tech & Code",
    author: { name: "Ilya Pavlov", username: "ilyapavlov", link: "https://unsplash.com/@ilyapavlov" },
  },

  // Minimal Gradients & Abstract
  {
    id: "grad-1",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=70",
    title: "Liquid Aurora Wave",
    category: "Minimal Gradients",
    author: { name: "Milad Fakurian", username: "fakurian", link: "https://unsplash.com/@fakurian" },
  },
  {
    id: "grad-2",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=70",
    title: "Sunset Mesh Gradient",
    category: "Minimal Gradients",
    author: { name: "Steve Johnson", username: "steve_j", link: "https://unsplash.com/@steve_j" },
  },
  {
    id: "grad-3",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=70",
    title: "Deep Violet Horizon",
    category: "Minimal Gradients",
    author: { name: "Alexander Grey", username: "shedeer", link: "https://unsplash.com/@shedeer" },
  },
  {
    id: "grad-4",
    url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=70",
    title: "Soft Pastel Glow",
    category: "Minimal Gradients",
    author: { name: "Scott Webb", username: "scottwebb", link: "https://unsplash.com/@scottwebb" },
  },

  // Nature & Landscapes
  {
    id: "nat-1",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=70",
    title: "Misty Alpine Forest",
    category: "Nature & Landscapes",
    author: { name: "Casey Horner", username: "mischievous_penguins", link: "https://unsplash.com/@mischievous_penguins" },
  },
  {
    id: "nat-2",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=70",
    title: "Yosemite Valley Stream",
    category: "Nature & Landscapes",
    author: { name: "Bailey Zindel", username: "baileyzindel", link: "https://unsplash.com/@baileyzindel" },
  },
  {
    id: "nat-3",
    url: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=400&q=70",
    title: "Pine Woods Sunlight",
    category: "Nature & Landscapes",
    author: { name: "Luca Bravo", username: "lucabravo", link: "https://unsplash.com/@lucabravo" },
  },
  {
    id: "nat-4",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=70",
    title: "Tropical Azure Shore",
    category: "Nature & Landscapes",
    author: { name: "Sean Oulashin", username: "oulashin", link: "https://unsplash.com/@oulashin" },
  },

  // Architecture & Urban
  {
    id: "arch-1",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=70",
    title: "Geometric Atrium",
    category: "Architecture",
    author: { name: "Garry Killian", username: "garrykillian", link: "https://unsplash.com/@garrykillian" },
  },
  {
    id: "arch-2",
    url: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=400&q=70",
    title: "City Skyline Dusk",
    category: "Architecture",
    author: { name: "Aleksandar Pasaric", username: "apasaric", link: "https://unsplash.com/@apasaric" },
  },

  // Dark Mode Aesthetics
  {
    id: "dark-1",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=70",
    title: "Dark Obsidian Flow",
    category: "Dark Mode",
    author: { name: "Pawel Czerwinski", username: "pawel_czerwinski", link: "https://unsplash.com/@pawel_czerwinski" },
  },
  {
    id: "dark-2",
    url: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=1600&q=80",
    thumbUrl: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=400&q=70",
    title: "Cosmic Starfield",
    category: "Dark Mode",
    author: { name: "Jeremy Thomas", username: "jeremythomasphoto", link: "https://unsplash.com/@jeremythomasphoto" },
  },
];

const CATEGORIES = [
  "All",
  "Workspaces",
  "Tech & Code",
  "Minimal Gradients",
  "Nature & Landscapes",
  "Architecture",
  "Dark Mode",
];

interface UnsplashCoverModalProps {
  isOpen: boolean;
  currentCoverUrl?: string;
  onClose: () => void;
  onSelectCover: (url: string) => Promise<void> | void;
}

export const UnsplashCoverModal: React.FC<UnsplashCoverModalProps> = ({
  isOpen,
  currentCoverUrl,
  onClose,
  onSelectCover,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customUrl, setCustomUrl] = useState<string>("");
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"gallery" | "custom">("gallery");

  // Filter banners based on category and search query
  const filteredBanners = useMemo(() => {
    return CURATED_UNSPLASH_BANNERS.filter((b) => {
      const matchCategory =
        activeCategory === "All" || b.category === activeCategory;
      const matchSearch =
        !searchQuery.trim() ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = async (photo: UnsplashPhoto) => {
    try {
      setIsApplying(photo.id);
      await onSelectCover(photo.url);
      onClose();
    } catch (err) {
      toast.error("Failed to update cover image");
    } finally {
      setIsApplying(null);
    }
  };

  const handleApplyCustomUrl = async () => {
    const trimmed = customUrl.trim();
    if (!trimmed) {
      toast.error("Please enter a valid Unsplash or image URL");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("URL must begin with http:// or https://");
      return;
    }

    try {
      setIsApplying("custom");
      await onSelectCover(trimmed);
      toast.success("Custom banner applied");
      onClose();
    } catch (err) {
      toast.error("Failed to apply custom cover URL");
    } finally {
      setIsApplying(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsplash-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="unsplash-modal-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                >
                  Unsplash Cover Banners
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  HD Quality
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a professional cover photo from Unsplash for your workspace profile
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 space-y-3 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Gallery vs Custom URL Tab */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("gallery")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "gallery"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Curated Gallery</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "custom"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Custom Unsplash URL</span>
              </button>
            </div>

            {/* Quick Unsplash Attribution Badge */}
            <a
              href="https://unsplash.com/?utm_source=empsphere&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <span>Photos via</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">Unsplash</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {activeTab === "gallery" ? (
            <>
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by keyword, style, workspace, or photographer..."
                  className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      activeCategory === cat
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Custom Unsplash URL Input Section */
            <div className="space-y-3 pt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Found a photo on{" "}
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 underline"
                >
                  Unsplash.com
                </a>
                ? Paste the image URL or direct link below to use it as your profile cover banner.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  disabled={!customUrl.trim() || isApplying === "custom"}
                  onClick={handleApplyCustomUrl}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  {isApplying === "custom" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Apply Banner</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Gallery Grid Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[260px] max-h-[58vh]">
          {activeTab === "gallery" ? (
            filteredBanners.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No photos match your search
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Try searching for another keyword such as &quot;office&quot;, &quot;gradient&quot;, &quot;forest&quot;, or click &quot;All&quot; to browse the full curated set.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                  className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredBanners.map((photo) => {
                  const isCurrent = currentCoverUrl === photo.url;
                  const isLoading = isApplying === photo.id;

                  return (
                    <div
                      key={photo.id}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video shadow-xs hover:shadow-md transition-all flex flex-col justify-end"
                    >
                      {/* Photo Thumbnail */}
                      <img
                        src={photo.thumbUrl}
                        alt={photo.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Subtle Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                      {/* Current active badge */}
                      {isCurrent && (
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow">
                          <Check className="w-2.5 h-2.5" />
                          <span>Active Cover</span>
                        </div>
                      )}

                      {/* Photo Info & Select Action */}
                      <div className="relative z-10 p-3 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate drop-shadow-xs">
                            {photo.title}
                          </p>
                          <a
                            href={`${photo.author.link}?utm_source=empsphere&utm_medium=referral`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-slate-300 hover:text-white truncate block hover:underline"
                          >
                            by {photo.author.name}
                          </a>
                        </div>

                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleSelect(photo)}
                          className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1 ${
                            isCurrent
                              ? "bg-slate-700/90 text-white hover:bg-slate-600"
                              : "bg-white hover:bg-blue-50 text-slate-900 group-hover:bg-blue-600 group-hover:text-white"
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isCurrent ? (
                            <span>Selected</span>
                          ) : (
                            <span>Use</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Custom URL Preview Card */
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
              {customUrl ? (
                <div className="w-full max-w-lg space-y-3">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <img
                      src={customUrl}
                      alt="Custom Preview"
                      onError={() => toast.error("Could not load preview. Please verify URL is a direct image link.")}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preview of custom image banner
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Paste an image URL
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter any Unsplash or web image link above to instantly preview and set it as your banner.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <span>
            Photos licensed under the{" "}
            <a
              href="https://unsplash.com/license"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              Unsplash License
            </a>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default UnsplashCoverModal;
