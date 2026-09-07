# Tokenized-stock country gate — block-list model (2026-09-07)

**Operator decision (Anthony, 2026-09-07):** Bobby does not have counsel. Instead of an
allow-list that needs a legal sign-off per country, the gate is a **block-list**: every
country that is not clearly prohibited stays open. This document is the source for each
entry so the list can be re-checked on a schedule rather than argued from memory.

The gate is `stockCountryAllowed()` in `src/lib/base-swap/tokens.ts`, evaluated by
`api/_lib/base-swap.ts` before any stock calldata is returned. Inputs still fail closed:
no resolvable edge country → no calldata. The human attestation ("I am in an eligible
jurisdiction outside the U.S.") remains a separate, independent gate. Neither is KYC:
the issuer runs its own identity, sanctions and jurisdiction checks for verified holders
and can freeze wallets in restricted jurisdictions.

## Entries and sources

| Tier | Codes | Why | Source |
|---|---|---|---|
| 1 — issuer exclusion | US, PR, GU, VI, AS, MP, UM | Coinbase offers B20 under Regulation S to non-US persons only; US territories are US for securities purposes. | [Base B20 spec](https://docs.base.org/specifications/b20/tokenized-stocks-on-base); [news.bitcoin.com](https://news.bitcoin.com/exchanges/coinbase-tokenized-stocks-go-live-for-eligible-non-us-users/) |
| 2 — comprehensive / broad sanctions | CU, IR, KP, SY | OFAC comprehensive embargoes (also UN/EU). | [Sanction Scanner 2026](https://www.sanctionscanner.com/blog/list-of-sanctioned-countries-by-ofac-un-and-eu-2026-1103) |
| 2 — broad sectoral | RU, BY | Broad sectoral programmes; EU prohibits crypto-asset services to Russian residents. | same |
| 2 — note | (no ISO code) | Crimea, Donetsk, Luhansk and other occupied Ukrainian regions are comprehensively sanctioned but resolve to `UA`, which stays open. Accepted residual; the issuer's own checks are the backstop. | same |
| 3 — FATF black list | MM (IR, KP above) | Countries subject to a call for action. | FATF public statement |
| 4 — statutory crypto ban | CN, DZ, BD, EG, IQ, NP, QA, TN, AF, KW, MA | Holding or trading crypto assets is prohibited by law or central-bank order. Morocco is drafting a licensing law (2025–26) but the 2017 ban is still in force; Bolivia lifted its ban in 2024 and is open. | [Techloy 2026](https://www.techloy.com/7-countries-where-cryptocurrency-is-banned-or-heavily-restricted-in-2026/); [Arristor 2026](https://arristor.com/countries-where-crypto-is-illegal-2026-global-ban-list-risks) |

Deliberately **open** despite regulatory friction (not "clearly prohibited"): GB (FCA
financial-promotions regime), CA (provincial securities registration), SG, JP, KR, AU,
EU/EEA (MiCA does not cover tokenized securities; MiFID does). These are the first
candidates if the operator later wants to tighten.

## Operating the list

- `BASE_STOCK_COUNTRY_BLOCKLIST` in the environment may only **add** ISO alpha-2 codes
  (union). It cannot remove a code that is in the source. Removing one is a code change
  with a new `version` string.
- Review cadence: monthly, or on any OFAC / FATF / issuer announcement. Bump `version`
  on every change; the version is echoed in the `txWithheld` reason so support can tell
  which list refused a user.
- `scripts/test-base-swap.mts` pins every tier and the env-brake semantics.

## Risk statement

This is not legal advice and no counsel reviewed it. The model accepts that some open
jurisdictions regulate securities offerings to retail; Bobby's exposure is limited by
being non-custodial (the user signs; Bobby never holds funds or keys), by the issuer's
own eligibility enforcement, and by the $100 per-ticket cap on stock tokens.
