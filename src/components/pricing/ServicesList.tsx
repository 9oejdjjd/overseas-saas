"use client";

import { useServicesList } from "@/hooks/pricing/useServicesList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, FileText, Settings, Pencil, X, TrendingUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ServicesList() {
    const {
        config,
        currencies,
        loading,
        isEditing,
        setIsEditing,
        handleSaveConfig,
        updateConfig,
        updateCurrency,
        fetchData
    } = useServicesList();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                <p className="text-muted-foreground text-sm animate-pulse font-medium">جاري جلب إعدادات الخدمات والرسوم الأساسية...</p>
            </div>
        );
    }

    const profitMargin = config.registrationPrice - config.registrationCost;
    const profitMarginPercent = config.registrationPrice > 0 
        ? Math.round((profitMargin / config.registrationPrice) * 100) 
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
            {/* Global Services Section */}
            <Card className="border-slate-200/80 shadow-md bg-white/70 backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
                
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Settings className="h-5 w-5" />
                                </span>
                                الخدمات والرسوم الأساسية
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-sm">
                                الرسوم الإدارية القياسية الموحدة والتكاليف التشغيلية للمتقدمين الجدد
                            </CardDescription>
                        </div>

                        <div className="flex gap-2">
                            {!isEditing ? (
                                <Button 
                                    onClick={() => setIsEditing(true)} 
                                    variant="outline" 
                                    className="gap-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 transition-all duration-300 shadow-sm"
                                >
                                    <Pencil className="h-4 w-4" /> تعديل الرسوم
                                </Button>
                            ) : (
                                <>
                                    <Button 
                                        onClick={() => { setIsEditing(false); fetchData(); }} 
                                        variant="outline" 
                                        className="gap-2 text-slate-500 border-slate-200 hover:bg-slate-100 transition-all"
                                    >
                                        <X className="h-4 w-4" /> إلغاء
                                    </Button>
                                    <Button 
                                        onClick={handleSaveConfig} 
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all shadow-md shadow-indigo-100"
                                    >
                                        <Save className="h-4 w-4" /> حفظ التعديلات
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-4">
                    {/* Fee Details Grid */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        
                        {/* Information Column */}
                        <div className="lg:col-span-1 flex flex-col justify-between p-5 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-2xl border border-indigo-100/50 space-y-4">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100/60 text-indigo-700 text-xs font-bold rounded-full">
                                    <FileText className="h-3.5 w-3.5" />
                                    بند رسوم التسجيل
                                </div>
                                <h3 className="font-bold text-slate-800 text-base">رسوم التسجيل وفتح الملف</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    هذه الرسوم تُحصّل لمرة واحدة فقط عند إنشاء حساب متقدم جديد وتدقيق مستنداته وأهليته. وتُعتبر موحدة لجميع الوجهات والمراكز في النظام.
                                </p>
                            </div>

                            {/* Profit analysis summary when not editing */}
                            <div className="pt-4 border-t border-indigo-100/80 flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">هامش الربح لكل عملية</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className={cn(
                                            "text-lg font-extrabold tracking-tight",
                                            profitMargin >= 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {profitMargin.toLocaleString()} ر.ي
                                        </span>
                                        {profitMargin >= 0 && (
                                            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                                +{profitMarginPercent}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        {/* Interactive pricing fields */}
                        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                            
                            {/* Price to client card */}
                            <div className={cn(
                                "p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                                isEditing ? "bg-white border-indigo-200 shadow-sm" : "bg-slate-50/50 border-slate-100"
                            )}>
                                <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">سعر البيع المعتمد</span>
                                        <HelpCircle className="h-4 w-4 text-slate-300 hover:text-indigo-500 cursor-pointer transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-slate-700">القيمة المطلوبة من المتقدم</h4>
                                        <p className="text-xs text-slate-500">رسوم فتح الملف التي تظهر للمشتركين</p>
                                    </div>
                                    
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={config.registrationPrice}
                                            onChange={e => updateConfig("registrationPrice", Number(e.target.value))}
                                            className={cn(
                                                "pl-14 pr-4 py-6 font-extrabold text-xl [direction:ltr] text-right rounded-xl transition-all shadow-inner",
                                                isEditing 
                                                    ? "border-indigo-300 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 text-indigo-900 bg-white" 
                                                    : "bg-slate-100/70 border-transparent text-slate-700 select-none"
                                            )}
                                            lang="en"
                                            disabled={!isEditing}
                                        />
                                        <span className="absolute left-4 top-3.5 text-xs font-black text-slate-400">ر.ي</span>
                                    </div>
                                </div>
                            </div>

                            {/* Operational cost card */}
                            <div className={cn(
                                "p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                                isEditing ? "bg-white border-rose-200 shadow-sm" : "bg-slate-50/50 border-slate-100"
                            )}>
                                <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">التكلفة التشغيلية</span>
                                        <HelpCircle className="h-4 w-4 text-slate-300 hover:text-rose-500 cursor-pointer transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-slate-700">تكلفة الخدمة الفعلية</h4>
                                        <p className="text-xs text-slate-500">القيمة المستهلكة لإصدار وتجهيز الملف</p>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={config.registrationCost}
                                            onChange={e => updateConfig("registrationCost", Number(e.target.value))}
                                            className={cn(
                                                "pl-14 pr-4 py-6 font-extrabold text-xl [direction:ltr] text-right rounded-xl transition-all shadow-inner",
                                                isEditing 
                                                    ? "border-rose-300 focus-visible:ring-rose-500 focus-visible:border-rose-500 text-rose-900 bg-white" 
                                                    : "bg-slate-100/70 border-transparent text-slate-700 select-none"
                                            )}
                                            lang="en"
                                            disabled={!isEditing}
                                        />
                                        <span className="absolute left-4 top-3.5 text-xs font-black text-slate-400">ر.ي</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Currency Exchange Management Section */}
            <Card className="border-slate-200/80 shadow-md bg-white/70 backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-lg mt-6">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <TrendingUp className="h-5 w-5" />
                                </span>
                                أسعار صرف العملات الأجنبية مقابل الريال اليمني
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-sm">
                                تحديد أسعار بيع وشراء العملات المعتمدة في النظام لتحويل وتحديث أسعار الباقات وخطوط النقل آلياً
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        {currencies.map((curr, idx) => (
                            <div key={curr.id} className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/60 relative overflow-hidden group">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{curr.code === "SAR" ? "🇸🇦" : "🌐"}</span>
                                            <span className="font-extrabold text-slate-800">{curr.name} ({curr.code})</span>
                                        </div>
                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">نشط</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600">سعر الشراء (من العميل)</label>
                                            <p className="text-[10px] text-slate-400 mt-0.5">لتحويل قيم اليمني إلى سعودي بالقسمة</p>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={curr.buyRate}
                                                    onChange={e => updateCurrency(idx, "buyRate", Number(e.target.value))}
                                                    disabled={!isEditing}
                                                    className={cn(
                                                        "pl-14 pr-4 py-5 font-black text-lg [direction:ltr] text-right rounded-xl shadow-inner",
                                                        isEditing 
                                                            ? "border-emerald-300 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-emerald-900 bg-white" 
                                                            : "bg-slate-200/40 border-transparent text-slate-700 select-none"
                                                    )}
                                                />
                                                <span className="absolute left-4 top-3 text-xs font-black text-slate-400">ر.ي</span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600">سعر البيع (للعميل)</label>
                                            <p className="text-[10px] text-slate-400 mt-0.5">لتحويل الفاتورة من سعودي لليمني بالضرب</p>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={curr.sellRate}
                                                    onChange={e => updateCurrency(idx, "sellRate", Number(e.target.value))}
                                                    disabled={!isEditing}
                                                    className={cn(
                                                        "pl-14 pr-4 py-5 font-black text-lg [direction:ltr] text-right rounded-xl shadow-inner",
                                                        isEditing 
                                                            ? "border-teal-300 focus-visible:ring-teal-500 focus-visible:border-teal-500 text-teal-900 bg-white" 
                                                            : "bg-slate-200/40 border-transparent text-slate-700 select-none"
                                                    )}
                                                />
                                                <span className="absolute left-4 top-3 text-xs font-black text-slate-400">ر.ي</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
