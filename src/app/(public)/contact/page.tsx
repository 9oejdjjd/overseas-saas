"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { Footer } from "@/components/mock/LandingComponents";
import { SITE_CONFIG } from "@/config/site";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending] = useState(false);

    const handleSubmit = () => {
        if (!formData.name || !formData.message) return;
        
        setSending(true);
        
        // Build WhatsApp message with form data
        const whatsappMessage = encodeURIComponent(
            `📩 رسالة جديدة من صفحة "اتصل بنا"\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👤 الاسم: ${formData.name}\n` +
            `📱 الهاتف: ${formData.phone || "غير محدد"}\n` +
            `📧 البريد: ${formData.email || "غير محدد"}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `💬 الرسالة:\n${formData.message}`
        );
        
        // Small delay for UX feedback
        setTimeout(() => {
            setSending(false);
            setSubmitted(true);
            
            // Open WhatsApp with the message
            window.open(`https://wa.me/${SITE_CONFIG.supportWhatsapp}?text=${whatsappMessage}`, "_blank");
        }, 800);
    };

    return (
        <main className="min-h-screen font-sans selection:bg-[#16539a] selection:text-white bg-mesh-gradient text-slate-800">

            {/* HERO SECTION */}
            <header className="relative pt-40 md:pt-48 pb-16 overflow-hidden border-b border-slate-150/40">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#16539a]/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto px-6 md:px-10 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-[#16539a] text-sm font-bold mb-6 shadow-sm">
                        <Sparkles size={16} className="text-[#5c9e45]" /> يسعدنا تواصلك دائماً
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight">
                        يسعدنا <span className="text-gradient-brand">تواصلك معنا</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-655 max-w-2xl mx-auto leading-relaxed font-semibold">
                        نحن هنا لمساعدتك والإجابة على استفساراتك. لا تتردد في التواصل مع فريق الدعم الفني المختص في التقييمات عبر قنواتنا أدناه.
                    </p>
                </div>
            </header>

            {/* CONTACT DETAILS & FORM */}
            <section className="py-16 pb-28 relative z-10">
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="grid lg:grid-cols-3 gap-10">

                        {/* Contact Information (Trust Signals) */}
                        <div className="lg:col-span-1 space-y-4">

                            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">رقم الهاتف</h3>
                                    <p className="text-slate-400 text-xs mb-2">للاتصال المباشر</p>
                                    <a href="tel:715454154" className="text-lg font-bold text-brand-blue dir-ltr text-left block hover:underline">
                                        715454154 967+
                                    </a>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-50 text-[#5c9e45] rounded-xl flex items-center justify-center shrink-0 border border-green-100">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">واتساب (دعم فني)</h3>
                                    <p className="text-slate-400 text-xs mb-2">للاستفسارات السريعة</p>
                                    <a href={SITE_CONFIG.supportWhatsappUrl} className="text-lg font-bold text-[#5c9e45] dir-ltr text-left block hover:underline">
                                        715454154 967+
                                    </a>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">البريد الإلكتروني</h3>
                                    <p className="text-slate-400 text-xs mb-2">لرسائل الدعم والاتفاقيات</p>
                                    <a href="mailto:alaa@overseas-travels.com" className="text-[15px] font-bold text-slate-655 hover:text-brand-blue transition-colors hover:underline">
                                        alaa@overseas-travels.com
                                    </a>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0 border border-orange-100">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">أوقات العمل</h3>
                                    <p className="text-slate-400 text-xs mb-1">الأحد - الخميس</p>
                                    <p className="text-sm font-bold text-slate-600">08:00 صباحاً - 05:00 مساءً</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-slate-100/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#16539a]/5 rounded-bl-full blur-[50px] pointer-events-none"></div>

                            <h2 className="text-2xl font-bold text-slate-800 mb-8 border-r-4 border-[#5c9e45] pr-4">أرسل لنا رسالة</h2>

                            {submitted ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100">
                                        <CheckCircle className="w-10 h-10 text-[#5c9e45]" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-850 mb-3">تم إرسال رسالتك بنجاح!</h3>
                                    <p className="text-slate-500 mb-8 max-w-md font-semibold">سيتم فتح محادثة واتساب لإكمال إرسال رسالتك. سيقوم فريقنا بالرد عليك في أقرب وقت.</p>
                                    <button
                                        onClick={() => { setSubmitted(false); setFormData({ name: "", phone: "", email: "", message: "" }); }}
                                        className="px-8 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                                    >
                                        إرسال رسالة أخرى
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 relative z-10">
                                    <div className="grid md:grid-cols-2 gap-6 text-right">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-600">الاسم الكامل <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#16539a] focus:ring-4 focus:ring-brand-blue/5 rounded-xl px-4 py-3 outline-none transition-all text-slate-800 placeholder-slate-400 font-medium"
                                                placeholder="الاسم الأول والأخير"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-600">رقم الهاتف</label>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#16539a] focus:ring-4 focus:ring-brand-blue/5 rounded-xl px-4 py-3 outline-none transition-all text-left text-slate-800 placeholder-slate-400 font-latin font-medium"
                                                dir="ltr"
                                                placeholder="7** *** *** "
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <label className="text-sm font-bold text-slate-600">البريد الإلكتروني (اختياري)</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#16539a] focus:ring-4 focus:ring-brand-blue/5 rounded-xl px-4 py-3 outline-none transition-all text-left text-slate-800 placeholder-slate-400 font-latin font-medium"
                                            dir="ltr"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <label className="text-sm font-bold text-slate-600">رسالتك <span className="text-red-500">*</span></label>
                                        <textarea
                                            rows={5}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#16539a] focus:ring-4 focus:ring-brand-blue/5 rounded-xl px-4 py-3 outline-none transition-all resize-none text-slate-800 placeholder-slate-400 font-medium"
                                            placeholder="كيف يمكننا مساعدتك؟"
                                        ></textarea>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!formData.name || !formData.message || sending}
                                        className="w-full bg-[#16539a] hover:bg-[#1f66b8] text-white font-bold text-lg py-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                                    >
                                        {sending ? (
                                            <><Loader2 size={20} className="animate-spin" /> جاري الإرسال...</>
                                        ) : (
                                            <>إرسال الرسالة <Send size={20} className="rotate-180" /></>
                                        )}
                                    </button>
                                    <p className="text-xs text-slate-400 text-center font-bold">
                                        سيتم فتح محادثة واتساب تلقائياً لإرسال رسالتك إلى فريق الدعم
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Global Footer */}
            <Footer />
        </main>
    );
}
