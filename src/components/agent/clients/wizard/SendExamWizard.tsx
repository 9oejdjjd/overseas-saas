import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Briefcase, CreditCard, Receipt, CheckCircle2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Step1Client } from "./Step1Client";
import { Step2Profession } from "./Step2Profession";
import { Step3Quantity } from "./Step3Quantity";
import { Step4Review } from "./Step4Review";
import { Step5Success } from "./Step5Success";

interface SendExamWizardProps {
    preselectedClient?: any;
    onClose: () => void;
}

export function SendExamWizard({ preselectedClient, onClose }: SendExamWizardProps) {
    // Steps state
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    // Wizard Data
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [selectedProfession, setSelectedProfession] = useState<any>(null);
    const [purchaseType, setPurchaseType] = useState<"single" | "package">("single");
    const [quantity, setQuantity] = useState(1);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [examLinks, setExamLinks] = useState<string[]>([]);
    const [isProfessionLocked, setIsProfessionLocked] = useState(false);

    // Dashboard / Financial Data
    const [financials, setFinancials] = useState({
        examPrice: 0,
        walletBalance: 0,
        allowDebt: false,
        debtLimit: 0,
        commissionRate: 0,
        loading: true,
    });

    // Pre-load preselected client if passed from parent
    useEffect(() => {
        if (preselectedClient) {
            handleClientSelection(preselectedClient);
        }
    }, [preselectedClient]);

    const handleClientSelection = async (client: any) => {
        setSelectedClient(client);
        // Fetch detailed client info to check for existing active exams and lock profession if necessary
        try {
            const res = await fetch(`/api/agent/clients/${client.id}`);
            if (res.ok) {
                const json = await res.json();
                const clientDetails = json.data;

                if (clientDetails.profession) {
                    // Check if there are active exams (SENT or STARTED)
                    const activeExams = clientDetails.examOrders || [];
                    const hasActive = activeExams.some((o: any) => o.status === "SENT" || o.status === "STARTED");

                    // Lock profession if they have active exams that are not completed
                    setIsProfessionLocked(hasActive);

                    // Find the corresponding profession from client details
                    if (activeExams.length > 0) {
                        const firstOrder = activeExams[0];
                        setSelectedProfession({
                            id: firstOrder.professionId,
                            name: clientDetails.profession
                        });
                    } else {
                        // Default select based on name (Step 2 fetch will bind fully)
                        setSelectedProfession({ id: "", name: clientDetails.profession });
                    }
                } else {
                    setIsProfessionLocked(false);
                    setSelectedProfession(null);
                }
            }
        } catch (e) {
            console.error("Error checking client status", e);
        }
        setCurrentStep(2); // Jump to Step 2
    };

    useEffect(() => {
        fetch("/api/agent/dashboard")
            .then((res) => res.json())
            .then((res) => {
                if (res.data) {
                    setFinancials({
                        examPrice: res.data.examPrice || 50,
                        walletBalance: res.data.walletBalance || 0,
                        allowDebt: res.data.allowDebt || false,
                        debtLimit: res.data.debtLimit || 0,
                        commissionRate: res.data.commissionRate || 0,
                        loading: false,
                    });
                }
            })
            .catch(() => setFinancials((prev) => ({ ...prev, loading: false })));
    }, []);

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    const prevStep = () => {
        // If preselected client was passed, we don't go back to Step 1
        if (currentStep === 2 && preselectedClient) {
            onClose();
            return;
        }
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const steps = [
        { id: 1, title: "معلومات العميل", icon: Users },
        { id: 2, title: "اختيار المهنة", icon: Briefcase },
        { id: 3, title: "الكمية والحساب", icon: CreditCard },
        { id: 4, title: "المراجعة", icon: Receipt },
        { id: 5, title: "تم بنجاح", icon: CheckCircle2 },
    ];

    const fadeVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Stepper */}
            <div className="mb-6 relative">
                <div className="flex justify-between items-center relative">
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-100 dark:bg-slate-700 -z-10 transform -translate-y-1/2"></div>
                    <div
                        className="absolute right-0 top-1/2 h-1 transition-all duration-300 ease-in-out -z-10 transform -translate-y-1/2"
                        style={{
                            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                            backgroundColor: "#55943b",
                        }}
                    ></div>

                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-slate-800 px-2 relative z-10">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                                        isCompleted ? "bg-[#55943b] border-[#55943b] text-white" :
                                        isCurrent ? "border-[#074388] text-[#074388] bg-white dark:bg-slate-800" :
                                        "border-gray-200 dark:border-slate-700 text-gray-400 bg-white dark:bg-slate-800"
                                    )}
                                >
                                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span
                                    className={cn(
                                        "text-xs font-medium hidden sm:block",
                                        isCurrent ? "text-[#074388]" : isCompleted ? "text-[#55943b]" : "text-gray-400"
                                    )}
                                >
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 p-6 min-h-[350px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        variants={fadeVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        {currentStep === 1 && (
                            <Step1Client
                                selectedClient={selectedClient}
                                setSelectedClient={setSelectedClient}
                                onSelectClient={handleClientSelection}
                            />
                        )}

                        {currentStep === 2 && (
                            <Step2Profession
                                selectedProfession={selectedProfession}
                                setSelectedProfession={setSelectedProfession}
                                isProfessionLocked={isProfessionLocked}
                                onNext={nextStep}
                                onPrev={prevStep}
                            />
                        )}

                        {currentStep === 3 && (
                            <Step3Quantity
                                purchaseType={purchaseType}
                                setPurchaseType={setPurchaseType}
                                quantity={quantity}
                                setQuantity={setQuantity}
                                selectedPackage={selectedPackage}
                                setSelectedPackage={setSelectedPackage}
                                financials={financials}
                                onNext={nextStep}
                                onPrev={prevStep}
                            />
                        )}

                        {currentStep === 4 && (
                            <Step4Review
                                client={selectedClient}
                                profession={selectedProfession}
                                purchaseType={purchaseType}
                                quantity={quantity}
                                selectedPackage={selectedPackage}
                                financials={financials}
                                onNext={(links: string[]) => {
                                    setExamLinks(links);
                                    nextStep();
                                }}
                                onPrev={prevStep}
                            />
                        )}

                        {currentStep === 5 && (
                            <Step5Success
                                links={examLinks}
                                onReset={() => {
                                    setSelectedClient(null);
                                    setSelectedProfession(null);
                                    setQuantity(1);
                                    setSelectedPackage(null);
                                    setPurchaseType("single");
                                    setExamLinks([]);
                                    setIsProfessionLocked(false);
                                    setCurrentStep(1);
                                }}
                                onClose={onClose}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
