"use client";

import { useWizardStore } from "@/lib/store";
import { WIZARD_STEPS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<string, string> = {
  source: "Source",
  colors: "Colors",
  typography: "Typography",
  spacing: "Spacing",
  components: "Components",
  layout: "Layout",
  preview: "Preview",
  export: "Export",
};

export function WizardShell({ children }: { children: React.ReactNode }) {
  const { currentStep, nextStep, prevStep, setStep } = useWizardStore();
  const isFirst = currentStep === 0;
  const isLast = currentStep === WIZARD_STEPS.length - 1;

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-8">
      {/* Progress stepper */}
      <nav className="mb-8">
        <ol className="flex items-center gap-1">
          {WIZARD_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => setStep(i)}
                className={cn(
                  "flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md transition-colors w-full cursor-pointer",
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">
                  {i < currentStep ? "\u2713" : i + 1}
                </span>
                <span className="hidden sm:inline truncate">
                  {STEP_LABELS[step]}
                </span>
              </button>
              {i < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-4 shrink-0",
                    i < currentStep ? "bg-primary/30" : "bg-border"
                  )}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step content */}
      <div className="flex-1">{children}</div>

      {/* Navigation */}
      <div className="flex justify-between pt-8 border-t mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={isFirst}
          className="cursor-pointer"
        >
          Back
        </Button>
        {!isLast && (
          <Button onClick={nextStep} className="cursor-pointer">
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
