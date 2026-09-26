/**
 * Pedagogical blueprints for Loopcraft technique art.
 * Structure inspired by brand step-guides (e.g. DMC SBS) — original wording & checks.
 * Used for image prompts + automatic refine. Not a copy of any third-party art.
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

const BLUEPRINTS: Record<string, TechniqueBlueprint> = {
  magic_ring: {
    key: "magic_ring",
    title: "Magic ring",
    tip: "A tight center for amigurumi — no hole in the middle.",
    preferredCols: 2,
    preferredRows: 2,
    panels: [
      {
        caption: "Make a loop with the yarn",
        action:
          "Left hand forms an open yarn ring; short tail hangs free; working yarn over the index finger.",
        mustShow: [
          "Clear closed yarn loop / ring held by fingers",
          "Distinct short yarn tail separate from working yarn",
          "No crochet hook yet (or hook not inserted)",
        ],
        rejectIf: [
          "Finished fabric or closed stitch circle already",
          "Hook piercing yarn with no visible ring",
        ],
      },
      {
        caption: "Insert hook into the ring",
        action:
          "Hook tip enters through the center of the yarn ring; yarn-over ready; one working loop path visible.",
        mustShow: [
          "Silver hook tip clearly inside / through the ring opening",
          "Yarn ring still open and visible around the hook shaft or tip",
          "Working yarn approach for yarn-over is readable",
        ],
        rejectIf: [
          "Hook floating away from the ring",
          "No visible ring opening",
          "Hook merged into a solid blob of yarn",
        ],
      },
      {
        caption: "Work stitches into the ring",
        action:
          "Several single-crochet-like stitches stand around the open ring; active loop on the hook.",
        mustShow: [
          "Open ring still visible in the center",
          "At least 3 distinct stitch posts / V-shaped tops around the ring",
          "Exactly one clear active loop on the hook neck",
          "Hook entering under both top loops of a stitch or into the ring for the next stitch",
        ],
        rejectIf: [
          "Generic ribs or gear teeth instead of stitch Vs",
          "Zero loops or a messy scribble on the hook",
          "Ring already fully closed with no center opening",
        ],
      },
      {
        caption: "Pull the tail to close the ring",
        action:
          "Hand pulls the short tail; center closes snug; stitches gather; loop remains on hook.",
        mustShow: [
          "Hand clearly pulling the short tail",
          "Center hole much smaller / closed vs previous panel",
          "Active loop still on the hook",
        ],
        rejectIf: [
          "Pulling the working yarn instead of the tail with no distinction",
          "Fabric looks unrelated to prior panels",
        ],
      },
    ],
  },
  sc: {
    key: "sc",
    title: "Single crochet",
    tip: "The basic stitch for most amigurumi rounds.",
    preferredCols: 3,
    preferredRows: 1,
    panels: [
      {
        caption: "Insert hook under both loops",
        action: "Hook tip goes under both top loops (the V) of the next stitch.",
        mustShow: [
          "Previous stitch shows a clear V (two top loops)",
          "Hook tip under BOTH loops of that V",
          "One loop already on the hook shaft before insert (starting loop)",
        ],
        rejectIf: [
          "Hook only under one strand with no V visible",
          "Hook stabbing the middle of fabric randomly",
        ],
      },
      {
        caption: "Yarn over and pull up a loop",
        action: "Yarn wrapped over hook; hook pulls a new loop through the stitch; two loops on hook.",
        mustShow: [
          "Yarn over clearly wrapped on the hook",
          "Exactly two loops visible on the hook after the pull-up",
        ],
        rejectIf: [
          "One loop or three+ loops when two are required",
          "No yarn-over visible",
        ],
      },
      {
        caption: "Yarn over and pull through both loops",
        action: "Second yarn over; hook pulls through both loops; one loop remains — SC complete.",
        mustShow: [
          "Yarn over present",
          "Exactly one loop remaining on the hook at the end",
          "New stitch height matches a single crochet (short post)",
        ],
        rejectIf: [
          "Still two loops left on the hook",
          "Looks like a tall double-crochet post",
        ],
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
        ],
        rejectIf: ["No identifiable stitch to work into"],
      },
      {
        caption: "Work the first sc",
        action: "Complete one single crochet into that stitch.",
        mustShow: [
          "One finished short stitch in the target place",
          "One loop on hook",
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
        rejectIf: [
          "Hook clearly in a different neighboring stitch",
        ],
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
        caption: "Pull up a loop from first stitch",
        action: "Hook inserts in stitch 1 and pulls up a loop (2 loops on hook).",
        mustShow: [
          "Hook through first stitch",
          "Two loops on hook",
        ],
        rejectIf: ["Three loops already"],
      },
      {
        caption: "Pull up a loop from next stitch",
        action: "Hook inserts in stitch 2 and pulls up another loop (3 loops on hook).",
        mustShow: [
          "Two adjacent stitches involved",
          "Exactly three loops on the hook",
        ],
        rejectIf: [
          "Still only two loops",
          "Loops look like a tangled mess with no count",
        ],
      },
      {
        caption: "Yarn over and pull through all loops",
        action: "Yarn over; pull through all three; one loop remains.",
        mustShow: [
          "Yarn over",
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
          "Tail passing through the final loop",
          "Hook involved in pulling the tail",
        ],
        rejectIf: ["Tail not going through a loop"],
      },
      {
        caption: "Tighten — then weave in the end",
        action: "Knot closes; tail woven into wrong side of fabric.",
        mustShow: [
          "Closed last stitch / no open loop on hook",
          "Tail being woven or tucked into fabric",
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
        "Readable silver hook tip and yarn path",
        "Plausible hand pose for this motion",
      ],
      rejectIf: [
        "Unreadable scribble of yarn",
        "Wrong number of loops on the hook for this step",
        "Hook floating with no connection to the fabric or ring",
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
