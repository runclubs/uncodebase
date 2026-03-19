"use client";

import { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRESET_RULES: Record<string, string[]> = {
  "Card Pattern": [
    "Cards should use consistent padding (p-6) and rounded corners (rounded-lg)",
    "Card headers should use the CardTitle component for consistent typography",
    "Cards should have a subtle border, not a shadow, for visual separation",
  ],
  "Form Pattern": [
    "All form inputs must have an associated Label component",
    "Form validation errors should appear below the input in destructive color",
    "Group related form fields in fieldsets with a legend",
    "Submit buttons should be full-width on mobile, auto-width on desktop",
  ],
  "Navigation Pattern": [
    "Use a consistent navigation component across all pages",
    "Active navigation items should use the primary color",
    "Mobile navigation should use a slide-out drawer",
  ],
  "Data Display": [
    "Tables should be responsive with horizontal scroll on mobile",
    "Use skeleton loaders for async data, not spinners",
    "Empty states should include an illustration and action button",
  ],
};

export function StepComponents() {
  const { designSystem, updateComponents } = useWizardStore();
  const { components } = designSystem;
  const [newRule, setNewRule] = useState("");

  const addRule = () => {
    if (!newRule.trim()) return;
    updateComponents({ rules: [...components.rules, newRule.trim()] });
    setNewRule("");
  };

  const removeRule = (index: number) => {
    updateComponents({ rules: components.rules.filter((_, i) => i !== index) });
  };

  const addPreset = (presetName: string) => {
    const presetRules = PRESET_RULES[presetName];
    if (!presetRules) return;
    const existing = new Set(components.rules);
    const newRules = presetRules.filter((r) => !existing.has(r));
    updateComponents({ rules: [...components.rules, ...newRules] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Components & Patterns</h2>
        <p className="text-muted-foreground mt-1">
          Define your component library preference and design rules.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Preferred Component Library</Label>
        <Select
          value={components.preferredLibrary}
          onValueChange={(v) => { if (v) updateComponents({ preferredLibrary: v }); }}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="shadcn/ui">shadcn/ui</SelectItem>
            <SelectItem value="Radix UI">Radix UI</SelectItem>
            <SelectItem value="MUI">Material UI</SelectItem>
            <SelectItem value="Chakra UI">Chakra UI</SelectItem>
            <SelectItem value="Ant Design">Ant Design</SelectItem>
            <SelectItem value="Custom">Custom / None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preset patterns */}
      <div className="space-y-2">
        <Label>Quick-add Pattern Presets</Label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESET_RULES).map((name) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              onClick={() => addPreset(name)}
              className="cursor-pointer"
            >
              + {name}
            </Button>
          ))}
        </div>
      </div>

      {/* Rules list */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Design Rules</h3>
          <p className="text-sm text-muted-foreground">
            Each rule will be included in the generated skill prompt as an instruction for the AI.
          </p>

          {components.rules.length > 0 && (
            <ul className="space-y-2">
              {components.rules.map((rule, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm bg-muted/50 rounded-md p-2"
                >
                  <span className="flex-1">{rule}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(i)}
                    className="cursor-pointer text-destructive shrink-0 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <Textarea
              placeholder="Type a design rule..."
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addRule();
                }
              }}
            />
            <Button onClick={addRule} variant="outline" className="cursor-pointer shrink-0">
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
