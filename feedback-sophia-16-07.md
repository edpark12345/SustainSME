# Testing feedback — Sophia Colville, 16.07.26

Source: `SustainSME Testing Notes Sophia Colville 16.07.26.pdf`. Feedback text kept verbatim.
Status: ✅ done · 🐞 bug fixed · ✔️ already implemented · ◻️ deferred (planned) · 💬 noted / discussion.

_Worked through 2026-07-20. 24 implemented + 1 bug fixed + 1 already-in-place; 4 deferred; 5 noted._

## Company onboarding
| Topic | Feedback (verbatim) | Status | What & how |
|---|---|---|---|
| Entity size undefined | 'Entity size' is subjective without any explanation around what ie small means (e.g. are we looking at this by revenue, employee headcount etc)… | ✅ | Added help text under the field: "Based on employee headcount and annual revenue — used only to choose the right peer group for benchmarking." `Onboarding.tsx` |
| Country ambiguous | 'Country' is misleading by itself. Add a reference to headquarter location maybe?… Same comment for region. | ✅ | Relabelled to **Country (headquarters)** + hint "Your head-office country — not every site. Sets the default grid factor."; Region → **Region (of headquarters)**. `Onboarding.tsx` |
| Staff housing wording | For operational boundary, change from 'energy for staff housing often...' to 'sometimes'… | ✅ | Changed "often" → "sometimes" and added "Most SMEs exclude it." `Onboarding.tsx` |
| Reporting year period | Reporting year – need to be able to clarify… what months are included… Ie difference between FY24 and CY24… | ✅ | Added hint: "The 12 months this covers — calendar year unless fiscal (e.g. FY24 = Apr 2023–Mar 2024). This drives which emission factors we apply." `Onboarding.tsx` |

## Scope 1
| Topic | Feedback (verbatim) | Status | What & how |
|---|---|---|---|
| Heating oil example | Give an example of what 'heating oil' is to make it really clear for them. | ✅ | Option label now "Heating oil (e.g. kerosene / gas oil / red diesel)". `GuidedEntry.tsx` |
| 'I don't know' option | Have you thought about the pros and cons of putting an 'I don't know' option? | 💬 | Already covered: each heating fuel has "Estimate it for me" and vehicles have "estimate from number of vehicles" — that IS the "don't know" path, flagged `estimated`. No separate control needed. |
| Multiple sites | …Are you making the assumption that all the companies doing this only have one site?… What happens if they have more than one site, different heating methods, floor areas etc. | ◻️ | Deferred. Tool currently models one primary site. Multi-site (per-site heating/area/methods) is a data-model change — next iteration. |
| Electric vehicles missing | Electric vehicles (particularly hybrids) are super popular now, there is no option for this… otherwise they will get stuck. | ✅ | Added **"Fully electric (battery)"** fuel option → 0 Scope 1 with note that charging is counted under electricity (Scope 2). Added guidance: "Plug-in/hybrid: pick the liquid fuel you refuel with — that's the Scope 1 part." `GuidedEntry.tsx` |
| Vehicle type/size | …SMEs in countries like the Phillipines, India etc are more likely to have motorbikes… add an additional selection box where they can provide the primary vehicle type / size. | ◻️ | Deferred. Currently uses an average light-commercial fuel benchmark. A vehicle type/size selector (car/van/motorbike) feeding type-specific benchmarks is planned. |
| Distance in km | You do not reference anywhere that they need to provide the distance travelled in km… This will be a surprise to them if they… look at the example 'extracted & structured data – review' table. | ✅ | Root cause: the review table showed a **"Distance km" column** that the calc never uses (backend `mobile()` only computes from litres or vehicle count — distance is explicitly skipped). Fix: (1) **removed the misleading "Distance km" column** from the mobile review table (`ExtractionSummary.tsx`); (2) added a note in the guided entry: "We work from fuel used (litres) or the number of vehicles — you don't need distance travelled." (`GuidedEntry.tsx`). Now consistent everywhere. |
| Prefill reporting year | Can you get it to prefill information such as reporting year based on what the supplier provides in the onboarding page?… | ✅ | Boundary now prefills **reporting year + HQ country** from the onboarding profile on load (only if empty). `EmissionsWorkbench.tsx` |
| 'Primary building type' | …you need to change 'building type' also to 'primary building type'. | ✅ | Relabelled to **Primary building type**. `EmissionsWorkbench.tsx` |
| Electricity is Scope 2 | '…we'll estimate consumption from energy-intensity benchmarks…' This sentence appears on this scope 1 page, but electricity consumption… falls into scope 2. | ✅ | Reworded the estimate note to be scope-correct: heating fuel (Scope 1) on the Scope 1 page, purchased electricity (Scope 2) on the Scope 2 page. `EmissionsWorkbench.tsx` |

## Scope 2
| Topic | Feedback (verbatim) | Status | What & how |
|---|---|---|---|
| 'Captive drawal' jargon | 'captive drawal split' this is language I am not familiar with at all… confusing language for your average person. | ✅ | Removed the phrase. Now plain: "if some of your power is generated on-site (e.g. your own solar), tell us how much of the total came from the grid — the grid part is what counts." `Scope2.tsx`, `EmissionsWorkbench.tsx` |
| Simplify 'green/PPA' | 'green certificate / PPA' – simplify and say something like 'a form of renewable energy certificate'. | ✅ | Reworded to "a form of renewable-energy certificate (e.g. REC, GO, or a renewable power contract)". `Scope2.tsx` |
| Landlord-billed utilities | …where companies rent office space, they get charged by landlords for utilities based on floor area… it is currently not clear that this is an option for them. | ✅ | Added note: "Renting and billed by the landlord for utilities by floor area? Enter your apportioned share as Total kWh — it's better data than an estimate." `EmissionsWorkbench.tsx` |
| Duplicate data entry | …asking them to give a kWh in a text box, as well as upload the source file. What does the AI do if they provide conflicting figures… Do you really need them to add the data twice? | ✅ | Reworded + note: "Read the kWh off your bill — or just upload the bill and we'll read it (no need to enter it twice). If both are given, your uploaded bill takes precedence." `GuidedEntry.tsx` |
| Explain field terms | You need to explain the difference between 'open-access [renewable]', 'tariff' and 'green'… | ✅ | Relabelled fields (On-site solar / Renewable via contract / Supplier · tariff name / Renewable certificate (REC/GO/PPA)) + added a plain-language explainer of each term. `EmissionsWorkbench.tsx` |

## Scope 3
| Topic | Feedback (verbatim) | Status | What & how |
|---|---|---|---|
| Relevance selection source | The automatic selection… is 'manufacturing / industry', but Sold Products GHG scope categories are not selected here? Where are you getting your selections information from? | 💬 | Prefill comes from a sector→archetype map (screen already says "Pre-filled for {archetype} based on your sector"). Sold-Products (Cat 10/11/12) aren't auto-selected because they depend on product type, not sector alone — hence the new prompt to review the other categories (below). Can default Cat 11 on for product manufacturers if wanted. |
| Review hidden categories | Show / Hide other categories (8)… I think you should give the supplier an instruction to review these… | ✅ | Added instruction: "please open and review them, and mark any that do apply"; relabelled "Show" → "Review other categories (n)". `Scope3Relevance.tsx` |
| Explain 'EEIO' | 'official EEIO factors.' They won't know what this is. Put a simple explanation instead? | ✅ | Reworded to plain language: "official 'money-to-emissions' factors published per industry (kg CO₂e per € spent)". `Scope3SpendEntry.tsx` |
| Waste skip follow-up | If you are giving them the instruction to 'skip waste for now' – when are we prompting them to go back and complete it? | ✅ | Skipping now shows a reminder that waste will appear as "not yet provided" in the Scope 3 **coverage map**, prompting them to return. `Scope3WasteEntry.tsx` + coverage map. |
| Waste tonnage bug | I could not select 'I know our annual waste tonnage' – not sure if there is a bug or if you haven't built this out yet? | 🐞 | **Bug fixed.** The mode was derived from whether tonnage was set, so choosing the (empty) tonnage option flipped straight back to estimate. Made the mode explicit UI state → the tonnage option stays selected and shows its field. Verified in browser. `Scope3WasteEntry.tsx` |
| Use of sold products | Use of sold products is notoriously difficult… We have not yet developed one for processing/end of life… I can't see some text boxes for other scope 3 categories either e.g. PG&S. | ◻️ | Deferred. Cat 10/11/12 are relevance-flag-only (shown in the coverage map, not yet quantified) — awaiting your sample data/template. Note: **PG&S = Cat 1 and IS built** (the "Purchased goods & services" spend entry). |
| FERA auto-calc | You don't need the SME to provide data for FERA, you can calculate this yourself based on scopes 1 and 2. | ✔️ | Already implemented — **Cat 3 (FERA) is auto-derived from the Scope 2 electricity**, no SME input. Matches your recommendation. |
| Excel upload for travel | Why have you gone for a text box upload with no source document file upload? …suppliers want to give Excels for PG&S, business travel etc… | ◻️ | Deferred. Document upload + AI extraction exists for Scope 1/2; extending Excel upload to Scope 3 spend/travel is planned. For now these are manual totals. |
| Flight class overlap | these on the surface to the supplier will likely be the same thing… Same for domestic / short haul – there is some cross over. | ✅ | Added distinguishing descriptions: domestic = within your country; short-haul = international ≤ ~3,700 km; long-haul > ~3,700 km; international = mixed average. `Scope3TravelEntry.tsx` |
| Hotel stays optional | You currently have hotel stays as an option… This is currently an optional category according to the GHG Protocol… | ✅ | Labelled "Hotel stay (nights) — optional under the GHG Protocol" (kept, since the Protocol is under review). `Scope3TravelEntry.tsx` |

## Employee commuting
| Topic | Feedback (verbatim) | Status | What & how |
|---|---|---|---|
| Numbeo attribution | …this is what we use to estimate employee commuting emissions – a website call numbeo: Traffic… you need to use an attribution on your tool to link back to Numbeo… | 💬 | We don't use Numbeo — commuting uses a documented screening default (22 km/day round-trip × 220 days), refinable with a survey. If we adopt Numbeo we'll add the required attribution. Noted for the data-source decision; keen on your upload-field template. |

## Uploaded Source Documents
| Topic | Feedback (verbatim) | Status | What & how |
|---|---|---|---|
| Accept image uploads | You currently don't have images included as an listed example e.g. Jpeg… try and see if you can accommodate that data ingestion via image… | ✅ | Ingestion already accepts JPG/PNG; the example text now says "or a photo/screenshot (JPG, PNG)". `EmissionsWorkbench.tsx` |

## Other general comments
| Topic | Feedback (verbatim) | Status | What & how |
|---|---|---|---|
| Unit conversion assumptions | …the AI converts miles to km if they upload a PDF of data in miles. Happy to jump on a call… | 💬 | Yes — the engine has a documented unit-conversion layer (m³/litre/kg/tonne → a fuel's base unit; miles→km in mapping). Happy to walk through the assumptions on a call. |
| Licensed emission factors | What thoughts have you had around using emission factors that require a license e.g. IEA, or alternatives that don't require a license? | 💬 | Deliberately using free/open factors (EPA, DEFRA, ADEME, IPCC, World Bank) to avoid licence constraints. The factor library is swappable, so a licensed set (e.g. IEA grid) can drop in later. |
| Auditability concern | I was not aware you were promoting this as an auditable tool… if you are layering so many assumptions / averages… it would be hard to get audit sign off. | ✅ | Reframed. Softened all "auditable" claims to **"transparent / fully-documented / traceable, screening-grade — not a certified/assured inventory"** and kept the disclaimer. `AllCalculations.tsx`, `ReportPreview.tsx`, `EmissionsWorkbench.tsx` |

## Follow-ups to raise with Sophia
- She offered **sample data/templates** for: use of sold products (Cat 11), and the **commuting upload fields** (Numbeo-based). Request these to build Cat 11 + commuting upload.
- Confirm whether the **manufacturing archetype** should default Cat 11 (use of sold products) to relevant.
- Offer the call she suggested to walk through calculation assumptions.
