"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MockExamNavbar } from "@/components/mock/MockExamNavbar";
import { CountryCodeSelector } from "@/components/ui/CountryCodeSelector";

interface ExamTermsProps {
    isRegistered: boolean;
    editableName: string;
    setEditableName: (val: string) => void;
    editablePhone: string;
    setEditablePhone: (val: string) => void;
    nameError: string;
    phoneError: string;
    countryCode: string;
    setCountryCode: (code: string) => void;
    whatsappConfirmed: boolean;
    setWhatsappConfirmed: (val: boolean) => void;
    termsAccepted: boolean;
    setTermsAccepted: (val: boolean) => void;
    isSubmitting: boolean;
    onBack: () => void;
    onSubmit: () => void;
}

export function ExamTerms({
    isRegistered,
    editableName,
    setEditableName,
    editablePhone,
    setEditablePhone,
    nameError,
    phoneError,
    countryCode,
    setCountryCode,
    whatsappConfirmed,
    setWhatsappConfirmed,
    termsAccepted,
    setTermsAccepted,
    isSubmitting,
    onBack,
    onSubmit
}: ExamTermsProps) {
    return (
        <div className="min-h-[100dvh] bg-white flex flex-col font-sans">
            <MockExamNavbar title="بيانات المتقدم والشروط" />
            <main className="flex-1 flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
                    <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 mx-auto border border-amber-100">
                            <ShieldCheck size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">البيانات والشروط</h2>
                        <p className="text-slate-400 text-sm text-center mb-6">يرجى التأكد من بياناتك والموافقة على الشروط للبدء</p>
                        
                        {/* Identity Fields */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-[#16539a]" /> بيانات المتقدم
                            </h3>
                            
                            <div className="space-y-4 text-right" dir="rtl">
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-bold text-sm">الاسم الكامل (بالعربية)</Label>
                                    <div className="relative">
                                        <User className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                                        <Input 
                                            className={`pl-4 pr-12 h-12 text-base rounded-xl border-slate-200 focus:border-[#16539a] focus:ring-[#16539a]/20 transition-all ${nameError ? 'border-red-500 bg-red-50' : 'bg-white'}`} 
                                            placeholder="أدخل اسمك ..."
                                            value={editableName}
                                            onChange={e => setEditableName(e.target.value)}
                                        />
                                    </div>
                                    {nameError && <p className="text-red-500 text-xs font-bold mt-1 pr-1">{nameError}</p>}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-bold text-sm">رقم الواتساب (لإرسال النتيجة)</Label>
                                    
                                    {/* Phone Number Input Layout with Country Selector */}
                                    <div className={`relative flex items-center bg-white border rounded-xl focus-within:border-[#16539a] focus-within:ring-2 focus-within:ring-[#16539a]/20 transition-all h-14 w-full overflow-hidden ${phoneError ? 'border-red-500' : 'border-slate-200'}`}>
                                        <CountryCodeSelector 
                                            selectedCode={countryCode}
                                            onSelect={setCountryCode}
                                            disabled={isSubmitting || isRegistered}
                                        />
                                        <div className="relative flex-1 h-full">
                                            <Phone className="absolute right-4 top-4.5 text-slate-355 w-5 h-5 pointer-events-none" />
                                            <Input 
                                                className="w-full h-full px-4 pr-12 text-xl border-0 focus:ring-0 bg-transparent font-mono focus-visible:ring-0 focus-visible:ring-offset-0 outline-none placeholder:text-slate-300" 
                                                placeholder="7XX XXX XXX"
                                                dir="ltr"
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                readOnly={isRegistered}
                                                value={editablePhone}
                                                onChange={e => setEditablePhone(e.target.value.replace(/\D/g, ''))}
                                            />
                                        </div>
                                    </div>
                                    {phoneError && <p className="text-red-500 text-xs font-bold mt-1 pr-1">{phoneError}</p>}
                                </div>
                                
                                <div 
                                    className="flex items-start gap-3 mt-4 bg-green-50/60 p-3 rounded-lg border border-green-200/60 hover:border-green-300 transition-colors cursor-pointer" 
                                    onClick={() => setWhatsappConfirmed(!whatsappConfirmed)}
                                >
                                    <Checkbox 
                                        checked={whatsappConfirmed}
                                        className="w-5 h-5 rounded-md data-[state=checked]:bg-[#5c9e45] border-green-300 border-2 pointer-events-none mt-0.5 shrink-0"
                                    />
                                    <Label className="text-sm font-bold text-[#4d853a] pointer-events-none leading-relaxed">
                                        أُقر بأن هذا الرقم صحيح ومفعل عليه واتساب لاستلام النتيجة
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Terms Checkbox */}
                        <div 
                            className="flex items-start gap-3 mb-8 bg-slate-50 p-4 rounded-xl border-2 border-slate-100 hover:border-slate-200 transition-colors cursor-pointer" 
                            onClick={() => setTermsAccepted(!termsAccepted)}
                        >
                            <Checkbox 
                                checked={termsAccepted}
                                className="w-5 h-5 rounded-md data-[state=checked]:bg-[#16539a] border-slate-300 border-2 pointer-events-none mt-0.5 shrink-0"
                            />
                            <Label className="text-sm font-bold text-slate-700 pointer-events-none leading-relaxed text-right" dir="rtl">
                                لقد قرأت <span className="text-[#16539a] underline">الشروط والأحكام</span> وأوافق عليها بالكامل.
                            </Label>
                        </div>

                        <div className="flex gap-3">
                            <Button 
                                onClick={onBack} 
                                variant="outline" 
                                disabled={isSubmitting}
                                className="w-[30%] h-14 text-base font-bold rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                رجوع
                            </Button>
                            <Button 
                                onClick={onSubmit} 
                                disabled={!termsAccepted || !whatsappConfirmed || isSubmitting}
                                className="w-[70%] h-14 text-base font-bold bg-gradient-to-l from-[#5c9e45] to-green-600 hover:from-[#4d853a] hover:to-[#5c9e45] text-white rounded-2xl shadow-xl shadow-green-900/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>جاري التحضير...</span>
                                    </>
                                ) : "ابدأ الاختبار الآن"}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
