import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProfileTabProps {
    companyName: string;
    companyNameEn: string;
    ownerName: string;
    phone: string;
    whatsappNumber: string;
    email: string;
    city: string;
    address: string;
}

export function ProfileTab({
    companyName,
    companyNameEn,
    ownerName,
    phone,
    whatsappNumber,
    email,
    city,
    address
}: ProfileTabProps) {
    return (
        <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl bg-white">
            <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم الوكالة بالعربية</label>
                        <Input 
                            value={companyName} 
                            readOnly 
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold cursor-not-allowed text-slate-600" 
                        />
                    </div>

                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم الوكالة بالإنجليزية</label>
                        <Input 
                            value={companyNameEn || "—"} 
                            readOnly 
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dir-ltr text-right cursor-not-allowed text-slate-600" 
                        />
                    </div>

                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم المالك / المدير المسؤول</label>
                        <Input 
                            value={ownerName} 
                            readOnly 
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-not-allowed text-slate-600" 
                        />
                    </div>

                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رقم الهاتف</label>
                        <Input 
                            value={phone} 
                            readOnly 
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-sans cursor-not-allowed dir-ltr text-right text-slate-600" 
                        />
                    </div>

                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رقم الواتس اب</label>
                        <Input 
                            value={whatsappNumber || "—"} 
                            readOnly 
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-sans cursor-not-allowed dir-ltr text-right text-slate-600" 
                        />
                    </div>

                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">البريد الالكتروني</label>
                        <Input 
                            value={email} 
                            readOnly 
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-sans cursor-not-allowed dir-ltr text-right text-slate-600" 
                        />
                    </div>

                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">المدينة</label>
                        <Input 
                            value={city || "—"} 
                            readOnly 
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-not-allowed text-slate-600" 
                        />
                    </div>
                </div>

                <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">العنوان الكامل</label>
                    <Input 
                        value={address || "—"} 
                        readOnly 
                        className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-not-allowed text-slate-600" 
                    />
                </div>
            </CardContent>
        </Card>
    );
}
