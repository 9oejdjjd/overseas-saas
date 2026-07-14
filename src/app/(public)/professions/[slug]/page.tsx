import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
    Briefcase, ShieldCheck, CheckCircle2, Clock, 
    Target, ArrowLeft, BookOpen, UserCheck, PlayCircle, GraduationCap
} from "lucide-react";
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
        <div className="min-h-screen bg-mesh-gradient text-slate-800 font-sans selection:bg-[#5c9e45] selection:text-white">
            
            {/* HERO SECTION */}
            <header className="relative pt-40 md:pt-48 pb-20 overflow-hidden border-b border-slate-150/40">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
                <div className="absolute top-[0%] right-[-10%] w-[600px] h-[600px] bg-[#16539a]/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto px-6 md:px-10 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-[#16539a] text-sm font-bold mb-8 shadow-sm">
                        <Briefcase size={16} className="text-[#5c9e45]" /> الدليل الشامل للاختبار وتحضير العمالة
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-8 leading-tight">
                        اختبار الاعتماد المهني: <br/>
                        <span className="text-gradient-brand">{profession.name}</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-655 max-w-3xl mx-auto leading-relaxed mb-12 font-semibold">
                        {`هل تبحث عن فرصة عمل في السعودية وتود اجتياز الفحص المهني الخاص بمهنة ${profession.name}؟ هذا الدليل وضع خصيصاً ليضعك على أول طريق النجاح المهني، متضمناً اختباراً تجريبياً يحاكي الأساسيات الفنية.`}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link 
                            href={`/${profession.slug}`} 
                            className="w-full sm:w-auto px-10 py-5 bg-[#5c9e45] hover:bg-[#6bae52] text-white rounded-2xl font-bold text-lg shadow-md shadow-green-900/10 hover:shadow-lg flex items-center justify-center gap-3 transition-all active:scale-97"
                        >
                            ابدأ الاختبار التجريبي المجاني <PlayCircle size={22} className="shrink-0" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* CONTENT & DETAILS SECTION */}
            <main className="max-w-6xl mx-auto px-6 md:px-10 py-20 relative z-10">
                <article className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-200/80 p-8 md:p-14 mb-20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#16539a]/5 rounded-bl-full blur-[40px] -z-10 pointer-events-none"></div>
                    
                    <h2 className="text-3xl font-black text-slate-900 mb-8 border-r-4 border-[#5c9e45] pr-4">
                        نظرة عامة على متطلبات المهنة واختبار الاعتماد
                    </h2>
                    
                    <div className="prose prose-lg text-justify !max-w-none text-slate-600 mb-12 leading-[1.9] font-medium">
                        <p className="mb-4">
                            يعتبر اجتياز متطلبات <strong>برنامج الاعتماد المهني السعودي</strong> بمثابة التأشيرة الحقيقية التي تضمن لك إثبات كفاءتك المهنية ومعرفتك الفنية كحرفي متخصص في مسار أداة العمل وتطبيقات السلامة لمهنة <strong>{profession.name}</strong>.
                        </p>
                        <p>
                            لقد أعددنا لك في (بوابة الاعتماد المهني) بيئة محاكاة افتراضية شاملة تضم تدريباً نظرياً يشمل المفاهيم المعيارية التي بنيت عليها الخطة الأساسية. إن الخضوع للاختبار التجريبي في قسم <strong>{profession.name}</strong> يتيح لك فهم زوايا الاختبار المتعددة كالسلامة المهنية والأدوات وتقنيات ممارسة الحرفة.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="flex gap-5 bg-slate-50/50 p-6 md:p-8 border border-slate-150 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                                <Clock size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">المدة الزمنية للاختبار</h3>
                                <p className="text-slate-500 font-semibold text-sm leading-relaxed">تم تخصيص {profession.examDuration} دقيقة متواصلة للاختبار التجريبي ليحاكي ضغط الوقت الرسمي.</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-5 bg-slate-50/50 p-6 md:p-8 border border-slate-150 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="w-14 h-14 bg-green-50 text-brand-green rounded-2xl flex items-center justify-center shrink-0 border border-green-100 shadow-sm">
                                <Target size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">نسبة الاجتياز المطلوبة</h3>
                                <p className="text-slate-500 font-semibold text-sm leading-relaxed">يجب عليك تحقيق درجة <span className="text-[#5c9e45] font-black">{profession.passingScore}%</span> كحد أدنى لتعتبر مؤهلاً حسب محتوى المنصة.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 bg-slate-50/50 p-6 md:p-8 border border-slate-150 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 border border-purple-100 shadow-sm">
                                <BookOpen size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">بنك الأسئلة المتاح</h3>
                                <p className="text-slate-500 font-semibold text-sm leading-relaxed">يتكون الاختبار من {profession.questionCount} سؤال موضوعي في التخصص (مستخرج من بنك يحتوي على {profession._count.questions} سؤال).</p>
                            </div>
                        </div>

                        <div className="flex gap-5 bg-slate-50/50 p-6 md:p-8 border border-slate-150 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0 border border-orange-100 shadow-sm">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">التوثيق والمحتوى</h3>
                                <p className="text-slate-500 font-semibold text-sm leading-relaxed">أسئلة معتمدة وتتم مراجعتها دورياً من خبراء وفنيين سعوديين لدعم تأهيل العمالة.</p>
                            </div>
                        </div>
                    </div>
                </article>

                {/* WHY TAKE THE MOCK EXAM SECTION */}
                <section className="mb-24">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">لماذا أقدم الاختبار التجريبي أولاً؟</h2>
                        <p className="text-lg text-slate-500 font-bold max-w-2xl mx-auto">التدريب المسبق يختصر عليك الكثير ويرفع فرص نجاحك بشكل مذهل.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-md hover:border-[#16539a]/30 transition-all duration-300 group">
                            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100 group-hover:scale-105 transition-transform">
                                <GraduationCap className="w-10 h-10 text-brand-blue" />
                            </div>
                            <h3 className="font-bold text-slate-850 text-2xl mb-4">كسر حاجز الخوف</h3>
                            <p className="text-slate-500 leading-relaxed text-sm font-semibold">التعود على منصات الاختبار ونظام الأسئلة يساعدك في التخلص من التوتر ويزيد ثقتك العالية يوم الامتحان.</p>
                        </div>
                        
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-md hover:border-[#5c9e45]/30 transition-all duration-300 group">
                            <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-100 group-hover:scale-105 transition-transform">
                                <CheckCircle2 className="w-10 h-10 text-[#5c9e45]" />
                            </div>
                            <h3 className="font-bold text-slate-850 text-2xl mb-4">معرفة نقاط الضعف</h3>
                            <p className="text-slate-500 leading-relaxed text-sm font-semibold">ستظهر نتيجتك فوراً مع توضيح المحاور التي أخطأت بها لكي تتمكن من قراءتها وتطوير نفسك فنياً فيها.</p>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all duration-300 group">
                            <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-teal-100 group-hover:scale-105 transition-transform">
                                <UserCheck className="w-10 h-10 text-teal-500" />
                            </div>
                            <h3 className="font-bold text-slate-850 text-2xl mb-4">دعم فني من خبرائنا</h3>
                            <p className="text-slate-500 leading-relaxed text-sm font-semibold">نهتم بوصول نتيجتك إليك عبر الواتساب ويقوم فريق الدعم الفني لدينا بتقديم نصائح بناءً على درجتك.</p>
                        </div>
                    </div>
                </section>

                {/* FINAL CTA SECTION */}
                <div className="bg-gradient-to-br from-[#16539a]/5 via-white to-[#5c9e45]/5 border border-slate-200/60 rounded-[2.5rem] p-12 md:p-20 text-center text-slate-800 relative overflow-hidden shadow-xl shadow-slate-100/50">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#16539a]/5 via-transparent to-transparent pointer-events-none"></div>
                    <Target className="w-20 h-20 text-brand-blue/5 absolute left-10 bottom-10" />
                    
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 relative z-10">جاهز للتحدي الفني وتقييم نفسك؟</h2>
                    <p className="text-slate-600 text-lg mb-10 max-w-2xl mx-auto relative z-10 font-semibold">إذا كنت تشعر بالاستعداد لإثبات مهارتك نظرياً، سارع بالتسجيل في المنصة الآن وبشكل مجاني تماماً وبدون أي شروط مسبقة.</p>
                    
                    <Link 
                        href={`/${profession.slug}`} 
                        className="inline-flex items-center gap-3 px-10 py-5 bg-[#5c9e45] hover:bg-[#6bae52] text-white rounded-2xl font-bold text-xl shadow-md shadow-green-900/10 relative z-10 transition-all hover:scale-102 active:scale-98"
                    >
                        الانتقال لتسجيل الدخول للاختبار <ArrowLeft size={22} className="shrink-0" />
                    </Link>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
