"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    CheckCircle,
    AlertCircle,
    Calendar,
    BookOpen,
    ShieldCheck,
    ArrowLeft,
    PlayCircle,
    MessageCircle,
    ChevronDown,
    Activity,
    UserCheck,
    Award,
    HelpCircle,
    FileWarning,
    ClipboardList,
    Headphones,
    Mail,
    Phone,
} from "lucide-react";

// --- Brand Colors ---
export const brand = {
    blue: "#16539a",
    green: "#5c9e45",
    dark: "#0f172a",
    light: "#f8fafc",
};

// --- Animations ---
export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12 }
    }
};

// ---------------------------------------------------------------------------
// 2. PROBLEMS SECTION
// ---------------------------------------------------------------------------
export function ProblemsSection() {
    const problems = [
        { icon: HelpCircle, title: "الغموض في المتطلبات", desc: "الكثير من العاملين لا يدركون أهمية الاعتماد المهني أو الخطوات الرسمية المطلوبة لاجتيازه." },
        { icon: FileWarning, title: "رهبة الاختبار", desc: "القلق من عدم اجتياز الاختبار بسبب عدم الإلمام بطبيعة الأسئلة وصيغتها المطروحة." },
        { icon: AlertCircle, title: "صعوبة المصطلحات", desc: "قد يحتوي الاختبار على مصطلحات تقنية أو لغوية تبدو معقدة لبعض المهن الحرفية." },
        { icon: Calendar, title: "تعقيد إجراءات التسجيل", desc: "منصة التسجيل تتطلب دقة في إدخال البيانات، مما قد يشكل عائقاً بدون توجيه متخصص." }
    ];

    return (
        <section className="py-20 md:py-24 bg-white relative overflow-hidden">
            {/* Floating Background Elements */}
            <motion.div 
                animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-10 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 pointer-events-none"
            />
            <motion.div 
                animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 left-10 w-72 h-72 bg-blue-50/50 rounded-full blur-3xl opacity-50 pointer-events-none"
            />

            <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
                    variants={fadeUp}
                    className="text-center max-w-3xl mx-auto mb-14"
                >
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                        لماذا يواجه الكثيرون <span className="text-[#16539a]">صعوبة في الاعتماد المهني؟</span>
                    </h2>
                    <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                        إذا كنت تنوي السفر للعمل في المملكة العربية السعودية، فالاعتماد المهني خطوة إلزامية. تشير إحصائيات سوق العمل إلى أن <strong className="text-slate-800">أكثر من 68% من المتقدمين</strong> يواجهون صعوبات أو إخفاق في المحاولة الأولى بسبب عدم الإلمام الكافي بطبيعة الأسئلة النظرية أو الإجراءات الرسمية.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {problems.map((prob, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
                            className="group bg-slate-50 border border-slate-100 p-7 rounded-2xl hover:shadow-xl hover:shadow-[#16539a]/5 hover:-translate-y-2 hover:bg-white transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-bl-full" />
                            <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-[#e11d48] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-5 relative z-10">
                                <prob.icon size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-3 relative z-10">{prob.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed relative z-10">{prob.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// 3. SOLUTION SECTION
// ---------------------------------------------------------------------------
export function SolutionSection() {
    const steps = [
        { title: "نتولى إجراءات التسجيل", desc: "نقوم بكافة إجراءات التسجيل في المنصة الرسمية بدلاً عنك بشكل دقيق ومطابق للشروط." },
        { title: "شرح شامل وواضح", desc: "نوضح لك طبيعة الاختبار ونوعية الأسئلة بأسلوب احترافي ومبسط يسهل استيعابه." },
        { title: "حجز مواعيد الاختبار", desc: "نختار لك الوقت والمكان الأنسب وندير الحجوزات بدقة حتى يتم تأكيد الموعد النهائي." },
        { title: "تأهيل عبر اختبار تجريبي", desc: "نقيم مستواك من خلال أسئلة محاكية للاختبار الحقيقي ومطابقة لمهنتك تماماً." },
        { title: "متابعة مستمرة للنجاح", desc: "نقف بجانبك خطوة بخطوة، ونقدم الدعم اللازم حتى تجتاز الاختبار وتستلم الاعتماد." }
    ];

    return (
        <section className="py-20 md:py-24 bg-[#0f172a] text-white relative overflow-hidden">
            <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.35, 0.25] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-1/4 w-80 h-80 bg-[#16539a]/30 rounded-full blur-[100px] pointer-events-none" 
            />
            <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#5c9e45]/20 rounded-full blur-[100px] pointer-events-none" 
            />
            {/* Ambient particles */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-14 items-center relative z-10">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="relative">
                    <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold mb-5 leading-tight">
                        دع الأمر لنا — <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5c9e45] to-[#3b82f6]">نكفيك عناء الإجراءات بالكامل</span>
                    </motion.h2>
                    <motion.p variants={fadeUp} className="text-slate-400 text-base md:text-lg mb-10 leading-relaxed">
                        أياً كانت مهنتك — سواء كنت عامل تحميل، سائق، أو خياط — نحن نوفر لك الدعم الشامل للتوافق بشكل كامل مع اشتراطات ومسار <a href="https://hrsd.gov.sa/ar/labor-market-services/84042" target="_blank" rel="nofollow external noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4">وزارة الموارد البشرية والتنمية الاجتماعية</a> وبرنامج الفحص المهني السعودي.
                    </motion.p>

                    <div className="space-y-6 relative before:absolute before:inset-y-2 before:right-[17px] before:w-[2px] before:bg-slate-800">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                whileHover={{ x: -5 }}
                                className="relative flex gap-5 pl-4 group cursor-default"
                            >
                                <div className="relative z-10 w-9 h-9 rounded-full bg-slate-800 border-2 border-[#16539a] flex items-center justify-center shrink-0 group-hover:border-[#5c9e45] group-hover:bg-[#16539a] transition-colors duration-300">
                                    <div className="w-2 h-2 rounded-full bg-[#5c9e45] group-hover:bg-white group-hover:scale-125 transition-transform" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-[#5c9e45] transition-colors">{step.title}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Visual Card */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="relative h-[550px] hidden lg:block"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl border border-slate-700 backdrop-blur-md p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                            <div className="h-3 w-20 bg-slate-700 rounded-full" />
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-600" />
                                <div className="w-3 h-3 rounded-full bg-slate-600" />
                                <div className="w-3 h-3 rounded-full bg-slate-600" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="h-14 w-full bg-slate-800/50 rounded-xl border border-slate-700 flex items-center px-4 gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-slate-700" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-2 w-1/3 bg-slate-600 rounded-full" />
                                        <div className="h-2 w-1/4 bg-slate-700 rounded-full" />
                                    </div>
                                    {item === 2 && (
                                        <div className="w-6 h-6 rounded-full bg-[#5c9e45]/20 flex items-center justify-center">
                                            <CheckCircle size={14} className="text-[#5c9e45]" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ height: "0%" }}
                            whileInView={{ height: "100%" }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="absolute right-0 top-0 w-1 bg-gradient-to-b from-[#16539a] to-[#5c9e45] rounded-r-3xl shadow-[0_0_15px_#5c9e45]"
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// 5. PROCESS TIMELINE
// ---------------------------------------------------------------------------
export function TimelineSection() {
    const process = [
        { title: "التواصل وتقديم الطلب", desc: "أرسل بياناتك عبر الواتساب للبدء الفوري." },
        { title: "تسجيل حساب المنصة", desc: "نتولى عنك إنشاء الحساب وإتمام الإجراءات بدقة." },
        { title: "تحديد موعد الاختبار", desc: "نحجز لك الوقت والمكان الأنسب لاختبارك النهائي." },
        { title: "الاجتياز والاعتماد", desc: "استعد جيداً واجتز الاختبار بثقة تامة." }
    ];

    return (
        <section className="py-20 md:py-24 bg-white border-y border-slate-100 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
                <motion.div 
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                    variants={fadeUp}
                    className="text-center mb-16"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">آلية العمل وخطوات الاعتماد</h2>
                    <p className="text-slate-500 mt-3 text-lg">أربع خطوات مبسطة وموثوقة تفصلك عن الاعتماد المهني الرسمي</p>
                </motion.div>

                <div className="relative">
                    <div className="hidden md:block absolute top-1/2 right-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="h-full bg-gradient-to-l from-[#16539a] via-[#3b82f6] to-[#5c9e45]"
                        />
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative z-10">
                        {process.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2, type: "spring", stiffness: 100 }}
                                className="relative flex flex-col items-center text-center group"
                            >
                                <motion.div 
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 flex items-center justify-center text-xl font-bold text-[#16539a] mb-6 relative group-hover:border-[#16539a] group-hover:text-white group-hover:bg-[#16539a] transition-all duration-300 z-10"
                                >
                                    {i + 1}
                                    <div className="absolute inset-0 rounded-2xl bg-[#16539a] opacity-0 group-hover:opacity-10 transition-opacity blur-md -z-10" />
                                </motion.div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-[#16539a] transition-colors">{step.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed px-2">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// 6. TRUST SECTION
// ---------------------------------------------------------------------------
export function TrustSection() {
    const stats = [
        { label: "اختبار تجريبي تم تقييمه", value: "+٥٠,٠٠٠" },
        { label: "نسبة اجتياز أعلى لمن تدرب", value: "+٧٠٪" },
        { label: "مهنة وحرفة فنية مدعومة", value: "٢٥" }
    ];

    return (
        <section className="py-16 md:py-20 bg-slate-900 text-white relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#16539a]/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
                <div className="grid md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
                            className="text-center pt-8 md:pt-0 flex flex-col items-center justify-center group"
                        >
                            <motion.div 
                                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-[#16539a] to-[#5c9e45] mb-3 group-hover:scale-110 transition-transform duration-300"
                            >
                                {stat.value}
                            </motion.div>
                            <div className="text-slate-400 font-medium text-lg lg:text-xl group-hover:text-slate-200 transition-colors">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// 7. FAQ SECTION
// ---------------------------------------------------------------------------
export function FAQSection() {
    const faqs = [
        { q: "ما هو الاعتماد المهني؟", a: "هو تصريح إلزامي من المملكة العربية السعودية للعمالة الوافدة، يثبت كفاءة العامل وامتلاكه المهارات المطلوبة لمزاولة مهنته بشكل رسمي." },
        { q: "هل الاختبار التجريبي مجاني بالكامل؟", a: "نعم، نقدم الاختبار التجريبي مجاناً لتتمكن من تقييم مستواك والتدرب على صياغة الأسئلة قبل التقدم للاختبار النهائي." },
        { q: "هل أسئلة الاختبار التجريبي مطابقة للاختبار الفعلي؟", a: "الأسئلة مصممة بعناية لتحاكي أسلوب ومستوى أسئلة الاعتماد المهني السعودي، لتهيئتك بأفضل طريقة ممكنة، لكنها لا تمثل تسريباً للاختبار الرسمي." },
        { q: "كيف يمكنني بدء إجراءات التسجيل معكم؟", a: "الأمر في غاية البساطة. يمكنك التواصل معنا عبر الواتساب أو البدء بالبحث عن مهنتك في الموقع وتجربة الاختبار؛ وسيقوم فريقنا بمتابعة كافة إجراءاتك." },
        { q: "كم يستغرق التحضير لاجتياز الاختبار؟", a: "تختلف المدة بناءً على خبرتك والمستوى الفني. يجتاز البعض من المحاولة الأولى بعد تدريب قصير، بينما يحتاج البعض لمزيد من المتابعة الدقيقة التي نوفرها بكل احترافية." },
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-20 md:py-24 bg-[#f8fafc] relative overflow-hidden">
            {/* Soft background decor */}
            <div className="absolute top-0 right-0 w-[800px] h-[400px] bg-gradient-to-tl from-slate-200/40 to-transparent -rotate-12 transform origin-top-right mix-blend-multiply pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-50/60 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl mx-auto px-6 md:px-10 relative z-10">
                <motion.div 
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={fadeUp}
                    className="text-center mb-14"
                >
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">الأسئلة الشائعة</h2>
                    <p className="text-slate-500 mt-4 text-lg">إجابات وافية لأكثر الاستفسارات التي تهمك حول الاعتماد المهني</p>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-[#16539a]/30 transition-colors shadow-sm hover:shadow-md"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-5 md:p-6 text-right focus:outline-none"
                            >
                                <span className={`font-semibold md:text-lg transition-colors ${openIndex === i ? 'text-[#16539a]' : 'text-slate-800'}`}>{faq.q}</span>
                                <motion.div 
                                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`shrink-0 ml-3 w-8 h-8 rounded-full flex items-center justify-center ${openIndex === i ? 'bg-blue-50 text-[#16539a]' : 'bg-slate-50 text-slate-400'}`}
                                >
                                    <ChevronDown size={20} />
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-5 md:px-6 pb-6 text-slate-600 leading-relaxed text-base border-t border-slate-50 pt-4">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// 8. FINAL CTA SECTION
// ---------------------------------------------------------------------------
export function CTASection() {
    return (
        <section id="whatsapp" className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#16539a] via-[#1e3a8a] to-[#0f172a]" />
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full blur-3xl pointer-events-none"
            />

            <div className="max-w-4xl mx-auto px-6 md:px-10 relative z-10 text-center text-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8"
                >
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-semibold tracking-wide text-blue-100">نحن هنا لخدمتك دائماً</span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                >
                    هل أنت مستعد لبدء مسيرتك المهنية؟
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    className="text-lg md:text-xl text-blue-100/90 mb-12 max-w-2xl mx-auto leading-relaxed"
                >
                    لا تهدر وقتك في الإجراءات المعقدة والمربكة. تواصل معنا الآن لنتولى كافة الترتيبات ونضمن لك القبول بنجاح.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-5"
                >
                    <motion.a 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="https://wa.me/967777263111" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full sm:w-auto px-10 py-4 bg-[#25D366] hover:bg-[#1ebd5b] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-900/30"
                    >
                        <MessageCircle size={24} />
                        تواصل معنا عبر الواتساب
                    </motion.a>
                    <motion.a 
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                        whileTap={{ scale: 0.95 }}
                        href="#search" 
                        className="w-full sm:w-auto px-10 py-4 bg-white/5 border-2 border-white/20 text-white rounded-2xl font-bold text-lg transition-all backdrop-blur-md flex items-center justify-center group"
                    >
                        جرب الاختبار التجريبي 
                        <ArrowLeft className="ml-2 w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </motion.a>
                </motion.div>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// 9. FOOTER
// ---------------------------------------------------------------------------
export function Footer() {
    return (
        <footer className="bg-[#0f172a] text-slate-400 py-10 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-2 lg:grid-cols-4 gap-8">

                {/* Brand */}
                <div className="lg:col-span-2">
                    <div className="flex items-center mb-6">
                        <img 
                            src="/logo2.png" 
                            alt="بوابة الاعتماد المهني" 
                            className="h-12 w-auto object-contain"
                            width="200"
                            height="48"
                        />
                    </div>
                    <p className="text-sm leading-relaxed mb-4 max-w-sm">
                        نساعد العمالة اليمنية في إجراءات الاعتماد المهني للعمل في المملكة العربية السعودية. من التسجيل إلى الاختبار — نرافقك خطوة بخطوة.
                    </p>
                </div>

                {/* Links */}
                <div>
                    <h4 className="text-white font-semibold mb-4">روابط سريعة</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#hero" className="hover:text-white transition-colors">الرئيسية</a></li>
                        <li><a href="#about" className="hover:text-white transition-colors">خدماتنا</a></li>
                        <li><a href="#search" className="hover:text-white transition-colors">ابدأ اختبارك</a></li>
                        <li><a href="#achievements" className="hover:text-white transition-colors">إنجازاتنا</a></li>
                        <li><a href="#faq" className="hover:text-white transition-colors">أسئلة شائعة</a></li>
                        <li><a href="#contact" className="hover:text-white transition-colors">تواصل معنا</a></li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h4 className="text-white font-semibold mb-4">تواصل معنا</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                            <MessageCircle size={16} className="text-[#25D366]" />
                            <a href="https://wa.me/967777263111" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" dir="ltr">+967 777 263 111</a>
                        </li>
                        <li className="flex items-center gap-2">
                            <Mail size={16} className="text-slate-500" />
                            <a href="mailto:alaa@overseas-travels.com" className="hover:text-white transition-colors">alaa@overseas-travels.com</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 mt-10 pt-6 border-t border-slate-800 text-sm text-center md:text-right flex flex-col md:flex-row justify-between items-center">
                <p>© {new Date().getFullYear()} بوابة الاعتماد المهني. جميع الحقوق محفوظة.</p>
                <div className="mt-4 md:mt-0 flex gap-4">
                    <a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
                    <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
                </div>
            </div>
        </footer>
    );
}
