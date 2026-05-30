"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, ShoppingCart } from "lucide-react";
import { useFullRegistration } from "@/hooks/applicants/useFullRegistration";
import { useQuickSale } from "@/hooks/applicants/useQuickSale";
import { FullRegistrationForm } from "@/components/applicants/new/FullRegistrationForm";
import { QuickSaleForm } from "@/components/applicants/new/QuickSaleForm";

export default function NewApplicantPage() {
    const router = useRouter();
    
    // Dual Mode: "register" = full registration, "sell" = quick package sale
    const [pageMode, setPageMode] = useState<"register" | "sell">("register");

    // Initialize hooks
    const fullReg = useFullRegistration();
    const quickSale = useQuickSale();

    // Check loading based on active mode
    const isInitialLoading = pageMode === "register" ? fullReg.initialLoading : quickSale.initialLoading;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/applicants")}>
                    <ArrowRight className="h-6 w-6 text-gray-500" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {pageMode === "register" ? (
                            <User className="h-6 w-6 text-blue-600" />
                        ) : (
                            <ShoppingCart className="h-6 w-6 text-green-600" />
                        )}
                        {pageMode === "register" ? "تسجيل متقدم جديد" : "بيع باقة اختبارات"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {pageMode === "register"
                            ? "البيانات الشخصية والمالية للمتقدم"
                            : "بيع سريع لباقة اختبارات تجريبية لزائر"
                        }
                    </p>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                <Button
                    variant={pageMode === "register" ? "default" : "ghost"}
                    onClick={() => setPageMode("register")}
                    className="gap-2"
                >
                    <User className="h-4 w-4" /> تسجيل متقدم جديد
                </Button>
                <Button
                    variant={pageMode === "sell" ? "default" : "ghost"}
                    onClick={() => setPageMode("sell")}
                    className="gap-2"
                >
                    <ShoppingCart className="h-4 w-4" /> بيع باقة اختبارات
                </Button>
            </div>

            {isInitialLoading ? (
                <div className="p-10 text-center text-gray-500 font-semibold animate-pulse">
                    جاري تحميل البيانات...
                </div>
            ) : pageMode === "register" ? (
                <FullRegistrationForm hook={fullReg} />
            ) : (
                <QuickSaleForm hook={quickSale} />
            )}
        </div>
    );
}
