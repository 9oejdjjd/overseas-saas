"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { countries } from "@/constants/countries";

interface CountryCodeSelectorProps {
    selectedCode: string;
    onSelect: (code: string) => void;
    disabled?: boolean;
}

export function CountryCodeSelector({ selectedCode, onSelect, disabled = false }: CountryCodeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredCountries = countries.filter(c => 
        c.name.includes(searchQuery) || c.code.includes(searchQuery)
    );

    const activeCountry = countries.find(c => c.code === selectedCode) || countries[0];

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="h-full flex items-center relative" ref={dropdownRef}>
            <button 
                type="button" 
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`h-full px-2 md:px-4 flex items-center justify-center gap-1.5 md:gap-2 border-l border-slate-200 hover:bg-slate-100/50 transition-colors rounded-r-xl md:rounded-r-2xl text-slate-700 bg-slate-50/50 min-w-[90px] md:min-w-[110px] ${disabled ? "cursor-not-allowed opacity-80" : ""}`}
                dir="ltr"
            >
                <span className="text-lg md:text-2xl leading-none drop-shadow-sm">{activeCountry.flag}</span>
                <span className="font-mono font-bold text-sm md:text-base text-slate-800" dir="ltr">{selectedCode}</span>
                {!disabled && (
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ml-0.5 ${isOpen ? 'rotate-180 text-[#16539a]' : ''}`} />
                )}
            </button>
            
            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-[calc(100%+8px)] right-0 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-100 w-[280px] md:w-72 overflow-hidden z-[100] flex flex-col"
                    >
                        {/* Search Input */}
                        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                                <Input 
                                    autoFocus
                                    placeholder="ابحث بالدولة أو الرمز..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="h-10 pl-3 pr-9 border-slate-200 focus:border-[#16539a] text-sm bg-white rounded-xl shadow-sm text-right font-sans"
                                />
                            </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                            {filteredCountries.length > 0 ? filteredCountries.map(c => (
                                <button 
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                        onSelect(c.code);
                                        setIsOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className={`w-full p-3 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors mb-1 ${selectedCode === c.code ? 'bg-blue-50 text-[#16539a] border border-blue-100' : 'text-slate-700 border border-transparent'}`}
                                    dir="ltr"
                                >
                                    <span className="text-2xl leading-none">{c.flag}</span>
                                    <span className="flex-1 text-right pr-4 font-bold">{c.name}</span>
                                    <span className="font-mono font-medium text-slate-500 w-16 text-left">{c.code}</span>
                                </button>
                            )) : (
                                <div className="p-6 text-center text-slate-400 font-medium">لم يتم العثور على نتائج</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
