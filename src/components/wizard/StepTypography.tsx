"use client";

import { useWizardStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { TypeScaleEntry } from "@/lib/types";

export function StepTypography() {
  const { designSystem, updateTypography } = useWizardStore();
  const { typography } = designSystem;

  const updateScaleEntry = (key: string, field: keyof TypeScaleEntry, value: string) => {
    updateTypography({
      scale: {
        ...typography.scale,
        [key]: { ...typography.scale[key], [field]: value },
      },
    });
  };

  const addScaleEntry = () => {
    const name = prompt("Scale name (e.g. 5xl):");
    if (!name) return;
    updateTypography({
      scale: {
        ...typography.scale,
        [name]: { size: "1rem", lineHeight: "1.5rem", weight: "400" },
      },
    });
  };

  const removeScaleEntry = (key: string) => {
    const next = { ...typography.scale };
    delete next[key];
    updateTypography({ scale: next });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Typography</h2>
        <p className="text-muted-foreground mt-1">
          Set your font families and type scale.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="font-sans">Sans-serif Font</Label>
          <Input
            id="font-sans"
            value={typography.fontFamilySans}
            onChange={(e) => updateTypography({ fontFamilySans: e.target.value })}
            placeholder="Inter, system-ui, sans-serif"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="font-mono">Monospace Font</Label>
          <Input
            id="font-mono"
            value={typography.fontFamilyMono}
            onChange={(e) => updateTypography({ fontFamilyMono: e.target.value })}
            placeholder="JetBrains Mono, monospace"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="font-serif">Serif Font (optional)</Label>
          <Input
            id="font-serif"
            value={typography.fontFamilySerif}
            onChange={(e) => updateTypography({ fontFamilySerif: e.target.value })}
            placeholder="Georgia, serif"
          />
        </div>
      </div>

      {/* Type scale */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Type Scale</h3>
          <Button variant="outline" size="sm" onClick={addScaleEntry} className="cursor-pointer">
            Add Size
          </Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2 font-medium">Name</th>
                <th className="text-left px-3 py-2 font-medium">Size</th>
                <th className="text-left px-3 py-2 font-medium">Line Height</th>
                <th className="text-left px-3 py-2 font-medium">Weight</th>
                <th className="text-left px-3 py-2 font-medium">Preview</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(typography.scale).map(([key, entry]) => (
                <tr key={key} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{key}</td>
                  <td className="px-3 py-2">
                    <Input
                      value={entry.size}
                      onChange={(e) => updateScaleEntry(key, "size", e.target.value)}
                      className="h-8 text-xs w-24"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={entry.lineHeight}
                      onChange={(e) => updateScaleEntry(key, "lineHeight", e.target.value)}
                      className="h-8 text-xs w-24"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={entry.weight}
                      onChange={(e) => updateScaleEntry(key, "weight", e.target.value)}
                      className="h-8 text-xs w-20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span
                      style={{
                        fontSize: entry.size,
                        lineHeight: entry.lineHeight,
                        fontWeight: entry.weight,
                      }}
                    >
                      Aa
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScaleEntry(key)}
                      className="cursor-pointer text-destructive h-7 w-7 p-0"
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
