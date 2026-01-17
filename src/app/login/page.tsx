
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res?.error) {
                setError("بيانات الدخول غير صحيحة");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("حدث خطأ ما");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-100 text-red-700 p-3 rounded text-sm">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label>البريد الإلكتروني</label>
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-2">
                            <label>كلمة المرور</label>
                            <Input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                dir="ltr"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "جاري الدخول..." : "دخول"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
