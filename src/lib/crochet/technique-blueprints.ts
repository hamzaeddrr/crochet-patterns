/**
 * Pedagogical blueprints for Loopcraft technique art.
 * Step counts follow real stitch motions (aligned with public SBS guides like DMC) —
 * original wording & checks only. Used for image prompts + automatic refine.
 */

import { TECHNIQUE_CATALOG } from "@/lib/crochet/technique-catalog";

export interface TechniquePanelBlueprint {
  /** Short English caption for the panel. */
  caption: string;
  /** What the learner is doing (prompt + QA). */
  action: string;
  /** Hard technical requirements the image MUST satisfy. */
  mustShow: string[];
  /** Common AI failure modes to reject. */
  rejectIf: string[];
}

export interface TechniqueBlueprint {
  key: string;
  title: string;
  tip: string;
  preferredCols: number;
  preferredRows: number;
  panels: TechniquePanelBlueprint[];
}

const COLOR = {
  mustBlue:
    "Active yarn for THIS motion drawn in bright instructional blue (#3b82f6)",
  mustApricot:
    "Established fabric / inactive yarn in soft apricot-tan (#d4a574)",
};

const BLUEPRINTS: Record<string, TechniqueBlueprint> = {
  chain: {
    key: "chain",
    title: "Chain",
    tip: "Foundation stitches and turning chains.",
    preferredCols: 4,
    preferredRows: 2,
    panels: [
      {
        caption: "Hold slip knot on hook",
        action: "Hook held with one clear slip-knot loop on the shaft; working yarn ready.",
        mustShow: [COLOR.mustApricot, "Exactly one loop on the hook"],
        rejectIf: ["Multiple chains already finished with no focus on start"],
      },
      {
        caption: "Yarn over",
        action: "Working yarn wraps over the hook clockwise.",
        mustShow: [COLOR.mustBlue + " on the yarn-over", "Starting loop still on shaft"],
        rejectIf: ["No yarn-over visible"],
      },
      {
        caption: "Catch the yarn",
        action: "Hook tip pulls through the slip knot, catching the wrap in the throat.",
        mustShow: [COLOR.mustBlue + " caught in hook throat", "Readable silver hook tip"],
        rejectIf: ["Hook floating away from yarn"],
      },
      {
        caption: "First chain made",
        action: "New loop on shaft; one chain V below the hook.",
        mustShow: ["Exactly one loop on hook", "One clear chain V below"],
        rejectIf: ["Tangled scribble with no chain V"],
      },
      {
        caption: "Yarn over again",
        action: "Same yarn-over for the next chain.",
        mustShow: [COLOR.mustBlue + " wrapping", "Prior chain still visible"],
        rejectIf: ["Camera angle drastically different"],
      },
      {
        caption: "Pull through again",
        action: "Second chain drawn through the loop on the hook.",
        mustShow: ["Two clear chain Vs", "One loop on hook"],
        rejectIf: ["Only one chain or a blob"],
      },
      {
        caption: "Two chains",
        action: "Two finished chain stitches sit below the active loop.",
        mustShow: ["Two distinct chain Vs", COLOR.mustApricot],
        rejectIf: ["Cannot count two separate chains"],
      },
      {
        caption: "Continue & count",
        action: "A short row of chain Vs; loop on hook visually separate from the count.",
        mustShow: [
          "Several chain Vs in a row",
          "Loop on hook clearly not counted as a chain",
        ],
        rejectIf: ["Counting the loop on the hook as a chain stitch"],
      },
    ],
  },
  magic_ring: {
    key: "magic_ring",
    title: "Magic ring",
    tip: "A tight center for amigurumi — no hole in the middle.",
    preferredCols: 3,
    preferredRows: 2,
    panels: [
      {
        caption: "Form a loop on fingers",
        action: "Yarn loop around index and middle fingers; short tail in the palm.",
        mustShow: [COLOR.mustApricot, "Open loop on fingers", "Distinct short tail"],
        rejectIf: ["Finished fabric circle already"],
      },
      {
        caption: "Insert, yarn over, pull up",
        action: "Hook enters the loop; blue yarn wraps and a loop is pulled through.",
        mustShow: [
          "Hook tip inside the ring opening",
          COLOR.mustBlue + " on the pull-up yarn",
        ],
        rejectIf: ["No visible ring opening", "Hook floating away"],
      },
      {
        caption: "Chain one",
        action: "Yarn over and pull through the loop on the hook (chain 1).",
        mustShow: [COLOR.mustBlue, "Exactly one loop remaining on the hook"],
        rejectIf: ["Multiple stitches already around the ring"],
      },
      {
        caption: "Work stitches into the ring",
        action: "An sc is worked into the still-open ring (insert, pull up, pull through both).",
        mustShow: [
          "Open ring still visible",
          "At least one clear stitch post / V around the ring",
          COLOR.mustBlue + " on active yarn",
        ],
        rejectIf: ["Generic ribs instead of stitch Vs", "Ring already fully closed"],
      },
      {
        caption: "Repeat to pattern count",
        action: "Several short stitches stand around the open ring.",
        mustShow: [
          "Open center still visible",
          "At least 3 distinct stitch tops around the ring",
        ],
        rejectIf: ["Center already sealed shut"],
      },
      {
        caption: "Join & pull the tail closed",
        action: "Hand pulls the short tail; center closes snug; loop remains on hook.",
        mustShow: [
          "Hand pulling the short tail",
          "Center hole closed or nearly closed",
          "Active loop still on the hook",
        ],
        rejectIf: ["Pulling working yarn with no tail distinction"],
      },
    ],
  },
  sc: {
    key: "sc",
    title: "Single crochet",
    tip: "The basic stitch for most amigurumi rounds.",
    preferredCols: 3,
    preferredRows: 2,
    panels: [
      {
        caption: "Insert under both loops",
        action: "Hook tip goes under both top loops (the V) of the next stitch.",
        mustShow: [
          COLOR.mustApricot,
          "Clear V on the target stitch",
          "Hook tip under BOTH loops",
          "One starting loop already on the hook",
        ],
        rejectIf: ["Hook only under one strand", "No identifiable stitch top"],
      },
      {
        caption: "Yarn over",
        action: "Working yarn wraps over the hook in instructional blue.",
        mustShow: [COLOR.mustBlue + " wrapped on the hook", "Hook still through the stitch"],
        rejectIf: ["No yarn-over"],
      },
      {
        caption: "Pull up a loop",
        action: "Blue yarn pulled through the stitch; exactly two loops on hook.",
        mustShow: [
          COLOR.mustBlue + " being drawn through",
          "Exactly two loops on the hook",
        ],
        rejectIf: ["One loop or three+ when two are required"],
      },
      {
        caption: "Yarn over again",
        action: "Second yarn-over in blue across the two loops.",
        mustShow: [COLOR.mustBlue, "Still two loops on hook"],
        rejectIf: ["Already finished stitch"],
      },
      {
        caption: "Pull through both loops",
        action: "Pull through both; one loop remains — short SC post complete.",
        mustShow: [
          "Exactly one loop remaining on the hook",
          "New stitch height matches a single crochet (short post)",
        ],
        rejectIf: ["Still two loops left", "Looks like a tall double-crochet post"],
      },
    ],
  },
  hdc: {
    key: "hdc",
    title: "Half double crochet",
    tip: "US hdc — UK half treble (htr).",
    preferredCols: 3,
    preferredRows: 1,
    panels: [
      {
        caption: "Yarn over and insert",
        action: "Blue yarn-over already on hook; tip inserts under both top loops.",
        mustShow: [
          COLOR.mustBlue + " yarn-over on hook",
          "Hook under both loops of the V",
        ],
        rejectIf: ["Inserting with no yarn-over"],
      },
      {
        caption: "Pull up a loop",
        action: "Pull up — exactly three loops on the hook.",
        mustShow: ["Exactly three loops on the hook", COLOR.mustBlue],
        rejectIf: ["Two or four loops"],
      },
      {
        caption: "Pull through all three",
        action: "Yarn over; pull through all three; one loop remains — medium-height hdc.",
        mustShow: [
          COLOR.mustBlue + " finishing yarn-over",
          "Exactly one loop on the hook",
          "Stitch taller than sc but shorter than dc",
        ],
        rejectIf: ["Multiple loops remaining"],
      },
    ],
  },
  dc: {
    key: "dc",
    title: "Double crochet",
    tip: "US double crochet — UK treble (tr).",
    preferredCols: 3,
    preferredRows: 2,
    panels: [
      {
        caption: "Yarn over",
        action: "Blue yarn-over before insert.",
        mustShow: [COLOR.mustBlue + " yarn-over on hook"],
        rejectIf: ["Inserting with no yarn-over"],
      },
      {
        caption: "Insert under both loops",
        action: "Hook under both top loops of the next V.",
        mustShow: ["Hook under both loops", "Prior YO still on shaft"],
        rejectIf: ["Random fabric pierce"],
      },
      {
        caption: "Yarn over and pull up",
        action: "Yarn over and pull up — exactly three loops on the hook.",
        mustShow: ["Exactly three loops on the hook", COLOR.mustBlue],
        rejectIf: ["Wrong loop count"],
      },
      {
        caption: "Pull through first two",
        action: "Yarn over; pull through first two only — two loops remain.",
        mustShow: ["Exactly two loops remaining", COLOR.mustBlue],
        rejectIf: ["Pulled through all three at once"],
      },
      {
        caption: "Yarn over again",
        action: "Final blue yarn-over with two loops on the hook.",
        mustShow: [COLOR.mustBlue, "Two loops on hook"],
        rejectIf: ["No yarn-over"],
      },
      {
        caption: "Pull through last two",
        action: "Pull through last two — tall dc post; one loop remains.",
        mustShow: [
          "Exactly one loop on the hook",
          "Tall post matching double crochet height",
        ],
        rejectIf: ["Short sc-height stitch", "Two loops still left"],
      },
    ],
  },
  inc: {
    key: "inc",
    title: "Increase",
    tip: "Two stitches in the same place — the fabric grows.",
    preferredCols: 2,
    preferredRows: 2,
    panels: [
      {
        caption: "Start in one stitch",
        action: "Identify one target stitch V where two SC will go.",
        mustShow: [
          "One clear target stitch V highlighted by hook approach",
          COLOR.mustApricot,
        ],
        rejectIf: ["No identifiable stitch to work into"],
      },
      {
        caption: "Work the first sc",
        action: "Complete one single crochet into that stitch.",
        mustShow: [
          "One finished short stitch in the target place",
          "One loop on hook",
          COLOR.mustBlue + " on active yarn during the stitch",
        ],
        rejectIf: ["Two stitches already complete"],
      },
      {
        caption: "Work a second sc in the same stitch",
        action: "Hook re-enters the SAME stitch V for a second SC.",
        mustShow: [
          "Hook entering the same stitch as the first SC",
          "First SC still visible beside the hook",
        ],
        rejectIf: ["Hook clearly in a different neighboring stitch"],
      },
      {
        caption: "Two stitches from one",
        action: "Two complete SC sit in one base stitch.",
        mustShow: [
          "Two distinct stitch tops sharing one base",
          "One loop on hook",
        ],
        rejectIf: ["Only one stitch visible"],
      },
    ],
  },
  dec: {
    key: "dec",
    title: "Decrease",
    tip: "Two stitches become one — the fabric narrows.",
    preferredCols: 3,
    preferredRows: 1,
    panels: [
      {
        caption: "Loop from first stitch",
        action: "Hook inserts in stitch 1 and pulls up a loop (2 loops on hook).",
        mustShow: ["Hook through first stitch", "Two loops on hook", COLOR.mustBlue],
        rejectIf: ["Three loops already"],
      },
      {
        caption: "Loop from next",
        action: "Hook inserts in stitch 2 and pulls up another loop (3 loops on hook).",
        mustShow: [
          "Two adjacent stitches involved",
          "Exactly three loops on the hook",
        ],
        rejectIf: ["Still only two loops"],
      },
      {
        caption: "Pull through all",
        action: "Yarn over; pull through all three; one loop remains.",
        mustShow: [
          COLOR.mustBlue + " yarn-over",
          "Exactly one loop left on hook",
          "Two bases joined into one stitch top",
        ],
        rejectIf: ["Multiple loops remaining"],
      },
    ],
  },
  fo: {
    key: "fo",
    title: "Fasten off",
    tip: "Secure the last stitch so the work does not unravel.",
    preferredCols: 3,
    preferredRows: 1,
    panels: [
      {
        caption: "Cut yarn, leaving a tail",
        action: "Scissors cut working yarn; long enough tail remains.",
        mustShow: [
          "Cut end / scissors or clearly severed yarn",
          "Tail length visible",
          "Last loop still on hook",
        ],
        rejectIf: ["No cut / continuous ball yarn only"],
      },
      {
        caption: "Yarn over and pull the tail through",
        action: "Hook pulls the cut tail entirely through the last loop.",
        mustShow: [
          COLOR.mustBlue + " on the tail being pulled through",
          "Tail passing through the final loop",
        ],
        rejectIf: ["Tail not going through a loop"],
      },
      {
        caption: "Tighten — then weave in the end",
        action: "Knot closes; tail woven into wrong side of fabric.",
        mustShow: [
          "Closed last stitch / no open loop on hook",
          "Tail being woven or tucked into fabric",
          COLOR.mustApricot,
        ],
        rejectIf: ["Open loop still on hook as if mid-stitch"],
      },
    ],
  },
};

export function getTechniqueBlueprint(
  key: string
): TechniqueBlueprint | undefined {
  if (BLUEPRINTS[key]) return BLUEPRINTS[key];
  const c = TECHNIQUE_CATALOG.find((t) => t.key === key);
  if (!c) return undefined;
  return {
    key: c.key,
    title: c.title.en,
    tip: c.tip.en,
    preferredCols: c.sheetCols,
    preferredRows: c.sheetRows,
    panels: c.steps.map((s) => ({
      caption: s.caption.en,
      action: s.body.en,
      mustShow: [
        `Clearly illustrate: ${s.caption.en}`,
        COLOR.mustBlue + " for the active yarn of this step",
        COLOR.mustApricot + " for established fabric",
        "Readable silver hook tip and yarn path",
        "Plausible hand pose for this motion",
      ],
      rejectIf: [
        "Unreadable scribble of yarn",
        "Wrong number of loops on the hook for this step",
        "Hook floating with no connection to the fabric or ring",
        "All yarn the same color with no blue active-yarn highlight",
      ],
    })),
  };
}

export function listTechniqueBlueprints(): TechniqueBlueprint[] {
  const keys = new Set([
    ...Object.keys(BLUEPRINTS),
    ...TECHNIQUE_CATALOG.map((c) => c.key),
  ]);
  return [...keys]
    .map((k) => getTechniqueBlueprint(k))
    .filter((b): b is TechniqueBlueprint => Boolean(b));
}

/** Build a strict image-prompt block from a blueprint. */
export function blueprintToPromptPanels(bp: TechniqueBlueprint): string {
  return bp.panels
    .map((p, i) => {
      const must = p.mustShow.map((m) => `  - MUST: ${m}`).join("\n");
      const reject = p.rejectIf.map((r) => `  - NEVER: ${r}`).join("\n");
      return [
        `Panel ${i + 1} — ${p.caption}`,
        `Action: ${p.action}`,
        must,
        reject,
      ].join("\n");
    })
    .join("\n\n");
}
