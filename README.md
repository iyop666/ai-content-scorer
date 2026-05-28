# AI Content Scorer

Paste your text. Get scored on 10 dimensions. Fix AI patterns.

## What is this?

AI Content Scorer analyzes your writing and detects common AI-generated patterns, structural cliches, and weak prose. It scores your text on 10 dimensions and can identify which AI model likely generated the text (GPT, Claude, Gemini).

Works with English and Indonesian text. Auto-detects language.

Built by merging detection rules from 4 open-source projects:
- [stop-slop](https://github.com/hardikpandya/stop-slop) — 29 banned phrases
- [claude-slop-detector](https://github.com/aplaceforallmystuff/claude-slop-detector) — 3-tier scoring, structural tells
- [humanize-writing-skill](https://github.com/lguz/humanize-writing-skill) — 51 banned words, 10 structural patterns
- [slop-cop](https://github.com/MahmoudHalat/slop-cop) — 45 rhetorical patterns, ~150 vocabulary tells, dual-axis scoring

## Scoring Dimensions (10 x 10 = 100)

| Dimension | What it checks |
|-----------|---------------|
| **Vocabulary** | 50+ T1 AI words, 35+ T2 words, T3 transition clusters, clinical formality (EN + ID) |
| **Banned Phrases** | 80+ EN + 60+ ID throat-clearing openers, sycophantic phrases, rhetorical setups |
| **Structure** | 15 EN + 16 ID structural patterns: negative parallelism, tricolons, fabricated case studies |
| **Rhythm** | Sentence uniformity, burstiness, em-dash overuse, staccato fragments, adverb overuse |
| **Voice** | Sycophancy, hedge stacking, performative openers, both-sides-ism, uniform paragraphs |
| **Density** | Sentence length, passive voice %, filler words, buzzword stacking, redundant phrases |
| **Formatting** | Bold bullets, emoji headers, listicles, formulaic structures, colon-pattern titles |
| **Readability** | Wall-of-text paragraphs, avg sentence length, passive ratio, subheadings, single-sentence paras |
| **Originality** | Cliche metaphors, template patterns, overused words, generic conclusions |
| **Specificity** | Concrete numbers vs vague quantifiers, anecdotes vs generic examples, abstract nouns |

Each dimension scores 1-10. Total score: 100.

**Score interpretation:**
- 70-100: Clean. Ready to publish.
- 50-69: Needs work. Check issues below.
- 30-49: Heavy AI patterns. Significant editing required.
- Below 30: Extreme AI slop. Full rewrite recommended.

## Special Features

### Language Detection
Auto-detects English, Indonesian, or mixed text. Shows flag badge on results.

**Indonesian detection includes:**
- 30+ T1 AI words (optimalisasi, sinergi, implementasi, transformasi, etc.)
- 30+ T2 words (dinamis, terpadu, berkesinambungan, etc.)
- 18 T3 transitions (selain itu, oleh karena itu, dengan demikian, etc.)
- 40+ banned phrases (perlu diketahui, tidak dapat dipungkiri, di era digital, etc.)
- 12 structural patterns (bukan X melainkan Y, tidak hanya X tetapi juga Y, etc.)
- Clinical formality suggestions (optimalisasi → perbaikan, implementasi → penerapan, etc.)

### Model Fingerprint Detection
Identifies which AI model likely generated the text based on vocabulary patterns:
- **GPT markers**: delve, underscore, commendable, meticulous, groundbreaking
- **Claude markers**: meaningfully, "the distinction is worth examining", "I notice that"
- **Gemini markers**: "the way for", "the cascade of", "let's explore"

### Slop Density Score
Uses the density formula from slop-cop: `(H×3 + M×1 + L×0.25) / 500 words`
- 0-2: PASS
- 2-5: LOW
- 5-10: MEDIUM
- 10-18: HIGH
- 18+: CRITICAL

### Tiered Severity System
- **Tier 1** (strongest AI signals): delve, tapestry, leverage, pivotal, groundbreaking, etc.
- **Tier 2** (moderate): crucial, vibrant, foster, holistic, innovative, dynamic, etc.
- **Tier 3** (transitions): furthermore, moreover, additionally, consequently, etc.

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- shadcn/ui
- TypeScript

## Run locally

```bash
git clone https://github.com/iyop666/ai-content-scorer.git
cd ai-content-scorer
npm install
npm run dev
```

Open http://localhost:3000

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/iyop666/ai-content-scorer)

## Credits

Detection rules merged from:
- [stop-slop](https://github.com/hardikpandya/stop-slop) by [Hardik Pandya](https://github.com/hardikpandya)
- [claude-slop-detector](https://github.com/aplaceforallmystuff/claude-slop-detector)
- [humanize-writing-skill](https://github.com/lguz/humanize-writing-skill)
- [slop-cop](https://github.com/MahmoudHalat/slop-cop)

## License

MIT
