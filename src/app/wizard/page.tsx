"use client";

import { useWizardStore } from "@/lib/store";
import { WIZARD_STEPS } from "@/lib/types";
import { WizardShell } from "@/components/wizard/WizardShell";
import { StepSource } from "@/components/wizard/StepSource";
import { StepColors } from "@/components/wizard/StepColors";
import { StepTypography } from "@/components/wizard/StepTypography";
import { StepSpacing } from "@/components/wizard/StepSpacing";
import { StepComponents } from "@/components/wizard/StepComponents";
import { StepLayout } from "@/components/wizard/StepLayout";
import { StepPreview } from "@/components/wizard/StepPreview";
import { StepExport } from "@/components/wizard/StepExport";

const STEP_COMPONENTS: Record<string, React.ComponentType> = {
  source: StepSource,
  colors: StepColors,
  typography: StepTypography,
  spacing: StepSpacing,
  components: StepComponents,
  layout: StepLayout,
  preview: StepPreview,
  export: StepExport,
};

export default function WizardPage() {
  const currentStep = useWizardStore((s) => s.currentStep);
  const stepKey = WIZARD_STEPS[currentStep] ?? "source";
  const StepComponent = STEP_COMPONENTS[stepKey];

  return (
    <WizardShell>
      <StepComponent />
    </WizardShell>
  );
}
