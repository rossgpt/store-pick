# Store Pick: facilitator notes

Ten planted items. None are marked in the code. The spec is `docs/SPEC.md`;
the seed is `scripts/seed.mjs`. Re-run `npm run seed` right before the session
so the staging clocks land where the notes say.

## Spec divergences

### 1. Substitution cap is eight, spec says six

- **Where:** `src/rules/substitution.ts:5` (`MAX_SUBSTITUTIONS_PER_ORDER = 8`).
  The settings screen reads `max_substitutions = 6` from the database, and
  that value is never passed into the rule.
- **Seed:** ORD-1041 already has six substitutions and one pending line
  (Orange Juice 1L). Open it, and the Substituted tab is still enabled.
- **Question:** "The settings screen says six. Where in the code is that six
  actually enforced?"

### 2. Tolerance is calculated on lines, spec says units

- **Where:** `src/rules/shortPick.ts:18` (allowance uses
  `orderLines.length`) and `:22` (compares a count of short lines).
- **Seed:** ORD-1043 has ten lines, thirty units, and one nil pick of five
  units. By units it is over tolerance (5 > 3). The UI shows "within
  tolerance" because 1 line ≤ floor(10 × 10%) = 1.
- **Question:** "Hannah Li is missing five of thirty units. Why does her
  order say within tolerance? Walk me through the allowance."

### 3. Chilled staging warns at 45, blocks at 60

- **Where:** `src/rules/staging.ts:11` (`BLOCK_GRACE_MINUTES = 15`) and
  `:24` (block threshold adds the grace).
- **Seed:** ORD-1042 chilled clock started 52 minutes before seeding. It
  shows an amber "chilled N min" badge but no "dispatch blocked" badge, and
  the run is "In progress" rather than "Blocked".
- **Question:** "Tom Okafor's chilled totes have been out for over forty
  five minutes. The spec says there is no intermediate warning state. What
  is the amber badge, and when does this order actually block?"

### 4. Age restriction check is by category, not by flag

- **Where:** `src/rules/substitution.ts:7` (`NEVER_SUBSTITUTE` lists only
  alcohol and tobacco; `product.ageRestricted` is never read).
- **Seed:** ORD-1044 has Paracetamol 500mg 16 Tablets (pharmacy, flagged
  18+). Open it: the Substituted tab is enabled and offers Ibuprofen and
  the 32-caplet paracetamol. Merlot on the same order is correctly blocked.
- **Question:** "The row says 18+. Why can I substitute paracetamol but not
  Merlot? What field decides?"

### 5. Nil pick accepts a typed reason after two failed scans

- **Where:** `src/rules/nilPick.ts:8` (`FAILED_SCANS_BEFORE_TYPED_REASON`)
  and `:26` (the `typed_reason` evidence branch). Surfaced in
  `src/components/LineActionPanel.tsx:178`.
- **Seed:** ORD-1044 Sourdough Loaf is already nil picked via this path
  ("Reason: Shelf label missing, bay empty"). To reproduce live, open any
  pending line, choose Nil pick, scan anything wrong twice.
- **Question:** "Section 7 says a shelf scan is the only acceptable
  evidence. What is this 'Reason:' text on the sourdough line, and how did
  the picker get there?"

## Design faults

### 6. Primary button has no hover state

- **Where:** `src/components/Button.tsx:6` (primary variant has no `hover:`
  class; compare the secondary variant on the next line).
- **Question:** "Hover over Confirm in the panel, then over Cancel. Which
  one reacts?"

### 7. Substitution badge has a 20px left margin, others 12px

- **Where:** `src/components/Badge.tsx:17` (`ml-[20px]`; every other tone
  uses `ml-[12px]`).
- **Question:** "Look at the badge row on ORD-1041. Why is the gap before
  '6 substitutions' wider than the gap before 'chilled'?"

### 8. Run status chip sits 2px above centre

- **Where:** `src/components/StatusChip.tsx:13` (`relative -top-0.5`).
- **Question:** "Is the 'In progress' chip vertically centred against
  RUN-0923-A? Measure it."

### 9. Disabled Confirm looks identical to enabled

- **Where:** `src/components/Button.tsx:17` (no `disabled:` styling on the
  shared button). The Confirm button is disabled at
  `src/components/LineActionPanel.tsx:196`.
- **Seed:** Open any pending line, choose Substituted or Nil pick, and look
  at Confirm before you have supplied anything.
- **Question:** "Can you tell whether Confirm is clickable right now without
  clicking it?"

### 10. Long product names overflow their cell

- **Where:** `src/components/OrderLineRow.tsx:25` (`whitespace-nowrap` on a
  fixed-width cell with no `truncate` or `overflow-hidden`).
- **Seed:** ORD-1044, "Kids' Multigrain Breakfast Cereal with Honey, Almonds
  & Dried Blueberries Family Pack 1.2kg" runs across the Shelf and Category
  columns.
- **Question:** "What happened to the shelf code on the cereal line?"
