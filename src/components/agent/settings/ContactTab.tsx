import React from "react";
import { Save, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ContactTabProps {
    phone: string;
    whatsappNumber: string;
    setWhatsappNumber: (num: string) => void;
    email: string;
    city: string;
    setCity: (city: string) => void;
    address: string;
    setAddress: (addr: string) => void;
    saving: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export function ContactTab({
    phone,
    whatsappNumber,
    setWhatsappNumber,
    email,
    city,
    setCity,
    address,
    setAddress,
    saving,
    onSubmit
}: ContactTabProps) {
    return (
        <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl bg-white">
            <CardContent className="p-6">
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-right">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رقم الهاتف الأساسي للوكالة</label>
                            <Input 
                                value={phone} 
                                readOnly 
                                className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-sans cursor-not-allowed dir-ltr text-right" 
                            />
                            <p className="text-[10px] text-slate-400">رقم الهاتف الرئيسي المعتمد للدخول في الحساب.</p>
                        </div>

                        <div className="space-y-1.5 text-right">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رقم الواتساب المخصص للإشعارات والنتائج</label>
                            <Input 
                                value={whatsappNumber} 
                                onChange={(e) => setWhatsappNumber(e.target.value)} 
                                placeholder="مثال: +967771234567" 
                                className="h-10 rounded-xl text-xs font-semibold font-sans dir-ltr text-right bg-white" 
                            />
                            <p className="text-[10px] text-slate-400">سيتم إرسال روابط الاختبارات وتقارير النتائج عليه.</p>
                        </div>

                        <div className="space-y-1.5 text-right">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني الرسمي</label>
                            <Input 
                                value={email} 
                                readOnly 
                                className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-sans cursor-not-allowed dir-ltr text-right" 
                            />
                        </div>

                        <div className="space-y-1.5 text-right">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">المدينة / المحافظة</label>
                            <Input 
                                value={city} 
                                onChange={(e) => setCity(e.target.value)} 
                                placeholder="مثال: صنعاء / الرياض / عدن" 
                                className="h-10 rounded-xl text-xs font-semibold bg-white" 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">العنوان التفصيلي للفرع / المكتب</label>
                        <Input 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)} 
                            placeholder="مثال: شارع الستين الجنوبي - برج النعمان - الدور الثاني" 
                            className="h-10 rounded-xl text-xs font-semibold bg-white" 
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t dark:border-slate-700">
                        <Button 
                            type="submit" 
                            disabled={saving} 
                            className="h-10 px-6 bg-[#55943b] hover:bg-[#4a8333] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                        >
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                            حفظ بيانات التواصل
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
