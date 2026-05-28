     1|# SlopEdge
     2|
     3|Your competitors use AI too. Make sure yours doesn't sound like it.
     4|
     5|Paste your text. Get scored on 10 dimensions. Fix AI patterns before you publish.
     6|
     7|## What is this?
     8|
     9|SlopEdge analyzes your writing and detects common AI-generated patterns, structural cliches, and weak prose. It scores your text on 10 dimensions and can identify which AI model likely generated the text (GPT, Claude, Gemini).
    10|
    11|Works with English and Indonesian text. Auto-detects language.
    12|
    13|Built by merging detection rules from 4 open-source projects:
    14|- [stop-slop](https://github.com/hardikpandya/stop-slop) — 29 banned phrases
    15|- [claude-slop-detector](https://github.com/aplaceforallmystuff/claude-slop-detector) — 3-tier scoring, structural tells
    16|- [humanize-writing-skill](https://github.com/lguz/humanize-writing-skill) — 51 banned words, 10 structural patterns
    17|- [slop-cop](https://github.com/MahmoudHalat/slop-cop) — 45 rhetorical patterns, ~150 vocabulary tells, dual-axis scoring
    18|
    19|## Scoring Dimensions (10 x 10 = 100)
    20|
    21|| Dimension | What it checks |
    22||-----------|---------------|
    23|| **Vocabulary** | 50+ T1 AI words, 35+ T2 words, T3 transition clusters, clinical formality (EN + ID) |
    24|| **Banned Phrases** | 80+ EN + 60+ ID throat-clearing openers, sycophantic phrases, rhetorical setups |
    25|| **Structure** | 15 EN + 16 ID structural patterns: negative parallelism, tricolons, fabricated case studies |
    26|| **Rhythm** | Sentence uniformity, burstiness, em-dash overuse, staccato fragments, adverb overuse |
    27|| **Voice** | Sycophancy, hedge stacking, performative openers, both-sides-ism, uniform paragraphs |
    28|| **Density** | Sentence length, passive voice %, filler words, buzzword stacking, redundant phrases |
    29|| **Formatting** | Bold bullets, emoji headers, listicles, formulaic structures, colon-pattern titles |
    30|| **Readability** | Wall-of-text paragraphs, avg sentence length, passive ratio, subheadings, single-sentence paras |
    31|| **Originality** | Cliche metaphors, template patterns, overused words, generic conclusions |
    32|| **Specificity** | Concrete numbers vs vague quantifiers, anecdotes vs generic examples, abstract nouns |
    33|
    34|Each dimension scores 1-10. Total score: 100.
    35|
    36|**Score interpretation:**
    37|- 70-100: Clean. Ready to publish.
    38|- 50-69: Needs work. Check issues below.
    39|- 30-49: Heavy AI patterns. Significant editing required.
    40|- Below 30: Extreme AI slop. Full rewrite recommended.
    41|
    42|## Special Features
    43|
    44|### Language Detection
    45|Auto-detects English, Indonesian, or mixed text. Shows flag badge on results.
    46|
    47|**Indonesian detection includes:**
    48|- 30+ T1 AI words (optimalisasi, sinergi, implementasi, transformasi, etc.)
    49|- 30+ T2 words (dinamis, terpadu, berkesinambungan, etc.)
    50|- 18 T3 transitions (selain itu, oleh karena itu, dengan demikian, etc.)
    51|- 40+ banned phrases (perlu diketahui, tidak dapat dipungkiri, di era digital, etc.)
    52|- 12 structural patterns (bukan X melainkan Y, tidak hanya X tetapi juga Y, etc.)
    53|- Clinical formality suggestions (optimalisasi → perbaikan, implementasi → penerapan, etc.)
    54|
    55|### Model Fingerprint Detection
    56|Identifies which AI model likely generated the text based on vocabulary patterns:
    57|- **GPT markers**: delve, underscore, commendable, meticulous, groundbreaking
    58|- **Claude markers**: meaningfully, "the distinction is worth examining", "I notice that"
    59|- **Gemini markers**: "the way for", "the cascade of", "let's explore"
    60|
    61|### Slop Density Score
    62|Uses the density formula from slop-cop: `(H×3 + M×1 + L×0.25) / 500 words`
    63|- 0-2: PASS
    64|- 2-5: LOW
    65|- 5-10: MEDIUM
    66|- 10-18: HIGH
    67|- 18+: CRITICAL
    68|
    69|### Tiered Severity System
    70|- **Tier 1** (strongest AI signals): delve, tapestry, leverage, pivotal, groundbreaking, etc.
    71|- **Tier 2** (moderate): crucial, vibrant, foster, holistic, innovative, dynamic, etc.
    72|- **Tier 3** (transitions): furthermore, moreover, additionally, consequently, etc.
    73|
    74|## Stack
    75|
    76|- Next.js 16
    77|- React 19
    78|- Tailwind CSS 4
    79|- shadcn/ui
    80|- TypeScript
    81|
    82|## Run locally
    83|
    84|```bash
    85|git clone https://github.com/iyop666/slop-edge.git
    86|cd slop-edge
    87|npm install
    88|npm run dev
    89|```
    90|
    91|Open http://localhost:3000
    92|
    93|## Deploy
    94|
    95|[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/iyop666/slop-edge)
    96|
    97|## Credits
    98|
    99|Detection rules merged from:
   100|- [stop-slop](https://github.com/hardikpandya/stop-slop) by [Hardik Pandya](https://github.com/hardikpandya)
   101|- [claude-slop-detector](https://github.com/aplaceforallmystuff/claude-slop-detector)
   102|- [humanize-writing-skill](https://github.com/lguz/humanize-writing-skill)
   103|- [slop-cop](https://github.com/MahmoudHalat/slop-cop)
   104|
   105|## License
   106|
   107|MIT
   108|