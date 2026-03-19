"use client";

import { useWizardStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function StepSpacing() {
  const { designSystem, updateSpacing } = useWizardStore();
  const { spacing } = designSystem;

  const updateScaleEntry = (key: string, value: string) => {
    updateSpacing({ scale: { ...spacing.scale, [key]: value } });
  };

  const updateRadiusEntry = (key: string, value: string) => {
    updateSpacing({ borderRadius: { ...spacing.borderRadius, [key]: value } });
  };

  const regenerateScale = () => {
    const base = spacing.baseUnit;
    const newScale: Record<string, string> = {};
    [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].forEach((m) => {
      newScale[String(m)] = `${m * base}px`;
    });
    updateSpacing({ scale: newScale });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Spacing</h2>
        <p className="text-muted-foreground mt-1">
          Define your spacing scale and border radius tokens.
        </p>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="base-unit">Base Unit (px)</Label>
          <Input
            id="base-unit"
            type="number"
            value={spacing.baseUnit}
            onChange={(e) => updateSpacing({ baseUnit: Number(e.target.value) || 4 })}
            className="w-24"
          />
        </div>
        <Button variant="outline" onClick={regenerateScale} className="cursor-pointer">
          Regenerate Scale
        </Button>
      </div>

      {/* Spacing scale */}
      <div className="space-y-3">
        <h3 className="font-semibold">Spacing Scale</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(spacing.scale).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="font-mono text-xs w-8 text-right text-muted-foreground">{key}</span>
              <div
                className="bg-primary/20 h-4 rounded-sm shrink-0"
                style={{ width: value }}
              />
              <Input
                value={value}
                onChange={(e) => updateScaleEntry(key, e.target.value)}
                className="h-7 text-xs w-20 font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Border radius */}
      <div className="space-y-3">
        <h3 className="font-semibold">Border Radius</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(spacing.borderRadius).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <div
                className="w-12 h-12 border-2 border-primary/30 bg-primary/5 shrink-0"
                style={{ borderRadius: value }}
              />
              <div className="space-y-1">
                <span className="font-mono text-xs">{key}</span>
                <Input
                  value={value}
                  onChange={(e) => updateRadiusEntry(key, e.target.value)}
                  className="h-7 text-xs w-24 font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
