import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AgentDepositDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    depositAmount: string;
    setDepositAmount: (val: string) => void;
    depositDescription: string;
    setDepositDescription: (val: string) => void;
    depositType: string;
    setDepositType: (val: string) => void;
    submittingDeposit: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export function AgentDepositDialog({
    isOpen,
    setIsOpen,
    depositAmount,
    setDepositAmount,
    depositDescription,
    setDepositDescription,
    depositType,
    setDepositType,
    submittingDeposit,
    onSubmit
}: AgentDepositDialogProps) {
    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
                <Button className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/20 text-xs">
                    <Plus className="h-4 w-4" />
                    شحن المحفظة / تعديل يدوي
                </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-2xl sm:rounded-2xl font-sans text-right animate-in fade-in zoom-in duration-200" dir="rtl">
                    <Dialog.Title className="text-base font-black text-gray-900">شحن رصيد / تعديل مالي للمحفظة</Dialog.Title>
                    
                    <form onSubmit={onSubmit} className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700">نوع العملية المالية</label>
                            <select 
                                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                                value={depositType}
                                onChange={e => setDepositType(e.target.value)}
                            >
                                <option value="DEPOSIT">إيداع رصيد (شحن)</option>
                                <option value="BONUS">منح رصيد مكافأة</option>
                                <option value="ADJUSTMENT">تعديل رصيد بالزيادة (+)</option>
                                <option value="ADJUSTMENT_NEG">تعديل رصيد بالخصم (-)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700">المبلغ بالريال اليمني</label>
                            <Input required type="number" min="1" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="h-10 rounded-xl text-xs font-semibold font-sans bg-white border border-slate-250" placeholder="مثال: 10000" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700">الوصف / البيان المستندي</label>
                            <Input required value={depositDescription} onChange={e => setDepositDescription(e.target.value)} className="h-10 rounded-xl text-xs font-semibold bg-white border border-slate-250" placeholder="مثال: إيداع نقدي للمكتب..." />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Dialog.Close asChild>
                                <Button type="button" variant="outline" className="h-10 rounded-xl text-xs font-bold bg-white">إلغاء</Button>
                            </Dialog.Close>
                            <Button type="submit" disabled={submittingDeposit} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md">
                                {submittingDeposit ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ الحساب"}
                            </Button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
