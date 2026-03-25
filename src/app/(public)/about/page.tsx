import { Metadata } from "next";
import { ShieldCheck, Users, Target, Award, Sparkles, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
    title: "من نحن | بوابة الاعتماد المهني",
    description: "تعرف على رؤيتنا وفريق الخبراء والمتخصصين وراء منصة بوابة الاعتماد المهني. نحن منصتك الأولى للتدريب واجتياز اختبار الاعتماد المهني السعودي.",
    keywords: "من نحن, فريق الخبراء, اعتماد مهني, خبراء سعوديين, اختبارات تجريبية, بوابة الاعتماد المهني"
};

export default function AboutPage() {
    return (
        <main className="min-h-screen font-sans selection:bg-[#16539a] selection:text-white bg-[#0a0f1c] text-white">
            
            {/* HERO SECTION */}
            <header className="relative pt-40 md:pt-48 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#16539a]/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/20 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="max-w-5xl mx-auto px-6 md:px-10 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-200 text-sm font-semibold mb-6">
                        <Sparkles size={16} className="text-[#5c9e45]" /> تعرف علينا عن قرب
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                        من نحن
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        منصة <span className="font-bold text-[#5c9e45]">بوابة الاعتماد المهني</span> هي وجهتك الأولى والموثوقة للاستعداد والتدريب العملي لاجتياز اختبارات الاعتماد المهني في المملكة العربية السعودية.
                    </p>
                </div>
            </header>

            {/* E-E-A-T SECTION */}
            <section className="py-20 relative bg-[#0d1425]">
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 md:p-14 backdrop-blur-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#16539a]/10 rounded-bl-full blur-[40px] -z-10"></div>
                        
                        <div className="flex flex-col lg:flex-row gap-12 items-center">
                            <div className="flex-1 w-full relative z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#16539a]/20 text-[#5c9e45] font-semibold text-sm mb-6 border border-[#16539a]/30">
                                    <Award size={16} /> الموثوقية والخبرة (E-E-A-T)
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                                    محتوى أُعِدّ بواسطة <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#5c9e45]">خبراء معتمدين</span>
                                </h2>
                                <p className="text-slate-300 md:text-lg mb-6 leading-relaxed">
                                    نفخر بأن قائمة الأسئلة، الاختبارات التجريبية، والمادة العلمية بالكامل في منصتنا قد تمت صياغتها ومراجعتها بدقة من قبل نخبة من <strong>الخبراء والفنيين المتخصصين السعوديين</strong> أصحاب الخبرة الميدانية الطويلة في سوق العمل.
                                </p>
                                <ul className="space-y-4 text-slate-400">
                                    <li className="flex items-center gap-3">
                                        <CheckCircle2 size={20} className="text-[#5c9e45]" />
                                        <span>مطابقة منهجية لمعايير الجهات الرسمية.</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle2 size={20} className="text-[#5c9e45]" />
                                        <span>محاكاة واقعية لبيئة الاختبار الفعلي.</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 w-full lg:w-[450px]">
                                <div className="bg-white/5 p-8 rounded-[1.5rem] border border-white/10 hover:border-[#5c9e45]/50 transition-colors text-center group">
                                    <Users className="w-10 h-10 text-[#5c9e45] mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                    <div className="text-4xl font-black text-white mb-2">+50</div>
                                    <div className="text-sm font-bold text-slate-400">خبير ومراجع</div>
                                </div>
                                <div className="bg-white/5 p-8 rounded-[1.5rem] border border-white/10 hover:border-[#16539a]/50 transition-colors text-center group">
                                    <ShieldCheck className="w-10 h-10 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                    <div className="text-4xl font-black text-white mb-2">100%</div>
                                    <div className="text-sm font-bold text-slate-400">محتوى موثوق</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* VISON AND MISSION */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Vision */}
                        <div className="bg-gradient-to-br from-[#16539a] to-blue-900 rounded-[2.5rem] p-10 md:p-14 text-white flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                            <Target className="w-32 h-32 text-blue-400/10 absolute -top-4 -right-4 group-hover:scale-110 transition-transform duration-500" />
                            
                            <h3 className="text-3xl font-extrabold mb-6 relative z-10 flex items-center gap-4">
                                رؤيتنا
                            </h3>
                            <p className="text-blue-100 text-lg leading-relaxed relative z-10">
                                أن نكون المرجع التدريبي الرقمي الأول على مستوى المملكة الذي يسهم في تمكين الكفاءات الفنية والعمالة الوافدة من إثبات مهاراتهم المهنية بكل ثقة واقتدار، ليكونوا شركاء حقيقيين في نهضة سوق العمل السعودي.
                            </p>
                        </div>
                        
                        {/* Mission */}
                        <div className="bg-gradient-to-br from-[#113a69] to-[#0a182e] rounded-[2.5rem] p-10 md:p-14 text-white flex flex-col justify-center relative overflow-hidden border border-white/10 group">
                            <ShieldCheck className="w-32 h-32 text-green-400/5 absolute -bottom-4 -left-4 group-hover:scale-110 transition-transform duration-500" />
                            
                            <h3 className="text-3xl font-extrabold mb-6 relative z-10 text-[#5c9e45]">
                                رسالتنا
                            </h3>
                            <p className="text-slate-300 text-lg leading-relaxed relative z-10">
                                تقديم نظام تقييم تجريبي متطور يحاكي الاختبارات الحقيقية للاعتماد المهني، مبني على أحدث المعايير المهنية لتخفيف توتر المختبرين ورفع نسبة نجاحهم واستعدادهم النظري والعملي من المحاولة الأولى.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
