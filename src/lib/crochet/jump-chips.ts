export type JumpChip = {
  componentId: string;
  round: number;
  label: string;
  anchor: string;
  fo?: boolean;
};

export function roundAnchor(
  componentId: string,
  round: number,
  fo?: boolean
): string {
  return fo ? `r-${componentId}-fo` : `r-${componentId}-${round}`;
}

export function buildJumpChips(
  items: {
    componentId: string;
    rounds: { round: number; fo?: boolean }[];
    stepLabel: string;
  }[]
): JumpChip[] {
  const chips: JumpChip[] = [];
  for (const item of items) {
    for (const r of item.rounds) {
      chips.push({
        componentId: item.componentId,
        round: r.round,
        fo: r.fo,
        label: r.fo ? "FO" : `${item.stepLabel}${r.round}`,
        anchor: roundAnchor(item.componentId, r.round, r.fo),
      });
    }
  }
  return chips;
}
