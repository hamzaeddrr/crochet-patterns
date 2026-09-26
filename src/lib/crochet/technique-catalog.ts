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
    sheetCols: 2,
    sheetRows: 2,
    detect: { ops: ["chain"], pattern: /\b(ch|chain)\b/i },
    steps: [
      step(
        ["Yarn over", "Faites un jeté", "Haz hebra"],
        [
          "With a slip knot on the hook, wrap yarn over the hook.",
          "Avec un nœud coulant, faites un jeté.",
          "Con un nudo corredizo, haz hebra.",
        ]
      ),
      step(
        ["Pull through loop", "Tirez à travers", "Pasa por el bucle"],
        [
          "Pull the yarn through the loop on the hook — one chain made.",
          "Tirez le fil à travers la boucle — une ml.",
          "Pasa el hilo por el bucle — una cadeneta.",
        ]
      ),
      step(
        ["Repeat", "Répétez", "Repite"],
        [
          "Yarn over and pull through again for each chain needed.",
          "Répétez jeté + tirez pour chaque ml.",
          "Repite hebra + pasar por cada cadeneta.",
        ]
      ),
      step(
        ["Count chains", "Comptez", "Cuenta"],
        [
          "The loop on the hook does not count as a chain.",
          "La boucle sur le crochet ne compte pas.",
          "El bucle en el ganchillo no cuenta.",
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
          "Insert the hook into the next stitch.",
          "Piquez dans la maille suivante.",
          "Introduce en el siguiente punto.",
        ]
      ),
      step(
        ["Yarn over", "Jeté", "Hebra"],
        [
          "Yarn over.",
          "Faites un jeté.",
          "Haz hebra.",
        ]
      ),
      step(
        ["Pull through both", "Passez les deux", "Pasa por ambos"],
        [
          "Pull through the stitch and the loop on the hook in one go.",
          "Passez d’un coup la maille et la boucle du crochet.",
          "Pasa de una por el punto y el bucle del ganchillo.",
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
    sheetCols: 2,
    sheetRows: 2,
    detect: { ops: ["magic_ring"], pattern: /\b(mr|magic\s*ring)\b/i },
    steps: [
      step(
        ["Make a loop", "Formez une boucle", "Haz un lazo"],
        [
          "Wrap yarn around your fingers to form a ring, keeping a short tail.",
          "Enroulez le fil pour former un anneau, courte queue.",
          "Enrolla el hilo para formar un anillo, cola corta.",
        ]
      ),
      step(
        ["Insert hook", "Passez le crochet", "Introduce el ganchillo"],
        [
          "Insert the hook into the ring, yarn over, and pull up a loop.",
          "Passez le crochet, jeté, tirez une boucle.",
          "Introduce, hebra y saca un bucle.",
        ]
      ),
      step(
        ["Work stitches", "Travaillez les mailles", "Teje los puntos"],
        [
          "Work the stitches listed into the ring.",
          "Travaillez les mailles dans l’anneau.",
          "Teje los puntos dentro del anillo.",
        ]
      ),
      step(
        ["Pull to close", "Fermez l’anneau", "Cierra el anillo"],
        [
          "Pull the yarn tail to close the center snug.",
          "Tirez la queue pour fermer le centre.",
          "Tira de la cola para cerrar el centro.",
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
    sheetRows: 1,
    detect: { ops: ["sc"], pattern: /\bsc\b/i },
    steps: [
      step(
        ["Insert under both loops", "Piquez sous les 2 brins", "Bajo ambos bucles"],
        [
          "Insert under both top loops of the next stitch.",
          "Piquez sous les deux brins.",
          "Introduce bajo los dos bucles.",
        ]
      ),
      step(
        ["Pull up a loop", "Tirez une boucle", "Saca un bucle"],
        [
          "Yarn over and pull up a loop (2 loops on hook).",
          "Jeté et tirez (2 boucles).",
          "Hebra y saca (2 bucles).",
        ]
      ),
      step(
        ["Pull through both", "Passez les 2", "Pasa por ambos"],
        [
          "Yarn over and pull through both loops — one sc made.",
          "Jeté et passez les deux — 1 ms.",
          "Hebra y pasa por ambos — 1 pb.",
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
    sheetCols: 2,
    sheetRows: 2,
    detect: { ops: ["hdc"], pattern: /\bhdc\b/i },
    steps: [
      step(
        ["Yarn over first", "Jeté d’abord", "Hebra primero"],
        [
          "Yarn over before inserting the hook.",
          "Faites un jeté avant de piquer.",
          "Haz hebra antes de introducir.",
        ]
      ),
      step(
        ["Insert and pull up", "Piquez et tirez", "Introduce y saca"],
        [
          "Insert into the stitch, yarn over, pull up a loop (3 loops).",
          "Piquez, jeté, tirez (3 boucles).",
          "Introduce, hebra, saca (3 bucles).",
        ]
      ),
      step(
        ["Yarn over", "Jeté", "Hebra"],
        [
          "Yarn over again.",
          "Refaites un jeté.",
          "Haz hebra otra vez.",
        ]
      ),
      step(
        ["Pull through all three", "Passez les 3", "Pasa por los 3"],
        [
          "Pull through all three loops — one hdc made.",
          "Passez les trois boucles — 1 db.",
          "Pasa por los tres — 1 mpa.",
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
    sheetCols: 2,
    sheetRows: 2,
    detect: { ops: ["dc"], pattern: /\bdc\b/i },
    steps: [
      step(
        ["Yarn over", "Jeté", "Hebra"],
        [
          "Yarn over.",
          "Faites un jeté.",
          "Haz hebra.",
        ]
      ),
      step(
        ["Insert and pull up", "Piquez et tirez", "Introduce y saca"],
        [
          "Insert, yarn over, pull up a loop (3 loops on hook).",
          "Piquez, jeté, tirez (3 boucles).",
          "Introduce, hebra, saca (3 bucles).",
        ]
      ),
      step(
        ["Pull through two", "Passez 2", "Pasa por 2"],
        [
          "Yarn over, pull through the first two loops (2 left).",
          "Jeté, passez les deux premières (il en reste 2).",
          "Hebra, pasa por los dos primeros (quedan 2).",
        ]
      ),
      step(
        ["Pull through last two", "Passez les 2 dernières", "Pasa por los 2 últimos"],
        [
          "Yarn over, pull through the last two — one dc made.",
          "Jeté, passez les deux dernières — 1 bride.",
          "Hebra, pasa por los dos últimos — 1 pa.",
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
    steps: [
      step(
        ["Yarn over twice", "Deux jetés", "Dos hebras"],
        [
          "Yarn over twice before inserting.",
          "Faites deux jetés.",
          "Haz dos hebras.",
        ]
      ),
      step(
        ["Insert and pull up", "Piquez et tirez", "Introduce y saca"],
        [
          "Insert, yarn over, pull up (4 loops).",
          "Piquez, jeté, tirez (4 boucles).",
          "Introduce, hebra, saca (4 bucles).",
        ]
      ),
      step(
        ["Pull through two, three times", "Passez 2 × 3", "Pasa de 2 en 2"],
        [
          "Yarn over, pull through 2 — repeat until one loop remains.",
          "Jeté, passez 2 — répétez jusqu’à 1 boucle.",
          "Hebra, pasa 2 — repite hasta 1 bucle.",
        ]
      ),
      step(
        ["Tall stitch done", "Point terminé", "Punto listo"],
        [
          "You have one treble crochet.",
          "Vous avez une double bride.",
          "Tienes un punto alto doble.",
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
          "Insert in the next stitch and pull up a loop.",
          "Piquez et tirez une boucle.",
          "Introduce y saca un bucle.",
        ]
      ),
      step(
        ["Loop from next", "Boucle de la suivante", "Bucle del siguiente"],
        [
          "Insert in the following stitch and pull up another loop (3 on hook).",
          "Piquez dans la suivante (3 boucles).",
          "Introduce en el siguiente (3 bucles).",
        ]
      ),
      step(
        ["Pull through all", "Passez tout", "Pasa por todos"],
        [
          "Yarn over and pull through all three loops.",
          "Jeté et passez les trois.",
          "Hebra y pasa por los tres.",
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

/** Add any catalog techniques missing from a stored doc (keeps existing art). */
export function mergeCatalogIntoTechniques(
  existing: Technique[]
): Technique[] {
  const now = new Date().toISOString();
  const byKey = new Map(existing.map((t) => [t.key, t]));
  const byId = new Map(existing.map((t) => [t.id, t]));
  const merged = [...existing];

  for (const c of TECHNIQUE_CATALOG) {
    if (byKey.has(c.key) || byId.has(c.id)) continue;
    const next = catalogToTechnique(c, now);
    merged.push(next);
    byKey.set(next.key, next);
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
