"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, Upload, Trash2, Plus, MessageSquare, Loader2, LayoutDashboard, Settings, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadDocument, getDocuments, deleteDocument as apiDeleteDocument } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface Document {
  id: string;
  name: string;
  size?: string;
}

export default function Sidebar() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs.map((doc: any, index: number) => ({
        id: index.toString(),
        name: typeof doc === 'string' ? doc : doc.name
      })));
    } catch (error) {
      console.error("Failed to fetch documents", error);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadDocument(file);
      await fetchDocuments();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await apiDeleteDocument(name);
      await fetchDocuments();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  return (
    <div className="flex h-screen w-72 flex-col border-r bg-zinc-950 text-zinc-400">
      <div className="flex items-center gap-3 border-b border-zinc-900 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-white leading-none">Lexora</span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mt-1">Local Intelligence</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        <div>
          <div className="mb-4 flex items-center justify-between px-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Navigation
            </h2>
          </div>
          <div className="space-y-1">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white bg-zinc-900 shadow-sm ring-1 ring-zinc-800">
              <LayoutDashboard className="h-4 w-4 text-indigo-400" />
              Chat Dashboard
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-900 hover:text-white transition-all duration-200">
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-900 hover:text-white transition-all duration-200">
              <Info className="h-4 w-4" />
              Help & Info
            </button>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between px-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Documents Inventory
            </h2>
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="rounded-full p-1.5 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {documents.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 text-xs text-zinc-600 italic"
                >
                  No documents synced.
                </motion.p>
              ) : (
                documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-zinc-900/50 hover:text-white transition-all duration-200 border border-transparent hover:border-zinc-800"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-900 shrink-0">
                        <FileText className="h-4 w-4 text-indigo-400" />
                      </div>
                      <span className="truncate text-zinc-300 group-hover:text-white">{doc.name}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.name)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-900">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt"
          className="hidden"
        />
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          )}
          <span>{isUploading ? "Processing..." : "Sync New File"}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
}
