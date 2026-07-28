import { prisma } from '@/lib/db';

/**
 * Region-based shipping charges.
 *
 * Rules are matched most-specific-first so a "Kerala local" pincode rule beats a
 * broader "South India" state rule, which in turn beats the default. Admins edit
 * these from /admin/shipping; nothing here is hardcoded.
 */

export type ShippingQuote = {
  fee: number;
  rateName: string;
  etaDays: string | null;
  /** True when the order qualified for free delivery via freeAbove. */
  freeApplied: boolean;
};

export type ShippingRule = {
  id: string;
  name: string;
  fee: number;
  freeAbove: number | null;
  states: string[];
  pincodePrefixes: string[];
  isDefault: boolean;
  sortOrder: number;
  etaDays: string | null;
};

const FALLBACK: ShippingQuote = {
  fee: 0,
  rateName: 'Standard delivery',
  etaDays: null,
  freeApplied: false,
};

function normalise(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Picks the best rule for a destination. Exported separately from the database
 * lookup so it can be unit-tested and reused on already-loaded rules.
 */
export function resolveRule(
  rules: ShippingRule[],
  { state, pincode }: { state?: string | null; pincode?: string | null },
): ShippingRule | null {
  const cleanState = state ? normalise(state) : '';
  const cleanPincode = (pincode ?? '').replace(/\D/g, '');

  // 1. Longest matching pincode prefix wins — the most specific signal we have.
  let bestPincodeRule: ShippingRule | null = null;
  let bestPrefixLength = -1;
  if (cleanPincode) {
    for (const rule of rules) {
      for (const prefix of rule.pincodePrefixes) {
        const clean = prefix.replace(/\D/g, '');
        if (clean && cleanPincode.startsWith(clean) && clean.length > bestPrefixLength) {
          bestPincodeRule = rule;
          bestPrefixLength = clean.length;
        }
      }
    }
  }
  if (bestPincodeRule) return bestPincodeRule;

  // 2. State match.
  if (cleanState) {
    const stateRule = rules.find((rule) =>
      rule.states.some((candidate) => normalise(candidate) === cleanState),
    );
    if (stateRule) return stateRule;
  }

  // 3. Explicit default rule.
  return rules.find((rule) => rule.isDefault) ?? null;
}

export function quoteFromRule(rule: ShippingRule | null, subtotal: number): ShippingQuote {
  if (!rule) return FALLBACK;

  const freeApplied = rule.freeAbove !== null && subtotal >= rule.freeAbove;
  return {
    fee: freeApplied ? 0 : rule.fee,
    rateName: rule.name,
    etaDays: rule.etaDays,
    freeApplied,
  };
}

export async function getShippingRules(): Promise<ShippingRule[]> {
  return prisma.shippingRate.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      fee: true,
      freeAbove: true,
      states: true,
      pincodePrefixes: true,
      isDefault: true,
      sortOrder: true,
      etaDays: true,
    },
  });
}

/**
 * Authoritative shipping quote. Always recomputed on the server at checkout —
 * the browser sends the destination, never the price.
 */
export async function quoteShipping({
  state,
  pincode,
  subtotal,
}: {
  state?: string | null;
  pincode?: string | null;
  subtotal: number;
}): Promise<ShippingQuote> {
  const rules = await getShippingRules();
  return quoteFromRule(resolveRule(rules, { state, pincode }), subtotal);
}
