
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Scan, Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/simple-toast";

interface OCRUploaderProps {
    onScanComplete: (data: any) => void;
    type: "PASSPORT" | "NATIONAL_ID";
    label?: string;
    className?: string;
}

export function OCRUploader({ onScanComplete, type, label, className }: OCRUploaderProps) {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("type", type);

        try {
            const res = await fetch("/api/ocr/analyze", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("فشل تحليل الصورة");
            }

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            onScanComplete(data);
            toast("تم استخراج البيانات بنجاح", "success");
        } catch (error: any) {
            console.error(error);
            toast(error.message || "حدث خطأ أثناء المسح", "error");
        } finally {
            setLoading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className={className}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            <Button
                type="button" // Prevent form submission
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Scan className="h-4 w-4" />
                )}
                {label || "مسح ضوئي"}
            </Button>
        </div>
    );
}
