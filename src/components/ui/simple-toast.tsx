"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto min-w-[300px] max-w-md p-4 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 transform transition-all",
                            t.type === "success" && "bg-green-600 text-white",
                            t.type === "error" && "bg-red-600 text-white",
                            t.type === "info" && "bg-blue-600 text-white"
                        )}
                    >
                        {t.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                        {t.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        {t.type === "info" && <Info className="w-5 h-5 flex-shrink-0" />}

                        <p className="text-sm font-medium flex-1">{t.message}</p>

                        <button onClick={() => removeToast(t.id)} className="opacity-80 hover:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
