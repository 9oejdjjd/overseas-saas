"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Applicant } from "@/types/applicant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, ArrowUpDown, Bus, Wallet, CalendarClock, Phone, CheckCircle2, XCircle, AlertCircle, Plane, BookOpen, Loader2, Beaker, Tag, Copy } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { updateApplicantStatus } from "@/app/actions/applicant";
import { useState, useEffect } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/simple-toast";

// Extended type to include ticket from API
export type ApplicantData = Applicant & {
    location?: { name: string; code?: string };
    ticket?: {
        id: string;
        status: string;
        ticketNumber: string;
        departureDate: string;
    } | null;
};

// Helper function to determine Ticket Status
const getTicketStatus = (app: ApplicantData) => {
    if (app.hasTransportation) {
        if (!app.ticket) return { label: "بانتظار الحجز", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle };

        switch (app.ticket.status) {
            case 'ISSUED': return { label: "تم حجز التذكرة", color: "bg-blue-100 text-blue-700", icon: Plane };
            case 'USED': return { label: "تم استخدام التذكرة", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
            case 'CANCELLED': return { label: "تم إلغاء التذكرة", color: "bg-red-100 text-red-700", icon: XCircle };
            case 'MODIFIED': return { label: "تم تعديل الموعد", color: "bg-purple-100 text-purple-700", icon: CalendarClock };
            case 'NO_SHOW': return { label: "لم يحضر", color: "bg-gray-100 text-gray-700", icon: XCircle };
            default: return { label: app.ticket.status, color: "bg-gray-100 text-gray-700", icon: Bus };
        }
    }
    return null;
};

// Credit-aware mock exam link sender
function MockExamLinkButton({ applicant }: { applicant: ApplicantData }) {
    const { toast } = useToast();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [copying, setCopying] = useState(false);
    const [creditInfo, setCreditInfo] = useState<{ hasCredits: boolean; remaining: number } | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // Check credits on mount
        const checkCredits = async () => {
            try {
                const params = new URLSearchParams();
                if (applicant.isVisitor) {
                    params.set("phone", applicant.phone);
                } else {
                    params.set("applicantId", applicant.id);
                }
                const res = await fetch(`/api/pricing/mock-packages/check-credits?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setCreditInfo(data);
                }
            } catch { /* ignore */ }
            setChecked(true);
        };
        checkCredits();
    }, [applicant.id, applicant.phone]);

    const noCredits = checked && creditInfo && !creditInfo.hasCredits;
    const remainingText = creditInfo
        ? creditInfo.remaining === -1 ? "∞" : `${creditInfo.remaining}`
        : "...";

    const handleSend = async () => {
        if (noCredits) return;
        setSending(true);
        setHasError(false);
        try {
            const genRes = await fetch("/api/messages/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId: applicant.isVisitor ? undefined : applicant.id,
                    purchaseId: applicant.visitorPurchaseId || undefined,
                    phone: applicant.phone,
                    trigger: "ON_MOCK_EXAM_LINK",
                })
            });
            if (!genRes.ok) throw new Error("Failed to generate");
            const { message, phone } = await genRes.json();

            const sendRes = await fetch("/api/messages/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId: applicant.isVisitor ? undefined : applicant.id,
                    phone,
                    message,
                    trigger: "ON_MOCK_EXAM_LINK",
                })
            });
            if (!sendRes.ok) throw new Error("Failed to send");
            setSent(true);
            toast("تم إرسال رابط الاختبار التجريبي بنجاح.", "success");
            
            // Revert icon back to normal after 5 seconds so they can send again if they want
            setTimeout(() => setSent(false), 5000);
            
        } catch (e) {
            console.error("Mock exam link send error:", e);
            setHasError(true);
            toast("حدث خطأ أثناء محاولة إرسال رابط الاختبار عبر الواتساب.", "error");
            setTimeout(() => setHasError(false), 5000);
        } finally {
            setSending(false);
        }
    };

    const handleCopy = async () => {
        if (noCredits) return;
        setCopying(true);
        try {
            const genRes = await fetch("/api/messages/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId: applicant.isVisitor ? undefined : applicant.id,
                    purchaseId: applicant.visitorPurchaseId || undefined,
                    phone: applicant.phone,
                    trigger: "ON_MOCK_EXAM_LINK",
                })
            });
            if (!genRes.ok) throw new Error("Failed to generate");
            const { message } = await genRes.json();
            await navigator.clipboard.writeText(message);
            toast("تم نسخ قالب الرسالة إلى الحافظة.", "success");
        } catch (e) {
            console.error("Copy error:", e);
            toast("تعذر إنشاء قالب الرسالة للنسخ.", "error");
        } finally {
            setCopying(false);
        }
    };

    return (
        <div className="flex items-center">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 w-8 p-0",
                                noCredits ? "text-gray-300 cursor-not-allowed" :
                                sent ? "text-green-600" : 
                                hasError ? "text-red-600" : "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            )}
                            onClick={handleSend}
                            disabled={sending || sent || !!noCredits}
                        >
                            {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : sent ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : hasError ? (
                                <XCircle className="h-4 w-4" />
                            ) : (
                                <BookOpen className="h-4 w-4" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{noCredits ? "لا يوجد رصيد اختبارات ❌" : sent ? "تم الإرسال ✓" : hasError ? "فشل الإرسال ❌" : `إرسال رابط اختبار (متبقي: ${remainingText})`}</p>
                    </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100",
                                noCredits ? "text-gray-300 cursor-not-allowed" : ""
                            )}
                            onClick={handleCopy}
                            disabled={copying || !!noCredits}
                        >
                            {copying ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>نسخ قالب رابط الاختبار التجريبي</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

export const columns: ColumnDef<ApplicantData>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "fullName",
        header: ({ column }) => (
            <Button variant="ghost" className="text-right p-0 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                بيانات المتقدم
                <ArrowUpDown className="mr-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{row.getValue("fullName")}</span>
                    {row.original.isVisitor && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-300 bg-orange-50 text-orange-700">
                            زائر
                        </Badge>
                    )}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 font-mono">
                    {!row.original.isVisitor && <span className="bg-gray-100 px-1 rounded">{row.original.applicantCode || "PNR"}</span>}
                    <span>{row.original.phone}</span>
                </div>
            </div>
        ),
    },
    {
        id: "mockExam",
        header: "الاختبارات",
        cell: ({ row }) => {
            const mp = row.original.mockPurchase;
            if (!mp) return <span className="text-gray-300 text-xs">—</span>;

            const remaining = mp.totalCredits === -1 ? -1 : mp.totalCredits - mp.usedCredits;
            const isExpired = mp.expiresAt && new Date(mp.expiresAt) < new Date();
            const isLow = remaining !== -1 && remaining <= 1 && remaining >= 0;
            const isDepleted = remaining === 0;

            return (
                <div className="flex flex-col gap-1">
                    <div className="text-xs font-semibold text-purple-700">
                        {mp.packageName || "مفرد"}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={cn(
                            "text-xs font-bold px-1.5 py-0.5 rounded",
                            isDepleted ? "bg-red-100 text-red-700" :
                            isLow ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"
                        )}>
                            {remaining === -1 ? "∞" : `${mp.usedCredits}/${mp.totalCredits}`}
                        </span>
                        {isDepleted && <span className="text-[10px] text-red-500">نفد</span>}
                        {isExpired && <span className="text-[10px] text-red-500">منتهي</span>}
                        {isLow && !isDepleted && <span className="text-[10px] text-yellow-600">⚠️</span>}
                    </div>
                    {/* Mini progress bar */}
                    {mp.totalCredits > 0 && (
                        <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", isDepleted ? "bg-red-400" : isLow ? "bg-yellow-400" : "bg-green-400")}
                                style={{ width: `${Math.min(100, (mp.usedCredits / mp.totalCredits) * 100)}%` }} />
                        </div>
                    )}
                </div>
            );
        }
    },
    {
        id: "examStatus",
        header: "حالة الاختبار",
        cell: ({ row }) => {
            const status = row.original.status;

            if (status === 'VISITOR') {
                return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-xs">زائر</Badge>;
            }

            let display = { label: "غير محدد", class: "bg-gray-100 text-gray-500" };
            if (status === 'EXAM_SCHEDULED') display = { label: "تم حجز الموعد", class: "bg-blue-100 text-blue-700" };
            else if (status === 'PASSED') display = { label: "ناجح", class: "bg-green-100 text-green-700" };
            else if (status === 'FAILED') display = { label: "راسب", class: "bg-red-100 text-red-700" };
            else if (status === 'ABSENT') display = { label: "غائب", class: "bg-orange-100 text-orange-700" };
            else if (status === 'NEW_REGISTRATION') display = { label: "جديد", class: "bg-gray-100 text-gray-600" };

            if (row.original.isVisitor) return null;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={cn("px-2 py-1 rounded-md text-xs font-semibold cursor-pointer select-none transition-colors hover:opacity-80", display.class)}>
                            {display.label}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>تحديث الحالة</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={status} onValueChange={async (val) => {
                            const result = await updateApplicantStatus(row.original.id, val);
                            if (result?.success) {
                                document.dispatchEvent(new CustomEvent('refresh-applicants-table'));
                            }
                        }}>
                            <DropdownMenuRadioItem value="PASSED">ناجح</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="FAILED">راسب</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="ABSENT">غائب</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="EXAM_SCHEDULED">تم حجز الموعد</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    },
    {
        id: "ticketStatus",
        header: "حالة التذكرة",
        cell: ({ row }) => {
            if (row.original.isVisitor) return <span className="text-gray-300 text-xs">—</span>;
            const status = getTicketStatus(row.original);
            if (!status) return <span className="text-gray-300 text-xs">-</span>;

            return (
                <div className={cn("px-2 py-1 rounded-md text-xs font-medium w-fit", status.color)}>
                    {status.label}
                </div>
            );
        },
    },
    {
        accessorKey: "examDate",
        header: "الموعد",
        cell: ({ row }) => {
            if (row.original.isVisitor) return <span className="text-gray-300 text-xs">—</span>;
            const date = row.getValue("examDate") as string;
            if (!date) return <span className="text-muted-foreground text-xs">-</span>;
            const d = new Date(date);
            const isToday = new Date().toDateString() === d.toDateString();

            return (
                <div className={cn("text-xs font-medium flex flex-col", isToday ? "text-green-600" : "")}>
                    <span>
                        {d.toLocaleDateString("en-GB")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{row.original.examTime || ""}</span>
                </div>
            );
        },
    },
    {
        id: "financials",
        header: "المالية",
        cell: ({ row }) => {
            if (row.original.isVisitor) {
                const mp = row.original.mockPurchase;
                return mp ? <span className="text-xs font-bold text-green-600">مدفوع</span> : <span className="text-gray-300 text-xs">—</span>;
            }
            const remaining = Number(row.original.remainingBalance);
            return (
                <div className="flex flex-col items-end">
                    <div className={cn("font-bold text-xs", remaining > 0 ? "text-red-600" : "text-green-600")}>
                        {remaining > 0 ? remaining.toLocaleString() : "مدفوع"}
                    </div>
                </div>
            );
        },
    },
    {
        id: "actions",
        header: "الإجراءات",
        cell: ({ row }) => {
            const app = row.original;

            return (
                <div className="flex items-center gap-1">
                    {/* Mock Exam Link Button */}
                    <MockExamLinkButton applicant={app} />

                    {/* Primary Action: Open Modal */}
                    <Button
                        variant="default"
                        size="sm"
                        className={cn(
                            "h-8 px-3 text-white text-xs font-medium",
                            app.isVisitor ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"
                        )}
                        onClick={() => {
                            document.dispatchEvent(new CustomEvent('open-applicant-modal', { detail: app }));
                        }}
                    >
                        فتح
                    </Button>

                    {/* More Options Dropdown */}
                    {!app.isVisitor && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                    <span className="sr-only">المزيد</span>
                                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>إجراءات سريعة</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(app.applicantCode || app.id)}>
                                    نسخ رقم الملف
                                </DropdownMenuItem>
                                <Link href={`https://wa.me/${app.whatsappNumber}`} target="_blank">
                                    <DropdownMenuItem>مراسلة واتساب</DropdownMenuItem>
                                </Link>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            );
        },
    },
];
