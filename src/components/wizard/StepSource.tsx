"use client";

import { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function StepSource() {
  const { source, setSource, updateMeta, designSystem, nextStep } = useWizardStore();
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaJson, setFigmaJson] = useState("");
  const [importing, setImporting] = useState(false);

  const handleFigmaImport = () => {
    if (!figmaJson.trim()) return;
    setImporting(true);
    try {
      const data = JSON.parse(figmaJson);
      // Try to map Figma variable collections to our color tokens
      if (data && typeof data === "object") {
        const store = useWizardStore.getState();
        // Attempt to extract colors from variable definitions
        if (data.colors) {
          store.updateColors(data.colors);
        }
        if (data.typography) {
          store.updateTypography(data.typography);
        }
        if (data.spacing) {
          store.updateSpacing(data.spacing);
        }
      }
      nextStep();
    } catch {
      // If JSON parsing fails, just move forward with defaults
      nextStep();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">How do you want to start?</h2>
        <p className="text-muted-foreground mt-1">
          Import from Figma or configure your design system manually.
        </p>
      </div>

      {/* Project name */}
      <div className="space-y-2">
        <Label htmlFor="project-name">Project Name</Label>
        <Input
          id="project-name"
          placeholder="My Design System"
          value={designSystem.meta.name}
          onChange={(e) => updateMeta({ name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-desc">Description</Label>
        <Input
          id="project-desc"
          placeholder="A brief description of your design system"
          value={designSystem.meta.description}
          onChange={(e) => updateMeta({ description: e.target.value })}
        />
      </div>

      {/* Source selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            source === "figma" && "border-primary ring-2 ring-primary/20"
          )}
          onClick={() => setSource("figma")}
        >
          <CardHeader>
            <CardTitle className="text-lg">Import from Figma</CardTitle>
            <CardDescription>
              Pull design tokens from your Figma file to pre-populate the wizard
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            source === "manual" && "border-primary ring-2 ring-primary/20"
          )}
          onClick={() => {
            setSource("manual");
          }}
        >
          <CardHeader>
            <CardTitle className="text-lg">Configure Manually</CardTitle>
            <CardDescription>
              Start with sensible defaults and customize each step
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Figma import section */}
      {source === "figma" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="figma-url">Figma File URL (optional)</Label>
              <Input
                id="figma-url"
                placeholder="https://figma.com/design/..."
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste your Figma file URL for reference. The actual token import uses the JSON below.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="figma-json">
                Design Tokens JSON
              </Label>
              <Textarea
                id="figma-json"
                placeholder={`Paste the output from Figma's "get_variable_defs" or your exported design tokens JSON here...

Example format:
{
  "colors": {
    "primary": "#0f172a",
    "background": "#ffffff"
  },
  "typography": {
    "fontFamilySans": "Inter"
  }
}`}
                rows={10}
                value={figmaJson}
                onChange={(e) => setFigmaJson(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleFigmaImport}
              disabled={importing}
              className="cursor-pointer"
            >
              {importing ? "Importing..." : "Import & Continue"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
