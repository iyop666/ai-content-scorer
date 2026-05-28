# AI Content Scorer

Paste your text. Get scored. Fix AI patterns.

## What is this?

AI Content Scorer analyzes your writing and detects common AI-generated patterns, structural cliches, and weak prose. It scores your text on 5 dimensions based on the [stop-slop](https://github.com/hardikpandya/stop-slop) framework by Hardik Pandya.

If you write blog posts, articles, or technical content, this tool tells you exactly what to fix before you publish.

## How it works

Paste your text and hit **Score It**. The tool runs regex-based analysis across 5 dimensions:

| Dimension | What it checks |
|-----------|---------------|
| **Directness** | Throat-clearing openers, passive voice, vague declaratives |
| **Rhythm** | Sentence length variation, em dashes, dramatic fragmentation, adverb overuse |
| **Trust** | Hedging, hand-holding, lazy extremes, permission-granting |
| **Authenticity** | Binary contrasts, rhetorical setups, narrator-from-a-distance, meta-commentary |
| **Density** | Sentence length, filler words, redundant phrases, business jargon |

Each dimension scores 1-10. Total score: 50.

**Score interpretation:**
- 40-50: Clean. Ready to publish.
- 30-39: Needs work. Check issues below.
- Below 30: Heavy AI patterns. Major revision needed.

## What gets flagged

- **Banned phrases** (29 patterns): "here's the thing", "let that sink in", "it turns out", "the uncomfortable truth is", etc.
- **Passive voice**: "is built", "was created", "are being used"
- **Common adverbs**: "really", "just", "literally", "genuinely", "honestly", "simply", "actually", etc.
- **-ly adverbs**: Any word ending in -ly not in the curated list
- **Structural cliches**: "not because X. because Y.", "the answer isn't X, it's Y"
- **Business jargon**: "game-changer", "deep dive", "circle back", "lean into", "navigate the landscape"
- **Filler words**: "very", "really", "just", "basically", "actually", "literally"
- **Redundant phrases**: "in order to", "due to the fact that", "at this point in time"

## Try it

**Load Sample** button shows a demo with intentionally bad AI-isms so you can see how the scoring works.

## Stack

- Next.js 15
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

Scoring logic based on [stop-slop](https://github.com/hardikpandya/stop-slop) by [Hardik Pandya](https://github.com/hardikpandya).

## License

MIT
