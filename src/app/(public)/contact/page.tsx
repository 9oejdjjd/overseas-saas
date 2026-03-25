import { Metadata } from "next";
import { Mail, Phone, MapPin, Clock, MessageCircle, Send } from "lucide-react";

export const metadata: Metadata = {
    title: "اتصل بنا | بوابة الاعتماد المهني",
    description: "تواصل مع فريق الدعم الفني وخدمة العملاء في بوابة الاعتماد المهني. نحن هنا لمساعدتك في أي استفسار حول الاختبارات التجريبية أو الاعتماد المهني.",
    keywords: "اتصل بنا, الدعم الفني, خدمة العملاء, بوابة الاعتماد المهني, رقم التواصل"
};

export default function ContactPage() {
    return (
        <main className="min-h-screen font-sans selection:bg-[#16539a] selection:text-white bg-[#0a0f1c] text-white">
            
            {/* HERO SECTION */}
            <header className="relative pt-40 md:pt-48 pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#16539a]/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/20 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="max-w-5xl mx-auto px-6 md:px-10 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                        يسعدنا <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#5c9e45]">تواصلك معنا</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        نحن هنا لمساعدتك والإجابة على استفساراتك. لا تتردد في التواصل مع فريق الدعم الفني المختص في التقييمات عبر قنواتنا أدناه.
                    </p>
                </div>
            </header>

            {/* CONTACT DETAILS & FORM */}
            <section className="py-10 pb-24 relative z-10">
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="grid lg:grid-cols-3 gap-10">
                        
                        {/* Contact Information (Trust Signals) */}
                        <div className="lg:col-span-1 space-y-4">
                            
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/20">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">رقم الهاتف</h3>
                                    <p className="text-slate-400 text-sm mb-2">للاتصال المباشر</p>
                                    <a href="tel:777263111" className="text-lg font-bold text-blue-400 dir-ltr text-left block">
                                        +967 777263111
                                    </a>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#5c9e45]/10 text-[#5c9e45] rounded-xl flex items-center justify-center shrink-0 border border-[#5c9e45]/20">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">واتساب (دعم فني)</h3>
                                    <p className="text-slate-400 text-sm mb-2">للاستفسارات السريعة</p>
                                    <a href="https://wa.me/967777263111" className="text-lg font-bold text-[#5c9e45] dir-ltr text-left block">
                                        +967 777263111
                                    </a>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors flex items-start gap-4">
                                <div className="w-12 h-12 bg-slate-500/10 text-slate-300 rounded-xl flex items-center justify-center shrink-0 border border-slate-500/20">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">البريد الإلكتروني</h3>
                                    <p className="text-slate-400 text-sm mb-2">لرسائل الدعم والاتفاقيات</p>
                                    <a href="mailto:alaa@overseas-travels.com" className="text-[15px] font-bold text-slate-300 hover:text-white transition-colors">
                                        alaa@overseas-travels.com
                                    </a>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors flex items-start gap-4">
                                <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center shrink-0 border border-orange-500/20">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">أوقات العمل</h3>
                                    <p className="text-slate-400 text-sm mb-1">الأحد - الخميس</p>
                                    <p className="text-sm font-bold text-slate-300">08:00 صباحاً - 05:00 مساءً</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2 bg-[#0d1425] border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#16539a]/10 rounded-bl-full blur-[50px] pointer-events-none"></div>
                            
                            <h2 className="text-2xl font-bold text-white mb-8 border-r-4 border-[#5c9e45] pr-4">أرسل لنا رسالة</h2>
                            
                            <form className="space-y-6 relative z-10">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">الاسم الكامل</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-900 border border-slate-700/50 focus:border-[#5c9e45] focus:ring-1 focus:ring-[#5c9e45]/50 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder-slate-600"
                                            placeholder="الاسم الأول والأخير"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">رقم الهاتف</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-900 border border-slate-700/50 focus:border-[#5c9e45] focus:ring-1 focus:ring-[#5c9e45]/50 rounded-xl px-4 py-3 outline-none transition-all text-left text-white placeholder-slate-600"
                                            dir="ltr"
                                            placeholder="مثال: 777263111"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400">البريد الإلكتروني (اختياري)</label>
                                    <input 
                                        type="email" 
                                        className="w-full bg-slate-900 border border-slate-700/50 focus:border-[#16539a] focus:ring-1 focus:ring-[#16539a]/50 rounded-xl px-4 py-3 outline-none transition-all text-left text-white placeholder-slate-600"
                                        dir="ltr"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400">رسالتك</label>
                                    <textarea 
                                        rows={5}
                                        className="w-full bg-slate-900 border border-slate-700/50 focus:border-[#16539a] focus:ring-1 focus:ring-[#16539a]/50 rounded-xl px-4 py-3 outline-none transition-all resize-none text-white placeholder-slate-600"
                                        placeholder="كيف يمكننا مساعدتك؟"
                                    ></textarea>
                                </div>
                                <button 
                                    type="button"
                                    className="w-full bg-[#16539a] hover:bg-[#1e66b8] text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    إرسال الرسالة <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
