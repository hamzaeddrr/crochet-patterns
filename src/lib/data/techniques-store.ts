import { randomUUID } from "crypto";
import { readJsonDocument, writeJsonDocument } from "@/lib/storage/json-store";
import { emptyLocalized } from "@/types";
import type {
  Technique,
  TechniquePublic,
  TechniquesDocument,
} from "@/types/techniques";

const DOC = "techniques";

function L(en: string, fr: string, es: string) {
  return { en, fr, es };
}

function defaultTechniques(): Technique[] {
  const now = new Date().toISOString();
  return [
    {
      id: "tech-magic-ring",
      slug: "magic-ring",
      key: "magic_ring",
      sortOrder: 10,
      published: true,
      title: L("Magic ring", "Anneau magique", "Anillo mágico"),
      tip: L(
        "A tight center for amigurumi — no hole in the middle.",
        "Un centre bien fermé pour l’amigurumi — sans trou au milieu.",
        "Un centro cerrado para amigurumi — sin agujero en medio."
      ),
      sheetCols: 2,
      sheetRows: 2,
      steps: [
        {
          caption: L(
            "Make a loop with the yarn",
            "Formez une boucle avec le fil",
            "Haz un lazo con el hilo"
          ),
          body: L(
            "Wrap yarn around your fingers to form a ring, keeping a short tail.",
            "Enroulez le fil autour des doigts pour former un anneau, en gardant une courte queue.",
            "Enrolla el hilo en los dedos para formar un anillo, dejando una cola corta."
          ),
        },
        {
          caption: L(
            "Insert hook into the ring",
            "Passez le crochet dans l’anneau",
            "Introduce el ganchillo en el anillo"
          ),
          body: L(
            "Insert the hook into the ring, yarn over, and pull up a loop.",
            "Passez le crochet dans l’anneau, faites un jeté et tirez une boucle.",
            "Introduce el ganchillo en el anillo, haz hebra y saca un bucle."
          ),
        },
        {
          caption: L(
            "Work stitches into the ring",
            "Travaillez les mailles dans l’anneau",
            "Teje los puntos dentro del anillo"
          ),
          body: L(
            "Work the stitches listed in the round into the ring.",
            "Travaillez les mailles indiquées dans le tour à l’intérieur de l’anneau.",
            "Teje los puntos indicados de la vuelta dentro del anillo."
          ),
        },
        {
          caption: L(
            "Pull the tail to close the ring",
            "Tirez le bout pour fermer l’anneau",
            "Tira de la cola para cerrar el anillo"
          ),
          body: L(
            "Pull the yarn tail to close the center snug.",
            "Tirez la queue du fil pour fermer le centre bien serré.",
            "Tira de la cola del hilo para cerrar el centro bien apretado."
          ),
        },
      ],
      updatedAt: now,
    },
    {
      id: "tech-sc",
      slug: "single-crochet",
      key: "sc",
      sortOrder: 20,
      published: true,
      title: L("Single crochet", "Maille serrée", "Punto bajo"),
      tip: L(
        "The basic stitch for most amigurumi rounds.",
        "La maille de base de la plupart des tours d’amigurumi.",
        "El punto básico de la mayoría de vueltas de amigurumi."
      ),
      sheetCols: 3,
      sheetRows: 1,
      steps: [
        {
          caption: L(
            "Insert hook under both loops",
            "Piquez sous les deux brins",
            "Introduce el ganchillo bajo ambos bucles"
          ),
          body: L(
            "Insert the hook under both top loops of the next stitch.",
            "Piquez le crochet sous les deux brins de la maille suivante.",
            "Introduce el ganchillo bajo los dos bucles del siguiente punto."
          ),
        },
        {
          caption: L(
            "Yarn over and pull up a loop",
            "Faites un jeté et tirez une boucle",
            "Haz hebra y saca un bucle"
          ),
          body: L(
            "Yarn over and pull up a loop (2 loops on hook).",
            "Faites un jeté et tirez une boucle (2 boucles sur le crochet).",
            "Haz hebra y saca un bucle (2 bucles en el ganchillo)."
          ),
        },
        {
          caption: L(
            "Yarn over and pull through both loops",
            "Faites un jeté et passez les deux boucles",
            "Haz hebra y pasa por ambos bucles"
          ),
          body: L(
            "Yarn over again and pull through both loops — one sc made.",
            "Faites un jeté et passez les deux boucles — une maille serrée est faite.",
            "Haz hebra de nuevo y pasa por ambos bucles — un punto bajo hecho."
          ),
        },
      ],
      updatedAt: now,
    },
    {
      id: "tech-inc",
      slug: "increase",
      key: "inc",
      sortOrder: 30,
      published: true,
      title: L("Increase", "Augmentation", "Aumento"),
      tip: L(
        "Two stitches in the same place — the fabric grows.",
        "Deux mailles au même endroit — l’ouvrage s’élargit.",
        "Dos puntos en el mismo sitio — la tela crece."
      ),
      sheetCols: 2,
      sheetRows: 2,
      steps: [
        {
          caption: L(
            "Start in one stitch",
            "Commencez dans une maille",
            "Empieza en un punto"
          ),
          body: L(
            "Find the stitch where the increase goes.",
            "Repérez la maille où l’augmentation doit se faire.",
            "Localiza el punto donde va el aumento."
          ),
        },
        {
          caption: L(
            "Work the first sc",
            "Faites la première maille serrée",
            "Teje el primer punto bajo"
          ),
          body: L(
            "Work one single crochet into that stitch.",
            "Faites une maille serrée dans cette maille.",
            "Teje un punto bajo en ese punto."
          ),
        },
        {
          caption: L(
            "Work a second sc in the same stitch",
            "Faites une 2e maille serrée dans la même maille",
            "Teje un segundo punto bajo en el mismo sitio"
          ),
          body: L(
            "Work a second single crochet into the exact same stitch.",
            "Faites une deuxième maille serrée exactement au même endroit.",
            "Teje un segundo punto bajo en el mismo punto exacto."
          ),
        },
        {
          caption: L(
            "Two stitches from one — that is an increase",
            "Deux mailles pour une — c’est une augmentation",
            "Dos puntos de uno — eso es un aumento"
          ),
          body: L(
            "You now have two stitches from one — count them before the next round.",
            "Vous avez deux mailles à partir d’une — comptez avant le tour suivant.",
            "Ahora tienes dos puntos de uno — cuéntalos antes de la siguiente vuelta."
          ),
        },
      ],
      updatedAt: now,
    },
    {
      id: "tech-dec",
      slug: "decrease",
      key: "dec",
      sortOrder: 40,
      published: true,
      title: L("Decrease", "Diminution", "Disminución"),
      tip: L(
        "Two stitches become one — the fabric narrows.",
        "Deux mailles deviennent une — l’ouvrage se rétrécit.",
        "Dos puntos se convierten en uno — la tela se estrecha."
      ),
      sheetCols: 3,
      sheetRows: 1,
      steps: [
        {
          caption: L(
            "Two stitches side by side",
            "Deux mailles côte à côte",
            "Dos puntos uno al lado del otro"
          ),
          body: L(
            "Insert the hook into the next stitch and pull up a loop.",
            "Piquez dans la maille suivante et tirez une boucle.",
            "Introduce el ganchillo en el siguiente punto y saca un bucle."
          ),
        },
        {
          caption: L(
            "Pull up a loop from each stitch",
            "Tirez une boucle dans chaque maille",
            "Saca un bucle de cada punto"
          ),
          body: L(
            "Insert into the following stitch and pull up another loop (3 loops on hook).",
            "Piquez dans la maille d’après et tirez une autre boucle (3 boucles sur le crochet).",
            "Introduce en el siguiente y saca otro bucle (3 bucles en el ganchillo)."
          ),
        },
        {
          caption: L(
            "Yarn over and pull through all loops",
            "Faites un jeté et passez toutes les boucles",
            "Haz hebra y pasa por todos los bucles"
          ),
          body: L(
            "Yarn over and pull through all three loops — one stitch remains.",
            "Faites un jeté et passez les trois boucles — il reste une maille.",
            "Haz hebra y pasa por los tres bucles — queda un punto."
          ),
        },
      ],
      updatedAt: now,
    },
    {
      id: "tech-fo",
      slug: "fasten-off",
      key: "fo",
      sortOrder: 50,
      published: true,
      title: L("Fasten off", "Arrêt du fil", "Cerrar / cortar hilo"),
      tip: L(
        "Secure the last stitch so the work does not unravel.",
        "Fixez la dernière maille pour que le travail ne se défasse pas.",
        "Asegura el último punto para que no se deshaga."
      ),
      sheetCols: 3,
      sheetRows: 1,
      steps: [
        {
          caption: L(
            "Cut yarn, leaving a tail",
            "Coupez le fil en gardant une queue",
            "Corta el hilo dejando una cola"
          ),
          body: L(
            "Cut the yarn, leaving a tail long enough to weave in (or sew pieces).",
            "Coupez le fil en laissant une queue assez longue pour rentrer (ou coudre).",
            "Corta el hilo dejando cola suficiente para esconder (o coser)."
          ),
        },
        {
          caption: L(
            "Yarn over and pull the tail through",
            "Faites un jeté et tirez la queue",
            "Haz hebra y tira de la cola"
          ),
          body: L(
            "Yarn over and pull the tail all the way through the last loop.",
            "Faites un jeté et tirez la queue entièrement à travers la dernière boucle.",
            "Haz hebra y pasa la cola del todo por el último bucle."
          ),
        },
        {
          caption: L(
            "Tighten — then weave in the end",
            "Serrez — puis rentrez le fil",
            "Aprieta — luego esconde el extremo"
          ),
          body: L(
            "Pull tight, then weave the end into the wrong side of the work.",
            "Serrez, puis rentrez le fil sur l’envers de l’ouvrage.",
            "Aprieta y esconde el extremo por el revés del trabajo."
          ),
        },
      ],
      updatedAt: now,
    },
  ];
}

function emptyDoc(): TechniquesDocument {
  return { version: 1, techniques: defaultTechniques() };
}

export async function readTechniquesDoc(): Promise<TechniquesDocument> {
  const doc = await readJsonDocument<TechniquesDocument>(DOC, emptyDoc());
  if (!doc.techniques?.length) return emptyDoc();
  return doc;
}

export async function saveTechniquesDoc(
  doc: TechniquesDocument
): Promise<void> {
  await writeJsonDocument(DOC, doc);
}

export async function listTechniques(): Promise<Technique[]> {
  const doc = await readTechniquesDoc();
  return [...doc.techniques].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getTechniqueById(
  id: string
): Promise<Technique | undefined> {
  const doc = await readTechniquesDoc();
  return doc.techniques.find((t) => t.id === id);
}

export async function getTechniqueBySlug(
  slug: string
): Promise<Technique | undefined> {
  const doc = await readTechniquesDoc();
  return doc.techniques.find((t) => t.slug === slug);
}

export async function getPublishedTechniques(): Promise<TechniquePublic[]> {
  const list = await listTechniques();
  return list.filter((t) => t.published).map(toPublic);
}

export function toPublic(t: Technique): TechniquePublic {
  return {
    id: t.id,
    slug: t.slug,
    key: t.key,
    sortOrder: t.sortOrder,
    title: t.title,
    tip: t.tip,
    youtubeUrl: t.youtubeUrl,
    sheetPath: t.sheetPath,
    sheetCols: t.sheetCols,
    sheetRows: t.sheetRows,
    steps: t.steps,
    professionallyReady: t.professionallyReady ?? t.technicallyApproved,
    technicallyApproved: t.technicallyApproved,
  };
}

export async function upsertTechnique(
  input: Partial<Technique> & { id?: string }
): Promise<Technique> {
  const doc = await readTechniquesDoc();
  const now = new Date().toISOString();
  const existingIdx = input.id
    ? doc.techniques.findIndex((t) => t.id === input.id)
    : -1;

  if (existingIdx >= 0) {
    const prev = doc.techniques[existingIdx];
    const next: Technique = {
      ...prev,
      ...input,
      id: prev.id,
      slug: (input.slug || prev.slug).trim(),
      key: (input.key || prev.key).trim(),
      sheetCols: Math.max(1, input.sheetCols ?? prev.sheetCols),
      sheetRows: Math.max(1, input.sheetRows ?? prev.sheetRows),
      steps: input.steps ?? prev.steps,
      updatedAt: now,
    };
    doc.techniques[existingIdx] = next;
    await saveTechniquesDoc(doc);
    return next;
  }

  const id = input.id || `tech-${randomUUID().slice(0, 8)}`;
  const created: Technique = {
    id,
    slug: (input.slug || id).trim(),
    key: (input.key || input.slug || id).trim(),
    sortOrder: input.sortOrder ?? (doc.techniques.length + 1) * 10,
    published: input.published ?? false,
    title: input.title || emptyLocalized("New technique"),
    tip: input.tip || emptyLocalized(""),
    youtubeUrl: input.youtubeUrl || "",
    sheetPath: input.sheetPath,
    sheetCols: Math.max(1, input.sheetCols ?? 2),
    sheetRows: Math.max(1, input.sheetRows ?? 2),
    steps: input.steps?.length
      ? input.steps
      : [
          {
            caption: emptyLocalized("Step 1"),
            body: emptyLocalized(""),
          },
        ],
    updatedAt: now,
  };
  doc.techniques.push(created);
  await saveTechniquesDoc(doc);
  return created;
}

export async function deleteTechnique(id: string): Promise<boolean> {
  const doc = await readTechniquesDoc();
  const next = doc.techniques.filter((t) => t.id !== id);
  if (next.length === doc.techniques.length) return false;
  doc.techniques = next;
  await saveTechniquesDoc(doc);
  return true;
}

export async function patchTechnique(
  id: string,
  patch: Partial<Technique>
): Promise<Technique | null> {
  const doc = await readTechniquesDoc();
  const idx = doc.techniques.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const next: Technique = {
    ...doc.techniques[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  doc.techniques[idx] = next;
  await saveTechniquesDoc(doc);
  return next;
}
