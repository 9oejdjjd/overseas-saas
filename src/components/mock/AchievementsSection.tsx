"use client";

import { motion } from "framer-motion";
import { Users, BookOpen, Award, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const Counter = ({ end, duration = 2 }: { end: number, duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const current = Math.min(Math.floor((progress / (duration * 1000)) * end), end);
            setCount(current);
            if (current < end) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);

    return <span>{count.toLocaleString('ar-EG')}</span>;
}

export function AchievementsSection() {
    const stats = [
        { id: 1, label: "عامل تم تجهيزهم", count: 2000, icon: <Users size={26} className="text-[#16539a]" />, suffix: "+" },
        { id: 2, label: "مهنة متاحة", count: 30, icon: <BookOpen size={26} className="text-[#5c9e45]" />, suffix: "+" },
        { id: 3, label: "نسبة النجاح", count: 95, icon: <Award size={26} className="text-[#16539a]" />, suffix: "%" },
        { id: 4, label: "اختبار تجريبي منجز", count: 8500, icon: <TrendingUp size={26} className="text-[#5c9e45]" />, suffix: "+" },
    ];

    return (
        <section id="achievements" className="py-20 md:py-24 bg-[#fafafa] relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
            
            <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
                <div className="text-center mb-14">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-3"
                    >
                        أرقام <span className="text-[#16539a]">وإنجازات</span> نفتخر بها
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg"
                    >
                        آلاف العمال والحرفيين وثقوا فينا لمساعدتهم في الحصول على الاعتماد المهني والبدء بالعمل في السعودية.
                    </motion.p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.id}
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            whileHover={{ y: -8 }}
                            className="bg-white p-7 rounded-2xl shadow-lg shadow-slate-200/40 border border-slate-100 text-center flex flex-col items-center justify-center relative overflow-hidden group"
                        >
                            <div className="absolute w-20 h-20 bg-slate-50 rounded-full -top-8 -right-8 transition-transform group-hover:scale-150 duration-500 z-0"></div>
                            
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-5 relative z-10 group-hover:bg-white transition-colors border border-slate-100 group-hover:border-[#16539a]/20">
                                {stat.icon}
                            </div>
                            
                            <div className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 relative z-10 flex items-center justify-center gap-1" dir="ltr">
                                <span className="text-xl text-slate-400 font-bold">{stat.suffix}</span>
                                <Counter end={stat.count} duration={2.5} />
                            </div>
                            
                            <div className="text-sm font-bold text-slate-500 relative z-10">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
