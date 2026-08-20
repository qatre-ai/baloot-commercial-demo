type InstrumentInput = {
  registrationInstrument?: unknown;
  primaryInstrument?: unknown;
  secondaryInstruments?: unknown;
};

export type ResolvedInstrumentProfile = {
  registrationInstrument: string | null;
  primaryInstrument: string | null;
  secondaryInstruments: string | null;
};

function normalizeValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseSecondaryInstruments(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(normalizeValue).filter(Boolean);
  }

  const text = normalizeValue(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeValue).filter(Boolean);
    }
  } catch {
    // Treat legacy comma-separated values as a compatible input.
  }

  return text.split(",").map((item) => item.trim()).filter(Boolean);
}

export function resolveInstrumentProfile(
  input: InstrumentInput,
): ResolvedInstrumentProfile {
  const registrationInstrument = normalizeValue(input.registrationInstrument);
  const requestedPrimaryInstrument = normalizeValue(input.primaryInstrument);
  const primaryInstrument =
    requestedPrimaryInstrument || registrationInstrument;
  const registrationKey = registrationInstrument.toLowerCase();
  const uniqueInstruments = new Map<string, string>();

  for (const instrument of parseSecondaryInstruments(
    input.secondaryInstruments,
  )) {
    const key = instrument.toLowerCase();
    if (key === registrationKey) continue;
    if (key === "none") continue;
    uniqueInstruments.set(key, instrument);
  }

  const secondaryInstruments = [...uniqueInstruments.values()];

  return {
    registrationInstrument: registrationInstrument || null,
    primaryInstrument: primaryInstrument || null,
    secondaryInstruments:
      secondaryInstruments.length > 0
        ? JSON.stringify(secondaryInstruments)
        : null,
  };
}
