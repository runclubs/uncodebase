"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DesignSystem,
  ColorTokens,
  TypographyTokens,
  SpacingTokens,
  ComponentRules,
  LayoutRules,
  DesignMeta,
  WizardSource,
} from "./types";
import { defaultDesignSystem } from "./defaults";

interface WizardStore {
  currentStep: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  source: WizardSource;
  setSource: (s: WizardSource) => void;

  designSystem: DesignSystem;
  updateMeta: (meta: Partial<DesignMeta>) => void;
  updateColors: (colors: Partial<ColorTokens>) => void;
  updateTypography: (typo: Partial<TypographyTokens>) => void;
  updateSpacing: (spacing: Partial<SpacingTokens>) => void;
  updateComponents: (comp: Partial<ComponentRules>) => void;
  updateLayout: (layout: Partial<LayoutRules>) => void;
  setDesignSystem: (ds: DesignSystem) => void;

  reset: () => void;
}

export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
      prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),

      source: null,
      setSource: (source) => set({ source }),

      designSystem: defaultDesignSystem,
      updateMeta: (meta) =>
        set((s) => ({
          designSystem: { ...s.designSystem, meta: { ...s.designSystem.meta, ...meta } },
        })),
      updateColors: (colors) =>
        set((s) => ({
          designSystem: {
            ...s.designSystem,
            colors: { ...s.designSystem.colors, ...colors },
          },
        })),
      updateTypography: (typo) =>
        set((s) => ({
          designSystem: {
            ...s.designSystem,
            typography: { ...s.designSystem.typography, ...typo },
          },
        })),
      updateSpacing: (spacing) =>
        set((s) => ({
          designSystem: {
            ...s.designSystem,
            spacing: { ...s.designSystem.spacing, ...spacing },
          },
        })),
      updateComponents: (comp) =>
        set((s) => ({
          designSystem: {
            ...s.designSystem,
            components: { ...s.designSystem.components, ...comp },
          },
        })),
      updateLayout: (layout) =>
        set((s) => ({
          designSystem: {
            ...s.designSystem,
            layout: { ...s.designSystem.layout, ...layout },
          },
        })),
      setDesignSystem: (ds) => set({ designSystem: ds }),

      reset: () =>
        set({
          currentStep: 0,
          source: null,
          designSystem: defaultDesignSystem,
        }),
    }),
    {
      name: "uncodebase-wizard",
    }
  )
);
