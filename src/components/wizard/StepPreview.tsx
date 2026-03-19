"use client";

import { useMemo, useState } from "react";
import { useWizardStore } from "@/lib/store";
import { generateSkillFile } from "@/lib/generate-skill";
import { generateDesignMd } from "@/lib/generate-design-md";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/export";
import { Badge } from "@/components/ui/badge";

export function StepPreview() {
  const designSystem = useWizardStore((s) => s.designSystem);
  const [copied, setCopied] = useState<string | null>(null);

  const skillContent = useMemo(() => generateSkillFile(designSystem), [designSystem]);
  const designMdContent = useMemo(() => generateDesignMd(designSystem), [designSystem]);

  const handleCopy = async (content: string, label: string) => {
    const ok = await copyToClipboard(content);
    if (ok) {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  // Stats
  const colorCount =
    13 + Object.keys(designSystem.colors.custom).length;
  const typeScaleCount = Object.keys(designSystem.typography.scale).length;
  const ruleCount = designSystem.components.rules.length + designSystem.layout.rules.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Preview</h2>
        <p className="text-muted-foreground mt-1">
          Review your generated files before exporting.
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary">{colorCount} color tokens</Badge>
        <Badge variant="secondary">{typeScaleCount} type scale entries</Badge>
        <Badge variant="secondary">{Object.keys(designSystem.spacing.scale).length} spacing values</Badge>
        <Badge variant="secondary">{ruleCount} design rules</Badge>
      </div>

      <Tabs defaultValue="skill">
        <TabsList>
          <TabsTrigger value="skill">Skill File (.md)</TabsTrigger>
          <TabsTrigger value="design">design.md</TabsTrigger>
        </TabsList>

        <TabsContent value="skill" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Place this file in <code className="bg-muted px-1 rounded">.claude/skills/</code> in your project
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(skillContent, "skill")}
              className="cursor-pointer"
            >
              {copied === "skill" ? "Copied!" : "Copy"}
            </Button>
          </div>
          <pre className="bg-muted/50 border rounded-lg p-4 overflow-auto max-h-[500px] text-sm font-mono whitespace-pre-wrap">
            {skillContent}
          </pre>
        </TabsContent>

        <TabsContent value="design" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Place this file in the root of your project
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(designMdContent, "design")}
              className="cursor-pointer"
            >
              {copied === "design" ? "Copied!" : "Copy"}
            </Button>
          </div>
          <pre className="bg-muted/50 border rounded-lg p-4 overflow-auto max-h-[500px] text-sm font-mono whitespace-pre-wrap">
            {designMdContent}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
