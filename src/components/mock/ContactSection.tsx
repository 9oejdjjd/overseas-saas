"use client";

import { motion } from "framer-motion";
import { HeadphonesIcon, MessageCircle, Mail, ArrowLeft, Clock } from "lucide-react";

export function ContactSection() {
    return (
        <section id="contact" className="py-20 md:py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                <div className="grid lg:grid-cols-2 gap-14 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-[#16539a] font-bold text-sm mb-6">
                            <HeadphonesIcon size={16} /> الدعم الفني المباشر
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-5 leading-tight">
                            عندك سؤال؟ <br />
                            <span className="text-[#5c9e45]">فريقنا جاهز يساعدك!</span>
                        </h2>
                        <p className="text-base md:text-lg text-slate-500 mb-10 leading-relaxed max-w-lg">
                            سواء كنت تبي تستفسر عن الاختبار، أو تحتاج مساعدة في التسجيل، أو واجهتك أي مشكلة — تواصل معنا مباشرة على الواتساب وبنرد عليك في أسرع وقت.
                        </p>

                        <div className="flex flex-col gap-5">
                            <a href="https://wa.me/967777263111" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-5 p-5 rounded-2xl border-2 border-slate-100 hover:border-[#5c9e45] bg-slate-50 hover:bg-green-50/50 transition-all">
                                <div className="w-14 h-14 rounded-full bg-[#5c9e45]/10 flex items-center justify-center text-[#5c9e45] group-hover:bg-[#5c9e45] group-hover:text-white transition-colors shrink-0">
                                    <MessageCircle size={26} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-base mb-1">واتساب مباشر</h4>
                                    <p className="text-sm text-slate-500 font-mono" dir="ltr">+967 777 263 111</p>
                                </div>
                                <ArrowLeft className="text-slate-300 group-hover:text-[#5c9e45] transition-colors shrink-0" />
                            </a>

                            <a href="mailto:alaa@overseas-travels.com" className="group flex items-center gap-5 p-5 rounded-2xl border-2 border-slate-100 hover:border-[#16539a] bg-slate-50 hover:bg-blue-50/50 transition-all">
                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#16539a] group-hover:text-white transition-colors shrink-0">
                                    <Mail size={26} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-base mb-1">البريد الإلكتروني</h4>
                                    <p className="text-sm text-slate-500 font-mono">alaa@overseas-travels.com</p>
                                </div>
                                <ArrowLeft className="text-slate-300 group-hover:text-[#16539a] transition-colors shrink-0" />
                            </a>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="bg-[#0a0f1c] rounded-[2rem] p-10 md:p-14 relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#16539a] rounded-full blur-[100px] opacity-25 transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#5c9e45] rounded-full blur-[100px] opacity-15 transform -translate-x-1/2 translate-y-1/2"></div>
                        
                        <div className="relative z-10 text-center text-white">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                                <Clock size={28} className="text-[#5c9e45]" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">أوقات التواصل</h3>
                            <p className="text-slate-300 mb-8 leading-relaxed">
                                فريقنا متاح يومياً للرد على استفساراتك ومساعدتك في كل خطوة من خطوات الاعتماد المهني.
                            </p>
                            
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-right space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">السبت - الخميس</span>
                                    <span className="font-bold text-sm text-[#5c9e45]">8 ص - 10 م</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">الجمعة</span>
                                    <span className="font-bold text-sm text-slate-300">4 م - 10 م</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
