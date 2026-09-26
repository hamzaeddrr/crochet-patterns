import { emptyLocalized } from "@/types";
import type { Technique, TechniqueStep } from "@/types/techniques";

/**
 * Full Loopcraft stitch library topics (US crochet terms).
 * Topic coverage inspired by public brand stitch guides (e.g. DMC SBS index) —
 * original Loopcraft wording only; no third-party art or copied text.
 */

function L(en: string, fr: string, es: string) {
  return { en, fr, es };
}

function step(
  caption: [string, string, string],
  body: [string, string, string]
): TechniqueStep {
  return {
    caption: L(...caption),
    body: L(...body),
  };
}

export interface CatalogTechnique {
  id: string;
  slug: string;
  key: string;
  sortOrder: number;
  title: ReturnType<typeof L>;
  tip: ReturnType<typeof L>;
  sheetCols: number;
  sheetRows: number;
  steps: TechniqueStep[];
  /** Studio auto-detect when this op/text appears. */
  detect?: {
    ops?: string[];
    pattern?: RegExp;
  };
}

/** Complete beginner → advanced technique list for /learn + studio. */
export const TECHNIQUE_CATALOG: CatalogTechnique[] = [
  {
    id: "tech-slip-knot",
    slug: "slip-knot",
    key: "slip_knot",
    sortOrder: 10,
    title: L("Slip knot", "Noeud coulant", "Nudo corredizo"),
    tip: L(
      "The first loop on your hook before you start chaining.",
      "La première boucle sur le crochet avant de commencer.",
      "El primer bucle en el ganchillo antes de empezar."
    ),
    sheetCols: 2,
    sheetRows: 2,
    steps: [
      step(
        ["Make a loop", "Formez une boucle", "Haz un lazo"],
        [
          "Make a loop at the yarn end; cross the tail behind the working yarn.",
          "Faites une boucle ; croisez la queue derrière le fil qui travaille.",
          "Haz un lazo; cruza la cola detrás del hilo de trabajo.",
        ]
      ),
      step(
        ["Pull yarn through", "Tirez le fil", "Pasa el hilo"],
        [
          "Pull the working yarn up through the loop.",
          "Tirez le fil qui travaille à travers la boucle.",
          "Pasa el hilo de trabajo por el lazo.",
        ]
      ),
      step(
        ["Place on hook", "Placez sur le crochet", "Pon en el ganchillo"],
        [
          "Slip the new loop onto your hook.",
          "Glissez la nouvelle boucle sur le crochet.",
          "Desliza el nuevo bucle en el ganchillo.",
        ]
      ),
      step(
        ["Tighten gently", "Serrez doucement", "Ajusta con suavidad"],
        [
          "Pull the tail to snug the knot — it should slide on the hook.",
          "Tirez la queue pour serrer — le nœud doit coulisser.",
          "Tira de la cola para ajustar — debe deslizar en el ganchillo.",
        ]
      ),
    ],
  },
  {
    id: "tech-chain",
    slug: "chain",
    key: "chain",
    sortOrder: 20,
    title: L("Chain (ch)", "Maille chaînette (ml)", "Cadeneta (cad)"),
    tip: L(
      "Foundation stitches and turning chains.",
      "Base des ouvrages et mailles tournantes.",
      "Base de la labor y cadenas de subida.",
    ),
    sheetCols: 4,
    sheetRows: 2,
    detect: { ops: ["chain"], pattern: /\b(ch|chain)\b/i },
    steps: [
      step(
        ["Hold slip knot on hook", "Nœud coulant en main", "Nudo en el ganchillo"],
        [
          "Hold the hook with the slip knot in your right hand; working yarn in your left.",
          "Tenez le crochet avec le nœud coulant ; fil qui travaille à gauche.",
          "Sostén el ganchillo con el nudo; hilo de trabajo a la izquierda.",
        ]
      ),
      step(
        ["Yarn over", "Faites un jeté", "Haz hebra"],
        [
          "Wrap the yarn over the hook clockwise.",
          "Enroulez le fil sur le crochet dans le sens horaire.",
          "Envuelve el hilo sobre el ganchillo en sentido horario.",
        ]
      ),
      step(
        ["Catch the yarn", "Attrapez le fil", "Atrapa el hilo"],
        [
          "Pull the hook through the slip-knot loop, catching the wrap in the groove.",
          "Tirez le crochet hors du nœud en attrapant le jeté dans la gorge.",
          "Saca el ganchillo del nudo atrapando la hebra en la garganta.",
        ]
      ),
      step(
        ["First chain made", "1re ml faite", "1.ª cadeneta"],
        [
          "Slide the new loop onto the shaft — one chain stitch made.",
          "Glissez la boucle sur le fût — une ml.",
          "Desliza el bucle en el fuste — una cadeneta.",
        ]
      ),
      step(
        ["Yarn over again", "Nouveau jeté", "Otra hebra"],
        [
          "Wrap the yarn over the hook the same way.",
          "Refaites un jeté de la même façon.",
          "Haz hebra otra vez igual.",
        ]
      ),
      step(
        ["Pull through again", "Tirez encore", "Pasa otra vez"],
        [
          "Catch the wrap and pull through the loop on the hook.",
          "Attrapez le jeté et tirez à travers la boucle.",
          "Atrapa la hebra y pasa por el bucle.",
        ]
      ),
      step(
        ["Two chains", "Deux ml", "Dos cadenetas"],
        [
          "You now have two chain stitches below the loop on the hook.",
          "Vous avez deux ml sous la boucle du crochet.",
          "Tienes dos cadenetas bajo el bucle del ganchillo.",
        ]
      ),
      step(
        ["Continue & count", "Continuez et comptez", "Sigue y cuenta"],
        [
          "Repeat until you have enough chains. The loop on the hook does not count.",
          "Répétez jusqu’au bon nombre. La boucle sur le crochet ne compte pas.",
          "Repite hasta tener las suficientes. El bucle del ganchillo no cuenta.",
        ]
      ),
    ],
  },
  {
    id: "tech-triple-chain",
    slug: "triple-chain",
    key: "triple_chain",
    sortOrder: 25,
    title: L("Triple chain", "Chaînette triple", "Cadeneta triple"),
    tip: L(
      "A taller starting chain used before some tall stitches.",
      "Chaînette plus haute avant certains points longs.",
      "Cadeneta más alta antes de puntos largos.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Yarn over twice", "Deux jetés", "Dos hebras"],
        [
          "With a loop on the hook, yarn over twice.",
          "Avec une boucle sur le crochet, faites deux jetés.",
          "Con un bucle en el ganchillo, haz dos hebras.",
        ]
      ),
      step(
        ["Pull through", "Tirez à travers", "Pasa"],
        [
          "Pull through the loop on the hook to form the tall chain.",
          "Passez à travers la boucle pour la chaînette haute.",
          "Pasa por el bucle para la cadeneta alta.",
        ]
      ),
      step(
        ["Use as turning chain", "Maille tournante", "Cadena de subida"],
        [
          "Often counts as the first tall stitch — follow your pattern.",
          "Compte souvent comme le 1er point long — suivez le modèle.",
          "A menudo cuenta como el 1.er punto largo — sigue el patrón.",
        ]
      ),
    ],
  },
  {
    id: "tech-slst",
    slug: "slip-stitch",
    key: "slst",
    sortOrder: 30,
    title: L("Slip stitch (sl st)", "Maille coulée (mc)", "Punto enano (pe)"),
    tip: L(
      "Join rounds, move across stitches, or finish neatly.",
      "Joindre les tours, avancer, ou finir proprement.",
      "Unir vueltas, avanzar o terminar con limpieza.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { ops: ["slst", "join"], pattern: /\b(sl\s*st|slip\s*st)\b/i },
    steps: [
      step(
        ["Insert hook", "Piquez", "Introduce"],
        [
          "Insert the hook into the next stitch (under both top loops).",
          "Piquez dans la maille suivante (sous les deux brins).",
          "Introduce en el siguiente punto (bajo ambos bucles).",
        ]
      ),
      step(
        ["Yarn over", "Jeté", "Hebra"],
        [
          "Yarn over — wrap the working yarn on the hook.",
          "Faites un jeté — enroulez le fil qui travaille.",
          "Haz hebra — envuelve el hilo de trabajo.",
        ]
      ),
      step(
        ["Pull through both", "Passez les deux", "Pasa por ambos"],
        [
          "Pull through the stitch and the loop on the hook in one go — one loop remains.",
          "Passez d’un coup la maille et la boucle — une boucle reste.",
          "Pasa de una por el punto y el bucle — queda un bucle.",
        ]
      ),
    ],
  },
  {
    id: "tech-join-ring",
    slug: "join-to-ring",
    key: "join_ring",
    sortOrder: 40,
    title: L(
      "Join with slip stitch to make a ring",
      "Anneau de chaînettes",
      "Anillo de cadenetas"
    ),
    tip: L(
      "Join a short chain into a circle (leaves a small center hole).",
      "Fermez une chaînette en cercle (petit trou au centre).",
      "Cierra una cadeneta en círculo (queda un hueco).",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Chain the start", "Faites des ml", "Haz cadenetas"],
        [
          "Work the chains listed in the pattern (often 4–6).",
          "Faites le nombre de ml indiqué (souvent 4–6).",
          "Haz las cadenetas indicadas (suele ser 4–6).",
        ]
      ),
      step(
        ["Insert in first chain", "Piquez dans la 1re", "Introduce en la 1.ª"],
        [
          "Insert the hook into the first chain.",
          "Piquez dans la première ml.",
          "Introduce en la primera cadeneta.",
        ]
      ),
      step(
        ["Slip stitch to join", "Mc pour fermer", "Pe para cerrar"],
        [
          "Slip stitch to join into a ring.",
          "Faites une mc pour former l’anneau.",
          "Haz un pe para formar el anillo.",
        ]
      ),
    ],
  },
  {
    id: "tech-magic-ring",
    slug: "magic-ring",
    key: "magic_ring",
    sortOrder: 50,
    title: L("Magic ring", "Anneau magique", "Anillo mágico"),
    tip: L(
      "A tight center for amigurumi — no hole in the middle.",
      "Un centre bien fermé pour l’amigurumi.",
      "Un centro cerrado para amigurumi.",
    ),
    sheetCols: 3,
    sheetRows: 2,
    detect: { ops: ["magic_ring"], pattern: /\b(mr|magic\s*ring)\b/i },
    steps: [
      step(
        ["Form a loop on fingers", "Boucle sur les doigts", "Lazo en los dedos"],
        [
          "With the tail in your palm, wrap yarn around index and middle fingers into a loop.",
          "Queue dans la paume, enroulez le fil autour de l’index et du majeur.",
          "Con la cola en la palma, enrolla el hilo en índice y medio.",
        ]
      ),
      step(
        ["Insert, yarn over, pull up", "Piquez, jeté, tirez", "Introduce, hebra, saca"],
        [
          "Hold the overlap; insert the hook into the loop, yarn over, and pull through.",
          "Tenez le croisement ; piquez dans la boucle, jeté, tirez à travers.",
          "Sostén el cruce; introduce en el lazo, hebra y saca.",
        ]
      ),
      step(
        ["Chain one", "1 ml", "1 cad"],
        [
          "Yarn over and pull through the loop on the hook — one chain to lock the start.",
          "Jeté et passez la boucle — 1 ml pour fixer.",
          "Hebra y pasa por el bucle — 1 cad para fijar.",
        ]
      ),
      step(
        ["Work stitches into the ring", "Mailles dans l’anneau", "Puntos en el anillo"],
        [
          "Insert into the ring, yarn over, pull up, yarn over, pull through both (one sc).",
          "Piquez dans l’anneau, jeté, tirez, jeté, passez les 2 (1 ms).",
          "Introduce en el anillo, hebra, saca, hebra, pasa por 2 (1 pb).",
        ]
      ),
      step(
        ["Repeat to pattern count", "Répétez le nombre", "Repite hasta el número"],
        [
          "Repeat into the ring until you have the stitch count from your pattern.",
          "Répétez dans l’anneau jusqu’au nombre du modèle.",
          "Repite en el anillo hasta el número del patrón.",
        ]
      ),
      step(
        ["Join & pull the tail closed", "Joignez et fermez", "Une y cierra"],
        [
          "Slip stitch to join if needed, then pull the short tail to close the center hole.",
          "Mc pour joindre si besoin, puis tirez la courte queue pour fermer le centre.",
          "Pe para unir si hace falta; tira de la cola corta para cerrar el centro.",
        ]
      ),
    ],
  },
  {
    id: "tech-sc",
    slug: "single-crochet",
    key: "sc",
    sortOrder: 60,
    title: L("Single crochet (sc)", "Maille serrée (ms)", "Punto bajo (pb)"),
    tip: L(
      "US single crochet — UK double crochet (dc).",
      "US : ms — UK : double crochet (dc).",
      "EE.UU.: pb — Reino Unido: double crochet (dc).",
    ),
    sheetCols: 3,
    sheetRows: 2,
    detect: { ops: ["sc"], pattern: /\bsc\b/i },
    steps: [
      step(
        ["Insert under both loops", "Piquez sous les 2 brins", "Bajo ambos bucles"],
        [
          "Insert under both top loops (the V) of the next stitch.",
          "Piquez sous les deux brins du V de la maille suivante.",
          "Introduce bajo ambos bucles (la V) del siguiente punto.",
        ]
      ),
      step(
        ["Yarn over", "Faites un jeté", "Haz hebra"],
        [
          "Wrap the yarn over the hook clockwise.",
          "Enroulez le fil sur le crochet dans le sens horaire.",
          "Envuelve el hilo sobre el ganchillo en sentido horario.",
        ]
      ),
      step(
        ["Pull up a loop", "Tirez une boucle", "Saca un bucle"],
        [
          "Pull the hook back through the stitch, catching the wrap — 2 loops on hook.",
          "Tirez à travers la maille en attrapant le jeté — 2 boucles.",
          "Saca el ganchillo por el punto atrapando la hebra — 2 bucles.",
        ]
      ),
      step(
        ["Yarn over again", "Nouveau jeté", "Otra hebra"],
        [
          "Yarn over once more — you still have 2 loops on the hook.",
          "Refaites un jeté — toujours 2 boucles sur le crochet.",
          "Haz hebra otra vez — siguen 2 bucles en el ganchillo.",
        ]
      ),
      step(
        ["Pull through both loops", "Passez les 2", "Pasa por ambos"],
        [
          "Pull through both loops — one single crochet made; 1 loop remains.",
          "Passez les deux — 1 ms ; 1 boucle reste.",
          "Pasa por ambos — 1 pb; queda 1 bucle.",
        ]
      ),
    ],
  },
  {
    id: "tech-sc-ring",
    slug: "single-crochet-into-ring",
    key: "sc_into_ring",
    sortOrder: 70,
    title: L(
      "Single crochet into a ring",
      "Maille serrée dans un anneau",
      "Punto bajo en un anillo"
    ),
    tip: L(
      "Work sc into a magic ring or chain ring.",
      "Travaillez des ms dans un anneau magique ou de ml.",
      "Teje pb en anillo mágico o de cadenetas.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Hold the ring", "Tenez l’anneau", "Sostén el anillo"],
        [
          "Keep the ring open with your fingers.",
          "Gardez l’anneau ouvert.",
          "Mantén el anillo abierto.",
        ]
      ),
      step(
        ["Insert into ring", "Piquez dans l’anneau", "Introduce en el anillo"],
        [
          "Insert the hook into the ring (not into a chain stitch unless told).",
          "Piquez dans l’anneau.",
          "Introduce en el anillo.",
        ]
      ),
      step(
        ["Complete the sc", "Terminez la ms", "Completa el pb"],
        [
          "Yarn over, pull up, yarn over, pull through both loops.",
          "Jeté, tirez, jeté, passez les deux.",
          "Hebra, saca, hebra, pasa por ambos.",
        ]
      ),
    ],
  },
  {
    id: "tech-hdc",
    slug: "half-double-crochet",
    key: "hdc",
    sortOrder: 80,
    title: L(
      "Half double crochet (hdc)",
      "Demi-bride (db)",
      "Medio punto alto (mpa)"
    ),
    tip: L(
      "US hdc — UK half treble (htr).",
      "US : db — UK : half treble (htr).",
      "EE.UU.: mpa — Reino Unido: half treble (htr).",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { ops: ["hdc"], pattern: /\bhdc\b/i },
    steps: [
      step(
        ["Yarn over and insert", "Jeté puis piquez", "Hebra e introduce"],
        [
          "Yarn over, then insert under both top loops of the next stitch.",
          "Faites un jeté, puis piquez sous les deux brins.",
          "Haz hebra e introduce bajo ambos bucles.",
        ]
      ),
      step(
        ["Pull up a loop", "Tirez une boucle", "Saca un bucle"],
        [
          "Yarn over and pull up through the stitch — 3 loops on the hook.",
          "Jeté et tirez à travers — 3 boucles sur le crochet.",
          "Hebra y saca por el punto — 3 bucles en el ganchillo.",
        ]
      ),
      step(
        ["Pull through all three", "Passez les 3", "Pasa por los 3"],
        [
          "Yarn over and pull through all three loops — one hdc made.",
          "Jeté et passez les trois — 1 db.",
          "Hebra y pasa por los tres — 1 mpa.",
        ]
      ),
    ],
  },
  {
    id: "tech-fsc",
    slug: "foundation-single-crochet",
    key: "fsc",
    sortOrder: 65,
    title: L(
      "Foundation single crochet (FSC)",
      "Maille serrée de fondation (FSC)",
      "Punto bajo de base (FSC)"
    ),
    tip: L(
      "Chain and single crochet in one pass — stretchy foundation row.",
      "Chaînette + ms en une passe — base élastique.",
      "Cadeneta + pb a la vez — base elástica.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    steps: [
      step(
        ["Start chain", "Départ", "Inicio"],
        [
          "Chain 2 (or as your pattern starts).",
          "Faites 2 ml (ou selon le modèle).",
          "Haz 2 cad (o según el patrón).",
        ]
      ),
      step(
        ["Insert in first chain", "Piquez dans la 1re", "En la 1.ª"],
        [
          "Insert in the first chain, yarn over, pull up a loop.",
          "Piquez dans la 1re ml, jeté, tirez.",
          "Introduce en la 1.ª, hebra, saca.",
        ]
      ),
      step(
        ["Chain part", "Partie chaînette", "Parte cadeneta"],
        [
          "Yarn over, pull through one loop (creates the next foundation chain).",
          "Jeté, passez 1 boucle (crée la ml suivante).",
          "Hebra, pasa 1 bucle (crea la siguiente cad).",
        ]
      ),
      step(
        ["SC part", "Partie ms", "Parte pb"],
        [
          "Yarn over, pull through both loops — one FSC made. Repeat in the chain just made.",
          "Jeté, passez 2 — 1 FSC. Répétez dans la ml créée.",
          "Hebra, pasa 2 — 1 FSC. Repite en la cad creada.",
        ]
      ),
    ],
  },
  {
    id: "tech-fhdc",
    slug: "foundation-half-double-crochet",
    key: "fhdc",
    sortOrder: 85,
    title: L(
      "Foundation half double crochet (FHDC)",
      "Demi-bride de fondation (FHDC)",
      "Medio punto alto de base (FHDC)"
    ),
    tip: L(
      "Foundation row built with half double crochet.",
      "Rang de fondation en demi-brides.",
      "Hilera de base en medio punto alto.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    steps: [
      step(
        ["Yarn over", "Jeté", "Hebra"],
        [
          "Yarn over, insert into the foundation chain/stitch as directed.",
          "Jeté, piquez selon le départ indiqué.",
          "Hebra, introduce según el inicio.",
        ]
      ),
      step(
        ["Pull up", "Tirez", "Saca"],
        [
          "Pull up a loop (3 loops on hook).",
          "Tirez une boucle (3 sur le crochet).",
          "Saca un bucle (3 en el ganchillo).",
        ]
      ),
      step(
        ["Chain part", "Partie chaînette", "Parte cadeneta"],
        [
          "Yarn over, pull through one loop for the foundation chain.",
          "Jeté, passez 1 pour la ml de fondation.",
          "Hebra, pasa 1 para la cad de base.",
        ]
      ),
      step(
        ["Finish hdc", "Terminez la db", "Termina el mpa"],
        [
          "Yarn over, pull through all remaining loops — one FHDC. Repeat.",
          "Jeté, passez le reste — 1 FHDC. Répétez.",
          "Hebra, pasa el resto — 1 FHDC. Repite.",
        ]
      ),
    ],
  },
  {
    id: "tech-dc",
    slug: "double-crochet",
    key: "dc",
    sortOrder: 90,
    title: L("Double crochet (dc)", "Bride (br)", "Punto alto (pa)"),
    tip: L(
      "US double crochet — UK treble (tr).",
      "US : bride — UK : treble (tr).",
      "EE.UU.: pa — Reino Unido: treble (tr).",
    ),
    sheetCols: 3,
    sheetRows: 2,
    detect: { ops: ["dc"], pattern: /\bdc\b/i },
    steps: [
      step(
        ["Yarn over", "Faites un jeté", "Haz hebra"],
        [
          "Yarn over once before inserting.",
          "Faites un jeté avant de piquer.",
          "Haz hebra antes de introducir.",
        ]
      ),
      step(
        ["Insert under both loops", "Piquez sous les 2", "Bajo ambos bucles"],
        [
          "Insert under both top loops of the next stitch.",
          "Piquez sous les deux brins de la maille suivante.",
          "Introduce bajo ambos bucles del siguiente punto.",
        ]
      ),
      step(
        ["Yarn over and pull up", "Jeté et tirez", "Hebra y saca"],
        [
          "Yarn over and pull up through the stitch — 3 loops on the hook.",
          "Jeté et tirez à travers — 3 boucles sur le crochet.",
          "Hebra y saca por el punto — 3 bucles en el ganchillo.",
        ]
      ),
      step(
        ["Pull through first two", "Passez les 2 premières", "Pasa por los 2 primeros"],
        [
          "Yarn over and pull through the first two loops only — 2 loops remain.",
          "Jeté et passez seulement les deux premières — il reste 2.",
          "Hebra y pasa solo por los dos primeros — quedan 2.",
        ]
      ),
      step(
        ["Yarn over again", "Nouveau jeté", "Otra hebra"],
        [
          "Yarn over once more with 2 loops still on the hook.",
          "Encore un jeté — toujours 2 boucles.",
          "Haz hebra otra vez — siguen 2 bucles.",
        ]
      ),
      step(
        ["Pull through last two", "Passez les 2 dernières", "Pasa por los 2 últimos"],
        [
          "Pull through the last two loops — one double crochet made.",
          "Passez les deux dernières — 1 bride.",
          "Pasa por los dos últimos — 1 pa.",
        ]
      ),
    ],
  },
  {
    id: "tech-dc-ring",
    slug: "double-crochet-into-ring",
    key: "dc_into_ring",
    sortOrder: 100,
    title: L(
      "Double crochet into a ring",
      "Bride dans un anneau",
      "Punto alto en un anillo"
    ),
    tip: L(
      "Work dc into a magic ring or chain ring.",
      "Travaillez des brides dans un anneau.",
      "Teje puntos altos en un anillo.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Yarn over", "Jeté", "Hebra"],
        ["Yarn over.", "Jeté.", "Hebra."]
      ),
      step(
        ["Insert into ring", "Dans l’anneau", "En el anillo"],
        [
          "Insert into the ring and pull up a loop.",
          "Piquez dans l’anneau et tirez une boucle.",
          "Introduce en el anillo y saca un bucle.",
        ]
      ),
      step(
        ["Finish the dc", "Terminez la bride", "Termina el pa"],
        [
          "Yarn over, pull through 2, yarn over, pull through 2.",
          "Jeté, passez 2, jeté, passez 2.",
          "Hebra, pasa 2, hebra, pasa 2.",
        ]
      ),
    ],
  },
  {
    id: "tech-tr",
    slug: "treble-crochet",
    key: "tr",
    sortOrder: 110,
    title: L("Treble crochet (tr)", "Double bride", "Punto alto doble"),
    tip: L(
      "US treble — UK double treble (dtr). Tall stitch.",
      "US : double bride — UK : dtr.",
      "EE.UU.: alto doble — Reino Unido: dtr.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    detect: { ops: ["tr"], pattern: /\btr\b/i },
    steps: [
      step(
        ["Yarn over twice & insert", "Deux jetés et piquez", "Dos hebras e introduce"],
        [
          "Yarn over twice, then insert under both top loops of the next stitch.",
          "Faites deux jetés, puis piquez sous les deux brins.",
          "Haz dos hebras e introduce bajo ambos bucles.",
        ]
      ),
      step(
        ["Pull up a loop", "Tirez une boucle", "Saca un bucle"],
        [
          "Yarn over and pull up — 4 loops on the hook.",
          "Jeté et tirez — 4 boucles sur le crochet.",
          "Hebra y saca — 4 bucles en el ganchillo.",
        ]
      ),
      step(
        ["Pull through twos", "Passez de 2 en 2", "Pasa de 2 en 2"],
        [
          "Yarn over, pull through 2; repeat until 2 loops remain.",
          "Jeté, passez 2 ; répétez jusqu’à 2 boucles.",
          "Hebra, pasa 2; repite hasta 2 bucles.",
        ]
      ),
      step(
        ["Finish last two", "Terminez les 2", "Termina los 2"],
        [
          "Yarn over and pull through the last two — one treble made.",
          "Jeté et passez les deux dernières — 1 double bride.",
          "Hebra y pasa por los dos últimos — 1 alto doble.",
        ]
      ),
    ],
  },
  {
    id: "tech-dtr",
    slug: "double-treble",
    key: "dtr",
    sortOrder: 120,
    title: L(
      "Double treble (dtr)",
      "Triple bride",
      "Punto alto triple"
    ),
    tip: L(
      "US double treble — UK triple treble (trtr). Very tall.",
      "US : triple bride — UK : trtr.",
      "EE.UU.: alto triple — Reino Unido: trtr.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Yarn over 3 times", "Trois jetés", "Tres hebras"],
        [
          "Yarn over three times.",
          "Faites trois jetés.",
          "Haz tres hebras.",
        ]
      ),
      step(
        ["Insert and pull up", "Piquez et tirez", "Introduce y saca"],
        [
          "Insert, yarn over, pull up a loop.",
          "Piquez, jeté, tirez une boucle.",
          "Introduce, hebra, saca un bucle.",
        ]
      ),
      step(
        ["Pull through twos", "Passez de 2 en 2", "Pasa de 2 en 2"],
        [
          "Yarn over and pull through 2 until one loop remains.",
          "Jeté et passez 2 jusqu’à 1 boucle.",
          "Hebra y pasa 2 hasta 1 bucle.",
        ]
      ),
    ],
  },
  {
    id: "tech-inc",
    slug: "increase",
    key: "inc",
    sortOrder: 130,
    title: L("Increase (inc)", "Augmentation (aug)", "Aumento (aum)"),
    tip: L(
      "Two stitches in the same place — the fabric grows.",
      "Deux mailles au même endroit.",
      "Dos puntos en el mismo sitio.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    detect: { ops: ["inc"], pattern: /\binc\b/i },
    steps: [
      step(
        ["Find the stitch", "Repérez la maille", "Localiza el punto"],
        [
          "Locate where the increase goes.",
          "Trouvez la maille d’augmentation.",
          "Encuentra el punto del aumento.",
        ]
      ),
      step(
        ["First stitch", "1re maille", "Primer punto"],
        [
          "Work one stitch (usually sc) into that stitch.",
          "Faites une maille (souvent ms).",
          "Teje un punto (suele ser pb).",
        ]
      ),
      step(
        ["Second in same place", "2e au même endroit", "Segundo en el mismo"],
        [
          "Work a second stitch into the exact same stitch.",
          "Une deuxième maille au même endroit.",
          "Un segundo punto en el mismo sitio.",
        ]
      ),
      step(
        ["Two from one", "Deux pour une", "Dos de uno"],
        [
          "Count two stitches from that base before the next round.",
          "Comptez deux mailles avant le tour suivant.",
          "Cuenta dos puntos antes de la siguiente vuelta.",
        ]
      ),
    ],
  },
  {
    id: "tech-dc-inc",
    slug: "double-crochet-increase",
    key: "dc_inc",
    sortOrder: 140,
    title: L(
      "2 double crochet in same stitch",
      "2 brides dans la même maille",
      "2 puntos altos en el mismo punto"
    ),
    tip: L(
      "US: 2 dc in one stitch (increase).",
      "Augmentation en brides.",
      "Aumento con puntos altos.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["First dc", "1re bride", "Primer pa"],
        [
          "Work one double crochet into the stitch.",
          "Faites une bride.",
          "Teje un punto alto.",
        ]
      ),
      step(
        ["Same stitch again", "Même maille", "Mismo punto"],
        [
          "Yarn over and work a second dc into the same stitch.",
          "Une 2e bride dans la même maille.",
          "Un 2.º pa en el mismo punto.",
        ]
      ),
      step(
        ["Increase done", "Augmentation faite", "Aumento hecho"],
        [
          "Two dc share one base stitch.",
          "Deux brides partagent la base.",
          "Dos pa comparten la base.",
        ]
      ),
    ],
  },
  {
    id: "tech-dec",
    slug: "decrease",
    key: "dec",
    sortOrder: 150,
    title: L("Decrease (dec / sc2tog)", "Diminution (dim)", "Disminución (dis)"),
    tip: L(
      "Two stitches become one — the fabric narrows.",
      "Deux mailles deviennent une.",
      "Dos puntos se convierten en uno.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { ops: ["dec"], pattern: /\b(dec|sc2tog)\b/i },
    steps: [
      step(
        ["Loop from first stitch", "Boucle de la 1re", "Bucle del 1.º"],
        [
          "Insert in the next stitch and pull up a loop (2 on hook).",
          "Piquez et tirez une boucle (2 sur le crochet).",
          "Introduce y saca un bucle (2 en el ganchillo).",
        ]
      ),
      step(
        ["Loop from next", "Boucle de la suivante", "Bucle del siguiente"],
        [
          "Insert in the following stitch and pull up another loop (3 on hook).",
          "Piquez dans la suivante et tirez (3 boucles).",
          "Introduce en el siguiente y saca (3 bucles).",
        ]
      ),
      step(
        ["Pull through all", "Passez tout", "Pasa por todos"],
        [
          "Yarn over and pull through all three loops — one decrease made.",
          "Jeté et passez les trois — 1 diminution.",
          "Hebra y pasa por los tres — 1 disminución.",
        ]
      ),
    ],
  },
  {
    id: "tech-hdc2tog",
    slug: "half-double-crochet-2-together",
    key: "hdc2tog",
    sortOrder: 155,
    title: L(
      "Half double crochet 2 together (hdc2tog)",
      "2 demi-brides ensemble",
      "2 medios puntos altos juntos"
    ),
    tip: L(
      "Decrease with half double crochet.",
      "Diminution en demi-brides.",
      "Disminución con medio punto alto.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Partial first hdc", "1re db entamée", "1.er mpa a medias"],
        [
          "Yarn over, insert in stitch 1, pull up a loop (3 loops).",
          "Jeté, piquez maille 1, tirez (3 boucles).",
          "Hebra, introduce en el 1.º, saca (3 bucles).",
        ]
      ),
      step(
        ["Partial second hdc", "2e db entamée", "2.º mpa a medias"],
        [
          "Yarn over, insert in stitch 2, pull up (5 loops on hook).",
          "Jeté, piquez maille 2, tirez (5 boucles).",
          "Hebra, introduce en el 2.º, saca (5 bucles).",
        ]
      ),
      step(
        ["Pull through all", "Passez tout", "Pasa por todos"],
        [
          "Yarn over and pull through all loops — one hdc2tog.",
          "Jeté et passez toutes les boucles.",
          "Hebra y pasa por todos los bucles.",
        ]
      ),
    ],
  },
  {
    id: "tech-tr2tog",
    slug: "treble-2-together",
    key: "tr2tog",
    sortOrder: 165,
    title: L(
      "Treble crochet 2 together (tr2tog)",
      "2 doubles brides ensemble",
      "2 puntos altos dobles juntos"
    ),
    tip: L(
      "Tall-stitch decrease.",
      "Diminution en points longs.",
      "Disminución con puntos largos.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Partial first tr", "1re double bride", "1.er alto doble"],
        [
          "Begin a treble in stitch 1; stop before the last pull-through.",
          "Entamez une double bride ; stop avant le dernier passage.",
          "Empieza un alto doble; para antes del último pase.",
        ]
      ),
      step(
        ["Partial second tr", "2e double bride", "2.º alto doble"],
        [
          "Begin a treble in stitch 2 the same way.",
          "Entamez la 2e de la même façon.",
          "Empieza el 2.º igual.",
        ]
      ),
      step(
        ["Close together", "Fermez ensemble", "Cierra juntos"],
        [
          "Yarn over and pull through all remaining loops.",
          "Jeté et passez toutes les boucles restantes.",
          "Hebra y pasa por todos los bucles restantes.",
        ]
      ),
    ],
  },
  {
    id: "tech-dc2tog",
    slug: "double-crochet-2-together",
    key: "dc2tog",
    sortOrder: 160,
    title: L(
      "Double crochet 2 together (dc2tog)",
      "2 brides ensemble",
      "2 puntos altos juntos"
    ),
    tip: L(
      "US dc decrease — UK tr2tog.",
      "Diminution en brides — UK tr2tog.",
      "Disminución en pa — UK tr2tog.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Start first dc", "1re bride entamée", "1.er pa a medias"],
        [
          "Yarn over, insert in stitch 1, pull up, yarn over, pull through 2 (2 loops left).",
          "Entamez une bride ; passez 2 (2 boucles restent).",
          "Empieza un pa; pasa 2 (quedan 2 bucles).",
        ]
      ),
      step(
        ["Start second dc", "2e bride entamée", "2.º pa a medias"],
        [
          "Yarn over, insert in stitch 2, pull up, yarn over, pull through 2 (3 loops left).",
          "Entamez la 2e (3 boucles).",
          "Empieza el 2.º (3 bucles).",
        ]
      ),
      step(
        ["Close together", "Fermez ensemble", "Cierra juntos"],
        [
          "Yarn over and pull through all three loops.",
          "Jeté et passez les trois.",
          "Hebra y pasa por los tres.",
        ]
      ),
    ],
  },
  {
    id: "tech-dc3tog",
    slug: "double-crochet-3-together",
    key: "dc3tog",
    sortOrder: 170,
    title: L(
      "Double crochet 3 together (dc3tog)",
      "3 brides ensemble",
      "3 puntos altos juntos"
    ),
    tip: L(
      "Stronger decrease — UK tr3tog.",
      "Forte diminution — UK tr3tog.",
      "Disminución fuerte — UK tr3tog.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Partial dc × 3", "3 brides entamées", "3 pa a medias"],
        [
          "Work three partial double crochets across three stitches.",
          "Entamez trois brides sur trois mailles.",
          "Empieza tres pa sobre tres puntos.",
        ]
      ),
      step(
        ["Loops gathered", "Boucles réunies", "Bucles reunidos"],
        [
          "You should have several loops on the hook.",
          "Plusieurs boucles sur le crochet.",
          "Varios bucles en el ganchillo.",
        ]
      ),
      step(
        ["Pull through all", "Passez tout", "Pasa por todos"],
        [
          "Yarn over and pull through all loops at once.",
          "Jeté et passez toutes les boucles.",
          "Hebra y pasa por todos los bucles.",
        ]
      ),
    ],
  },
  {
    id: "tech-blo",
    slug: "back-loop-only",
    key: "blo",
    sortOrder: 180,
    title: L("Back loop only (BLO)", "Brin arrière (BA)", "Solo bucle trasero (SBT)"),
    tip: L(
      "Work under the back loop of the V for ridges / stretch.",
      "Travaillez le brin arrière du V.",
      "Teje solo el bucle de atrás de la V.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { ops: ["blo"], pattern: /\bblo\b/i },
    steps: [
      step(
        ["Find the V", "Repérez le V", "Encuentra la V"],
        [
          "Each stitch top is a V: front loop nearest you, back loop farther.",
          "Chaque maille a un V : brin avant / arrière.",
          "Cada punto es una V: bucle delantero / trasero.",
        ]
      ),
      step(
        ["Insert in back loop", "Piquez derrière", "Introduce atrás"],
        [
          "Insert the hook under the back loop only.",
          "Piquez sous le brin arrière seulement.",
          "Introduce solo bajo el bucle trasero.",
        ]
      ),
      step(
        ["Complete the stitch", "Terminez", "Completa"],
        [
          "Finish the stitch as usual (often sc).",
          "Terminez la maille comme d’habitude.",
          "Termina el punto como siempre.",
        ]
      ),
    ],
  },
  {
    id: "tech-flo",
    slug: "front-loop-only",
    key: "flo",
    sortOrder: 185,
    title: L("Front loop only (FLO)", "Brin avant (BV)", "Solo bucle delantero"),
    tip: L(
      "Work under the front loop of the V.",
      "Travaillez le brin avant du V.",
      "Teje solo el bucle de delante.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { ops: ["flo"], pattern: /\bflo\b/i },
    steps: [
      step(
        ["Find the front loop", "Brin avant", "Bucle delantero"],
        [
          "Identify the loop of the V closest to you.",
          "Repérez le brin le plus proche de vous.",
          "Identifica el bucle más cercano a ti.",
        ]
      ),
      step(
        ["Insert there only", "Piquez devant", "Introduce delante"],
        [
          "Insert under the front loop only.",
          "Piquez sous le brin avant seulement.",
          "Introduce solo bajo el bucle delantero.",
        ]
      ),
      step(
        ["Complete stitch", "Terminez", "Completa"],
        [
          "Finish the stitch as the pattern says.",
          "Terminez selon le modèle.",
          "Termina según el patrón.",
        ]
      ),
    ],
  },
  {
    id: "tech-popcorn",
    slug: "popcorn-stitch",
    key: "popcorn",
    sortOrder: 195,
    title: L("Popcorn stitch (pc)", "Point popcorn", "Punto popcorn"),
    tip: L(
      "Several complete tall stitches pushed forward and joined.",
      "Plusieurs brides complètes poussées en relief et jointes.",
      "Varios puntos altos completos empujados al frente y unidos.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    steps: [
      step(
        ["Work several dc", "Plusieurs brides", "Varios pa"],
        [
          "Work 4–5 complete double crochets into the same stitch.",
          "Faites 4–5 brides complètes dans la même maille.",
          "Teje 4–5 puntos altos completos en el mismo punto.",
        ]
      ),
      step(
        ["Remove hook", "Retirez le crochet", "Saca el ganchillo"],
        [
          "Drop the working loop from the hook temporarily.",
          "Enlevez temporairement la boucle du crochet.",
          "Suelta el bucle del ganchillo un momento.",
        ]
      ),
      step(
        ["Join front to back", "Joignez devant-arrière", "Une delante-atrás"],
        [
          "Insert into the first dc of the group, catch the dropped loop, pull through.",
          "Piquez dans la 1re bride du groupe, récupérez la boucle.",
          "Introduce en el 1.er pa del grupo y recupera el bucle.",
        ]
      ),
      step(
        ["Popcorn stands out", "Le popcorn ressort", "El popcorn sobresale"],
        [
          "The stitches bulge forward; chain 1 if the pattern says.",
          "Les mailles ressortent ; 1 ml si demandé.",
          "Los puntos sobresalen; 1 cad si lo pide.",
        ]
      ),
    ],
  },
  {
    id: "tech-horizontal-puff",
    slug: "horizontal-puff",
    key: "horizontal_puff",
    sortOrder: 205,
    title: L(
      "Horizontal puff stitch",
      "Puff horizontal",
      "Puff horizontal"
    ),
    tip: L(
      "Puff worked sideways across stitches for textured bands.",
      "Puff travaillé sur le côté pour des bandes texturées.",
      "Puff trabajado de lado para bandas con textura.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Approach sideways", "Approche latérale", "Enfoque lateral"],
        [
          "Yarn over and insert around/post or as the pattern shows horizontally.",
          "Jeté et piquez à l’horizontal selon le modèle.",
          "Hebra e introduce en horizontal según el patrón.",
        ]
      ),
      step(
        ["Pull up long loops", "Longues boucles", "Bucles largos"],
        [
          "Pull up long loops across the horizontal path several times.",
          "Tirez de longues boucles plusieurs fois.",
          "Saca bucles largos varias veces.",
        ]
      ),
      step(
        ["Close the puff", "Fermez", "Cierra"],
        [
          "Yarn over and pull through all loops to close.",
          "Jeté et passez toutes les boucles.",
          "Hebra y pasa por todos los bucles.",
        ]
      ),
    ],
  },
  {
    id: "tech-bobble",
    slug: "bobble-stitch",
    key: "bobble",
    sortOrder: 190,
    title: L("Bobble stitch (bo)", "Bobble", "Punto bobble"),
    tip: L(
      "Several incomplete tall stitches closed together (differs from popcorn).",
      "Plusieurs brides incomplètes fermées ensemble (différent du popcorn).",
      "Varios puntos altos incompletos cerrados juntos (distinto del popcorn).",
    ),
    sheetCols: 2,
    sheetRows: 2,
    steps: [
      step(
        ["Partial stitches", "Brides entamées", "Puntos a medias"],
        [
          "Work several incomplete dc (or tr) into the same stitch.",
          "Faites plusieurs brides incomplètes dans la même maille.",
          "Teje varios pa incompletos en el mismo punto.",
        ]
      ),
      step(
        ["Loops on hook", "Boucles sur le crochet", "Bucles en el ganchillo"],
        [
          "Keep all the extra loops on the hook.",
          "Gardez toutes les boucles.",
          "Mantén todos los bucles.",
        ]
      ),
      step(
        ["Close together", "Fermez", "Cierra"],
        [
          "Yarn over and pull through all loops at once.",
          "Jeté et passez toutes les boucles.",
          "Hebra y pasa por todos.",
        ]
      ),
      step(
        ["Bobble sits out", "Le relief apparaît", "El relieve aparece"],
        [
          "The bobble pops forward; continue to the next stitch.",
          "Le bobble ressort ; continuez.",
          "El bobble sobresale; continúa.",
        ]
      ),
    ],
  },
  {
    id: "tech-puff",
    slug: "puff-stitch",
    key: "puff",
    sortOrder: 200,
    title: L("Puff stitch", "Point puff", "Punto puff"),
    tip: L(
      "Soft raised stitch from yarn-overs pulled up and closed.",
      "Relief doux avec des jetés tirés et fermés.",
      "Relieve suave con hebras sacadas y cerradas.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Yarn over & pull up × several", "Plusieurs jetés", "Varias hebras"],
        [
          "Yarn over, insert, pull up a long loop — repeat in the same stitch.",
          "Jeté, piquez, tirez une longue boucle — répétez.",
          "Hebra, introduce, saca un bucle largo — repite.",
        ]
      ),
      step(
        ["Gather loops", "Rassemblez", "Reúne"],
        [
          "You will have many loops on the hook.",
          "Beaucoup de boucles sur le crochet.",
          "Muchos bucles en el ganchillo.",
        ]
      ),
      step(
        ["Close the puff", "Fermez le puff", "Cierra el puff"],
        [
          "Yarn over and pull through all loops; chain 1 if the pattern says.",
          "Jeté, passez tout ; 1 ml si demandé.",
          "Hebra, pasa por todos; 1 cad si lo pide.",
        ]
      ),
    ],
  },
  {
    id: "tech-crab",
    slug: "crab-stitch",
    key: "crab",
    sortOrder: 210,
    title: L(
      "Crab stitch (reverse single crochet)",
      "Point d’écrevisse",
      "Punto cangrejo"
    ),
    tip: L(
      "Work single crochet from left to right for a corded edge.",
      "Ms de gauche à droite pour un bord cordé.",
      "Pb de izquierda a derecha para un borde cordón.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Work the other way", "Sens inverse", "Al revés"],
        [
          "Without turning, work into the stitch to the right.",
          "Sans tourner, piquez dans la maille à droite.",
          "Sin girar, teje el punto de la derecha.",
        ]
      ),
      step(
        ["Insert & yarn over", "Piquez + jeté", "Introduce + hebra"],
        [
          "Insert, yarn over, pull up a loop.",
          "Piquez, jeté, tirez.",
          "Introduce, hebra, saca.",
        ]
      ),
      step(
        ["Complete reverse sc", "Terminez", "Completa"],
        [
          "Yarn over and pull through both loops; continue left ← right.",
          "Jeté, passez les 2 ; continuez.",
          "Hebra, pasa por 2; continúa.",
        ]
      ),
    ],
  },
  {
    id: "tech-color",
    slug: "change-color",
    key: "color_change",
    sortOrder: 220,
    title: L(
      "Join a new ball / change color",
      "Changer de couleur",
      "Cambiar de color"
    ),
    tip: L(
      "Switch yarns in the last yarn-over of the previous stitch.",
      "Changez au dernier jeté de la maille précédente.",
      "Cambia en la última hebra del punto anterior.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Stop before last pull-through", "Avant le dernier passage", "Antes del último pase"],
        [
          "Work the stitch until two loops remain (for sc).",
          "Pour une ms, laissez 2 boucles.",
          "En un pb, deja 2 bucles.",
        ]
      ),
      step(
        ["Yarn over with new color", "Jeté nouvelle couleur", "Hebra color nuevo"],
        [
          "Drop the old yarn; yarn over with the new color.",
          "Lâchez l’ancien fil ; jeté avec le nouveau.",
          "Suelta el hilo viejo; hebra con el nuevo.",
        ]
      ),
      step(
        ["Pull through & continue", "Passez et continuez", "Pasa y sigue"],
        [
          "Pull through with the new color and keep crocheting.",
          "Passez avec la nouvelle couleur.",
          "Pasa con el color nuevo y sigue.",
        ]
      ),
    ],
  },
  {
    id: "tech-fo",
    slug: "fasten-off",
    key: "fo",
    sortOrder: 230,
    title: L("Fasten off", "Arrêt du fil", "Cerrar / cortar hilo"),
    tip: L(
      "Secure the last stitch so the work does not unravel.",
      "Fixez la dernière maille.",
      "Asegura el último punto.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { ops: ["fasten_off"], pattern: /\b(fasten\s*off|\bfo\b)/i },
    steps: [
      step(
        ["Cut yarn", "Coupez", "Corta"],
        [
          "Cut the yarn, leaving a tail long enough to weave in.",
          "Coupez en laissant une queue.",
          "Corta dejando cola.",
        ]
      ),
      step(
        ["Pull tail through", "Tirez la queue", "Tira de la cola"],
        [
          "Yarn over and pull the tail fully through the last loop.",
          "Tirez la queue à travers la dernière boucle.",
          "Pasa la cola por el último bucle.",
        ]
      ),
      step(
        ["Tighten", "Serrez", "Aprieta"],
        [
          "Pull tight to close the last stitch.",
          "Serrez pour fermer.",
          "Aprieta para cerrar.",
        ]
      ),
    ],
  },
  {
    id: "tech-weave",
    slug: "weave-in-ends",
    key: "weave_ends",
    sortOrder: 240,
    title: L("Weave in ends", "Rentrer les fils", "Esconder extremos"),
    tip: L(
      "Hide tails on the wrong side so they stay secure.",
      "Cachez les queues sur l’envers.",
      "Esconde las colas por el revés.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    steps: [
      step(
        ["Thread a needle", "Enfilez une aiguille", "Enhebra una aguja"],
        [
          "Thread the yarn tail onto a yarn needle.",
          "Passez la queue dans une aiguille à laine.",
          "Pasa la cola por una aguja de lana.",
        ]
      ),
      step(
        ["Weave through stitches", "Passez dans les mailles", "Pasa entre puntos"],
        [
          "Weave through several stitches on the wrong side, changing direction once.",
          "Passez sous plusieurs mailles, changez de sens.",
          "Pasa bajo varios puntos y cambia de dirección.",
        ]
      ),
      step(
        ["Trim close", "Coupez court", "Corta cerca"],
        [
          "Snip the remaining tip close to the fabric.",
          "Coupez près du tissu.",
          "Corta cerca de la tela.",
        ]
      ),
    ],
  },
  // --- Decorative / pattern stitches (topics inspired by public tutorial libraries) ---
  {
    id: "tech-invisible-join",
    slug: "invisible-join",
    key: "invisible_join",
    sortOrder: 250,
    title: L(
      "Invisible join (rounds)",
      "Jointure invisible",
      "Unión invisible"
    ),
    tip: L(
      "Finish a round so the join looks seamless — no visible slip-stitch bump.",
      "Fermez un tour sans bosse de mc visible.",
      "Cierra una vuelta sin el bulto del pe.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    steps: [
      step(
        ["Finish the last stitch", "Dernière maille", "Último punto"],
        [
          "Complete the last stitch of the round; cut yarn leaving a tail.",
          "Terminez la dernière maille ; coupez en laissant une queue.",
          "Termina el último punto; corta dejando cola.",
        ]
      ),
      step(
        ["Needle under both loops", "Aiguille sous les 2 brins", "Aguja bajo 2 bucles"],
        [
          "Thread the tail; insert the needle under both top loops of the first stitch of the round.",
          "Enfilez la queue ; passez sous les deux brins de la 1re maille du tour.",
          "Enhebra la cola; pasa bajo ambos bucles del 1.er punto de la vuelta.",
        ]
      ),
      step(
        ["Back into the last stitch", "Dans la dernière maille", "En el último punto"],
        [
          "Insert the needle into the middle of the last stitch (or back loop) and pull snug.",
          "Piquez au milieu de la dernière maille et serrez.",
          "Introduce en el centro del último punto y ajusta.",
        ]
      ),
      step(
        ["Weave in the end", "Rentrez le fil", "Esconde el extremo"],
        [
          "The join should mimic a stitch top — weave the remaining tail on the wrong side.",
          "La jointure imite un dessus de maille — rentrez la queue.",
          "La unión imita la tapa de un punto — esconde la cola.",
        ]
      ),
    ],
  },
  {
    id: "tech-shell",
    slug: "shell-stitch",
    key: "shell",
    sortOrder: 260,
    title: L("Shell stitch", "Point coquille", "Punto concha"),
    tip: L(
      "Several stitches in one place that fan into a shell.",
      "Plusieurs mailles au même endroit en éventail.",
      "Varios puntos en el mismo sitio en abanico.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { pattern: /\bshell\b/i },
    steps: [
      step(
        ["Skip to the shell base", "Base de la coquille", "Base de la concha"],
        [
          "Work to the stitch or space where the shell sits (often skip stitches before/after).",
          "Arrivez à la maille ou à l’espace de la coquille.",
          "Llega al punto o espacio de la concha.",
        ]
      ),
      step(
        ["Work multiple stitches in one place", "Plusieurs mailles au même endroit", "Varios en el mismo sitio"],
        [
          "Work the pattern’s tall stitches (often 5 dc) all into the same stitch or space.",
          "Faites les mailles hautes indiquées (souvent 5 brides) au même endroit.",
          "Teje los puntos altos indicados (suele ser 5 pa) en el mismo sitio.",
        ]
      ),
      step(
        ["Fan complete", "Éventail terminé", "Abanico listo"],
        [
          "The stitches spread into a shell; continue as the pattern says.",
          "Les mailles s’ouvrent en coquille ; continuez.",
          "Los puntos se abren en concha; continúa.",
        ]
      ),
    ],
  },
  {
    id: "tech-v-stitch",
    slug: "v-stitch",
    key: "v_stitch",
    sortOrder: 270,
    title: L("V-stitch", "Point en V", "Punto en V"),
    tip: L(
      "Two tall stitches with a chain between them — a clear V.",
      "Deux mailles hautes séparées par une ml — un V.",
      "Dos puntos altos con una cad entre ellos — una V.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { pattern: /\bv[\s-]?stitch\b/i },
    steps: [
      step(
        ["First tall stitch", "1re maille haute", "1.er punto alto"],
        [
          "Work a dc (or as written) into the indicated stitch or space.",
          "Faites une bride (ou selon le modèle) à l’endroit indiqué.",
          "Teje un pa (o según el patrón) en el sitio indicado.",
        ]
      ),
      step(
        ["Chain between", "Ml au centre", "Cad en el centro"],
        [
          "Chain the number listed (often ch 1 or ch 2).",
          "Faites le nombre de ml indiqué (souvent 1 ou 2).",
          "Haz las cadenetas indicadas (suele ser 1 o 2).",
        ]
      ),
      step(
        ["Second tall stitch", "2e maille haute", "2.º punto alto"],
        [
          "Work another dc into the same stitch or space — the V is complete.",
          "Une 2e bride au même endroit — le V est fait.",
          "Otro pa en el mismo sitio — la V está lista.",
        ]
      ),
    ],
  },
  {
    id: "tech-x-stitch",
    slug: "x-stitch",
    key: "x_stitch",
    sortOrder: 280,
    title: L("X-stitch (crossed double crochet)", "Point en X", "Punto en X"),
    tip: L(
      "Two crossed tall stitches that form an X.",
      "Deux mailles hautes croisées en X.",
      "Dos puntos altos cruzados en X.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    detect: { pattern: /\bx[\s-]?stitch\b/i },
    steps: [
      step(
        ["Skip and work the first leg", "Sautez puis 1re jambe", "Salta y 1.ª pierna"],
        [
          "Skip the next stitch; dc in the following stitch.",
          "Sautez 1 maille ; bride dans la suivante.",
          "Salta 1 punto; pa en el siguiente.",
        ]
      ),
      step(
        ["Go behind to the skipped stitch", "Derrière vers la sautée", "Detrás al saltado"],
        [
          "Working behind (or in front, as written), dc into the skipped stitch.",
          "En passant derrière (ou devant), bride dans la maille sautée.",
          "Por detrás (o delante), pa en el punto saltado.",
        ]
      ),
      step(
        ["Legs cross into an X", "Les jambes forment un X", "Las piernas forman una X"],
        [
          "The two posts cross; continue across the row as directed.",
          "Les deux brides se croisent ; continuez.",
          "Los dos postes se cruzan; continúa.",
        ]
      ),
    ],
  },
  {
    id: "tech-alpine",
    slug: "alpine-stitch",
    key: "alpine",
    sortOrder: 290,
    title: L("Alpine stitch", "Point alpin", "Punto alpino"),
    tip: L(
      "Alternating front-post and regular stitches for a textured zig-zag.",
      "Alternance de brides en relief et brides normales.",
      "Alterna puntos en relieve y normales.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    detect: { pattern: /\balpine\b/i },
    steps: [
      step(
        ["Set up the row", "Préparez le rang", "Prepara la hilera"],
        [
          "Follow the pattern’s setup row (often a row of dc).",
          "Suivez le rang de base du modèle (souvent des brides).",
          "Sigue la hilera base del patrón (suele ser pa).",
        ]
      ),
      step(
        ["Front-post stitch", "Bride en relief devant", "Punto en relieve al frente"],
        [
          "Yarn over; insert the hook from front to back to front around the post below; complete the stitch.",
          "Jeté ; piquez autour du montant devant ; terminez la maille.",
          "Hebra; introduce alrededor del poste por delante; termina el punto.",
        ]
      ),
      step(
        ["Regular stitch next", "Maille normale ensuite", "Punto normal después"],
        [
          "Work the next stitch into the top of the following stitch as usual.",
          "Travaillez la suivante dans le dessus de maille normal.",
          "Teje el siguiente en la tapa del punto como siempre.",
        ]
      ),
      step(
        ["Alternate across", "Alternez", "Alterna"],
        [
          "Keep alternating front-post and regular stitches for the alpine texture.",
          "Alternez relief et normal pour le relief alpin.",
          "Alterna relieve y normal para la textura alpina.",
        ]
      ),
    ],
  },
  {
    id: "tech-herringbone",
    slug: "herringbone-stitch",
    key: "herringbone",
    sortOrder: 300,
    title: L(
      "Herringbone stitch",
      "Point chevron / herringbone",
      "Punto espiga (herringbone)"
    ),
    tip: L(
      "A slanted stitch that stacks into a herringbone fabric.",
      "Maille inclinée qui forme un chevron.",
      "Punto inclinado que forma espiga.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    detect: { pattern: /\bherringbone\b/i },
    steps: [
      step(
        ["Yarn over and insert", "Jeté et piquez", "Hebra e introduce"],
        [
          "Yarn over and insert into the next stitch.",
          "Jeté et piquez dans la maille suivante.",
          "Hebra e introduce en el siguiente punto.",
        ]
      ),
      step(
        ["Pull through stitch and first loop", "Tirez maille + 1re boucle", "Pasa punto + 1.er bucle"],
        [
          "Pull up a loop and immediately pull it through the first loop on the hook.",
          "Tirez une boucle et passez-la tout de suite dans la 1re boucle du crochet.",
          "Saca un bucle y pásalo de inmediato por el 1.er bucle del ganchillo.",
        ]
      ),
      step(
        ["Finish like a tall stitch", "Terminez comme une maille haute", "Termina como punto alto"],
        [
          "Yarn over and pull through the remaining loops as the pattern’s herringbone requires.",
          "Jeté et passez les boucles restantes selon le herringbone du modèle.",
          "Hebra y pasa los bucles restantes según el herringbone del patrón.",
        ]
      ),
    ],
  },
  {
    id: "tech-star",
    slug: "star-stitch",
    key: "star_stitch",
    sortOrder: 310,
    title: L("Star stitch", "Point étoile", "Punto estrella"),
    tip: L(
      "Clusters of pulled loops closed together that look like stars.",
      "Boucles tirées refermées ensemble — aspect étoile.",
      "Bucles sacados y cerrados juntos — aspecto estrella.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    detect: { pattern: /\bstar\s*stitch\b/i },
    steps: [
      step(
        ["Pull up loops across", "Tirez plusieurs boucles", "Saca varios bucles"],
        [
          "Insert and pull up a loop in each of the places the pattern lists (often 5–6 loops on hook).",
          "Piquez et tirez une boucle à chaque endroit indiqué (souvent 5–6 boucles).",
          "Introduce y saca un bucle en cada sitio indicado (suele ser 5–6).",
        ]
      ),
      step(
        ["Close the star eye", "Fermez l’œil", "Cierra el ojo"],
        [
          "Yarn over and pull through all loops on the hook.",
          "Jeté et passez toutes les boucles.",
          "Hebra y pasa por todos los bucles.",
        ]
      ),
      step(
        ["Chain to lock", "Ml pour fixer", "Cad para fijar"],
        [
          "Chain 1 (or as written) to close the center of the star.",
          "1 ml (ou selon le modèle) pour fermer le centre.",
          "1 cad (o según el patrón) para cerrar el centro.",
        ]
      ),
      step(
        ["Next star starts in the eye", "Étoile suivante", "Siguiente estrella"],
        [
          "Begin the next star in the chain-space / eye just made, as directed.",
          "Démarrez la suivante dans l’œil / l’espace ml créé.",
          "Empieza la siguiente en el ojo / espacio de cad creado.",
        ]
      ),
    ],
  },
  {
    id: "tech-tulip",
    slug: "tulip-stitch",
    key: "tulip",
    sortOrder: 320,
    title: L("Tulip stitch", "Point tulipe", "Punto tulipán"),
    tip: L(
      "A flower-like cluster motif often used in blankets.",
      "Motif en bouquet / fleur pour couvertures.",
      "Motivo tipo flor para mantas.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { pattern: /\btulip\b/i },
    steps: [
      step(
        ["Build the base", "Base", "Base"],
        [
          "Work the chains / spaces the pattern uses under each tulip.",
          "Faites les ml / espaces sous chaque tulipe.",
          "Haz las cad / espacios bajo cada tulipán.",
        ]
      ),
      step(
        ["Work the petals", "Pétales", "Pétalos"],
        [
          "Work the clustered or shell stitches that form the tulip head.",
          "Travaillez les mailles groupées / coquille de la tête.",
          "Teje los puntos agrupados / concha de la cabeza.",
        ]
      ),
      step(
        ["Secure and move on", "Fixez et continuez", "Fija y sigue"],
        [
          "Close or slip-stitch as written, then move to the next motif.",
          "Fermez ou mc selon le modèle, puis motif suivant.",
          "Cierra o pe según el patrón, luego el siguiente motivo.",
        ]
      ),
    ],
  },
  {
    id: "tech-wrapped",
    slug: "wrapped-stitches",
    key: "wrapped",
    sortOrder: 330,
    title: L("Wrapped stitches", "Mailles enveloppées", "Puntos envueltos"),
    tip: L(
      "Yarn wraps around a stitch or post for extra texture.",
      "Le fil s’enroule autour d’une maille ou d’un montant.",
      "El hilo rodea un punto o poste.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { pattern: /\bwrapped?\b/i },
    steps: [
      step(
        ["Reach the stitch to wrap", "Maille à envelopper", "Punto a envolver"],
        [
          "Work to the stitch or post the pattern wants wrapped.",
          "Arrivez à la maille / au montant à envelopper.",
          "Llega al punto / poste a envolver.",
        ]
      ),
      step(
        ["Wrap the yarn", "Enroulez le fil", "Envuelve el hilo"],
        [
          "Bring the yarn around the stitch as many times as written.",
          "Passez le fil autour le nombre de fois indiqué.",
          "Pasa el hilo alrededor las veces indicadas.",
        ]
      ),
      step(
        ["Complete the stitch", "Terminez la maille", "Completa el punto"],
        [
          "Finish the underlying stitch so the wraps sit neatly on the fabric.",
          "Terminez la maille pour que les tours restent nets.",
          "Termina el punto para que las vueltas queden limpias.",
        ]
      ),
    ],
  },
  {
    id: "tech-granny-cluster",
    slug: "granny-cluster",
    key: "granny_cluster",
    sortOrder: 340,
    title: L("Granny clusters", "Groupes granny", "Racimos granny"),
    tip: L(
      "Classic granny-square style groups of tall stitches separated by chains.",
      "Groupes de brides séparés par des ml — style granny.",
      "Grupos de pa separados por cad — estilo granny.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { pattern: /\bgranny\b/i },
    steps: [
      step(
        ["Chain space", "Espace de ml", "Espacio de cad"],
        [
          "Work into the chain space (or corner) where the cluster sits.",
          "Travaillez dans l’espace de ml (ou coin).",
          "Teje en el espacio de cad (o esquina).",
        ]
      ),
      step(
        ["Group of tall stitches", "Groupe de brides", "Grupo de pa"],
        [
          "Work 3 dc (or as written) into the same space.",
          "Faites 3 brides (ou selon le modèle) dans le même espace.",
          "Haz 3 pa (o según el patrón) en el mismo espacio.",
        ]
      ),
      step(
        ["Chain and next cluster", "Ml puis groupe suivant", "Cad y siguiente"],
        [
          "Chain between clusters; repeat around or across.",
          "Ml entre les groupes ; répétez.",
          "Cad entre grupos; repite.",
        ]
      ),
    ],
  },
  {
    id: "tech-catherine-wheel",
    slug: "catherine-wheel",
    key: "catherine_wheel",
    sortOrder: 350,
    title: L("Catherine wheel", "Roue de Catherine", "Rueda de Catalina"),
    tip: L(
      "Fans and decreases that form rolling wheel motifs.",
      "Éventails et diminutions formant des roues.",
      "Abanicos y disminuciones que forman ruedas.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    detect: { pattern: /\bcatherine\s*wheel\b/i },
    steps: [
      step(
        ["Build the fan", "Éventail", "Abanico"],
        [
          "Work the increase / shell half of the wheel as written.",
          "Faites la partie éventail / augmentations.",
          "Teje la parte de abanico / aumentos.",
        ]
      ),
      step(
        ["Decrease to gather", "Diminuez pour ramasser", "Disminuye para juntar"],
        [
          "Work the decrease stitches that pull the fan into a wheel segment.",
          "Faites les diminutions qui ramassent l’éventail.",
          "Haz las disminuciones que juntan el abanico.",
        ]
      ),
      step(
        ["Repeat the motif", "Répétez le motif", "Repite el motivo"],
        [
          "Continue alternating fans and decreases for the Catherine-wheel fabric.",
          "Alternez éventails et diminutions.",
          "Alterna abanicos y disminuciones.",
        ]
      ),
    ],
  },
  {
    id: "tech-jacobs-ladder",
    slug: "jacobs-ladder",
    key: "jacobs_ladder",
    sortOrder: 360,
    title: L("Jacob’s ladder", "Échelle de Jacob", "Escalera de Jacob"),
    tip: L(
      "Chain loops laced through each other like a ladder.",
      "Boucles de ml passées les unes dans les autres.",
      "Lazos de cad pasados unos por otros.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    detect: { pattern: /\bjacob'?s?\s*ladder\b/i },
    steps: [
      step(
        ["Make chain loops", "Boucles de ml", "Lazos de cad"],
        [
          "Work the long chain loops (or chain spaces) listed in the pattern.",
          "Faites les longues boucles / espaces de ml indiqués.",
          "Haz los lazos / espacios de cad largos indicados.",
        ]
      ),
      step(
        ["Lace loops together", "Enfilez les boucles", "Enlaza los lazos"],
        [
          "Pull each loop through the one below (or as shown) to build the ladder.",
          "Passez chaque boucle dans celle du dessous pour l’échelle.",
          "Pasa cada lazo por el de abajo para la escalera.",
        ]
      ),
      step(
        ["Anchor the top", "Ancrez le haut", "Ancla la parte superior"],
        [
          "Secure the final loop with a stitch so the ladder does not unravel.",
          "Fixez la dernière boucle avec une maille.",
          "Fija el último lazo con un punto.",
        ]
      ),
    ],
  },
  {
    id: "tech-larksfoot",
    slug: "larksfoot",
    key: "larksfoot",
    sortOrder: 370,
    title: L("Larksfoot stitch", "Point pied d’alouette", "Punto larksfoot"),
    tip: L(
      "Offset spikes / long stitches that create a larksfoot color pattern.",
      "Mailles longues décalées — motif pied d’alouette.",
      "Puntos largos desplazados — motivo larksfoot.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { pattern: /\blarks?foot\b/i },
    steps: [
      step(
        ["Work the base stitches", "Mailles de base", "Puntos base"],
        [
          "Work the short stitches of the row as written.",
          "Faites les mailles courtes du rang.",
          "Teje los puntos cortos de la hilera.",
        ]
      ),
      step(
        ["Long stitch into the row below", "Maille longue en dessous", "Punto largo abajo"],
        [
          "Insert one or more rows down for the long “spike” stitch.",
          "Piquez une ou plusieurs rangs plus bas pour la maille longue.",
          "Introduce una o más hileras abajo para el punto largo.",
        ]
      ),
      step(
        ["Offset the next color", "Décalez la couleur", "Desplaza el color"],
        [
          "On the next stripe, shift the long stitches so the larksfoot pattern forms.",
          "Au prochain rang couleur, décalez les mailles longues.",
          "En la siguiente franja, desplaza los puntos largos.",
        ]
      ),
    ],
  },
  {
    id: "tech-wave",
    slug: "wave-stitch",
    key: "wave",
    sortOrder: 380,
    title: L("Wave stitch", "Point vague", "Punto ola"),
    tip: L(
      "Increases and decreases that make undulating waves.",
      "Augmentations et diminutions en vagues.",
      "Aumentos y disminuciones en olas.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { pattern: /\bwave\s*stitch\b/i },
    steps: [
      step(
        ["Climb with taller stitches", "Montez en mailles hautes", "Sube con puntos altos"],
        [
          "Work progressively taller stitches up the wave (e.g. sc → hdc → dc).",
          "Passez à des mailles plus hautes (ms → db → bride).",
          "Pasa a puntos más altos (pb → mpa → pa).",
        ]
      ),
      step(
        ["Peak of the wave", "Crête", "Cresta"],
        [
          "Work the tallest stitches at the crest as written.",
          "Les mailles les plus hautes au sommet.",
          "Los puntos más altos en la cresta.",
        ]
      ),
      step(
        ["Descend again", "Redescendez", "Baja de nuevo"],
        [
          "Step back down in height (and/or decrease) to finish the wave.",
          "Redescendez en hauteur (et/ou diminuez).",
          "Baja de altura (y/o disminuye).",
        ]
      ),
    ],
  },
  {
    id: "tech-apache-tear",
    slug: "apache-tear",
    key: "apache_tear",
    sortOrder: 390,
    title: L("Apache tear", "Apache tear", "Apache tear"),
    tip: L(
      "Dropped long stitches that form diagonal “tear” motifs.",
      "Mailles longues tombantes en motif diagonal.",
      "Puntos largos caídos en motivo diagonal.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { pattern: /\bapache\s*tear\b/i },
    steps: [
      step(
        ["Work to the drop point", "Jusqu’au point de chute", "Hasta el punto de caída"],
        [
          "Crochet across until the pattern calls for a long stitch down.",
          "Avancez jusqu’à la maille longue vers le bas.",
          "Avanza hasta el punto largo hacia abajo.",
        ]
      ),
      step(
        ["Long stitch several rows down", "Maille longue plus bas", "Punto largo más abajo"],
        [
          "Insert the hook the required number of rows below and complete the tall stitch.",
          "Piquez le nombre de rangs plus bas et terminez la maille haute.",
          "Introduce el número de hileras más abajo y termina el punto alto.",
        ]
      ),
      step(
        ["Continue the diagonal", "Continuez en diagonal", "Sigue en diagonal"],
        [
          "Repeat so the long stitches travel on a diagonal across the fabric.",
          "Répétez pour faire voyager les mailles en diagonal.",
          "Repite para que los puntos viajen en diagonal.",
        ]
      ),
    ],
  },
  {
    id: "tech-c2c",
    slug: "corner-to-corner",
    key: "c2c",
    sortOrder: 400,
    title: L(
      "Corner to corner (C2C)",
      "Coin à coin (C2C)",
      "Esquina a esquina (C2C)"
    ),
    tip: L(
      "Build a fabric in diagonal blocks from one corner to the opposite.",
      "Tissu en blocs en diagonale d’un coin à l’autre.",
      "Tejido en bloques en diagonal de esquina a esquina.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    detect: { pattern: /\b(c2c|corner\s*to\s*corner)\b/i },
    steps: [
      step(
        ["First block", "1er bloc", "1.er bloque"],
        [
          "Chain the start (often 6), then work the first C2C block into the chain.",
          "Faites les ml de départ (souvent 6), puis le 1er bloc.",
          "Haz las cad de inicio (suele ser 6), luego el 1.er bloque.",
        ]
      ),
      step(
        ["Increase on the edge", "Augmentez sur le bord", "Aumenta en el borde"],
        [
          "Turn, chain, and add a new block on the increase edge each row.",
          "Tournez, ml, et ajoutez un bloc sur le bord d’augmentation.",
          "Gira, cad, y añade un bloque en el borde de aumento.",
        ]
      ),
      step(
        ["Work across existing blocks", "Sur les blocs existants", "Sobre bloques existentes"],
        [
          "Slip stitch to the next block top, chain, and work into each block across.",
          "Mc vers le bloc suivant, ml, travaillez chaque bloc.",
          "Pe al siguiente bloque, cad, teje cada bloque.",
        ]
      ),
      step(
        ["Decrease when the graph says", "Diminuez selon le graphique", "Disminuye según el gráfico"],
        [
          "When decreasing, skip starting a new edge block and continue across the shorter edge.",
          "En diminution, ne démarrez pas de nouveau bloc de bord.",
          "Al disminuir, no inicies un bloque nuevo en el borde.",
        ]
      ),
    ],
  },
  {
    id: "tech-surface",
    slug: "surface-crochet",
    key: "surface",
    sortOrder: 410,
    title: L("Surface crochet", "Crochet de surface", "Crochet de superficie"),
    tip: L(
      "Slip stitches worked on top of fabric to draw lines or outlines.",
      "Mc travaillées sur le tissu pour dessiner des lignes.",
      "Pe trabajados sobre el tejido para dibujar líneas.",
    ),
    sheetCols: 3,
    sheetRows: 1,
    detect: { pattern: /\bsurface\s*crochet\b/i },
    steps: [
      step(
        ["Insert from the front", "Piquez devant", "Introduce por delante"],
        [
          "With yarn behind the work, insert the hook from front to back where the line starts.",
          "Fil derrière, piquez d’avant en arrière au début du trait.",
          "Hilo detrás, introduce de adelante atrás al inicio de la línea.",
        ]
      ),
      step(
        ["Pull up and slip stitch", "Tirez et mc", "Saca y pe"],
        [
          "Yarn over behind, pull up a loop, then slip stitch through the loop on the hook.",
          "Jeté derrière, tirez, puis mc à travers la boucle du crochet.",
          "Hebra detrás, saca, luego pe por el bucle del ganchillo.",
        ]
      ),
      step(
        ["Walk the line", "Suivez le trait", "Sigue la línea"],
        [
          "Keep inserting into neighboring gaps to draw the surface path.",
          "Continuez dans les espaces voisins pour tracer le motif.",
          "Sigue en los huecos vecinos para trazar el motivo.",
        ]
      ),
    ],
  },
  {
    id: "tech-tassel",
    slug: "yarn-tassel",
    key: "tassel",
    sortOrder: 420,
    title: L("Yarn tassel", "Pompon / gland de fil", "Borla de hilo"),
    tip: L(
      "A scrap-yarn tassel for edges, bunting, and finishing.",
      "Gland en restes de fil pour bordures et fanions.",
      "Borla con restos para bordes y banderines.",
    ),
    sheetCols: 2,
    sheetRows: 2,
    detect: { pattern: /\btassel\b/i },
    steps: [
      step(
        ["Wrap yarn", "Enroulez le fil", "Enrolla el hilo"],
        [
          "Wrap yarn many times around a cardboard rectangle (or your hand).",
          "Enroulez le fil autour d’un carton (ou de la main).",
          "Enrolla el hilo alrededor de un cartón (o la mano).",
        ]
      ),
      step(
        ["Tie the top", "Liez le haut", "Ata la parte superior"],
        [
          "Slide a tie under the wraps at one edge and knot tightly.",
          "Passez un lien sous les tours d’un côté et serrez.",
          "Pasa un lazo bajo las vueltas de un lado y aprieta.",
        ]
      ),
      step(
        ["Cut the opposite edge", "Coupez le bord opposé", "Corta el borde opuesto"],
        [
          "Cut through the wraps on the opposite edge to free the fringe.",
          "Coupez les tours du bord opposé pour former les franges.",
          "Corta las vueltas del borde opuesto para formar flecos.",
        ]
      ),
      step(
        ["Neck wrap & trim", "Collier et égalisez", "Cuello y recorta"],
        [
          "Wrap a neck below the tie, then trim the fringe even.",
          "Faites un collier sous le nœud, puis égalisez.",
          "Haz un cuello bajo el nudo y recorta al mismo largo.",
        ]
      ),
    ],
  },
];

export function catalogToTechnique(c: CatalogTechnique, now: string): Technique {
  return {
    id: c.id,
    slug: c.slug,
    key: c.key,
    sortOrder: c.sortOrder,
    published: true,
    title: c.title,
    tip: c.tip,
    youtubeUrl: "",
    sheetCols: c.sheetCols,
    sheetRows: c.sheetRows,
    steps: c.steps.length
      ? c.steps
      : [{ caption: emptyLocalized("Step 1"), body: emptyLocalized("") }],
    updatedAt: now,
  };
}

export function buildDefaultTechniques(): Technique[] {
  const now = new Date().toISOString();
  return TECHNIQUE_CATALOG.map((c) => catalogToTechnique(c, now));
}

/** Add missing catalog techniques and enrich shorter step lists (keeps existing art). */
export function mergeCatalogIntoTechniques(
  existing: Technique[]
): Technique[] {
  const now = new Date().toISOString();
  const byKey = new Map(existing.map((t) => [t.key, t]));
  const byId = new Map(existing.map((t) => [t.id, t]));
  const merged = [...existing];

  for (const c of TECHNIQUE_CATALOG) {
    const prev = byKey.get(c.key) || byId.get(c.id);
    if (!prev) {
      const next = catalogToTechnique(c, now);
      merged.push(next);
      byKey.set(next.key, next);
      continue;
    }

    // Sync step count/text from catalog (grow or shrink); keep imagePath by index.
    if (c.steps.length !== prev.steps.length) {
      const steps = c.steps.map((catalogStep, i) => {
        const old = prev.steps[i];
        return {
          caption: catalogStep.caption,
          body: catalogStep.body,
          imagePath: old?.imagePath,
        };
      });
      const idx = merged.findIndex((t) => t.id === prev.id || t.key === prev.key);
      if (idx >= 0) {
        merged[idx] = {
          ...prev,
          title: c.title,
          tip: c.tip,
          sortOrder: c.sortOrder,
          sheetCols: c.sheetCols,
          sheetRows: c.sheetRows,
          steps,
          updatedAt: now,
        };
        byKey.set(prev.key, merged[idx]);
      }
    }
  }

  return merged.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function detectionRules(): {
  key: string;
  ops: string[];
  pattern?: RegExp;
}[] {
  return TECHNIQUE_CATALOG.filter((c) => c.detect).map((c) => ({
    key: c.key,
    ops: c.detect!.ops || [],
    pattern: c.detect!.pattern,
  }));
}
