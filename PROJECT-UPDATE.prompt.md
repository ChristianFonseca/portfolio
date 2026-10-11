# Portfolio update prompt — what changed in a project

> **Uso (Christian):** abre una sesión de Claude Code **dentro del repo del proyecto**, rellena las dos líneas de
> `PROJECT` y `LAST_CARD_UPDATE` de abajo (si no sabes la fecha, deja `unknown`) y pega todo lo que está debajo de
> "COPY FROM HERE". Tráeme la respuesta completa: con eso actualizo el card del portafolio o confirmo que no hace falta.
> Si el proyecto todavía no tiene card, la sesión te lo dirá y habrá que usar `PROJECT-INTAKE.prompt.md`.

---

COPY FROM HERE ↓

PROJECT: <name of the project as it appears on the portfolio, e.g. "Atalaya">
LAST_CARD_UPDATE: <YYYY-MM-DD, or "unknown">

You are running inside the repository of a project that **already has a card** on a personal portfolio
(christianfonseca.dev). A *separate* session maintains that portfolio. Your job is to tell it, precisely and
honestly, **what exists in this project today and what changed since the card was written**, so it can update the
card — or confirm that nothing needs to change. **Write your whole answer in both English and Spanish**, as the
template below shows.

## The two questions you must answer

1. **What has been added to this project since the card was last updated that should appear on the card?**
   / ¿Qué se ha añadido a este proyecto desde la última actualización del card que debería aparecer en él?
2. **If nothing card-worthy was added, has anything else relevant been done?** (infrastructure, security, tests,
   docs, performance, research, deployment) / Si no se añadió nada que merezca estar en el card, ¿se hizo algo más
   que sea relevante?

## Ground rules

1. **Read-only.** Do not modify, create, commit or delete anything. Only read files and run read-only commands.
2. **Verify, don't guess.** Every fact comes from the code, manifests, docs or git history, with its source. Tag
   inferences `(inferred)`. If you cannot determine something, write `unavailable`. **Never invent metrics, dates,
   users or numbers.**
3. **Privacy & security — never output:** secrets, `.env` contents, tokens, credentials, private hostnames/IPs,
   internal URLs, connection strings, personal data, or client/company names under NDA.
4. **Don't ask questions mid-way.** Investigate first; put anything unresolved in section H.
5. **One message, one markdown document**, following the template exactly. No preamble, no closing remarks.

## Step 1 — Read the current card

The published card lives in the portfolio's public knowledge file: **https://christianfonseca.dev/llms.txt**.
Under `## Projects` (or `## Research Projects`) each item is a block that starts with `### <title>`, followed by
its description, a `Highlights:` line (the bullets), `Tech:` and optional `Links:`.

- Fetch it read-only and find the block for PROJECT. Match by name; if the name differs, match by what it describes.
- If you cannot fetch it (no web access), say so in section A and continue using only the repository: the
  maintainer will do the comparison.
- If there is **no block** for this project, answer with verdict `NEW_PROJECT`, fill only sections A and B, and
  tell the owner to run the full intake prompt instead.

## Step 2 — Find what changed

- If LAST_CARD_UPDATE is a date: `git log --since=<date> --oneline --stat`, plus tags/releases since then.
- If it is `unknown`: compare the card's claims against the current code and docs, and use the last 60 days of
  `git log` as context. Say which method you used.
- Check every claim in the card: features, numbers, stack, status, links. Flag anything that is now **outdated,
  wrong or missing**.

Useful read-only commands:
```bash
git log -1 --format='%ad' --date=short                      # last commit
git log --since=<date> --oneline --stat | head -200          # what changed
git tag --sort=creatordate | tail -10                        # recent releases
```

## Output template (fill exactly; keep the letters and field names)

```markdown
# Portfolio update — <project name>

## A. Verdict
- verdict: <UPDATE_NEEDED | NO_CHANGE | NEW_PROJECT>
- card_found: <yes | no | could not fetch llms.txt>
- method: <git log since YYYY-MM-DD | claim-by-claim comparison (date unknown)>
- EN: <one sentence: why>
- ES: <una frase: por qué>

## B. What the project is today (snapshot)
### EN
<3–5 sentences: what it is, what it does now, current status (active / paused / in production / in shadow mode…),
where it runs. Plain language first.>
### ES
<lo mismo, en español neutro (sin voseo)>

## C. Answer to question 1 — added since the card (card-worthy)
<one bullet per item; each with its source (commit hash, file, doc) and date. If none: "none / ninguno".>
- EN: <…> · ES: <…> · source: <…>

## D. What in the current card is outdated or wrong
<quote the card's phrase → what is true now → source. If nothing: "nothing / nada".>
- card says: "<…>" → EN: <correction> · ES: <corrección> · source: <…>

## E. Answer to question 2 — other relevant work (not necessarily for the card)
<infra, security, tests, docs, performance, refactors, research. Each with source. If none: "none / ninguno".>
- EN: <…> · ES: <…> · source: <…>

## F. Proposed card changes (only the fields that should change; omit the rest)
Limits: title ≤ 120 chars · description 250–500 recommended (hard max 600) · bullets: max 12, each ≤ 300
recommended (hard max 400), starting with a past-tense verb and with a real metric when one exists · tech: max 20
items, canonical casing, only what the code really uses.
When you change bullets or tech, give the **full new list**, not a diff.
**No bullets about having tests.** Do not write a bullet whose point is that tests exist or how many there are (e.g. "Wrote 56 automated tests…" / "Escribí 56 pruebas automatizadas…"), and do not append test counts to other bullets ("…, backed by 146 passing tests"). Testing is expected of any serious project, so it reads as filler. Test counts still belong in section E as facts. If the current card has such a bullet or clause, list it in section D
as something to remove.
### EN
- title: <…>
- description: <…>
- bullets: <full list>
- tech: <full list>
- repoUrl / liveUrl: <…>
### ES (español neutro; bullets en primera persona del singular en pasado: "Implementé…", "Diseñé…")
- title: <…>
- description: <…>
- bullets: <lista completa>

## G. Visual assets
- new_since_card: <new screenshots/diagrams/videos in the repo — path — what it shows — good as cover? — or "none">
- suggestion: <1–3 captures worth taking now, if the card has no images>

## H. Open questions for the owner
- <anything you could not verify, or a decision only the owner can make (disclosure, naming, framing)>
```

## Quality bar before you answer

- Both questions (sections C and E) are answered explicitly, even if the answer is "none / ninguno".
- Every new fact and number has a source, or it is `unavailable`.
- EN and ES say the same things; ES is neutral Spanish.
- Section F only contains fields that should change, and respects the limits.
- No proposed bullet is about having tests or a test count (EN or ES).
- Nothing confidential, no secrets, no personal data.
