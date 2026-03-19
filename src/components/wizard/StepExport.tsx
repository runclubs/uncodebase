"use client";

import { useMemo, useState } from "react";
import { useWizardStore } from "@/lib/store";
import { generateSkillFile } from "@/lib/generate-skill";
import { generateDesignMd } from "@/lib/generate-design-md";
import { downloadFile, copyToClipboard } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function StepExport() {
  const designSystem = useWizardStore((s) => s.designSystem);
  const reset = useWizardStore((s) => s.reset);
  const [copied, setCopied] = useState<string | null>(null);

  const skillContent = useMemo(() => generateSkillFile(designSystem), [designSystem]);
  const designMdContent = useMemo(() => generateDesignMd(designSystem), [designSystem]);

  const skillFilename = designSystem.meta.name
    ? designSystem.meta.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".md"
    : "design-system.md";

  const handleCopy = async (content: string, label: string) => {
    const ok = await copyToClipboard(content);
    if (ok) {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Export</h2>
        <p className="text-muted-foreground mt-1">
          Download your files and add them to your project.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Claude Code Skill File</CardTitle>
            <CardDescription>
              {skillFilename} — Place in <code className="bg-muted px-1 rounded text-xs">.claude/skills/</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => downloadFile(skillContent, skillFilename)}
              className="w-full cursor-pointer"
            >
              Download {skillFilename}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopy(skillContent, "skill")}
              className="w-full cursor-pointer"
            >
              {copied === "skill" ? "Copied!" : "Copy to Clipboard"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">design.md</CardTitle>
            <CardDescription>
              design.md — Place in your project root
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => downloadFile(designMdContent, "design.md")}
              className="w-full cursor-pointer"
            >
              Download design.md
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopy(designMdContent, "design")}
              className="w-full cursor-pointer"
            >
              {copied === "design" ? "Copied!" : "Copy to Clipboard"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">How to use these files</h3>
          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium">1. Claude Code Skill File</p>
              <p className="text-muted-foreground">
                Create a <code className="bg-muted px-1 rounded">.claude/skills/</code> directory in your project root
                and place the skill file there. Claude Code will automatically pick it up when working with matching files.
              </p>
              <pre className="bg-muted/50 rounded p-2 font-mono text-xs mt-1">
{`mkdir -p .claude/skills
mv ~Downloads/${skillFilename} .claude/skills/`}
              </pre>
            </div>
            <div className="space-y-1">
              <p className="font-medium">2. design.md</p>
              <p className="text-muted-foreground">
                Place design.md in your project root. This serves as a reference for both humans and AI tools.
                You can also reference it in your CLAUDE.md file.
              </p>
              <pre className="bg-muted/50 rounded p-2 font-mono text-xs mt-1">
{`mv ~/Downloads/design.md ./design.md`}
              </pre>
            </div>
            <div className="space-y-1">
              <p className="font-medium">3. Reference in CLAUDE.md (optional)</p>
              <p className="text-muted-foreground">
                Add a line to your CLAUDE.md to ensure Claude always considers the design system:
              </p>
              <pre className="bg-muted/50 rounded p-2 font-mono text-xs mt-1">
{`# In your CLAUDE.md file, add:
When building UI components, follow the design system in design.md`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={reset}
          className="cursor-pointer"
        >
          Start Over
        </Button>
      </div>
    </div>
  );
}
