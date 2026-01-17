"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
    label: string;
    done: boolean;
    active?: boolean;
}

interface JourneyStepperProps {
    steps: Step[];
}

export function JourneyStepper({ steps }: JourneyStepperProps) {
    const completedCount = steps.filter(s => s.done).length;
    const progressPercent = steps.length > 1 ? ((completedCount - 1) / (steps.length - 1)) * 100 : 0;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between relative px-4">
                {/* Background Track */}
                <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 rounded-full" />

                {/* Progress Track */}
                <div
                    className="absolute top-5 left-8 h-1 bg-primary rounded-full transition-all duration-700 ease-out"
                    style={{ width: `calc(${Math.max(0, progressPercent)}% - 32px)` }}
                />

                {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center z-10 relative">
                        {/* Step Circle */}
                        <div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 border-2",
                                step.done
                                    ? "bg-primary border-primary text-white shadow-md"
                                    : step.active
                                        ? "bg-white border-primary text-primary shadow-sm ring-4 ring-primary/20"
                                        : "bg-white border-gray-300 text-gray-400"
                            )}
                        >
                            {step.done ? (
                                <Check className="w-5 h-5" strokeWidth={3} />
                            ) : (
                                <span>{index + 1}</span>
                            )}
                        </div>

                        {/* Step Label */}
                        <span
                            className={cn(
                                "mt-3 text-xs font-medium transition-colors whitespace-nowrap",
                                step.done ? "text-primary" : step.active ? "text-gray-900" : "text-gray-400"
                            )}
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
