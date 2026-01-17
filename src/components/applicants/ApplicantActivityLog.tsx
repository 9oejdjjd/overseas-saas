"use client";

import { ActivityLog } from "@/types/applicant";

interface ApplicantActivityLogProps {
    logs: ActivityLog[];
}

export function ApplicantActivityLog({ logs }: ApplicantActivityLogProps) {
    if (logs.length === 0) {
        return <div className="text-center text-gray-400 py-8 text-sm">لا يوجد سجل نشاط</div>;
    }

    return (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {logs.map((log) => (
                <div key={log.id} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                        <div className="w-0.5 h-full bg-blue-100 mt-1" />
                    </div>
                    <div className="pb-4">
                        <p className="text-sm font-medium text-gray-800">{log.action}</p>
                        <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString('en-GB')} - {log.user?.name || 'النظام'}
                        </p>
                        {log.details && (
                            <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded border inline-block">
                                {log.details}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
