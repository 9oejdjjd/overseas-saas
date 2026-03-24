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
        { icon: HelpCircle, title: "ما أعرف المطلوب مني", desc: "كثير من العمال لا يعرفون ما هو الاعتماد المهني أصلاً ولا الخطوات المطلوبة." },
        { icon: FileWarning, title: "خايف من الاختبار", desc: "الخوف من الرسوب بسبب عدم معرفة نوعية الأسئلة وطريقة الاختبار." },
        { icon: AlertCircle, title: "لغة الأسئلة صعبة", desc: "الأسئلة قد تحتوي مصطلحات تقنية غير مفهومة لبعض المهن الحرفية." },
        { icon: Calendar, title: "ما أعرف أتسجل", desc: "منصة التسجيل معقدة والخطوات غير واضحة بدون مساعدة متخصصة." }
    ];

    return (
        <section className="py-20 md:py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
                    variants={fadeUp}
                    className="text-center max-w-3xl mx-auto mb-14"
                >
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                        ليش كثير من العمال <span className="text-[#16539a]">يواجهون صعوبة في الاعتماد المهني؟</span>
                    </h2>
                    <p className="text-slate-500 text-base md:text-lg">إذا كنت تنوي السفر للعمل في السعودية، لازم تعرف إن الاعتماد المهني خطوة إلزامية — وبدون تحضير ممكن تواجه مشاكل.</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {problems.map((prob, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08, duration: 0.4 }}
                            className="group bg-slate-50 border border-slate-100 p-7 rounded-2xl hover:shadow-lg hover:shadow-[#16539a]/5 hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-[#e11d48] group-hover:scale-110 transition-all mb-5">
                                <prob.icon size={22} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{prob.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{prob.desc}</p>
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
        { title: "نسجّلك في الاعتماد المهني", desc: "نقوم بكل إجراءات التسجيل في المنصة بدلاً عنك بشكل دقيق ومطابق للشروط." },
        { title: "نوضّح لك كل شي", desc: "نشرح لك خطوات الاختبار ونوعية الأسئلة بأسلوب بسيط وسهل تفهمه." },
        { title: "نحجز لك موعد الاختبار", desc: "نختار لك الوقت و المكان الأنسب ونتابع الحجوزات حتى تأكيد الموعد." },
        { title: "نجهّزك باختبار تجريبي", desc: "تختبر نفسك بأسئلة تحاكي الاختبار الحقيقي حسب مهنتك — مجاناً." },
        { title: "نتابعك حتى تنجح", desc: "نبقى معك خطوة بخطوة حتى تجتاز الاختبار وتستلم الاعتماد." }
    ];

    return (
        <section className="py-20 md:py-24 bg-[#0f172a] text-white relative overflow-hidden">
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#16539a]/25 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#5c9e45]/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-14 items-center">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                    <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold mb-5 leading-tight">
                        لا تشيل هم — <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5c9e45] to-[#3b82f6]">نحن نتولى كل شي عنك</span>
                    </motion.h2>
                    <motion.p variants={fadeUp} className="text-slate-400 text-base md:text-lg mb-10">
                        سواء كنت عامل تحميل، سائق، خياط أو أي مهنة — نساعدك من الصفر حتى تحصل على الاعتماد المهني وتكون جاهز للسفر.
                    </motion.p>

                    <div className="space-y-6 relative before:absolute before:inset-y-2 before:right-[17px] before:w-[2px] before:bg-slate-800">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                className="relative flex gap-5 pl-4"
                            >
                                <div className="relative z-10 w-9 h-9 rounded-full bg-slate-800 border-2 border-[#16539a] flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-[#5c9e45]" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-1">{step.title}</h4>
                                    <p className="text-slate-400 text-sm">{step.desc}</p>
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
        { title: "تتواصل معنا", desc: "أرسل لنا رسالة واتساب أو سجّل بياناتك." },
        { title: "نسجّلك بالمنصة", desc: "نقوم بإنشاء حسابك وإتمام كل الإجراءات." },
        { title: "نحدد الموعد", desc: "نختار لك الوقت والمكان الأنسب لاختبارك." },
        { title: "تجتاز الاختبار", desc: "تدخل الاختبار وأنت مستعد ومتدرب عليه." }
    ];

    return (
        <section className="py-20 md:py-24 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">كيف تسير رحلتك معنا؟</h2>
                    <p className="text-slate-500 mt-3">أربع خطوات بسيطة تفصلك عن الاعتماد المهني</p>
                </div>

                <div className="relative">
                    <div className="hidden md:block absolute top-1/2 right-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                            className="h-full bg-gradient-to-l from-[#16539a] to-[#5c9e45]"
                        />
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative z-10">
                        {process.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="relative flex flex-col items-center text-center"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#16539a] shadow-lg flex items-center justify-center text-lg font-bold text-[#16539a] mb-5 relative group">
                                    {i + 1}
                                    <div className="absolute inset-0 bg-[#16539a] rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                </div>
                                <h3 className="text-base font-bold text-slate-800 mb-2">{step.title}</h3>
                                <p className="text-sm text-slate-500">{step.desc}</p>
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
        { label: "عامل تم تجهيزهم", value: "+٢٠٠٠" },
        { label: "نسبة اجتياز", value: "٩٥٪" },
        { label: "دقة في التسجيل", value: "١٠٠٪" }
    ];

    return (
        <section className="py-16 md:py-20 bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                <div className="grid md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center pt-6 md:pt-0"
                        >
                            <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#5c9e45] mb-2">
                                {stat.value}
                            </div>
                            <div className="text-slate-400 font-medium">{stat.label}</div>
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
        { q: "ما هو الاعتماد المهني؟", a: "هو تصريح إلزامي تطلبه السعودية من العمالة الوافدة يثبت أن العامل يملك المهارات المطلوبة لمهنته. بدونه لا تقدر تشتغل رسمياً." },
        { q: "هل الاختبار التجريبي مجاني؟", a: "نعم، الاختبار التجريبي مجاني بالكامل. تقدر تعرف مستواك وتتدرب على نوعية الأسئلة قبل ما تدخل الاختبار الحقيقي." },
        { q: "هل الأسئلة نفسها اللي في الاختبار الحقيقي؟", a: "الأسئلة مصممة لتحاكي أسلوب ومستوى أسئلة الاعتماد المهني السعودي. لكن هذا اختبار تجريبي تدريبي وليس الاختبار الرسمي." },
        { q: "كيف أبدأ التسجيل معكم؟", a: "ببساطة تواصل معنا عبر الواتساب أو ابحث عن مهنتك في الموقع وابدأ الاختبار التجريبي. وفريقنا يقدر يساعدك في كل الإجراءات." },
        { q: "كم يوم أحتاج عشان أتجهز؟", a: "يعتمد على مستواك. بعض العمال يجتازون من أول مرة بعد التدريب، وبعضهم يحتاجون أسبوع إلى أسبوعين. نحن نتابعك حتى تنجح." },
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-20 md:py-24 bg-[#f8fafc]">
            <div className="max-w-3xl mx-auto px-6 md:px-10">
                <div className="text-center mb-14">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">أسئلة شائعة</h2>
                    <p className="text-slate-500 mt-3">أجوبة على أكثر الأسئلة اللي تجينا من العمال</p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-5 text-right focus:outline-none"
                            >
                                <span className="font-semibold text-slate-800">{faq.q}</span>
                                <ChevronDown
                                    className={`text-slate-400 transition-transform duration-300 shrink-0 ml-3 ${openIndex === i ? 'rotate-180' : ''}`}
                                    size={20}
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-5 pb-5 text-slate-500 leading-relaxed"
                                    >
                                        {faq.a}
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
        <section id="whatsapp" className="py-20 md:py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#16539a] to-[#0f172a]" />
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="max-w-4xl mx-auto px-6 md:px-10 relative z-10 text-center text-white">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5"
                >
                    جاهز تبدأ طريقك للسعودية؟
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-base md:text-lg text-slate-300 mb-10"
                >
                    لا تضيع وقتك في الإجراءات المعقدة. تواصل معنا الآن ودعنا نتولى كل شي عنك.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <a href="https://wa.me/967777263111" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#1ebd5b] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-900/20 active:scale-95">
                        <MessageCircle size={22} />
                        تواصل معنا واتساب
                    </a>
                    <a href="#search" className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold text-lg transition-all backdrop-blur-md flex items-center justify-center">
                        جرّب الاختبار التجريبي
                    </a>
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
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#16539a] to-[#5c9e45] flex items-center justify-center text-white">
                            <Award size={18} />
                        </div>
                        <span className="text-lg font-bold text-white">
                            بوابة الاعتماد المهني
                        </span>
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
