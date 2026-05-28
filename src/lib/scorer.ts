// AI Content Scorer — based on stop-slop rules
// Scores text on 5 dimensions: Directness, Rhythm, Trust, Authenticity, Density

export type ScoreResult = {
  dimension: string;
  score: number;
  issues: string[];
};

export type AnalysisResult = {
  scores: ScoreResult[];
  total: number;
  bannedPhrases: string[];
  adverbs: string[];
  passiveVoice: string[];
  structuralIssues: string[];
  suggestions: string[];
};

// Banned phrases (throat-clearing openers, emphasis crutches, business jargon)
const BANNED_PHRASES = [
  "here's the thing",
  "here's what",
  "here's this",
  "here's that",
  "here's why",
  "the uncomfortable truth is",
  "it turns out",
  "the real",
  "let me be clear",
  "the truth is",
  "i'll say it again",
  "i'm going to be honest",
  "can we talk about",
  "here's what i find interesting",
  "here's the problem though",
  "full stop",
  "let that sink in",
  "this matters because",
  "make no mistake",
  "here's why that matters",
  "at its core",
  "in today's",
  "it's worth noting",
  "at the end of the day",
  "what if i told you",
  "think about it",
  "and that's okay",
  "here's what i mean",
];

// Common adverbs
const ADVERB_PATTERN = /\b\w+ly\b/gi;
const COMMON_ADVERBS = [
  "really", "just", "literally", "genuinely", "honestly", "simply",
  "actually", "deeply", "truly", "fundamentally", "inherently",
  "inevitably", "interestingly", "importantly", "crucially",
  "essentially", "basically", "practically", "virtually", "clearly",
  "obviously", "certainly", "definitely", "probably", "possibly",
  "arguably", "surprisingly", "notably", "significantly", "remarkably",
];

// Binary contrast patterns
const BINARY_CONTRASTS = [
  /not because .+ because/gi,
  /not .+\. but .+\./gi,
  /isn't .+\. .+ is\./gi,
  /the answer isn't .+ it's/gi,
  /it feels like .+ it's actually/gi,
  /the question isn't .+ it's/gi,
  /not just .+ but also/gi,
  /doesn't mean .+ but actually/gi,
  /stops being .+ and starts being/gi,
];

// Passive voice patterns
const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi,
  /\b(is|are|was|were|be|been|being)\s+\w+en\b/gi,
];

// Wh- sentence starters
const WH_STARTERS = /^(what|why|when|where|who|how|which)\b/i;

// Dramatic fragmentation
const FRAGMENTATION = [
  /\w+\.\s*That's it\./gi,
  /\w+\.\s*That's the \w+\./gi,
];

// Em dash
const EM_DASH = /—/g;

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function findMatches(text: string, pattern: RegExp): string[] {
  const matches = text.match(pattern);
  return matches ? Array.from(new Set(matches.map(m => m.toLowerCase().trim()))) : [];
}

function analyzeDirectness(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  // Check for throat-clearing openers
  const bannedFound = BANNED_PHRASES.filter(p => text.toLowerCase().includes(p));
  if (bannedFound.length > 0) {
    score -= Math.min(4, bannedFound.length);
    issues.push(`Throat-clearing: "${bannedFound.slice(0, 3).join('", "')}"`);
  }

  // Check for passive voice
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const passiveCount = sentences.filter(s => 
    PASSIVE_PATTERNS.some(p => p.test(s))
  ).length;
  if (passiveCount > sentences.length * 0.3) {
    score -= 2;
    issues.push(`${passiveCount} sentences use passive voice`);
  }

  // Check for Wh- starters
  const whStarters = sentences.filter(s => WH_STARTERS.test(s.trim())).length;
  if (whStarters > sentences.length * 0.2) {
    score -= 1;
    issues.push(`${whStarters} sentences start with Wh- words`);
  }

  // Check for vague declaratives
  const vaguePatterns = [
    /the (reasons|implications|effects|consequences|results) are/gi,
    /this is (significant|important|crucial|vital)/gi,
  ];
  const vagueCount = vaguePatterns.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (vagueCount > 0) {
    score -= Math.min(2, vagueCount);
    issues.push(`${vagueCount} vague declaratives`);
  }

  return { dimension: "Directness", score: Math.max(1, score), issues };
}

function analyzeRhythm(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Check sentence length variation
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avgLen, 2), 0) / lengths.length;
  
  if (variance < 10) {
    score -= 2;
    issues.push("Sentences too uniform in length");
  }

  // Check for three consecutive sentences of similar length
  let similarStreak = 0;
  for (let i = 2; i < lengths.length; i++) {
    if (Math.abs(lengths[i] - lengths[i-1]) < 3 && Math.abs(lengths[i-1] - lengths[i-2]) < 3) {
      similarStreak++;
    }
  }
  if (similarStreak > 2) {
    score -= 1;
    issues.push(`${similarStreak} streaks of similar-length sentences`);
  }

  // Check for em dashes
  const emDashes = countMatches(text, EM_DASH);
  if (emDashes > 0) {
    score -= Math.min(2, emDashes);
    issues.push(`${emDashes} em dashes found`);
  }

  // Check for dramatic fragmentation
  const fragments = FRAGMENTATION.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (fragments > 0) {
    score -= 1;
    issues.push(`${fragments} dramatic fragments`);
  }

  // Check for adverb overuse
  const adverbs = text.toLowerCase().split(/\s+/).filter(w => 
    COMMON_ADVERBS.includes(w.replace(/[^a-z]/g, ''))
  );
  if (adverbs.length > 3) {
    score -= 1;
    issues.push(`${adverbs.length} common adverbs`);
  }

  return { dimension: "Rhythm", score: Math.max(1, score), issues };
}

function analyzeTrust(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  // Check for softening/hedging
  const hedges = [
    /\bperhaps\b/gi, /\bmight\b/gi, /\bcould be\b/gi, /\bit seems\b/gi,
    /\bin some ways\b/gi, /\bto some extent\b/gi, /\bmore or less\b/gi,
    /\bsort of\b/gi, /\bkind of\b/gi, /\bmaybe\b/gi,
  ];
  const hedgeCount = hedges.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (hedgeCount > 2) {
    score -= 2;
    issues.push(`${hedgeCount} hedging/softening phrases`);
  }

  // Check for hand-holding
  const handHolding = [
    /\bas you (can see|might know|probably)/gi,
    /\bit's important to note/gi,
    /\bkeep in mind\b/gi,
    /\bremember that\b/gi,
    /\bdon't forget\b/gi,
  ];
  const holdCount = handHolding.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (holdCount > 0) {
    score -= Math.min(2, holdCount);
    issues.push(`${holdCount} hand-holding phrases`);
  }

  // Check for lazy extremes
  const lazyExtremes = [
    /\bevery (single )?\w+ knows\b/gi,
    /\balways\b/gi,
    /\bnever\b/gi,
    /\bno one\b/gi,
    /\beveryone\b/gi,
  ];
  const extremeCount = lazyExtremes.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (extremeCount > 2) {
    score -= 1;
    issues.push(`${extremeCount} lazy extremes (always/never/everyone)`);
  }

  // Check for permission-granting
  const permission = [
    /and that's okay/gi,
    /and that's fine/gi,
    /and that's valid/gi,
    /it's okay to/gi,
  ];
  const permCount = permission.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (permCount > 0) {
    score -= 1;
    issues.push(`${permCount} permission-granting phrases`);
  }

  return { dimension: "Trust", score: Math.max(1, score), issues };
}

function analyzeAuthenticity(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  // Check for binary contrasts
  const contrastCount = BINARY_CONTRASTS.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (contrastCount > 0) {
    score -= Math.min(3, contrastCount);
    issues.push(`${contrastCount} binary contrast patterns`);
  }

  // Check for negative listings
  const negativeListings = countMatches(text, /not a .+\.\.\. not a .+\.\.\. a .+\./gi);
  if (negativeListings > 0) {
    score -= 2;
    issues.push(`${negativeListings} negative listing patterns`);
  }

  // Check for rhetorical setups
  const rhetorical = [
    /what if\b/gi,
    /here's what i mean/gi,
    /think about it/gi,
    /can we talk about/gi,
  ];
  const rhetCount = rhetorical.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (rhetCount > 0) {
    score -= Math.min(2, rhetCount);
    issues.push(`${rhetCount} rhetorical setups`);
  }

  // Check for narrator-from-a-distance
  const narrator = [
    /nobody (designed|planned|expected|wanted)/gi,
    /everybody (knows|thinks|believes)/gi,
    /the (market|data|evidence) (tells|shows|suggests)/gi,
  ];
  const narratorCount = narrator.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (narratorCount > 0) {
    score -= Math.min(2, narratorCount);
    issues.push(`${narratorCount} narrator-from-a-distance phrases`);
  }

  // Check for meta-commentary
  const meta = [
    /the rest of this (essay|article|post)/gi,
    /in this (article|post|essay)/gi,
    /as i (mentioned|wrote|said) (earlier|before|above)/gi,
  ];
  const metaCount = meta.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (metaCount > 0) {
    score -= Math.min(2, metaCount);
    issues.push(`${metaCount} meta-commentary phrases`);
  }

  return { dimension: "Authenticity", score: Math.max(1, score), issues };
}

function analyzeDensity(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = words / sentences;

  // Check for overly long sentences
  if (avgWordsPerSentence > 25) {
    score -= 2;
    issues.push(`Average sentence length ${Math.round(avgWordsPerSentence)} words (too long)`);
  }

  // Check for filler words
  const fillers = [
    /\bvery\b/gi, /\breally\b/gi, /\bjust\b/gi, /\bbasically\b/gi,
    /\bactually\b/gi, /\bliterally\b/gi, /\bpractically\b/gi,
    /\bessentially\b/gi, /\bfundamentally\b/gi,
  ];
  const fillerCount = fillers.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (fillerCount > 3) {
    score -= 2;
    issues.push(`${fillerCount} filler words`);
  }

  // Check for redundant phrases
  const redundant = [
    /\bin order to\b/gi, /\bdue to the fact that\b/gi,
    /\bat this point in time\b/gi, /\bin the event that\b/gi,
    /\bfor the purpose of\b/gi, /\bin the process of\b/gi,
  ];
  const redundantCount = redundant.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (redundantCount > 0) {
    score -= Math.min(2, redundantCount);
    issues.push(`${redundantCount} redundant phrases`);
  }

  // Check for business jargon
  const jargon = [
    /\bnavigate\b/gi, /\bunpack\b/gi, /\blean into\b/gi,
    /\blandscape\b/gi, /\bgame-changer\b/gi, /\bdouble down\b/gi,
    /\bdeep dive\b/gi, /\bcircle back\b/gi, /\bon the same page\b/gi,
    /\bmoving forward\b/gi, /\btake a step back\b/gi,
  ];
  const jargonCount = jargon.reduce((acc, p) => acc + countMatches(text, p), 0);
  if (jargonCount > 0) {
    score -= Math.min(2, jargonCount);
    issues.push(`${jargonCount} business jargon terms`);
  }

  return { dimension: "Density", score: Math.max(1, score), issues };
}

export function analyzeText(text: string): AnalysisResult {
  if (!text.trim()) {
    return {
      scores: [
        { dimension: "Directness", score: 0, issues: [] },
        { dimension: "Rhythm", score: 0, issues: [] },
        { dimension: "Trust", score: 0, issues: [] },
        { dimension: "Authenticity", score: 0, issues: [] },
        { dimension: "Density", score: 0, issues: [] },
      ],
      total: 0,
      bannedPhrases: [],
      adverbs: [],
      passiveVoice: [],
      structuralIssues: [],
      suggestions: [],
    };
  }

  const scores = [
    analyzeDirectness(text),
    analyzeRhythm(text),
    analyzeTrust(text),
    analyzeAuthenticity(text),
    analyzeDensity(text),
  ];

  const total = scores.reduce((acc, s) => acc + s.score, 0);

  // Collect all issues
  const bannedPhrases = BANNED_PHRASES.filter(p => text.toLowerCase().includes(p));
  const adverbs = COMMON_ADVERBS.filter(a => text.toLowerCase().includes(a));
  const passiveVoice = findMatches(text, /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi);
  const structuralIssues = BINARY_CONTRASTS.reduce((acc, p) => [...acc, ...findMatches(text, p)], [] as string[]);

  // Generate suggestions
  const suggestions: string[] = [];
  if (total < 35) {
    suggestions.push("Score below 35. Major revision needed.");
  }
  if (bannedPhrases.length > 0) {
    suggestions.push(`Remove ${bannedPhrases.length} banned phrases.`);
  }
  if (adverbs.length > 3) {
    suggestions.push(`Cut ${adverbs.length} adverbs. Use strong verbs instead.`);
  }
  if (passiveVoice.length > 2) {
    suggestions.push(`Convert ${passiveVoice.length} passive constructions to active voice.`);
  }
  if (structuralIssues.length > 0) {
    suggestions.push(`Fix ${structuralIssues.length} structural clichés.`);
  }
  if (suggestions.length === 0) {
    suggestions.push("Text looks clean. Good work.");
  }

  return {
    scores,
    total,
    bannedPhrases,
    adverbs,
    passiveVoice,
    structuralIssues,
    suggestions,
  };
}
