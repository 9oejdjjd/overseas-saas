/**
 * @file SessionsTable.tsx
 * @description مكون جدول عرض الجلسات والمشتبه بهم والتفاصيل المتداخلة (SessionsTable).
 * يدعم التوسيع اللحظي لعرض محاولات المتقدم والـ IPs والـ Fingerprints وإجراءات الحظر والمنح.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, ShieldAlert, Ban, Eye, MoreHorizontal, PlusCircle, Globe, Fingerprint, Users as UsersIcon, Phone as PhoneIcon } from "lucide-react";

// مكون شارة مستويات الاشتباه الداخلي
function SuspicionBadge({ level, score }: { level: string; score: number }) {
    if (level === "CLEAN") return null;
    const config: Record<string, { bg: string; text: string; label: string }> = {
        WATCH: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", label: "مراقبة" },
        SUSPICIOUS: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", label: "مشبوه" },
        CRITICAL: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "خطير" },
    };
    const c = config[level] || config.WATCH;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${c.bg} ${c.text}`}>
            <ShieldAlert className="w-3 h-3" />
            {c.label} ({score})
        </span>
    );
}

interface SessionsTableProps {
    filteredSessions: any[];
    loading: boolean;
    suspicionFilter: string;
    expandedGroups: string[];
    toggleGroup: (id: string) => void;
    stopAttempts: (session: any) => void;
    grantAttempt: (group: any, session?: any) => void;
    fetchReview: (sessionId: string, sessionMeta?: any) => void;
    canManageActions: boolean;
}

export function SessionsTable({
    filteredSessions,
    loading,
    suspicionFilter,
    expandedGroups,
    toggleGroup,
    stopAttempts,
    grantAttempt,
    fetchReview,
    canManageActions
}: SessionsTableProps) {
    return (
        <div className="overflow-x-auto border border-gray-100 rounded-xl bg-white shadow-sm" dir="rtl">
            <table className="w-full text-sm text-right rtl:text-right">
                <thead className="bg-gray-50/75 border-b text-gray-500 font-bold">
                    <tr>
                        <th className="px-6 py-4 font-bold text-xs tracking-wider">المتقدم</th>
                        <th className="px-6 py-4 font-bold text-xs tracking-wider">المهنة</th>
                        <th className="px-6 py-4 font-bold text-xs tracking-wider">الحالة</th>
                        <th className="px-6 py-4 font-bold text-xs tracking-wider">النتيجة</th>
                        <th className="px-6 py-4 font-bold text-xs tracking-wider">النوع والمحاولة</th>
                        <th className="px-6 py-4 font-bold text-xs tracking-wider">التاريخ</th>
                        <th className="px-6 py-4 font-bold text-xs tracking-wider">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="py-16 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                                <p className="text-xs text-gray-400 mt-2 font-medium">جاري جلب سجل الجلسات...</p>
                            </td>
                        </tr>
                    ) : filteredSessions.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-16 text-center text-gray-500 font-medium">
                                {suspicionFilter !== "ALL" 
                                    ? "لا توجد أنشطة مشبوهة حالياً ✅" 
                                    : "لا توجد جلسات اختبار مسجلة حالياً"}
                            </td>
                        </tr>
                    ) : (
                        filteredSessions.map((group) => {
                            const isExpanded = expandedGroups.includes(group.id);
                            const borderColor = group.suspicionLevel === "CRITICAL" ? "border-r-red-500" 
                                : group.suspicionLevel === "SUSPICIOUS" ? "border-r-orange-500"
                                : group.suspicionLevel === "WATCH" ? "border-r-yellow-500"
                                : "border-r-transparent";

                            return (
                                <React.Fragment key={group.id}>
                                    {/* الصف الرئيسي للمتقدم */}
                                    <tr className={`hover:bg-slate-50/30 transition-colors border-r-4 ${borderColor}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900 text-sm">{group.displayName}</span>
                                                <SuspicionBadge level={group.suspicionLevel} score={group.suspicionScore} />
                                                {group.isBanned && (
                                                    <span title="تم حظر المتقدم بالكامل" className="bg-red-50 text-red-700 p-0.5 rounded border border-red-100">
                                                        <Ban className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-mono mt-0.5" dir="ltr">{group.displayPhone}</div>
                                            
                                            {/* أسباب الاشتباه */}
                                            {group.suspicionReasons?.length > 0 && (
                                                <div className="mt-1.5 flex flex-wrap gap-1">
                                                    {group.suspicionReasons.map((r: string, i: number) => (
                                                        <div 
                                                            key={i} 
                                                            className="text-[9px] font-black text-red-700 bg-red-50 border border-red-100/50 px-2 py-0.5 rounded-md"
                                                        >
                                                            ⚠ {r}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {group.allProfessions?.length > 1 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {group.allProfessions.map((p: string) => (
                                                        <span 
                                                            key={p} 
                                                            className="bg-blue-50/50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-blue-100/60"
                                                        >
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="bg-blue-50/50 text-blue-700 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-blue-100/60">
                                                    {group.profession?.name || "غير محدد"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {group.isBanned ? (
                                                <Badge variant="destructive" className="bg-red-600 font-bold text-[10px]">محظور</Badge>
                                            ) : group.status === "SUBMITTED" ? (
                                                <Badge variant="outline" className="bg-green-50/80 text-green-700 border-green-200 text-[10px] font-bold">مكتمل</Badge>
                                            ) : group.status === "TIMEOUT" ? (
                                                <Badge variant="outline" className="bg-red-50/80 text-red-700 border-red-200 text-[10px] font-bold">لم يكمل</Badge>
                                            ) : group.status === "EXPIRED" ? (
                                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] font-bold">لم يدخل</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-orange-50/80 text-orange-700 border-orange-200 text-[10px] font-bold animate-pulse">قيد الاختبار</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="text-gray-400">أفضل:</span>
                                                    <span className={`font-bold ${group.isPassed ? "text-green-600" : "text-red-500"}`}>
                                                        {group.bestScore}%
                                                    </span>
                                                </div>
                                                {group.totalAttempts > 1 && (
                                                    <div className="flex items-center gap-1 text-[10px]">
                                                        <span className="text-gray-400">أحدث:</span>
                                                        <span className="text-gray-500 font-medium">{group.lastScore}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 items-center">
                                                <Badge variant="secondary" className="text-[9px] font-bold scale-90">{group.type === "PUBLIC" ? "عام" : "خاص"}</Badge>
                                                <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                                    {group.totalAttempts} / 3
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs font-medium text-left" dir="ltr">
                                            {new Date(group.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => toggleGroup(group.id)} 
                                                    className="gap-1.5 text-xs font-bold border-gray-200 h-8 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                                                    التقييمات ({group.totalAttempts})
                                                </Button>
                                                {!group.isBanned && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => stopAttempts(group.sessions[0])} 
                                                        className="gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50/50 border-red-200 hover:border-red-300 h-8 transition-colors"
                                                    >
                                                        <Ban className="w-3.5 h-3.5" />
                                                        حظر
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* تفاصيل الجلسة الإضافية المنسدلة عند التوسيع */}
                                    {isExpanded && (
                                        <>
                                            {/* سجلات البصمة وعناوين IP المشبوهة */}
                                            {group.suspicionLevel !== "CLEAN" && (
                                                <tr className="bg-red-50/10 border-b border-red-100/30">
                                                    <td colSpan={7} className="px-6 py-3 border-r-2 border-r-red-400">
                                                        <div className="flex flex-wrap gap-4 text-[11px] font-bold">
                                                            {group.allIps?.length > 0 && (
                                                                <div className="flex items-center gap-1 text-gray-600">
                                                                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                                                                    <span className="text-gray-500">مواقع IP:</span>
                                                                    {group.allIps.map((ip: string) => (
                                                                        <span key={ip} className="bg-white px-2 py-0.5 rounded border font-mono text-[10px] text-gray-700">{ip}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {group.allFingerprints?.length > 0 && (
                                                                <div className="flex items-center gap-1 text-gray-600">
                                                                    <Fingerprint className="w-3.5 h-3.5 text-gray-400" />
                                                                    <span className="text-gray-500">البصمات:</span>
                                                                    {group.allFingerprints.map((fp: string) => (
                                                                        <span key={fp} className="bg-white px-2 py-0.5 rounded border font-mono text-[10px] text-gray-700">{fp.substring(0, 12)}...</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {group.allNames?.length > 1 && (
                                                                <div className="flex items-center gap-1 text-gray-600">
                                                                    <UsersIcon className="w-3.5 h-3.5 text-gray-400" />
                                                                    <span className="text-gray-500">الأسماء المستخدمة:</span>
                                                                    {group.allNames.map((n: string) => (
                                                                        <span key={n} className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200 text-[10px]">{n}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {group.allPhones?.length > 1 && (
                                                                <div className="flex items-center gap-1 text-gray-600">
                                                                    <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                                                                    <span className="text-gray-500">الهواتف المستخدمة:</span>
                                                                    {group.allPhones.map((p: string) => (
                                                                        <span key={p} className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200 font-mono text-[10px]">{p}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                            {/* قائمة المحاولات التفصيلية للجلسة */}
                                            {group.sessions.map((session: any) => {
                                                const sPassed = session.status === "SUBMITTED" && session.score >= session.passingScore;
                                                const sName = session.applicant?.fullName || session.visitorName || "غير معروف";
                                                const sPhone = session.applicant?.whatsappNumber || session.visitorPhone || "لا يوجد";
                                                
                                                return (
                                                    <tr key={session.id} className="bg-slate-50/30 border-b border-slate-100">
                                                        <td className="px-6 py-3 pl-8 text-xs relative">
                                                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-200"></div>
                                                            <span className="text-gray-400 block mb-0.5 font-medium">الاسم: {sName}</span>
                                                            <span className="text-gray-400 font-mono" dir="ltr">الرقم: {sPhone}</span>
                                                        </td>
                                                        <td className="px-6 py-3 text-xs">
                                                            <span className="bg-slate-100/60 text-slate-600 px-2.5 py-1 rounded-md max-w-[120px] inline-block truncate font-bold border">
                                                                {session.profession?.name || group.profession?.name || "غير محدد"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            {session.status === "SUBMITTED" ? (
                                                                <span className="text-xs text-green-600 font-black">مكتمل</span>
                                                            ) : session.status === "TIMEOUT" ? (
                                                                <span className="text-xs text-red-500 font-black">لم يكمل</span>
                                                            ) : session.status === "EXPIRED" ? (
                                                                <span className="text-xs text-gray-400 font-black">لم يدخل</span>
                                                            ) : (
                                                                <span className="text-xs text-orange-500 font-black animate-pulse">جاري</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            {session.status === "SUBMITTED" ? (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <span className={`font-black ${sPassed ? "text-green-600" : "text-red-500"}`}>
                                                                        {session.score}%
                                                                    </span>
                                                                </div>
                                                            ) : <span className="text-gray-300 font-medium">-</span>}
                                                        </td>
                                                        <td className="px-6 py-3 text-xs text-gray-500 font-bold">
                                                            <Badge variant="secondary" className="text-[9px] ml-2 font-black scale-90 origin-right">{session.type === "PUBLIC" ? "عام" : "خاص"}</Badge>
                                                            محاولة رقم: {session.attemptNumber}
                                                        </td>
                                                        <td className="px-6 py-3 text-left text-xs text-gray-400 font-medium" dir="ltr">
                                                            {new Date(session.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-slate-100">
                                                                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="text-right w-44 rounded-xl shadow-lg border border-gray-100">
                                                                    <DropdownMenuItem 
                                                                        onClick={() => fetchReview(session.id, session)} 
                                                                        disabled={session.status !== "SUBMITTED"} 
                                                                        className="flex justify-end gap-2 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        المراجعة والتفاصيل <Eye className="h-4 w-4 text-blue-600" />
                                                                    </DropdownMenuItem>
                                                                    {canManageActions && (
                                                                        <>
                                                                            <DropdownMenuItem 
                                                                                onClick={() => grantAttempt(group, session)} 
                                                                                className="flex justify-end gap-2 text-xs font-bold text-green-600 cursor-pointer hover:bg-green-50/55 transition-colors"
                                                                            >
                                                                                منح محاولة إضافية <PlusCircle className="h-4 w-4" />
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem 
                                                                                onClick={() => stopAttempts(session)} 
                                                                                className="flex justify-end gap-2 text-xs font-bold text-red-600 cursor-pointer hover:bg-red-50/55 transition-colors"
                                                                            >
                                                                                حظر شامل للجهاز <Ban className="h-4 w-4" />
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </>
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
