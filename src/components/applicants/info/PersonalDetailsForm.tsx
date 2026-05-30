"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Save } from "lucide-react";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { OCRUploader } from "@/components/applicants/OCRUploader";
import { useApplicantInfo } from "@/hooks/applicants/useApplicantInfo";

interface PersonalDetailsFormProps {
    hook: ReturnType<typeof useApplicantInfo>;
}

export function PersonalDetailsForm({ hook }: PersonalDetailsFormProps) {
    const {
        professions,
        dropdownOpen,
        setDropdownOpen,
        basicInfo,
        setBasicInfo,
        savingBasic,
        handleSaveBasicInfo
    } = hook;

    return (
        <div className="space-y-4 animate-in fade-in relative">
            {savingBasic && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">جاري حفظ البيانات...</span>
                    </div>
                </div>
            )}
            
            <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700">الاسم الكامل (عربي)</Label>
                <Input
                    value={basicInfo.fullName}
                    onChange={e => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                    className="font-semibold"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs text-gray-600">الاسم الإنجليزي (الأول)</Label>
                    <Input
                        value={basicInfo.firstName}
                        onChange={e => setBasicInfo({ ...basicInfo, firstName: e.target.value })}
                        className="dir-ltr font-mono bg-blue-50/50"
                        placeholder="First Name"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-gray-600">الاسم الإنجليزي (الأخير)</Label>
                    <Input
                        value={basicInfo.lastName}
                        onChange={e => setBasicInfo({ ...basicInfo, lastName: e.target.value })}
                        className="dir-ltr font-mono bg-blue-50/50"
                        placeholder="Last Name"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs text-gray-600">رقم الهاتف</Label>
                    <Input
                        value={basicInfo.phone}
                        onChange={e => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                        className="dir-ltr font-mono"
                        placeholder="967..."
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-gray-600">رقم الواتساب</Label>
                    <Input
                        value={basicInfo.whatsappNumber}
                        onChange={e => setBasicInfo({ ...basicInfo, whatsappNumber: e.target.value })}
                        className="dir-ltr font-mono"
                        placeholder="967..."
                    />
                </div>
            </div>
            
            <div className="space-y-2 relative">
                <Label className="text-xs">المهنة</Label>
                <div className="relative">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        value={basicInfo.profession}
                        onChange={e => {
                            setBasicInfo({ ...basicInfo, profession: e.target.value });
                            setDropdownOpen(true);
                        }}
                        onFocus={() => setDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                        className="pr-9"
                        placeholder="ابحث أو اكتب المهنة..."
                    />
                </div>
                {dropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                        {professions.filter(p => p.name.includes(basicInfo.profession || "")).map(p => (
                            <div
                                key={p.id}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setBasicInfo({ ...basicInfo, profession: p.name });
                                    setDropdownOpen(false);
                                }}
                            >
                                {p.name}
                            </div>
                        ))}
                        {professions.filter(p => p.name.includes(basicInfo.profession || "")).length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-500 text-center">قم بكتابة المهنة أو ابحث عنها</div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className="text-xs">رقم الجواز</Label>
                    <OCRUploader
                        type="PASSPORT"
                        onScanComplete={(data) => {
                            const updates: any = {};
                            if (data.passportNumber) updates.passportNumber = data.passportNumber;
                            if (data.firstName) updates.firstName = data.firstName;
                            if (data.lastName) updates.lastName = data.lastName;
                            if (data.passportExpiry) updates.passportExpiry = new Date(data.passportExpiry);
                            if (data.dob) updates.dob = new Date(data.dob);
                            if (data.profession) updates.profession = data.profession;
                            if (data.nationalId) updates.nationalId = data.nationalId;

                            setBasicInfo(prev => ({ ...prev, ...updates }));
                        }}
                        label="مسح"
                        className="scale-90"
                    />
                </div>
                <Input
                    value={basicInfo.passportNumber}
                    onChange={e => setBasicInfo({ ...basicInfo, passportNumber: e.target.value })}
                    className="dir-ltr font-mono uppercase"
                />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs">انتهاء الجواز</Label>
                    <CustomDatePicker
                        value={basicInfo.passportExpiry}
                        onChange={d => setBasicInfo({ ...basicInfo, passportExpiry: d })}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">تاريخ الميلاد</Label>
                    <CustomDatePicker
                        value={basicInfo.dob}
                        onChange={d => setBasicInfo({ ...basicInfo, dob: d })}
                    />
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className="text-xs">الرقم الوطني</Label>
                    <OCRUploader
                        type="NATIONAL_ID"
                        onScanComplete={(data) => {
                            if (data.nationalId) setBasicInfo(prev => ({ ...prev, nationalId: data.nationalId }));
                        }}
                        label="مسح"
                        className="scale-90"
                    />
                </div>
                <Input
                    value={basicInfo.nationalId}
                    onChange={e => setBasicInfo({ ...basicInfo, nationalId: e.target.value })}
                />
            </div>
            
            <Button onClick={handleSaveBasicInfo} disabled={savingBasic} className="w-full bg-blue-600 hover:bg-blue-700">
                {savingBasic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                حفظ التعديلات
            </Button>
        </div>
    );
}
