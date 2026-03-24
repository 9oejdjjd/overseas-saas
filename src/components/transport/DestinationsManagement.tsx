
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

type Destination = { id: string; name: string; code: string | null };

export function DestinationsManagement() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchDestinations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/transport/destinations");
            if (res.ok) setDestinations(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchDestinations(); }, []);

    const handleAdd = async () => {
        if (!newName) return;
        try {
            await fetch("/api/transport/destinations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });
            setNewName("");
            fetchDestinations();
        } catch (e) { alert("حدث خطأ"); }
    };

    return (
        <Card>
            <CardHeader><CardTitle>قائمة الوجهات (المدن)</CardTitle></CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-6">
                    <Input placeholder="اسم المدينة (مثال: صنعاء)" value={newName} onChange={e => setNewName(e.target.value)} />
                    <Button onClick={handleAdd}><Plus className="h-4 w-4 ml-2" /> إضافة</Button>
                </div>
                <div className="border rounded divide-y">
                    {destinations.map(d => (
                        <div key={d.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                            <span className="font-medium">{d.name}</span>
                            <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    {destinations.length === 0 && !loading && <div className="p-4 text-center text-gray-500">لا توجد وجهات</div>}
                </div>
            </CardContent>
        </Card>
    );
}
