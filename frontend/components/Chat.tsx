"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Welcome to Lexora. I'm your private intelligence assistant. Upload your documents to the left, and I'll help you analyze them instantly.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/ask_stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: currentInput }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantMessageId 
                ? { ...msg, content: accumulatedContent } 
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to ask question", error);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantMessageId 
            ? { ...msg, content: "My apologies, but I've encountered a connectivity issue. Please ensure the local intelligence server is active." } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-1 flex-col bg-zinc-50 dark:bg-[#09090b]">
      <header className="flex h-16 items-center border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Active Intelligence Session</h1>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-10 space-y-8 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "flex w-full gap-5",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div 
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm shadow-sm transition-all duration-300",
                    message.role === "assistant" 
                      ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-indigo-500" 
                      : "bg-indigo-600 border-indigo-500 text-white"
                  )}
                >
                  {message.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ring-1",
                    message.role === "user"
                      ? "bg-indigo-600 text-white ring-indigo-500"
                      : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 ring-zinc-200 dark:ring-zinc-800"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && !messages[messages.length-1].content && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-full justify-start gap-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-white dark:bg-zinc-900 text-indigo-500 border-zinc-200 dark:border-zinc-800">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-4 text-sm shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl relative">
          <div className="group relative transition-all duration-300">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur group-within:opacity-40 transition duration-300" />
            <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden px-1">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask your documents. Make inquiries. Extract knowledge..."
                className="w-full resize-none border-none bg-transparent px-4 py-4 text-sm focus:ring-0 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 m-2"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 font-medium px-2 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-full px-2 py-0.5 bg-zinc-50 dark:bg-zinc-900">
              <Sparkles className="h-3 w-3 text-amber-500" /> Powered by Mistral 7B
            </span>
            <span>Local Encryption Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
