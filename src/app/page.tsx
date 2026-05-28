"use client";

import { useState } from "react";
import { analyzeText, type AnalysisResult } from "@/lib/scorer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const SAMPLE_TEXT = `Here's the thing: building products is hard. Not because the technology is complex. Because people are complex. Let that sink in.

It turns out that most teams struggle with alignment. The uncomfortable truth is that nobody wants to admit they're confused. And that's okay.

In today's fast-paced landscape, we need to lean into discomfort and navigate uncertainty with clarity. This matters because your competition isn't waiting.

What if I told you that the best teams don't optimize for productivity? Here's what I mean: they optimize for learning. Think about it.

The data tells us that innovation really just requires fundamentally rethinking how we essentially approach the problem. It's worth noting that this is deeply important.

Delve into the intricate tapestry of modern software engineering. The meticulous craftsmanship required to foster seamless, robust solutions is truly a testament to human ingenuity.

Take Sarah, a marketing manager who leveraged cutting-edge AI to unlock her team's potential. The game-changing results? A 300% increase in engagement. Not bad. Not bad at all.`;

function ScoreGauge({ score, max, label, severity }: { score: number; max: number; label: string; severity: string }) {
  const percentage = (score / max) * 100;
  const color = severity === "low" ? "bg-green-500" : severity === "medium" ? "bg-yellow-500" : severity === "high" ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{score}/{max}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function IssueList({ issues, severity }: { issues: string[]; severity: string }) {
  if (issues.length === 0) return null;
  const color = severity === "low" ? "border-green-500 text-green-700" : severity === "medium" ? "border-yellow-500 text-yellow-700" : severity === "high" ? "border-orange-500 text-orange-700" : "border-red-500 text-red-700";
  return (
    <div className="space-y-1">
      {issues.map((issue, i) => (
        <div key={i} className="flex items-start gap-2">
          <Badge variant="outline" className={`${color} text-xs shrink-0`}>
            {i + 1}
          </Badge>
          <span className="text-sm">{issue}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    const analysis = analyzeText(text);
    setResult(analysis);
  };

  const handleLoadSample = () => {
    setText(SAMPLE_TEXT);
    setResult(null);
  };

  const handleClear = () => {
    setText("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">AI Content Scorer</h1>
          <p className="text-muted-foreground">
            Paste your text. Get scored on 7 dimensions. Fix AI patterns.
          </p>
          <p className="text-xs text-muted-foreground">
            Based on stop-slop, claude-slop-detector, humanize-writing-skill, and slop-cop
          </p>
        </div>

        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your article, blog post, or any text here..."
              className="min-h-[200px] resize-y"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleAnalyze} disabled={!text.trim()}>
                Score It
              </Button>
              <Button variant="outline" onClick={handleLoadSample}>
                Load Sample
              </Button>
              <Button variant="ghost" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <>
            {/* Total Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold tabular-nums">
                    {result.total}
                    <span className="text-lg text-muted-foreground">/{result.maxTotal}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          result.total >= 50 ? "bg-green-500" : result.total >= 35 ? "bg-yellow-500" : result.total >= 20 ? "bg-orange-500" : "bg-red-500"
                        }`}
                        style={{ width: `${(result.total / result.maxTotal) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.total >= 50
                        ? "Clean. Ready to publish."
                        : result.total >= 35
                        ? "Needs work. Check issues below."
                        : result.total >= 20
                        ? "Heavy AI patterns. Significant editing required."
                        : "Extreme AI slop. Full rewrite recommended."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Slop density: {result.density.toFixed(1)} per 500 words
                      {result.density >= 18 ? " (CRITICAL)" : result.density >= 10 ? " (HIGH)" : result.density >= 5 ? " (MEDIUM)" : result.density >= 2 ? " (LOW)" : " (PASS)"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Fingerprints */}
            {result.modelFingerprints.length > 0 && (
              <Card className="border-orange-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-orange-500">⚠</span> Model Fingerprints Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.modelFingerprints.map((fp, i) => (
                    <div key={i} className="mb-3">
                      <Badge variant="destructive" className="mb-2">{fp.model}</Badge>
                      <div className="flex flex-wrap gap-1">
                        {fp.matches.slice(0, 8).map((m, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{m}</Badge>
                        ))}
                        {fp.matches.length > 8 && (
                          <Badge variant="outline" className="text-xs">+{fp.matches.length - 8} more</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Dimension Scores */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.scores.map((score) => (
                <Card key={score.dimension}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{score.dimension}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScoreGauge score={score.score} max={score.maxScore} label={score.dimension} severity={score.severity} />
                    <IssueList issues={score.issues} severity={score.severity} />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tier Hits Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Pattern Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.tier1Hits.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-red-600">Tier 1 — Strongest AI Signals ({result.tier1Hits.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.tier1Hits.map((p, i) => (
                        <Badge key={i} variant="destructive">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.tier2Hits.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-orange-600">Tier 2 — Moderate AI Signals ({result.tier2Hits.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.tier2Hits.map((p, i) => (
                        <Badge key={i} variant="outline" className="border-orange-500 text-orange-700">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.tier3Hits.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-yellow-600">Tier 3 — Transitions ({result.tier3Hits.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.tier3Hits.map((p, i) => (
                        <Badge key={i} variant="secondary">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.structuralTells.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Structural Tells ({result.structuralTells.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.structuralTells.map((s, i) => (
                        <Badge key={i} variant="outline" className="border-purple-500 text-purple-700">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.formattingTells.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Formatting Tells ({result.formattingTells.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.formattingTells.map((f, i) => (
                        <Badge key={i} variant="outline" className="border-blue-500 text-blue-700">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.passiveVoice.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Passive Voice ({result.passiveVoice.length})</h4>
                    <div className="space-y-1">
                      {result.passiveVoice.map((p, i) => (
                        <p key={i} className="text-sm text-muted-foreground">"{p}..."</p>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Suggestions */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Suggestions</h4>
                  <ul className="space-y-1">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>
            Based on{" "}
            <a href="https://github.com/hardikpandya/stop-slop" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">stop-slop</a>,{" "}
            <a href="https://github.com/aplaceforallmystuff/claude-slop-detector" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">claude-slop-detector</a>,{" "}
            <a href="https://github.com/lguz/humanize-writing-skill" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">humanize-writing-skill</a>,{" "}
            <a href="https://github.com/MahmoudHalat/slop-cop" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">slop-cop</a>
          </p>
        </div>
      </div>
    </div>
  );
}
