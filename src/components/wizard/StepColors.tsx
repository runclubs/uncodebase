"use client";

import { useWizardStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

const COLOR_FIELDS: { key: string; label: string; description: string }[] = [
  { key: "primary", label: "Primary", description: "Main brand color, CTAs" },
  { key: "primaryForeground", label: "Primary Foreground", description: "Text on primary" },
  { key: "secondary", label: "Secondary", description: "Secondary actions" },
  { key: "secondaryForeground", label: "Secondary Foreground", description: "Text on secondary" },
  { key: "background", label: "Background", description: "Page background" },
  { key: "foreground", label: "Foreground", description: "Default text color" },
  { key: "muted", label: "Muted", description: "Muted backgrounds" },
  { key: "mutedForeground", label: "Muted Foreground", description: "Muted text" },
  { key: "accent", label: "Accent", description: "Accent highlights" },
  { key: "accentForeground", label: "Accent Foreground", description: "Text on accent" },
  { key: "destructive", label: "Destructive", description: "Error, danger states" },
  { key: "border", label: "Border", description: "Default borders" },
  { key: "ring", label: "Ring", description: "Focus ring color" },
];

export function StepColors() {
  const { designSystem, updateColors } = useWizardStore();
  const { colors } = designSystem;
  const [newCustomKey, setNewCustomKey] = useState("");
  const [newCustomValue, setNewCustomValue] = useState("#000000");

  const addCustomColor = () => {
    if (!newCustomKey.trim()) return;
    updateColors({
      custom: { ...colors.custom, [newCustomKey.trim()]: newCustomValue },
    });
    setNewCustomKey("");
    setNewCustomValue("#000000");
  };

  const removeCustomColor = (key: string) => {
    const next = { ...colors.custom };
    delete next[key];
    updateColors({ custom: next });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Colors</h2>
        <p className="text-muted-foreground mt-1">
          Define your semantic color tokens. These will be referenced in the generated skill.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COLOR_FIELDS.map(({ key, label, description }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`color-${key}`} className="text-sm">
              {label}
            </Label>
            <div className="flex gap-2">
              <div
                className="w-10 h-10 rounded-md border shrink-0"
                style={{ backgroundColor: (colors as unknown as Record<string, string>)[key] }}
              />
              <div className="flex-1 relative">
                <Input
                  id={`color-${key}`}
                  type="text"
                  value={(colors as unknown as Record<string, string>)[key]}
                  onChange={(e) => updateColors({ [key]: e.target.value })}
                  className="font-mono text-sm pr-10"
                />
                <input
                  type="color"
                  value={(colors as unknown as Record<string, string>)[key]}
                  onChange={(e) => updateColors({ [key]: e.target.value })}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded cursor-pointer border-0 p-0"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      {/* Custom colors */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Custom Colors</h3>
          {Object.entries(colors.custom).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(colors.custom).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <span className="font-mono text-sm flex-1">{key}: {value}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomColor(key)}
                    className="cursor-pointer text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Token name"
              value={newCustomKey}
              onChange={(e) => setNewCustomKey(e.target.value)}
              className="flex-1"
            />
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={newCustomValue}
                onChange={(e) => setNewCustomValue(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
              <Input
                value={newCustomValue}
                onChange={(e) => setNewCustomValue(e.target.value)}
                className="w-28 font-mono text-sm"
              />
            </div>
            <Button onClick={addCustomColor} variant="outline" className="cursor-pointer">
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
