"use client";

import { useState } from "react";
import { FolderOpen, FileText, CheckCircle2, AlertCircle, Trash2, Plus, File, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, extractApiError } from "@/lib/api";

export const DocumentsTab = () => {
  const { user, setUser } = useAuth();
  
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  
  const documents = user?.documents || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    setSaving(true);
    setMsg(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      
      const newDoc = {
        title: file.name,
        type: file.type,
        url,
        uploadedAt: new Date().toISOString()
      };

      try {
        const res = await api.patch("/users/me", {
          documents: [...documents, newDoc]
        });
        setUser(res.data.data.user);
        setMsg({ type: "success", text: "Document uploaded successfully." });
      } catch (err) {
        const { message } = extractApiError(err);
        setMsg({ type: "error", text: message });
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (indexToDelete: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    setSaving(true);
    setMsg(null);

    const newDocs = documents.filter((_, i) => i !== indexToDelete);

    try {
      const res = await api.patch("/users/me", {
        documents: newDocs
      });
      setUser(res.data.data.user);
      setMsg({ type: "success", text: "Document deleted successfully." });
    } catch (err) {
      const { message } = extractApiError(err);
      setMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="w-8 h-8 text-rose-500" />;
    if (type.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-slate-500" />;
  };

  return (
    <div className="rounded-[24px] border border-slate-200/60 bg-white p-7 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-sky-500" />
      
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h3 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-sky-500" /> My Documents
          </h3>
          <p className="text-[13.5px] text-slate-500 mt-1 font-medium">
            Manage your offer letters, ID proofs, and compliance documents.
          </p>
        </div>
        
        <div>
          <label 
            htmlFor="document-upload"
            className={`px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-[13px] hover:bg-sky-600 shadow-sm shadow-sky-500/20 hover:shadow-md transition-all flex items-center gap-2 cursor-pointer ${saving ? 'opacity-50 pointer-events-none' : ''}`}
          >
             <Plus className="w-4 h-4" /> Add Document
          </label>
          <input 
            id="document-upload" 
            type="file" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={saving}
          />
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-[13.5px] font-bold mb-6 ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50">
          <FolderOpen className="w-12 h-12 text-slate-300 mb-3" />
          <h4 className="text-[15px] font-bold text-slate-700">No documents yet</h4>
          <p className="text-[13px] text-slate-500 mt-1 max-w-sm">
            Upload your first document by clicking the Add Document button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc, index) => (
            <div key={index} className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-md hover:shadow-sky-500/10 transition-all flex flex-col relative">
              
              <button
                onClick={() => handleDelete(index)}
                disabled={saving}
                className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Delete Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  {getFileIcon(doc.type)}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="text-[14px] font-bold text-slate-900 truncate" title={doc.title}>
                    {doc.title}
                  </h4>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5 truncate">
                    {doc.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </p>
                </div>
              </div>
              
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </span>
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[12px] font-bold text-sky-600 hover:text-sky-700 hover:underline"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
