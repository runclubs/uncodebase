"use client";

import { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function StepLayout() {
  const { designSystem, updateLayout } = useWizardStore();
  const { layout } = designSystem;
  const [newRule, setNewRule] = useState("");

  const updateBreakpoint = (key: string, value: string) => {
    updateLayout({ breakpoints: { ...layout.breakpoints, [key]: value } });
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    updateLayout({ rules: [...layout.rules, newRule.trim()] });
    setNewRule("");
  };

  const removeRule = (index: number) => {
    updateLayout({ rules: layout.rules.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Layout</h2>
        <p className="text-muted-foreground mt-1">
          Configure your layout grid, breakpoints, and constraints.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max-width">Max Width</Label>
          <Input
            id="max-width"
            value={layout.maxWidth}
            onChange={(e) => updateLayout({ maxWidth: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="columns">Columns</Label>
          <Input
            id="columns"
            type="number"
            value={layout.columns}
            onChange={(e) => updateLayout({ columns: Number(e.target.value) || 12 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gutter">Gutter</Label>
          <Input
            id="gutter"
            value={layout.gutter}
            onChange={(e) => updateLayout({ gutter: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="container-padding">Container Padding</Label>
          <Input
            id="container-padding"
            value={layout.containerPadding}
            onChange={(e) => updateLayout({ containerPadding: e.target.value })}
          />
        </div>
      </div>

      {/* Breakpoints */}
      <div className="space-y-3">
        <h3 className="font-semibold">Breakpoints</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(layout.breakpoints).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <Label className="font-mono text-xs">{key}</Label>
              <Input
                value={value}
                onChange={(e) => updateBreakpoint(key, e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Layout rules */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Layout Rules</h3>
          {layout.rules.length > 0 && (
            <ul className="space-y-2">
              {layout.rules.map((rule, i) => (
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
              placeholder="Add a layout rule..."
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
