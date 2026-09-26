import { chatCompletion } from "./openai";
import type { DesignSpec, PatternContent } from "@/types";
import { emptyLocalized } from "@/types";
import { slugify } from "@/lib/utils";

export async function generatePatternContent(
  prompt: string,
  spec: DesignSpec
): Promise<{ content: PatternContent; suggestedSlug: string }> {
  const completion = await chatCompletion({
    temperature: 0.25,
    usageLabel: "pattern-content",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert US-term crochet pattern writer for a premium paid pattern shop.
Return ONLY JSON:
{
  "title_en": "string",
  "summary_en": "2-3 sentence shop summary",
  "seo_title_en": "SEO title under 60 chars",
  "seo_description_en": "SEO meta under 155 chars",
  "abbreviations": [{"abbr":"sc","meaning":"single crochet"}],
  "materials": {
    "yarn": ["brand/weight/color with yardage estimate"],
    "hook": "3.5 mm",
    "notions": ["yarn needle","stuffing","stitch marker"],
    "gauge": "optional"
  },
  "components": [
    {
      "id": "body",
      "name": "Body",
      "construction": "amigurumi",
      "make": 1,
      "rounds": [
        {
          "round": 1,
          "instructions": "6 sc in MR (6)",
          "operations": [{"type":"magic_ring","stitches":6}],
          "result": 6
        }
      ],
      "notes": "optional"
    }
  ],
  "assembly": ["step..."],
  "finishing": ["weave ends", "..."]
}

Rules:
- US crochet terms only in instructions.
- Every crochet round/row MUST include instructions, operations[], and accurate numeric result (active stitch count on that piece).
- The number in parentheses at the end of instructions MUST equal "result". Write the count once only, e.g. "inc x6 (12)" not "(12) (12)".
- operations MUST mathematically produce the same "result". If a step is embroidery, appliqué loops, or hard to encode, use operations: [{"type":"text","text":"..."}] and set result to 0 for non-stitch steps.
- After "fasten off", result may be 0; include {"type":"fasten_off"}. Put FO as its own final stitch step of the piece (result 0).
- For foundation rows (ch N, sc across), result is stitches worked (usually N-1), NOT ch + sc. These are ROWS (construction: "flat"), never call them rounds.
- Flat / row-worked pieces (panels, masks, beaks, straps, flaps): construction "flat"; include turn; number them as rows in your reasoning. Circular / magic-ring pieces: construction "amigurumi" or "in-the-round".
- Stitch math must be consistent round-to-round for amigurumi bodies.
- Do NOT put "make N" in the component name when make is already a field — name is "Wings (teal)", make: 2.
- NON-STITCH OPERATIONS (critical): drawstring chains, hanging loops, cords, embroidery, safety-eye placement, fabric cuts are NOT stitch rounds/rows.
  - Never give them a stitch count like (30) or (15). Always result: 0 and operations: [{"type":"text","text":"..."}].
  - Prefer AFTER fasten off of the piece, as a separate note round OR a separate detail component named "Drawstring" / "Hanging loop".
  - Example pouch: Rnds keep count at 18; FO; then a note step "ch 30 for drawstring" with result 0 — do NOT write "Rnd 8 — ch 30 (30)".
  - Example mask: Rows stay at 12 sts; FO; then "ch 15 for hanging loop" with result 0 — do NOT write "Row 5 — ch 15 (15)".
- ASSEMBLY is never a crochet round. Put assembly text only in the top-level "assembly" array. Do NOT create a component named "Assembly" with "Rnd 1 — Assemble pieces…".
- Eye details / embroidery: either "finishing" / "assembly" arrays, OR a note component with construction "note" and result 0 rounds — never fake Rnd tables with stitch counts.
- Prefer clear beginner wording when difficulty is beginner/easy.
- Include ALL crocheted components from the design specification with enough rounds/rows to form the shape. Do not invent crochet rounds for assembly/embroidery.
- operations.type: magic_ring, chain, sc, hdc, dc, slst, inc, dec, repeat, skip, join, fasten_off, blo, flo, turn, text
- For (sc, inc) x 6 use: [{"type":"repeat","repeat":6,"of":[{"type":"sc","stitches":1},{"type":"inc","repeat":1}]}]
- Assembly and finishing must be concrete shop-quality steps. Do not number steps yourself with "1." prefixes if avoidable.`,
      },
      {
        role: "user",
        content: `Original prompt:\n${prompt}\n\nDesign specification JSON:\n${JSON.stringify(spec, null, 2)}\n\nWrite the full professional crochet pattern.`,
      },
    ],
  });

  const raw = JSON.parse(completion.choices[0]?.message?.content || "{}") as {
    title_en?: string;
    summary_en?: string;
    seo_title_en?: string;
    seo_description_en?: string;
    abbreviations?: PatternContent["abbreviations"];
    materials?: PatternContent["materials"];
    components?: PatternContent["components"];
    assembly?: string[];
    finishing?: string[];
  };

  const titleEn = raw.title_en || spec.object.replace(/_/g, " ");
  const content: PatternContent = {
    title: emptyLocalized(titleEn),
    summary: emptyLocalized(raw.summary_en || prompt),
    seoTitle: emptyLocalized(
      raw.seo_title_en || `${titleEn} Crochet Pattern`
    ),
    seoDescription: emptyLocalized(
      raw.seo_description_en ||
        `Premium crochet pattern for ${titleEn}. ${spec.difficulty} level.`
    ),
    abbreviations: raw.abbreviations?.length
      ? raw.abbreviations
      : [
          { abbr: "MR", meaning: "magic ring" },
          { abbr: "sc", meaning: "single crochet" },
          { abbr: "inc", meaning: "increase (2 sc in same stitch)" },
          { abbr: "dec", meaning: "decrease (sc2tog)" },
          { abbr: "sl st", meaning: "slip stitch" },
          { abbr: "ch", meaning: "chain" },
          { abbr: "FO", meaning: "fasten off" },
        ],
    materials: raw.materials || {
      yarn: [
        `${spec.yarn_weight || "worsted"} yarn in ${spec.colors.join(", ")}`,
      ],
      hook: `${spec.hook_mm || "4.0"} mm`,
      notions: ["yarn needle", "scissors", "stitch marker"],
    },
    components: (raw.components || []).map((c, i) => ({
      ...c,
      id: c.id || `part-${i + 1}`,
      rounds: (c.rounds || []).map((r) => ({
        ...r,
        operations: r.operations || [],
        result: typeof r.result === "number" ? r.result : 0,
      })),
    })),
    assembly: raw.assembly || [],
    finishing: raw.finishing || [],
  };

  return {
    content,
    suggestedSlug: slugify(titleEn),
  };
}
