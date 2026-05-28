"use client";

import { useState } from "react";
import { analyzeText, type AnalysisResult } from "@/lib/scorer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const SAMPLE_TEXT = `Here's the thing: building products is hard. Not because the technology is complex. Because people are complex. Let that sink in.

It turns out that most teams struggle with alignment. The uncomfortable truth is that nobody wants to admit they're confused. And that's okay.

In today's fast-paced landscape, we need to lean into discomfort and navigate uncertainty with clarity. This matters because your competition isn't waiting.

What if I told you that the best teams don't optimize for productivity? Here's what I mean: they optimize for learning. Think about it.

The data tells us that innovation really just requires fundamentally rethinking how we essentially approach the problem. It's worth noting that this is deeply important.`;

function ScoreGauge({ score, max, label }: { score: number; max: number; label: string }) {
  const percentage = (score / max) * 100;
  const color = percentage >= 70 ? "bg-green-500" : percentage >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{score}/{max}</span>
      </div>
      <Progress value={percentage} className={`h-2 ${color}`} />
    </div>
  );
}

function IssueList({ issues, color }: { issues: string[]; color: string }) {
  if (issues.length === 0) return null;
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
            Paste your text. Get scored on 5 dimensions. Fix AI patterns.
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
                    <span className="text-lg text-muted-foreground">/50</span>
                  </div>
                  <div className="flex-1">
                    <Progress value={(result.total / 50) * 100} className="h-4" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.total >= 40
                        ? "Clean. Ready to publish."
                        : result.total >= 30
                        ? "Needs work. Check issues below."
                        : "Heavy AI patterns. Major revision needed."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dimension Scores */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.scores.map((score) => (
                <Card key={score.dimension}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{score.dimension}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScoreGauge score={score.score} max={10} label={score.dimension} />
                    <IssueList
                      issues={score.issues}
                      color={
                        score.score >= 7
                          ? "border-green-500 text-green-700"
                          : score.score >= 4
                          ? "border-yellow-500 text-yellow-700"
                          : "border-red-500 text-red-700"
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Issues Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Issues Found</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.bannedPhrases.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Banned Phrases</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.bannedPhrases.map((p, i) => (
                        <Badge key={i} variant="destructive">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.adverbs.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Adverbs</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.adverbs.map((a, i) => (
                        <Badge key={i} variant="secondary">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.passiveVoice.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Passive Voice</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.passiveVoice.map((p, i) => (
                        <Badge key={i} variant="outline">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.structuralIssues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Structural Issues</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.structuralIssues.map((s, i) => (
                        <Badge key={i} variant="outline" className="border-orange-500 text-orange-700">
                          {s}
                        </Badge>
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
        <div className="text-center text-sm text-muted-foreground">
          Based on{" "}
          <a
            href="https://github.com/hardikpandya/stop-slop"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            stop-slop
          </a>{" "}
          by Hardik Pandya
        </div>
      </div>
    </div>
  );
}
