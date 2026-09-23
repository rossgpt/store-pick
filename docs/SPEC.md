# Store Pick: Picking Console Specification

Version 1.2, September 2026. Owner: Fulfilment Product.

## 1. Purpose

Store Pick is the console a store colleague uses to pick online grocery orders.
A picker is assigned a pick run, which groups several customer orders due for
the same dispatch slot. The picker works through each order line, records what
happened to it, and the console tells the picker and the dispatch team whether
the run is ready to leave the building.

This document describes the behaviour the console must exhibit. It does not
describe screen layout, which is covered separately by the design library.

## 2. Terms

**Pick run.** A batch of orders assigned to one picker in one store, worked
together. A run has a status that summarises the state of all its orders.

**Order line.** One product on one customer order, with an ordered quantity.
Every line ends in exactly one of three outcomes: picked, substituted or nil
picked. Until then it is pending.

**Picked.** The picker found the product and put it in the tote. The picked
quantity is normally the ordered quantity. If the picker found fewer units
than ordered, the line is still recorded as picked, with the lower quantity,
and it counts as a short pick (see section 5).

**Substituted.** The product was not available and the picker chose an
alternative product for the customer instead.

**Nil picked.** The product was not available and no substitute was made. The
customer receives nothing for that line and is refunded. A nil pick is also a
short pick.

**Staging.** Once picking of an order begins, its totes wait in a staging area
until the dispatch van collects them. Ambient totes wait in ambient staging.
Chilled and frozen totes wait in chilled staging.

## 3. The pick run screen

The pick run screen shows the picker's active run. At the top it shows the run
reference, the store, the picker and how long ago the run started, together
with a status chip for the run (section 7) and counts of pending, picked,
substituted and nil picked lines across the whole run.

Below that, each order in the run is shown as a block. The order block shows
the order reference, the customer name, the number of lines and the total
number of units ordered, plus any warning badges the rules below produce.
Under the block header, every line of the order is listed with the product,
its shelf location, its category, the picked and ordered quantity, and its
outcome.

The picker opens a line to record an outcome. They choose one of picked,
substituted or nil picked, supply whatever the chosen outcome requires, and
confirm. The confirm control must not be available until the outcome is
complete and valid under these rules. Once confirmed, the line, the order
badges and the run status update immediately.

## 4. Substitution rules

A substitution is offered to the customer when their chosen product is not
available. The rules below decide whether a line may be substituted at all and
what it may be substituted with.

### 4.1 Same category

A substitute must be a different product in the same category as the ordered
product. Chilled is substituted with chilled, ambient with ambient, and so on.
The console presents only eligible products for selection.

### 4.2 Age restricted products are never substituted

Some products are age restricted at the point of sale: alcohol, tobacco and
pharmacy lines such as paracetamol and ibuprofen. These are flagged as age
restricted in the product record.

An age restricted product must never be substituted, whatever its category.
The customer chose a specific age restricted product and we must not put a
different one into their order without their consent. If an age restricted
product is not available the line is nil picked.

The console must not offer the substitute outcome on an age restricted line.

### 4.3 Maximum of six substitutions per order

Customer research shows satisfaction falls sharply once an order contains more
than a handful of swaps. An order may therefore contain at most **six**
substituted lines.

Once an order has six substitutions, the substitute outcome is not available on
any of its remaining lines. The picker must pick the line as ordered or nil
pick it. The order block shows how many substitutions the order has so far so
the picker can see the limit approaching.

The limit is a per-run setting and is shown on the settings screen. Six is the
value for all stores at present.

## 5. Short pick tolerance

A short pick is any line where the customer receives fewer units than they
ordered: a nil picked line, or a picked line with a lower quantity than
ordered.

Every order has a short pick tolerance. Provided the shortfall stays within
tolerance, the order can be dispatched as normal and the customer is simply
refunded for the missing units. If the shortfall exceeds tolerance, the order
is flagged as **over tolerance** and must be reviewed by the dispatch team,
who will contact the customer before the order leaves.

### 5.1 Calculation

Tolerance is expressed as a percentage of the **units** ordered on the order,
not of the number of lines. The allowance for an order is:

    allowance (units) = floor(total units ordered × tolerance % ÷ 100)

An order is within tolerance if the total number of units short across all its
lines is less than or equal to the allowance.

The tolerance percentage is a per-run setting shown on the settings screen. It
is **ten per cent** for all stores at present.

### 5.2 Worked example

An order has ten lines totalling thirty units. Its allowance is three units.
The picker nil picks one line of five units. Five units short is greater than
three, so the order is over tolerance even though only one of ten lines was
affected. Had the nil picked line been for two units, the order would have
been within tolerance.

Substituted lines are not short: the customer receives the ordered quantity of
the substitute.

## 6. Staging time limits

Once totes are in staging they have a limited life before the order must be
dispatched or re-picked.

### 6.1 Clocks

An order has two staging clocks. The ambient clock starts when the first line
of the order is picked or substituted. The chilled clock starts when the first
chilled or frozen line of the order is picked or substituted. Frozen items use
the chilled staging area and the chilled clock. Nil picks do not start a
clock, because nothing is put in a tote.

### 6.2 Limits

Each clock has a limit, set per run and shown on the settings screen:

* Chilled staging limit: **forty five minutes**.
* Ambient staging limit: **four hours** (two hundred and forty minutes).

While a clock is below its limit the order is fine to dispatch. When a clock
reaches its limit the order is **blocked**: it must not be dispatched, and the
affected totes must be returned to the shop floor or re-chilled before the
order can go. There is no intermediate warning state. Forty five minutes in
chilled staging is the point at which food safety is compromised, so it is the
point at which the order stops.

The order block shows how long the chilled clock has been running and a
blocked badge when either clock has reached its limit. A run containing any
blocked order shows as blocked (section 7).

## 7. Nil pick evidence

A nil pick is the outcome with the greatest cost to the customer, so we require
the picker to prove they looked in the right place.

To nil pick a line the picker must **scan the shelf-edge label** at the
product's recorded shelf location. The console compares the scanned code with
the shelf code on the product record. If they match, the nil pick may be
confirmed. If they do not match, the picker is told the scan did not match and
asked to scan again.

A shelf scan is the only acceptable evidence for a nil pick. There is no
alternative path. If the shelf-edge label is missing or damaged, the picker
raises it with the shop floor team and the line stays pending until the label
is replaced or a supervisor intervenes outside this console.

The line record stores the fact that a shelf scan was captured so that the
customer care team can see the location was checked.

## 8. Run status

The run status chip takes one of four values, evaluated in this order:

1. **Blocked.** Any order in the run has a staging clock at or beyond its
   limit.
2. **In progress.** Any line in the run is still pending.
3. **Needs review.** All lines are complete but at least one order is over its
   short pick tolerance.
4. **Complete.** Every line is complete, every order is within tolerance, and
   no staging clock has expired. The run can be dispatched.

## 9. Settings screen

The second screen shows the settings that apply to the active run, read only:
the store, run reference, picker and start time, and the four rule values
described above (maximum substitutions, short pick tolerance, chilled staging
limit, ambient staging limit). Settings cannot be edited from the console.
