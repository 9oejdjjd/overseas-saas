"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

type RegionsChartProps = {
    locationData: { name: string; value: number }[];
};

export function RegionsChart({ locationData }: RegionsChartProps) {
    // Elegant tailored color palette instead of simple pure colors
    const COLORS = [
        '#6366f1', // Indigo
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#3b82f6', // Blue
        '#8b5cf6'  // Violet
    ];

    return (
        <Card className="shadow-sm border border-slate-100 bg-white">
            <CardHeader className="pb-2">
                <div className="text-right">
                    <CardTitle className="text-sm font-bold text-slate-800">التوزيع الجغرافي للمتقدمين</CardTitle>
                    <CardDescription className="text-[10px] text-slate-400 font-bold mt-0.5">
                        حصة ونسب المتقدمين الموزعة حسب المحافظات والبلدان
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="h-[200px] pt-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={locationData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={45} 
                            outerRadius={65} 
                            paddingAngle={3} 
                            dataKey="value"
                        >
                            {locationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: '1px solid #f1f5f9', 
                                fontSize: '10px',
                                direction: 'rtl',
                                textAlign: 'right'
                            }} 
                        />
                        <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right" 
                            wrapperStyle={{ 
                                fontSize: '10px', 
                                fontWeight: 'bold', 
                                color: '#64748b',
                                paddingRight: '10px'
                            }} 
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
