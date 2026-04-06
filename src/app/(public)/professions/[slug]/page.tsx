import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
    Briefcase, ShieldCheck, CheckCircle2, Clock, 
    Target, ArrowLeft, BookOpen, UserCheck, PlayCircle, GraduationCap
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/mock/LandingComponents";

interface Props {
    params: Promise<{ slug: string }>;
}

// 1. Dynamic Meta Tags generation for Perfect SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const profession = await prisma.profession.findUnique({
        where: { slug, isActive: true }
    });

    if (!profession) {
        return { title: "التخصص غير متوفر" };
    }

    return {
        title: `دليلك الشامل واختبار الاعتماد المهني التجريبي - مهنة ${profession.name}`,
        description: `دليلك الكامل للتدريب على أسئلة ومحاور اختبار الاعتماد المهني الخاص بمهنة ${profession.name}. جرب وتدرب مجاناً في بوابة الاعتماد المهني.`,
        keywords: `الاعتماد المهني ${profession.name}, اسئلة اختبار ${profession.name}, امتحان ${profession.name} السعودية, اختبار الفحص المهني ${profession.name}, ${profession.slug} test saudi`,
        openGraph: {
            title: `اختبار الاعتماد المهني - مهنة ${profession.name}`,
            description: `احصل على التدريب الشامل والمحاكي لاختبار وزارة الموارد البشرية السعودية لمهنة ${profession.name}.`,
            images: ["/logo1.png"],
        }
    };
}

// 2. High-Value Content Page (Server Component)
export default async function ProfessionLandingPage({ params }: Props) {
    const { slug } = await params;
    
    // Fetch data directly from DB for SSR
    const profession = await prisma.profession.findUnique({
        where: { slug, isActive: true },
        include: {
            _count: {
                select: { questions: true }
            }
        }
    });

    if (!profession) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#0a0f1c] text-white font-sans selection:bg-[#5c9e45] selection:text-white">
            
            {/* HERO SECTION */}
            <header className="relative bg-[#0a0f1c] pt-40 md:pt-48 pb-20 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div>
                <div className="absolute top-[0%] right-[-10%] w-[600px] h-[600px] bg-[#16539a]/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/15 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto px-6 md:px-10 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-200 text-sm font-semibold mb-8 backdrop-blur-sm">
                        <Briefcase size={16} className="text-[#5c9e45]" /> الدليل الشامل للاختبار وتحضير العمالة
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-8 leading-tight">
                        اختبار الاعتماد المهني: <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-[#16539a] to-[#5c9e45]">{profession.name}</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12">
                        {`هل تبحث عن فرصة عمل في السعودية وتود اجتياز الفحص المهني الخاص بمهنة ${profession.name}؟ هذا الدليل وضع خصيصاً ليضعك على أول طريق النجاح المهني، متضمناً اختباراً تجريبياً يحاكي الأساسيات الفنية.`}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link 
                            href={`/${profession.slug}`} 
                            className="w-full sm:w-auto px-10 py-5 bg-[#5c9e45] hover:bg-[#4d853a] text-white rounded-2xl font-bold text-lg shadow-xl shadow-green-900/40 flex items-center justify-center gap-3 transition-transform hover:scale-105"
                        >
                            ابدأ الاختبار التجريبي المجاني <PlayCircle size={22} className="shrink-0" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* CONTENT & DETAILS SECTION */}
            <main className="max-w-6xl mx-auto px-6 md:px-10 py-20 relative z-10">
                <article className="bg-white/[0.02] rounded-[2.5rem] shadow-2xl border border-white/10 p-8 md:p-14 mb-20 relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#16539a]/10 rounded-bl-full blur-[40px] -z-10 pointer-events-none"></div>
                    
                    <h2 className="text-3xl font-bold text-white mb-8 border-r-4 border-[#5c9e45] pr-4">
                        نظرة عامة على متطلبات المهنة واختبار الاعتماد
                    </h2>
                    
                    <div className="prose prose-lg prose-invert text-justify !max-w-none text-slate-300 mb-12 leading-[1.9]">
                        <p>
                            يعتبر اجتياز متطلبات <strong>برنامج الاعتماد المهني السعودي</strong> بمثابة التأشيرة الحقيقية التي تضمن لك إثبات كفاءتك المهنية ومعرفتك الفنية كحرفي متخصص في مسار أداة العمل وتطبيقات السلامة لمهنة <strong>{profession.name}</strong>.
                        </p>
                        <p>
                            لقد أعددنا لك في (بوابة الاعتماد المهني) بيئة محاكاة افتراضية شاملة تضم تدريباً نظرياً يشمل المفاهيم المعيارية التي بنيت عليها الخطة الأساسية. إن الخضوع للاختبار التجريبي في قسم <strong>{profession.name}</strong> يتيح لك فهم زوايا الاختبار المتعددة كالسلامة المهنية والأدوات وتقنيات ممارسة الحرفة.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="flex gap-5 bg-white/5 p-6 md:p-8 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/20 shadow-inner">
                                <Clock size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-2">المدة الزمنية للاختبار</h3>
                                <p className="text-slate-400 leading-relaxed">تم تخصيص {profession.examDuration} دقيقة متواصلة للاختبار التجريبي ليحاكي ضغط الوقت الرسمي.</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-5 bg-white/5 p-6 md:p-8 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="w-14 h-14 bg-[#5c9e45]/10 text-[#5c9e45] rounded-2xl flex items-center justify-center shrink-0 border border-[#5c9e45]/20 shadow-inner">
                                <Target size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-2">نسبة الاجتياز المطلوبة</h3>
                                <p className="text-slate-400 leading-relaxed">يجب عليك تحقيق درجة <span className="text-[#5c9e45] font-bold">{profession.passingScore}%</span> كحد أدنى لتعتبر مؤهلاً حسب محتوى المنصة.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 bg-white/5 p-6 md:p-8 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                                <BookOpen size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-2">بنك الأسئلة المتاح</h3>
                                <p className="text-slate-400 leading-relaxed">يتكون الاختبار من {profession.questionCount} سؤال موضوعي في التخصص (مستخرج من بنك يحتوي على {profession._count.questions} سؤال).</p>
                            </div>
                        </div>

                        <div className="flex gap-5 bg-white/5 p-6 md:p-8 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="w-14 h-14 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center shrink-0 border border-orange-500/20 shadow-inner">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-2">التوثيق والمحتوى</h3>
                                <p className="text-slate-400 leading-relaxed">أسئلة معتمدة وتتم مراجعتها دورياً من خبراء وفنيين سعوديين لدعم تأهيل العمالة.</p>
                            </div>
                        </div>
                    </div>
                </article>

                {/* WHY TAKE THE MOCK EXAM SECTION */}
                <section className="mb-24">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">لماذا أقدم الاختبار التجريبي أولاً؟</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">التدريب المسبق يختصر عليك الكثير ويرفع فرص نجاحك بشكل مذهل.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="bg-[#0d1425] p-10 rounded-[2rem] border border-white/10 shadow-xl hover:-translate-y-2 hover:border-[#16539a]/50 transition-all duration-300 group">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <GraduationCap className="w-10 h-10 text-blue-400" />
                            </div>
                            <h3 className="font-bold text-white text-2xl mb-4">كسر حاجز الخوف</h3>
                            <p className="text-slate-400 leading-relaxed">التعود على منصات الاختبار ونظام الأسئلة يساعدك في التخلص من التوتر ويزيد ثقتك العالية يوم الامتحان.</p>
                        </div>
                        
                        <div className="bg-[#0d1425] p-10 rounded-[2rem] border border-white/10 shadow-xl hover:-translate-y-2 hover:border-[#5c9e45]/50 transition-all duration-300 group">
                            <div className="w-20 h-20 bg-[#5c9e45]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-10 h-10 text-[#5c9e45]" />
                            </div>
                            <h3 className="font-bold text-white text-2xl mb-4">معرفة نقاط الضعف</h3>
                            <p className="text-slate-400 leading-relaxed">ستظهر نتيجتك فوراً مع توضيح المحاور التي أخطأت بها لكي تتمكن من قراءتها وتطوير نفسك فنياً فيها.</p>
                        </div>

                        <div className="bg-[#0d1425] p-10 rounded-[2rem] border border-white/10 shadow-xl hover:-translate-y-2 hover:border-teal-500/50 transition-all duration-300 group">
                            <div className="w-20 h-20 bg-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <UserCheck className="w-10 h-10 text-teal-400" />
                            </div>
                            <h3 className="font-bold text-white text-2xl mb-4">دعم فني من خبرائنا</h3>
                            <p className="text-slate-400 leading-relaxed">نهتم بوصول نتيجتك إليك عبر الواتساب ويقوم فريق الدعم الفني لدينا بتقديم نصائح بناءً على درجتك.</p>
                        </div>
                    </div>
                </section>

                {/* FINAL CTA SECTION */}
                <div className="bg-gradient-to-br from-[#16539a] to-blue-900 rounded-[2.5rem] p-10 md:p-14 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent pointer-events-none"></div>
                    <Target className="w-20 h-20 text-blue-300/20 absolute left-10 bottom-10" />
                    
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">جاهز للتحدي الفني وتقييم نفسك؟</h2>
                    <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">إذا كنت تشعر بالاستعداد لإثبات مهارتك نظرياً، سارع بالتسجيل في المنصة الآن وبشكل مجاني تماماً وبدون أي شروط مسبقة.</p>
                    
                    <Link 
                        href={`/${profession.slug}`} 
                        className="inline-flex items-center gap-3 px-10 py-5 bg-[#5c9e45] hover:bg-[#4d853a] text-white rounded-2xl font-bold text-xl shadow-xl shadow-green-900/40 relative z-10 transition-colors"
                    >
                        الانتقال لتسجيل الدخول للاختبار <ArrowLeft size={22} className="shrink-0" />
                    </Link>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
