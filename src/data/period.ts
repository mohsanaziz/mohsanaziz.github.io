export interface Period {
  /** Machine month, `YYYY-MM`. */
  start: string;
  /** Machine month, `YYYY-MM`, or `null` while the period is ongoing. */
  end: string | null;
}

export interface MachineMonth {
  year: number;
  month: number;
}

const MACHINE_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function parseMachineMonth(bound: string): MachineMonth {
  const match = MACHINE_MONTH_PATTERN.exec(bound);

  if (!match) {
    throw new Error(`Invalid machine month, expected YYYY-MM: "${bound}"`);
  }

  return { year: Number(match[1]), month: Number(match[2]) };
}

export function machineMonthToIndex(bound: string): number {
  const { year, month } = parseMachineMonth(bound);

  return year * 12 + month - 1;
}
