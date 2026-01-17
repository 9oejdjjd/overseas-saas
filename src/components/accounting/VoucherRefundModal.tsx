
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, RefreshCw, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VoucherRefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function VoucherRefundModal({ isOpen, onClose, onSuccess }: VoucherRefundModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [applicants, setApplicants] = useState<any[]>([]);
    const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Search Applicant
    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 3) {
            setApplicants([]);
            return;
        }

        try {
            const res = await fetch(`/api/applicants?search=${term}`);
            if (res.ok) {
                const data = await res.json();
                setApplicants(Array.isArray(data) ? data : data.applicants);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Fetch Applicant Vouchers
    const handleSelectApplicant = async (app: any) => {
        setSelectedApplicant(app);
        setLoading(true);
        try {
            const res = await fetch(`/api/vouchers?applicantId=${app.id}&type=EXAM_RETAKE`); // EXAM_RETAKE is used for COMPENSATION
            if (res.ok) {
                const data = await res.json();
                // Filter client side to be safe and ensure only COMPENSATION category or valid refundable vouchers
                const refundable = data.filter((v: any) =>
                    !v.isUsed &&
                    (v.category === "COMPENSATION" || (v.notes && v.notes.includes("COMPENSATION")))
                );
                setVouchers(refundable);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async (voucher: any) => {
        if (!confirm(`هل أنت متأكد من استرداد مبلغ ${getAmount(voucher)} ر.ي نقداً للمتقدم؟ سيتم تعطيل القسيمة.`)) return;

        setProcessingId(voucher.id);
        try {
            const res = await fetch("/api/vouchers/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ voucherId: voucher.id, notes: "Refunded from Accounting Page" })
            });

            if (res.ok) {
                alert("تم استرداد المبلغ بنجاح");
                // Remove from list
                setVouchers(prev => prev.filter(v => v.id !== voucher.id));
                onSuccess();
            } else {
                const err = await res.json();
                alert(err.error || "فشلت العملية");
            }
        } catch (e) {
            alert("حدث خطأ");
        } finally {
            setProcessingId(null);
        }
    };

    const getAmount = (v: any) => {
        if (v.amount) return v.amount;
        if (v.notes && v.notes.includes("META")) {
            try {
                const meta = JSON.parse(v.notes.split("META:")[1].replace("]", ""));
                return meta.balance || meta.amount || 0;
            } catch (e) { return 0; }
        }
        return 0;
    };

    const reset = () => {
        setSearchTerm("");
        setApplicants([]);
        setSelectedApplicant(null);
        setVouchers([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) reset(); onClose(); }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>استرداد القسائم (تعويضات)</DialogTitle>
                    <DialogDescription>
                        استرداد نقدي لقسائم التعويض. سيتم تسجيل العملية كمسحوبات.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!selectedApplicant ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="ابحث عن متقدم (الاسم، الجواز)..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pr-9"
                                />
                            </div>
                            <div className="h-[300px] border rounded-md p-2 overflow-y-auto">
                                {applicants.length === 0 && searchTerm.length > 2 && (
                                    <div className="text-center py-4 text-gray-500">لا توجد نتائج</div>
                                )}
                                {applicants.map((app) => (
                                    <div
                                        key={app.id}
                                        onClick={() => handleSelectApplicant(app)}
                                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer rounded-lg border-b last:border-0"
                                    >
                                        <div>
                                            <p className="font-bold text-sm">{app.fullName}</p>
                                            <p className="text-xs text-gray-500">{app.passportNumber}</p>
                                        </div>
                                        <Badge variant="outline">اختيار</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <div>
                                    <p className="font-bold text-blue-900">{selectedApplicant.fullName}</p>
                                    <p className="text-xs text-blue-700">قسائم التعويض المتاحة</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedApplicant(null)}><X className="h-4 w-4" /></Button>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-gray-400" /></div>
                            ) : (
                                <div className="space-y-3">
                                    {vouchers.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                            <p>لا توجد قسائم تعويض متاحة للاسترداد</p>
                                        </div>
                                    ) : (
                                        vouchers.map(v => (
                                            <div key={v.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-200 transition-all bg-white shadow-sm">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">تعويض</Badge>
                                                        <span className="font-bold text-lg">{getAmount(v).toLocaleString()} ر.ي</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">{new Date(v.createdAt).toLocaleDateString("ar-EG")}</p>
                                                </div>
                                                <Button
                                                    onClick={() => handleRefund(v)}
                                                    disabled={processingId === v.id}
                                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                                >
                                                    {processingId === v.id ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                                                    استرداد نقدي
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
