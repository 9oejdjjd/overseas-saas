"use client";

import { ExtendedApplicant } from "@/types/applicant";
import { Copy, Check } from "lucide-react";
import { useApplicantInfo } from "@/hooks/applicants/useApplicantInfo";

interface PersonalDetailsViewProps {
    applicant: ExtendedApplicant;
    hook: ReturnType<typeof useApplicantInfo>;
}

export function PersonalDetailsView({ applicant, hook }: PersonalDetailsViewProps) {
    const { copiedField, copyToClipboard } = hook;

    return (
        <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">الاسم الكامل</span>
                <span className="font-medium text-right">{applicant.fullName}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">المهنة</span>
                <span className="font-medium">{applicant.profession}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">رقم الهاتف</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-medium direction-ltr">{applicant.phone || "-"}</span>
                    {applicant.phone && (
                        <button onClick={() => copyToClipboard(applicant.phone, 'phone')} className="text-gray-400 hover:text-blue-600">
                            {copiedField === 'phone' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">رقم الواتساب</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-medium direction-ltr">{applicant.whatsappNumber || "-"}</span>
                    {applicant.whatsappNumber && (
                        <button onClick={() => copyToClipboard(applicant.whatsappNumber, 'whatsapp')} className="text-gray-400 hover:text-blue-600">
                            {copiedField === 'whatsapp' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">بريد الإشعارات</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-medium direction-ltr">{applicant.notificationEmail || "-"}</span>
                    {applicant.notificationEmail && (
                        <button onClick={() => copyToClipboard(applicant.notificationEmail!, 'notifEmail')} className="text-gray-400 hover:text-blue-600">
                            {copiedField === 'notifEmail' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">First Name</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{applicant.firstName || "-"}</span>
                    {applicant.firstName && (
                        <button onClick={() => copyToClipboard(applicant.firstName!, 'fname')} className="text-gray-400 hover:text-blue-600">
                            {copiedField === 'fname' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">Last Name</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{applicant.lastName || "-"}</span>
                    {applicant.lastName && (
                        <button onClick={() => copyToClipboard(applicant.lastName!, 'lname')} className="text-gray-400 hover:text-blue-600">
                            {copiedField === 'lname' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">رقم الجواز</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{applicant.passportNumber || "-"}</span>
                    {applicant.passportNumber && (
                        <button onClick={() => copyToClipboard(applicant.passportNumber!, 'passport')} className="text-gray-400 hover:text-blue-600">
                            {copiedField === 'passport' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">انتهاء الجواز</span>
                <span className="font-mono font-medium">
                    {applicant.passportExpiry ? new Date(applicant.passportExpiry).toLocaleDateString('en-GB') : "-"}
                </span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">تاريخ الميلاد</span>
                <span className="font-mono font-medium">
                    {applicant.dob ? new Date(applicant.dob).toLocaleDateString('en-GB') : "-"}
                </span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">الرقم الوطني</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{applicant.nationalId || "-"}</span>
                    {applicant.nationalId && (
                        <button onClick={() => copyToClipboard(applicant.nationalId!, 'nid')} className="text-gray-400 hover:text-blue-600">
                            {copiedField === 'nid' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
