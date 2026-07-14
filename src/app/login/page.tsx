"use client";

import { useState } from "react";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Mail, Loader2, ShieldCheck, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await nextAuthSignIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res?.error) {
                setError("بيانات الدخول غير صحيحة. يرجى التحقق وإعادة المحاولة.");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-stretch font-sans text-right" dir="rtl">
            
            {/* LEFT SIDE: Brand Panel Showcase (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#16539a] to-blue-950 text-white flex-col justify-between p-16 relative overflow-hidden">
                {/* Background Patterns */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:30px_30px]" />
                <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px]" />
                
                {/* Header Logo fallback */}
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <img 
                            src="/logo2.png" 
                            alt="بوابة الاعتماد المهني" 
                            className="h-16 w-auto object-contain brightness-110"
                            width="200"
                        />
                    </Link>
                </div>

                {/* Hero Feature Showcase */}
                <div className="relative z-10 max-w-lg my-auto space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                        <Sparkles size={14} className="text-brand-green animate-pulse" />
                        <span className="text-xs font-bold text-blue-100">نظام الإدارة المركزي للخدمات</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black leading-tight text-white">
                        بوابة الاعتماد المهني <br/>
                        <span className="text-brand-green">تأهيل وتمكين مستمر</span>
                    </h2>

                    <p className="text-blue-100/80 leading-relaxed font-semibold">
                        سجل دخولك الآن لإدارة باقات الاختبارات التجريبية، متابعة نتائج المتقدمين، وضبط الرسوم والسياسات الخاصة بالمنصة بكل سهولة واقتدار.
                    </p>

                    <div className="space-y-4 pt-4">
                        {[
                            "إدارة فورية وبسيطة لباقات الاختبارات",
                            "تقارير وإحصائيات النجاح والرسوب للعمالة",
                            "تغطية فنية كاملة لأكثر من 30 مهنة حرفية"
                        ].map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm font-bold text-blue-100/90">
                                <CheckCircle2 size={18} className="text-brand-green shrink-0" />
                                <span>{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer terms */}
                <div className="relative z-10 text-xs text-blue-200/60 flex justify-between items-center">
                    <p>© {new Date().getFullYear()} بوابة الاعتماد المهني. جميع الحقوق محفوظة.</p>
                    <div className="flex gap-4">
                        <Link href="/" className="hover:text-white transition-colors">الشروط والأحكام</Link>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Interactive Login Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-mesh-gradient relative">
                {/* Floating back button to home page */}
                <Link 
                    href="/" 
                    className="absolute top-8 left-8 p-3 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800"
                >
                    <ArrowLeft size={18} className="rotate-180" />
                </Link>

                <div className="w-full max-w-md bg-white border border-slate-200/80 p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-100/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#16539a]/5 rounded-bl-full blur-[40px] pointer-events-none"></div>

                    {/* Logo Mobile / Form Header */}
                    <div className="text-center lg:text-right mb-8">
                        <div className="lg:hidden flex justify-center mb-6">
                            <img 
                                src="/logo1.png" 
                                alt="بوابة الاعتماد المهني" 
                                className="h-12 w-auto object-contain"
                                width="180"
                            />
                        </div>
                        <h3 className="text-2xl font-black text-slate-850 mb-2">تسجيل الدخول</h3>
                        <p className="text-xs text-slate-400 font-bold">يرجى إدخال بيانات حساب المشرف الخاص بك للوصول</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-xs font-bold mb-6 flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-650 shrink-0 mt-1.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-600">البريد الإلكتروني</label>
                            <div className="relative">
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Mail size={16} className="text-brand-blue" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full h-12 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#16539a] focus:ring-4 focus:ring-brand-blue/5 rounded-xl pl-4 pr-11 text-sm text-slate-800 placeholder-slate-400 font-latin font-semibold outline-none transition-all"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2 text-right">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black text-slate-600">كلمة المرور</label>
                                <Link href="#" className="text-[11px] font-bold text-brand-blue hover:underline">
                                    نسيت كلمة المرور؟
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock size={16} className="text-brand-blue" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-12 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#16539a] focus:ring-4 focus:ring-brand-blue/5 rounded-xl pl-4 pr-11 text-sm text-slate-800 placeholder-slate-400 font-latin font-semibold outline-none transition-all"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2.5 py-1 text-right">
                            <input 
                                type="checkbox" 
                                id="remember" 
                                className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/20 pointer-events-auto"
                            />
                            <label htmlFor="remember" className="text-xs text-slate-500 font-bold cursor-pointer">تذكر هذا الجهاز</label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#16539a] hover:bg-[#1f66b8] text-white rounded-xl font-bold shadow-md shadow-blue-900/10 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> جاري التحقق...</>
                            ) : (
                                <>سجل الدخول <ChevronRight size={16} className="rotate-180" /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
