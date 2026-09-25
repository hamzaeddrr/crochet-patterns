import { getOpenAI, contentModel } from "./openai";
import type { DesignSpec, PatternContent } from "@/types";
import { emptyLocalized } from "@/types";
import { slugify } from "@/lib/utils";

export async function generatePatternContent(
  prompt: string,
  spec: DesignSpec
): Promise<{ content: PatternContent; suggestedSlug: string }> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: contentModel(),
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert US-term crochet pattern writer.
Return ONLY JSON with this shape:
{
  "title_en": "string",
  "summary_en": "string",
  "seo_title_en": "string",
  "seo_description_en": "string",
  "abbreviations": [{"abbr":"sc","meaning":"single crochet"}, ...],
  "materials": {
    "yarn": ["..."],
    "hook": "3.5 mm",
    "notions": ["yarn needle","stuffing"],
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
  "finishing": ["step..."]
}

Rules:
- Use US crochet terms.
- Every round MUST include instructions, operations array, and accurate result stitch count.
- Stitch math must be consistent round to round.
- Include all components from the design specification.
- Prefer clear beginner-friendly wording when difficulty is beginner/easy.
- operations.type allowed: magic_ring, chain, sc, hdc, dc, slst, inc, dec, repeat, skip, join, fasten_off, blo, flo, turn, text
- For (sc, inc) x 6 use operations: [{"type":"repeat","repeat":6,"of":[{"type":"sc","stitches":1},{"type":"inc","repeat":1}]}]`,
      },
      {
        role: "user",
        content: `Original prompt:\n${prompt}\n\nDesign specification JSON:\n${JSON.stringify(spec, null, 2)}\n\nWrite the full crochet pattern.`,
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
      raw.seo_title_en || `${titleEn} Free Crochet Pattern`
    ),
    seoDescription: emptyLocalized(
      raw.seo_description_en ||
        `Crochet pattern for ${titleEn}. ${spec.difficulty} level.`
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
      yarn: [`${spec.yarn_weight || "worsted"} yarn in ${spec.colors.join(", ")}`],
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
