// AI Content Scorer — v2.1
// Merged from: stop-slop, claude-slop-detector, humanize-writing-skill, slop-cop
// + Indonesian language detection (ChatGPT/Gemini AI patterns)
// Scores text on 7 dimensions with tiered severity

export type ScoreResult = {
  dimension: string;
  score: number;
  maxScore: number;
  severity: "low" | "medium" | "high" | "critical";
  issues: string[];
};

export type AnalysisResult = {
  scores: ScoreResult[];
  total: number;
  maxTotal: number;
  language: "en" | "id" | "mixed";
  tier1Hits: string[];
  tier2Hits: string[];
  tier3Hits: string[];
  structuralTells: string[];
  formattingTells: string[];
  modelFingerprints: { model: string; matches: string[] }[];
  passiveVoice: string[];
  suggestions: string[];
  density: number;
};

// ============================================================
// TIER 1 — Strongest AI Signals (each: -3 points)
// ============================================================
const TIER_1_WORDS = [
  // From humanize-writing-skill
  "delve", "tapestry", "landscape", "pivotal", "underscore", "testament",
  "intricate", "intricacies", "meticulous", "meticulously", "nuanced",
  "multifaceted", "embark", "spearhead", "bolster", "bolstered", "garner",
  "interplay", "realm", "labyrinth", "symphony",
  // From slop-cop
  "leverage", "harness", "foster", "empower", "unlock", "elevate",
  "streamline", "revolutionize", "illuminate", "navigate", "utilize",
  "facilitate", "optimize", "enhance", "showcase", "boast",
  "groundbreaking", "cutting-edge", "state-of-the-art", "game-changer",
  "game-changing", "ever-evolving", "ever-changing", "transformative",
  "unwavering", "robust", "seamless", "seamlessly",
  // From claude-slop-detector
  "revolutionary",
];

// ============================================================
// TIER 2 — Moderate AI Signals (each: -2 points)
// ============================================================
const TIER_2_WORDS = [
  // From humanize-writing-skill
  "crucial", "vibrant", "resonate", "enduring", "holistic",
  "comprehensive", "innovative", "dynamic",
  // From slop-cop
  "demystify", "ignite", "supercharge", "unleash", "unveil", "reimagine",
  "reverberate", "transcend", "roadmap", "cornerstone", "crucible",
  "profound", "compelling", "commendable", "insightful", "invaluable",
  "next-generation", "future-proof", "daunting", "ever-expanding",
  "timeless", "diverse array", "unique blend", "hyper-connected",
  "vivid", "bustling", "mission-critical", "enterprise-grade",
  "world-class", "best-in-class", "ai-native", "agent-driven",
  "high-velocity", "outcome-oriented", "scalable", "repeatable", "defensible",
  // From claude-slop-detector
  "comprehensive and thorough", "unique and intense",
  "simple and straightforward", "complex and nuanced",
];

// ============================================================
// TIER 3 — Transition/Formal words (cluster of 3+: -2 points)
// ============================================================
const TIER_3_WORDS = [
  "furthermore", "moreover", "additionally", "consequently",
  "nevertheless", "subsequently", "notably", "indeed", "nonetheless",
  "hence", "thus", "overall", "ultimately",
];

// ============================================================
// BANNED PHRASES — Throat-clearing, rhetorical, sycophantic
// ============================================================
const BANNED_PHRASES = [
  // stop-slop originals
  "here's the thing", "here's what", "here's this", "here's that",
  "here's why", "the uncomfortable truth is", "it turns out",
  "let me be clear", "the truth is", "i'll say it again",
  "i'm going to be honest", "can we talk about",
  "here's what i find interesting", "here's the problem though",
  "full stop", "let that sink in", "this matters because",
  "make no mistake", "here's why that matters", "at its core",
  "in today's", "it's worth noting", "at the end of the day",
  "what if i told you", "think about it", "and that's okay",
  "here's what i mean",
  // claude-slop-detector additions
  "the answer surprised me", "here's what blew my mind", "plot twist:",
  "the crazy part?", "that's when it clicked", "the bottom line",
  "let's be clear", "let's dive in", "let's unpack this",
  "let's break this down", "without further ado",
  "in this post, we'll cover", "by the end of this article, you'll",
  // slop-cop additions
  "in today's fast-paced", "in today's digital world",
  "in today's fast-paced world", "at the end of the day",
  "in essence", "to put it simply", "first and foremost",
  "last but not least", "all things considered", "in a nutshell",
  "that being said", "with that in mind",
  "studies show", "research suggests", "research indicates",
  "many experts agree", "industry reports indicate",
  "it is widely understood", "it's widely believed",
  "observers have noted", "some critics argue",
  "i hope this helps", "let me know if you have any questions",
  "feel free to reach out", "don't hesitate to ask",
  "happy to clarify",
  "imagine a world", "as a society", "we live in an age",
  "play a significant role", "aims to explore",
  "great question!", "excellent question!", "excellent point!",
  "absolutely!", "certainly!", "of course!",
];

// ============================================================
// MODEL FINGERPRINTS
// ============================================================
const MODEL_FINGERPRINTS: Record<string, RegExp[]> = {
  "GPT/Claude": [
    /\bdelve[sd]?\b/gi, /\bunderscore[sd]?\b/gi, /\bcommendable\b/gi,
    /\bintricate\b/gi, /\bmeticulous(ly)?\b/gi, /\bpivotal\b/gi,
    /\bgroundbreaking\b/gi, /\bgarner(ed|s)?\b/gi, /\bboast(s|ed)?\b/gi,
    /\balign(s|ed)?\b/gi, /\bsurpassing\b/gi, /\bplay a significant role\b/gi,
    /\btoday's fast-paced world\b/gi, /\baims to explore\b/gi,
  ],
  "Claude-specific": [
    /\bmeaningfully\b/gi, /\bthe distinction is worth examining\b/gi,
    /\bI notice that\b/gi, /\bit's worth examining\b/gi,
    /\bI should be careful here\b/gi, /\bworth noting that\b/gi,
  ],
  "Gemini-specific": [
    /\bthe way for\b/gi, /\bthe cascade of\b/gi,
    /\bin the world of\b/gi, /\blet's explore\b/gi,
    /\blet's take a closer look\b/gi,
  ],
};

// ============================================================
// STRUCTURAL PATTERNS
// ============================================================
const STRUCTURAL_PATTERNS: { name: string; pattern: RegExp; severity: string }[] = [
  // Negative parallelism
  { name: "Negative parallelism (Not X, but Y)", pattern: /\bnot\b.{5,60}\bbut\b/gi, severity: "high" },
  // Dramatic countdown
  { name: "Dramatic countdown (Not X. Not Y. Just Z)", pattern: /\bnot\b[^.]+\. Not\b[^.]+\./gi, severity: "high" },
  // Rhetorical Q+A
  { name: "Rhetorical Q+A setup", pattern: /\b(the (result|answer|truth|reality|problem|key))\?\s*[A-Z]/gm, severity: "high" },
  // Tricolon abuse
  { name: "Tricolon (rule of three)", pattern: /\b\w+,\s*\w+,\s*and\s*\w+\b/g, severity: "medium" },
  // Comparator sentences
  { name: "Comparator (This isn't X. It's Y)", pattern: /\bthis isn't\b.{3,40}\.\s*it's\b/gi, severity: "high" },
  // Staccato fragment spam
  { name: "Staccato fragments", pattern: /\b\w+\.\s*\b\w+\.\s*\b\w+\./g, severity: "high" },
  // Flattery sandwich
  { name: "Flattery sandwich", pattern: /\b(while|though)\b.{10,60}\b(have merit|suggests|conventional)\b/gi, severity: "medium" },
  // Fabricated case study
  { name: "Fabricated case study", pattern: /\b(take|meet|consider)\s+\b[A-Z][a-z]+\b,\s+a\b/g, severity: "high" },
  // Vague authority
  { name: "Vague authority (no citation)", pattern: /\b(studies show|research suggests|experts agree|data tells us)\b/gi, severity: "high" },
  // Hedged superlatives
  { name: "Hedged superlative", pattern: /\b(perhaps|arguably|possibly)\s+(the\s+)?(most|best|greatest|worst)\b/gi, severity: "medium" },
  // While X, Y opener
  { name: "While X, Y opener", pattern: /^while\b.{10,60},/gim, severity: "medium" },
  // Both-sides-ism
  { name: "Both-sides-ism", pattern: /\bon (the )?one hand\b.{10,80}\bon the other\b/gi, severity: "medium" },
  // False concession
  { name: "False concession", pattern: /\bdespite (its|the|their) .{5,30},\s*(the )?(future|potential|promise|impact)\b/gi, severity: "medium" },
  // Mirror structure (A/B parallelism)
  { name: "Mirror structure", pattern: /\b(\w+ \w+ \w+)\.\s*\1\b/gi, severity: "medium" },
  // Overuse of colons for reveals
  { name: "Colon reveal pattern", pattern: /[^:]{20,80}:\s*a\b/g, severity: "low" },
];

// ============================================================
// FORMATTING TELLS
// ============================================================
const FORMATTING_TELLS: { name: string; check: (text: string) => boolean; severity: string }[] = [
  { name: "Bold-first bullets", check: (t) => /^\*\*\w/gm.test(t), severity: "high" },
  { name: "Emoji headers/bullets", check: (t) => /[\u{1F3AF}\u{1F4A1}\u{1F680}\u{2705}\u{1F525}\u{1F4CC}\u{1F3C6}]/u.test(t), severity: "medium" },
  { name: "Colon-pattern title", check: (t) => /^#\s+\w[^:]+:\s+(A |The |How |Why |What )/m.test(t), severity: "medium" },
  { name: "Ultimate/Definitive guide", check: (t) => /\b(ultimate|definitive)\s+guide\b/gi.test(t), severity: "high" },
  { name: "TL;DR / Key Takeaways", check: (t) => /\b(TL;?DR|key takeaways?)\b/i.test(t), severity: "medium" },
  { name: "In conclusion section", check: (t) => /^#{1,3}\s*(in conclusion|to (summarize|wrap up|conclude))/gim.test(t), severity: "high" },
  { name: "Numbered listicle (5/7/10 ways)", check: (t) => /\b(5|7|10|15|20)\s+(ways|tips|reasons|steps|things)\b/i.test(t), severity: "low" },
];

// ============================================================
// COMMON ADVERBS
// ============================================================
const COMMON_ADVERBS = [
  "really", "just", "literally", "genuinely", "honestly", "simply",
  "actually", "deeply", "truly", "fundamentally", "inherently",
  "inevitably", "interestingly", "importantly", "crucially",
  "essentially", "basically", "practically", "virtually", "clearly",
  "obviously", "certainly", "definitely", "probably", "possibly",
  "arguably", "surprisingly", "notably", "significantly", "remarkably",
  "quietly", "subtly",
];

const ADVERB_PATTERN = /\b\w+ly\b/gi;

// ============================================================
// PASSIVE VOICE
// ============================================================
const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|be|been|being)\s+\w+ed\b/i,
  /\b(is|are|was|were|be|been|being)\s+\w+en\b/i,
];

// ============================================================
// CLINICAL FORMALITY (word → better replacement)
// ============================================================
const CLINICAL_FORMALITY: Record<string, string> = {
  "individuals": "people",
  "utilize": "use",
  "facilitate": "help",
  "implement": "do/start",
  "commence": "start",
  "terminate": "end",
  "subsequent": "next",
  "prior to": "before",
  "in the event that": "if",
  "due to the fact that": "because",
  "at this point in time": "now",
  "in order to": "to",
  "for the purpose of": "for",
  "in the process of": "while",
  "at this juncture": "now",
};

// ============================================================
// INDONESIAN LANGUAGE PATTERNS
// ============================================================

// Language detection — check if text is primarily Indonesian
function detectLanguage(text: string): "en" | "id" | "mixed" {
  const idWords = ["dan", "yang", "ini", "itu", "dengan", "untuk", "pada", "dari", "oleh", "dalam", "adalah", "akan", "tidak", "juga", "sudah", "masih", "bisa", "ada", "lebih", "sangat", "telah", "para", "antara", "karena", "namun", "sehingga", "serta", "bagi", "seperti", "setelah", "sebelum", "ketika", "meskipun", "bahwa"];
  const words = text.toLowerCase().split(/\s+/);
  const idCount = words.filter(w => idWords.includes(w.replace(/[^a-z]/g, ''))).length;
  const ratio = idCount / words.length;
  if (ratio > 0.15) return "id";
  if (ratio > 0.05) return "mixed";
  return "en";
}

// Indonesian T1 — Strongest AI Signals
const ID_TIER_1_WORDS = [
  // Formal/bureaucratic words that AI overuses
  "optimalisasi", "sinergi", "kolaborasi", "implementasi", "transformasi",
  "sustainable", "berkelanjutan", "holistik", "komprehensif", "inovatif",
  "paradigma", "ekosistem", "strategis", "signifikan", "fundamental",
  "esensial", "krusial", "vital", "ponten", "paramount",
  // ChatGPT favorites in Indonesian
  "mendalami", "menjelajahi", "menggali", "mengungkap", "mengupas",
  "landskap", "lanskap", "tapestri", "labirin", "simfoni",
  "pilar", "tiang", "punggung", "tulang punggung",
  // Google Translate-sounding phrases
  "dalam hal ini", "perlu dicatat", "penting untuk diketahui",
  "tidak dapat dipungkiri", "sudah menjadi rahasia umum",
];

// Indonesian T2 — Moderate AI Signals
const ID_TIER_2_WORDS = [
  "dinamis", "vibrant", "beragam", "berimbang", "terpadu",
  "terintegrasi", "berkesinambungan", "berdaya saing", "kompetitif",
  "moderen", "mutakhir", "canggih", "revolusioner", "mutlak",
  "absolut", "konkret", "riil", "praktis", "efektif", "efisien",
  "profesional", "kompeten", "andal", "tangguh", "unggul",
  "berkualitas", "terpercaya", "relevan", "aplikatif",
];

// Indonesian T3 — Transition/Formal words (cluster of 3+: flag)
const ID_TIER_3_WORDS = [
  "selain itu", "di sisi lain", "sebaliknya", "oleh karena itu",
  "dengan demikian", "berdasarkan hal tersebut", "mengingat",
  "sehubungan dengan", "terkait dengan", "berkaitan dengan",
  "seiring dengan", "sejalan dengan", "menimbang", "merujuk pada",
  "adapun", "alhasil", "kesimpulannya", "secara keseluruhan",
];

// Indonesian Banned Phrases — AI throat-clearing, rhetorical, performative
const ID_BANNED_PHRASES = [
  // Throat-clearing openers
  "perlu diketahui", "penting untuk dicatat", "perlu diingat",
  "tidak dapat dipungkiri", "sudah menjadi rahasia umum",
  "faktanya", "pada kenyataannya", "sejatinya", "hakikatnya",
  "pada dasarnya", "secara garis besar",
  // ChatGPT-style openers
  "di era digital", "di era modern", "di era globalisasi",
  "di tengah-tengah", "di tengah perkembangan",
  "dalam era transformasi", "dalam dunia yang serba cepat",
  "seiring perkembangan teknologi", "seiring dengan kemajuan",
  // Performative
  "bayangkan", "coba bayangkan", "imagine",
  "mar kita", "ayo kita", "yuk kita bahas",
  // Rhetorical setups
  "apa sebenarnya", "mengapa hal ini penting",
  "bagaimana cara", "kenapa harus",
  // Sycophantic (Indonesian ChatGPT)
  "pertanyaan bagus", "hebat sekali", "luar biasa",
  "tentu saja", "dengan senang hati", "semoga membantu",
  "jangan ragu untuk", "silakan tanyakan",
  // Closing cliches
  "kesimpulannya", "secara keseluruhan", "pada akhirnya",
  "intinya", "yang terpenting", "yang paling utama",
  "dengan demikian dapat disimpulkan",
  // Vague authority
  "menurut para ahli", "berdasarkan penelitian",
  "studi menunjukkan", "data menunjukkan",
  "tidak diragukan lagi", "sudah terbukti",
  // AI-generated conclusions
  "tantangan dan peluang", "pro dan kontra",
  "kelebihan dan kekurangan", "positif dan negatif",
  "di satu sisi di sisi lain",
  // Meta AI / WhatsApp AI patterns (casual Indonesian)
  "oke, jadi", "jadi gini", "jadi begini", "nih, jadi",
  "jangan lupa ya", "pastikan ya", "ingat ya",
  "semoga membantu ya", "semoga bermanfaat ya",
  "selamat mencoba ya", "selamat mencoba!",
  "gitu aja sih", "segitu aja", "cukup sekian",
  "mudah-mudahan", "insyaallah",
  // Meta AI over-helpfulness
  "berikut adalah langkah-langkah", "berikut tahapannya",
  "ini dia caranya", "begini cara membuatnya",
  "simak baik-baik", "perhatikan hal berikut",
  "ada beberapa hal yang perlu diperhatikan",
  "berikut beberapa tips", "berikut beberapa manfaat",
  "perlu diingat bahwa", "harus diingat bahwa",
  // Meta AI structure patterns
  "langkah 1:", "langkah 2:", "langkah 3:",
  "tahap 1:", "tahap 2:", "tahap 3:",
  "pertama-tama", "selanjutnya", "terakhir",
  // Meta AI casual fillers that signal AI
  "sebenarnya sih", "memang sih", "iya sih",
  "bener banget", "betul sekali", "tepat sekali",
  "wah, bagus banget", "keren banget",
  // Meta AI recipe/tutorial patterns
  "pastikan untuk", "jangan lupa untuk", "usahakan",
  "sebaiknya", "alangkah baiknya", "akan lebih baik jika",
  "prosesnya cukup mudah", "caranya sangat mudah",
  "tidak sulit kok", "gampang banget kok",
];

// Indonesian Structural Patterns
const ID_STRUCTURAL_PATTERNS: { name: string; pattern: RegExp; severity: string }[] = [
  // "Bukan X, melainkan Y" (Not X, but Y)
  { name: "Bukan X, melainkan Y (negative parallelism)", pattern: /\bbukan\b.{5,60}\bmelainkan\b/gi, severity: "high" },
  // "Tidak hanya X, tetapi juga Y"
  { name: "Tidak hanya X, tetapi juga Y", pattern: /\btidak hanya\b.{5,60}\btetapi juga\b/gi, severity: "high" },
  // "Di satu sisi... di sisi lain"
  { name: "Di satu sisi... di sisi lain (both-sides)", pattern: /\bdi satu sisi\b.{10,80}\bdi sisi lain\b/gi, severity: "medium" },
  // Tricolon in Indonesian (X, Y, dan Z)
  { name: "Tricolon Indonesia (X, Y, dan Z)", pattern: /\b\w+,\s*\w+,\s*dan\s*\w+\b/g, severity: "medium" },
  // "Perlu dicatat bahwa" (It's worth noting that)
  { name: "Perlu dicatat bahwa", pattern: /\bperlu dicatat\b/gi, severity: "high" },
  // "Tidak dapat dipungkiri bahwa" (It cannot be denied)
  { name: "Tidak dapat dipungkiri bahwa", pattern: /\btidak dapat dipungkiri\b/gi, severity: "high" },
  // "Seiring dengan perkembangan" (Along with the development)
  { name: "Seiring dengan perkembangan", pattern: /\bseiring (dengan )?perkembangan\b/gi, severity: "high" },
  // "Dalam era digital/modern"
  { name: "Dalam era digital/modern", pattern: /\bdalam era\b/gi, severity: "high" },
  // "X memainkan peran penting" (X plays an important role)
  { name: "Memainkan peran penting", pattern: /\bmemainkan peran (penting|crucial|vital)\b/gi, severity: "high" },
  // ChatGPT-style definition opener: "X adalah..."
  { name: "Definition opener (X adalah...)", pattern: /^[A-Z][a-z]+ adalah\b/gm, severity: "medium" },
  // "Berikut adalah" (Here are)
  { name: "Berikut adalah", pattern: /\bberikut adalah\b/gi, severity: "medium" },
  // "Adapun" as paragraph opener
  { name: "Adapun sebagai pembuka", pattern: /\badapun\b/gi, severity: "low" },
  // Meta AI "too perfect" structure
  { name: "Numbered steps (langkah 1, 2, 3)", pattern: /\b(langkah|tahap|step)\s*\d+/gi, severity: "high" },
  { name: "Over-organized bullets", pattern: /^[\-\*]\s+.{10,60}$/gm, severity: "low" },
  { name: "Perfect recipe format", pattern: /\b(bahan|bumbu|cara membuat|cara memasak)\b/gi, severity: "medium" },
  { name: "Meta AI helpful closer", pattern: /\b(selamat mencoba|semoga membantu|semoga bermanfaat)\b/gi, severity: "high" },
];

// Indonesian Clinical Formality
const ID_CLINICAL_FORMALITY: Record<string, string> = {
  "optimalisasi": "perbaikan",
  "implementasi": "penerapan",
  "transformasi": "perubahan",
  "sinergi": "kerja sama",
  "kolaborasi": "kerja sama",
  "komprehensif": "lengkap",
  "signifikan": "besar",
  "fundamental": "dasar",
  "esensial": "penting",
  "berkelanjutan": "terus-menerus",
  "ekosistem": "lingkungan",
  "paradigma": "cara pandang",
  "strategis": "penting",
  "mengimplementasikan": "menerapkan",
  "mengoptimalkan": "memperbaiki",
  "berkolaborasi": "bekerja sama",
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function findWordHits(text: string, wordList: string[]): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const word of wordList) {
    if (word.includes(" ")) {
      if (lower.includes(word)) hits.push(word);
    } else {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      if (regex.test(lower)) hits.push(word);
    }
  }
  return hits;
}

function getSentenceLengthVariance(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 2) return 0;
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avg, 2), 0) / lengths.length;
  return Math.sqrt(variance);
}

function getBurstiness(text: string): number {
  const sd = getSentenceLengthVariance(text);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 2) return 0.5;
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  return avg > 0 ? sd / avg : 0;
}

// ============================================================
// DIMENSION SCORERS
// ============================================================

function analyzeVocabulary(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;
  const lang = detectLanguage(text);

  // English patterns
  const t1Hits = findWordHits(text, TIER_1_WORDS);
  const t2Hits = findWordHits(text, TIER_2_WORDS);
  const t3Hits = findWordHits(text, TIER_3_WORDS);

  // Indonesian patterns
  const idT1Hits = findWordHits(text, ID_TIER_1_WORDS);
  const idT2Hits = findWordHits(text, ID_TIER_2_WORDS);
  const idT3Hits = findWordHits(text, ID_TIER_3_WORDS);

  const allT1 = [...t1Hits, ...idT1Hits];
  const allT2 = [...t2Hits, ...idT2Hits];
  const allT3 = [...t3Hits, ...idT3Hits];

  if (allT1.length > 0) {
    const penalty = Math.min(6, allT1.length * 1.5);
    score -= penalty;
    issues.push(`T1 AI words (${allT1.length}): ${allT1.slice(0, 5).join(", ")}${allT1.length > 5 ? "..." : ""}`);
  }
  if (allT2.length > 0) {
    const penalty = Math.min(4, allT2.length);
    score -= penalty;
    issues.push(`T2 AI words (${allT2.length}): ${allT2.slice(0, 5).join(", ")}${allT2.length > 5 ? "..." : ""}`);
  }
  if (allT3.length >= 3) {
    score -= 2;
    issues.push(`T3 transition cluster (${allT3.length}): ${allT3.join(", ")}`);
  }

  // Clinical formality check (both languages)
  const clinicalHits: string[] = [];
  const lower = text.toLowerCase();
  const allFormality = { ...CLINICAL_FORMALITY, ...ID_CLINICAL_FORMALITY };
  for (const phrase of Object.keys(allFormality)) {
    if (lower.includes(phrase)) clinicalHits.push(`${phrase} → ${allFormality[phrase]}`);
  }
  if (clinicalHits.length > 0) {
    score -= Math.min(2, clinicalHits.length);
    issues.push(`Formal words: ${clinicalHits.slice(0, 3).join("; ")}`);
  }

  // Language indicator
  if (lang === "id") issues.unshift("🇮🇩 Indonesian detected");
  else if (lang === "mixed") issues.unshift("🇮🇩🇬🇧 Mixed language detected");

  return { dimension: "Vocabulary", score: Math.max(1, score), maxScore: 10, severity: score <= 4 ? "critical" : score <= 6 ? "high" : score <= 8 ? "medium" : "low", issues };
}

function analyzeBannedPhrases(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  const hits = findWordHits(text, BANNED_PHRASES);
  const idHits = findWordHits(text, ID_BANNED_PHRASES);
  const allHits = [...hits, ...idHits];

  if (allHits.length > 0) {
    score -= Math.min(8, allHits.length * 2);
    issues.push(`Banned phrases (${allHits.length}): ${allHits.slice(0, 5).map(h => `"${h}"`).join(", ")}${allHits.length > 5 ? "..." : ""}`);
  }

  return { dimension: "Banned Phrases", score: Math.max(1, score), maxScore: 10, severity: score <= 4 ? "critical" : score <= 6 ? "high" : score <= 8 ? "medium" : "low", issues };
}

function analyzeStructuralTells(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  // English structural patterns
  for (const { name, pattern, severity } of STRUCTURAL_PATTERNS) {
    const count = countMatches(text, pattern);
    if (count > 0) {
      const penalty = severity === "high" ? Math.min(3, count * 1.5) : severity === "medium" ? Math.min(2, count) : Math.min(1, count);
      score -= penalty;
      issues.push(`${name} (${count}x)`);
    }
  }

  // Indonesian structural patterns
  for (const { name, pattern, severity } of ID_STRUCTURAL_PATTERNS) {
    const count = countMatches(text, pattern);
    if (count > 0) {
      const penalty = severity === "high" ? Math.min(3, count * 1.5) : severity === "medium" ? Math.min(2, count) : Math.min(1, count);
      score -= penalty;
      issues.push(`${name} (${count}x)`);
    }
  }

  // Tricolon check (both languages)
  const tricolonCount = countMatches(text, /\b\w+,\s*\w+,\s*(and|dan)\s*\w+\b/g);
  if (tricolonCount > 2) {
    score -= 2;
    issues.push(`Excessive tricolons (${tricolonCount}x)`);
  }

  return { dimension: "Structure", score: Math.max(1, score), maxScore: 10, severity: score <= 4 ? "critical" : score <= 6 ? "high" : score <= 8 ? "medium" : "low", issues };
}

function analyzeRhythm(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) {
    return { dimension: "Rhythm", score: 5, maxScore: 10, severity: "low", issues: ["No sentences detected"] };
  }

  // Sentence length variance
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avg, 2), 0) / lengths.length;
  const sd = Math.sqrt(variance);

  if (sd < 5) {
    score -= 3;
    issues.push(`Sentence uniformity (SD: ${sd.toFixed(1)} words)`);
  }

  // Burstiness check
  const burstiness = getBurstiness(text);
  if (burstiness < 0.3) {
    score -= 2;
    issues.push(`Low burstiness (${burstiness.toFixed(2)}) — AI-typical rhythm`);
  }

  // Em dash overuse
  const emDashes = countMatches(text, /—/g);
  const words = text.split(/\s+/).length;
  const emDashPer500 = (emDashes / words) * 500;
  if (emDashPer500 >= 3) {
    score -= 2;
    issues.push(`${emDashes} em dashes (${emDashPer500.toFixed(1)} per 500 words)`);
  } else if (emDashes > 0) {
    score -= 1;
    issues.push(`${emDashes} em dash(es)`);
  }

  // Staccato fragment spam
  const staccatoCount = countMatches(text, /\b\w+\.\s*\b\w+\.\s*\b\w+\./g);
  if (staccatoCount > 0) {
    score -= Math.min(3, staccatoCount * 1.5);
    issues.push(`${staccatoCount} staccato fragment clusters`);
  }

  // Adverb overuse (curated + -ly pattern)
  const adverbs = text.toLowerCase().split(/\s+/).filter(w =>
    COMMON_ADVERBS.includes(w.replace(/[^a-z]/g, ''))
  );
  const lyAdverbs = text.match(ADVERB_PATTERN) || [];
  const uniqueLyAdverbs = Array.from(new Set(lyAdverbs.map(a => a.toLowerCase())))
    .filter(a => !COMMON_ADVERBS.includes(a));
  const totalAdverbs = adverbs.length + uniqueLyAdverbs.length;
  if (totalAdverbs > 5) {
    score -= 2;
    issues.push(`${totalAdverbs} adverbs`);
  }

  return { dimension: "Rhythm", score: Math.max(1, score), maxScore: 10, severity: score <= 4 ? "critical" : score <= 6 ? "high" : score <= 8 ? "medium" : "low", issues };
}

function analyzeVoice(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  // Sycophancy detection
  const sycophancyOpeners = /\b(great question|excellent question|excellent point|absolutely!|certainly!|of course!)\b/gi;
  const sycophancyClosers = /\b(i hope this helps|let me know if you|feel free to reach out|don't hesitate|happy to clarify)\b/gi;
  const sycCount = countMatches(text, sycophancyOpeners) + countMatches(text, sycophancyClosers);
  if (sycCount > 0) {
    score -= Math.min(3, sycCount * 1.5);
    issues.push(`${sycCount} sycophantic phrases`);
  }

  // Hedge stacking
  const hedges = /\b(perhaps|might|could be|it seems|sort of|kind of|maybe|generally speaking|to some extent|more or less)\b/gi;
  const hedgeCount = countMatches(text, hedges);
  if (hedgeCount > 3) {
    score -= 2;
    issues.push(`${hedgeCount} hedging phrases`);
  }

  // Too balanced / no opinion
  const balancePhrases = /\bon (the )?one hand\b/gi;
  const balanceCount = countMatches(text, balancePhrases);
  if (balanceCount > 1) {
    score -= 1;
    issues.push(`${balanceCount} both-sides-ism patterns`);
  }

  // Performative openers
  const performative = /\b(imagine a world|in today's fast-paced|as a society|we live in an age)\b/gi;
  if (performative.test(text)) {
    score -= 2;
    issues.push("Performative opener detected");
  }

  // Uniform paragraph length check
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length > 3) {
    const paraLengths = paragraphs.map(p => p.split(/\s+/).length);
    const paraAvg = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
    const paraVariance = paraLengths.reduce((acc, l) => acc + Math.pow(l - paraAvg, 2), 0) / paraLengths.length;
    if (Math.sqrt(paraVariance) < 10) {
      score -= 1;
      issues.push("Uniform paragraph lengths");
    }
  }

  // Perfection detector (Meta AI / Gemini casual Indonesian)
  // Check for zero contractions + zero slang in Indonesian text
  const lang = detectLanguage(text);
  if (lang === "id" || lang === "mixed") {
    const contractions = /\b(nggak|gak|ga|gk|dong|sih|nih|deh|lah|kok|banget|bgt|doang|aja|aja sih|btw|gw|lu|loe|gue|guys)\b/i;
    const hasContractions = contractions.test(text);
    
    // Indonesian AI writes with perfect "tidak" instead of casual "nggak/gak"
    const formalNegation = (text.match(/\btidak\b/gi) || []).length;
    const casualNegation = (text.match(/\b(nggak|gak|ga|gk)\b/gi) || []).length;
    
    if (formalNegation > 3 && casualNegation === 0) {
      score -= 2;
      issues.push("Too formal: uses 'tidak' exclusively, no casual 'nggak/gak'");
    }
    
    // Check for overly detailed explanations (every sentence explains something)
    const explanatoryPhrases = text.match(/\b(karena|sebab|hal ini|yang mana|dimana|yaitu|adalah|merupakan)\b/gi) || [];
    const wordCount = text.split(/\s+/).length;
    const explanatoryRatio = explanatoryPhrases.length / (wordCount / 100);
    if (explanatoryRatio > 5) {
      score -= 2;
      issues.push(`Over-explaining (${explanatoryPhrases.length} explanatory phrases)`);
    }
    
    // Check for zero typos/informalities (too perfect)
    const informalMarkers = /\b(emang|gini|gitu|kayak|kaya|udah|udh|blm|blom|skrg|skarang|tp|tpi|dg|dgn|sm|smw|org|org2)\b/i;
    if (!informalMarkers.test(text) && wordCount > 50 && !hasContractions) {
      score -= 2;
      issues.push("Zero informal markers: text is suspiciously perfect for casual Indonesian");
    }
  }

  return { dimension: "Voice", score: Math.max(1, score), maxScore: 10, severity: score <= 4 ? "critical" : score <= 6 ? "high" : score <= 8 ? "medium" : "low", issues };
}

function analyzeDensity(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount === 0 ? 0 : words / sentenceCount;

  // Long sentences
  if (avgWordsPerSentence > 25) {
    score -= 2;
    issues.push(`Avg sentence length ${Math.round(avgWordsPerSentence)} words (too long)`);
  }

  // Passive voice
  const passiveCount = sentences.filter(s =>
    PASSIVE_PATTERNS.some(p => p.test(s))
  ).length;
  const passivePercent = sentenceCount > 0 ? (passiveCount / sentenceCount) * 100 : 0;
  if (passivePercent > 15) {
    score -= 2;
    issues.push(`${passivePercent.toFixed(0)}% passive voice`);
  } else if (passivePercent > 10) {
    score -= 1;
    issues.push(`${passivePercent.toFixed(0)}% passive voice`);
  }

  // Filler words
  const fillers = /\b(very|really|just|basically|actually|literally|practically|essentially|fundamentally)\b/gi;
  const fillerCount = countMatches(text, fillers);
  if (fillerCount > 5) {
    score -= 2;
    issues.push(`${fillerCount} filler words`);
  }

  // Buzzword stacking (3+ in one paragraph)
  const buzzwords = /\b(scalable|repeatable|defensible|mission-critical|enterprise-grade|world-class|best-in-class|robust|seamless|innovative|cutting-edge|state-of-the-art|synergy|holistic|next-generation|transformative|groundbreaking|comprehensive|multifaceted)\b/gi;
  const paragraphs = text.split(/\n\s*\n/);
  for (const para of paragraphs) {
    const buzzCount = countMatches(para, buzzwords);
    if (buzzCount >= 3) {
      score -= 2;
      issues.push(`Buzzword stacking (${buzzCount} in one paragraph)`);
      break;
    }
  }

  // Redundant phrases
  const redundant = /\b(in order to|due to the fact that|at this point in time|in the event that|for the purpose of|in the process of)\b/gi;
  const redundantCount = countMatches(text, redundant);
  if (redundantCount > 0) {
    score -= Math.min(2, redundantCount);
    issues.push(`${redundantCount} redundant phrases`);
  }

  return { dimension: "Density", score: Math.max(1, score), maxScore: 10, severity: score <= 4 ? "critical" : score <= 6 ? "high" : score <= 8 ? "medium" : "low", issues };
}

function analyzeFormatting(text: string): ScoreResult {
  const issues: string[] = [];
  let score = 10;

  for (const { name, check, severity } of FORMATTING_TELLS) {
    if (check(text)) {
      const penalty = severity === "high" ? 2 : severity === "medium" ? 1 : 0.5;
      score -= penalty;
      issues.push(name);
    }
  }

  // Section structure: intro → 3-5 H2s → conclusion
  const h2Count = (text.match(/^##\s/gm) || []).length;
  const hasConclusion = /^#{1,3}\s*(in conclusion|to (summarize|wrap up|conclude))/gim.test(text);
  if (h2Count >= 3 && hasConclusion) {
    score -= 1;
    issues.push(`Formulaic structure (${h2Count} H2s + conclusion)`);
  }

  // Uniform paragraph length
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  if (paragraphs.length > 3) {
    const paraLengths = paragraphs.map(p => p.split(/\s+/).length);
    const paraAvg = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
    const allSimilar = paraLengths.every(l => Math.abs(l - paraAvg) < 15);
    if (allSimilar) {
      score -= 1;
      issues.push("Uniform paragraph lengths across sections");
    }
  }

  return { dimension: "Formatting", score: Math.max(1, score), maxScore: 10, severity: score <= 4 ? "critical" : score <= 6 ? "high" : score <= 8 ? "medium" : "low", issues };
}

// ============================================================
// MAIN ANALYSIS
// ============================================================

export function analyzeText(text: string): AnalysisResult {
  if (!text.trim()) {
    return {
      scores: [
        { dimension: "Vocabulary", score: 0, maxScore: 10, severity: "low", issues: [] },
        { dimension: "Banned Phrases", score: 0, maxScore: 10, severity: "low", issues: [] },
        { dimension: "Structure", score: 0, maxScore: 10, severity: "low", issues: [] },
        { dimension: "Rhythm", score: 0, maxScore: 10, severity: "low", issues: [] },
        { dimension: "Voice", score: 0, maxScore: 10, severity: "low", issues: [] },
        { dimension: "Density", score: 0, maxScore: 10, severity: "low", issues: [] },
        { dimension: "Formatting", score: 0, maxScore: 10, severity: "low", issues: [] },
      ],
      total: 0, maxTotal: 70, language: "en",
      tier1Hits: [], tier2Hits: [], tier3Hits: [],
      structuralTells: [], formattingTells: [],
      modelFingerprints: [], passiveVoice: [],
      suggestions: [], density: 0,
    };
  }

  const language = detectLanguage(text);

  const scores = [
    analyzeVocabulary(text),
    analyzeBannedPhrases(text),
    analyzeStructuralTells(text),
    analyzeRhythm(text),
    analyzeVoice(text),
    analyzeDensity(text),
    analyzeFormatting(text),
  ];

  const total = scores.reduce((acc, s) => acc + s.score, 0);
  const maxTotal = scores.reduce((acc, s) => acc + s.maxScore, 0);

  // Collect tier hits (both languages)
  const tier1Hits = [...findWordHits(text, TIER_1_WORDS), ...findWordHits(text, ID_TIER_1_WORDS)];
  const tier2Hits = [...findWordHits(text, TIER_2_WORDS), ...findWordHits(text, ID_TIER_2_WORDS)];
  const tier3Hits = [...findWordHits(text, TIER_3_WORDS), ...findWordHits(text, ID_TIER_3_WORDS)];

  // Structural tells (both languages)
  const structuralTells: string[] = [];
  for (const { name, pattern } of STRUCTURAL_PATTERNS) {
    const count = countMatches(text, pattern);
    if (count > 0) structuralTells.push(`${name} (${count}x)`);
  }
  for (const { name, pattern } of ID_STRUCTURAL_PATTERNS) {
    const count = countMatches(text, pattern);
    if (count > 0) structuralTells.push(`${name} (${count}x)`);
  }

  // Formatting tells
  const formattingTells: string[] = [];
  for (const { name, check } of FORMATTING_TELLS) {
    if (check(text)) formattingTells.push(name);
  }

  // Model fingerprints
  const modelFingerprints: { model: string; matches: string[] }[] = [];
  for (const [model, patterns] of Object.entries(MODEL_FINGERPRINTS)) {
    const matches: string[] = [];
    for (const p of patterns) {
      const found = text.match(p);
      if (found) matches.push(...found);
    }
    if (matches.length > 0) {
      modelFingerprints.push({ model, matches: Array.from(new Set(matches.map(m => m.toLowerCase()))) });
    }
  }

  // Passive voice
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const passiveVoice = sentences
    .filter(s => PASSIVE_PATTERNS.some(p => p.test(s)))
    .map(s => s.trim().substring(0, 60))
    .slice(0, 5);

  // Density score
  const words = text.split(/\s+/).length;
  const highHits = tier1Hits.length + structuralTells.filter(t => t.includes("high")).length;
  const medHits = tier2Hits.length;
  const lowHits = tier3Hits.length;
  const density = words > 0 ? ((highHits * 3) + (medHits * 1) + (lowHits * 0.25)) / (words / 500) : 0;

  // Suggestions
  const suggestions: string[] = [];
  if (total < 35) suggestions.push("Score below 35. Major revision needed.");
  if (tier1Hits.length > 3) suggestions.push(`Remove ${tier1Hits.length} Tier 1 AI words first.`);
  if (structuralTells.length > 3) suggestions.push(`Fix ${structuralTells.length} structural patterns.`);
  if (density > 10) suggestions.push(`AI-slop density is HIGH (${density.toFixed(1)}). Rewrite recommended.`);
  if (modelFingerprints.length > 0) suggestions.push(`Detected ${modelFingerprints.map(m => m.model).join(", ")} fingerprints.`);
  if (passiveVoice.length > 3) suggestions.push(`Convert ${passiveVoice.length} passive constructions.`);
  if (suggestions.length === 0) suggestions.push("Text looks clean. Good work.");

  return {
    scores, total, maxTotal, language,
    tier1Hits, tier2Hits, tier3Hits,
    structuralTells, formattingTells,
    modelFingerprints, passiveVoice,
    suggestions, density,
  };
}
