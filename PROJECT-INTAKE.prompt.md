# Portfolio intake prompt — Projects & Research

> **Uso (Christian):** abre una sesión de Claude Code **dentro del repo del proyecto**, pega todo lo que está debajo de la línea
> "COPY FROM HERE", y tráeme el resultado (un solo bloque markdown). Con eso creo el card nuevo o actualizo el
> existente en Projects / Research Projects. Si el repo tiene varios productos, la sesión devolverá un dossier por producto.

---

COPY FROM HERE ↓

You are running inside the repository of a software or research project. Your job is to produce a **complete, verifiable intake dossier** about this project so that a *separate* session (the maintainer of a personal portfolio site) can create or update a portfolio card for it. That maintainer will do the final editing; your job is to be exhaustive, precise and honest.

## Ground rules

1. **Read-only.** Do not modify, create, commit or delete anything in this repository. Only read and run read-only commands (`git log`, `git tag`, listing files, reading manifests/docs).
2. **Verify, don't guess.** Every fact must come from the code, manifests, docs, README, changelog, CI/infra files or git history. If something is an inference, tag it `(inferred)`. If you cannot determine it, write `unavailable` — **never invent metrics, dates, users, numbers or affiliations.**
3. **Privacy & security — never output:** secrets, `.env` contents, tokens/keys, credentials, private hostnames/IPs, internal URLs, database connection strings, personal data, or client/company names covered by NDA. If the project is confidential, say so and describe it generically. If the repository is private, say so (the portfolio will show it as "Private" and omit the repo link).
4. **Don't ask questions mid-way.** Investigate first; put anything you could not resolve in the final "Open questions" section.
5. **One message, one markdown document.** Follow the output template below **exactly** (same section letters and field names), no preamble, no closing remarks. If the repo contains several distinct products, output one full dossier per product (max 3) and say so at the top.

## What to investigate (checklist)

- `README*`, `docs/`, `CHANGELOG*`, `CONTRIBUTING*`, `LICENSE*`, wiki-like folders, ADRs, design docs, notebooks' markdown cells.
- Package/dependency manifests: `package.json`, `pyproject.toml`, `requirements*.txt`, `Cargo.toml`, `go.mod`, `pom.xml`, `*.csproj`, `environment.yml`, lockfiles.
- Infra & deployment: `Dockerfile*`, `docker-compose*`, Kubernetes/Helm, Terraform/CloudFormation, CI workflows (`.github/workflows`, `.gitlab-ci.yml`, etc.), `vercel.json`, `fly.toml`, `Procfile`, extension manifests (e.g. VS Code `package.json` `contributes`), Marketplace/store listings.
- Source layout: entry points, main modules/services, APIs (routes/endpoints), data models/schemas, ML training/eval code, configs.
- Tests: framework, count of test files/cases, coverage config/reports if present.
- Git: first commit date, last commit date, tags/releases, rough commit count, whether it is still active.
- Research signals: papers/preprints, DOIs, citations in README, datasets, experiment configs, metrics tables, institution/lab/grant mentions, ethical/medical disclaimers.
- Visual assets: screenshots, GIFs, diagrams, figures, demo videos (paths inside the repo or linked from README).

Useful commands (read-only):
```bash
git log --reverse --format='%ad' --date=short | head -1     # first commit
git log -1 --format='%ad' --date=short                       # last commit
git rev-list --count HEAD; git tag --sort=creatordate | tail -20
git shortlog -sn --all | head            # contributors (for "solo vs team" only — do not list personal emails)
```

## Output template (fill exactly; keep the letters and field names)

```markdown
# Portfolio intake — <project name>

## A. Identity
- name:
- one_line: <≤120 chars — what it is, for a busy reader>
- plain_language_summary: <2–4 sentences a non-technical person understands: the problem, who it is for, what it does>
- status: <active | maintained | paused | archived> — evidence: <last commit date / release cadence>
- team: <solo | team (N contributors)> — role of the repo owner if evident (inferred allowed)
- visibility: <public | private> (repository)
- repoUrl: <full URL, or "" if private/none>
- liveUrl: <production/demo URL, or "">
- other_links: <docs, Marketplace/store listing, demo video, dataset, DOI, blog post — label each>
- license: <SPDX id or "none found">

## B. Classification (Project vs Research)
- recommendation: <Project | Research | Either (explain)>
- signals_for_project: <shipped product, users/customers, live URL, product UX, CI/CD, releases…>
- signals_for_research: <institution/lab, grant, papers/preprints, datasets, experiments & metrics, novelty claims, academic disclaimers…>
- confidence: <high | medium | low> — one sentence why

## C. Timeline
- first_commit: <YYYY-MM-DD>  → startDate: <YYYY-MM>
- last_commit: <YYYY-MM-DD>   → endDate: <YYYY-MM, or "" if ongoing/active>
- milestones: <dated bullets from tags/changelog/releases, most important 3–8>

## D. Technology
- tech_primary: <5–12 canonical names with proper casing, e.g. "PyTorch", "Next.js", "PostgreSQL", "FastAPI" — these become badges>
- tech_secondary: <other notable libs/services/tools>
- architecture: <3–8 lines: main components, data flow, storage, external services, where it runs (cloud/provider/container), how it is deployed>
- scale_and_ops: <anything verifiable about performance, load, data volume, cost controls, observability — else "unavailable">

## E. What it does — verifiable facts
- core_features: <bulleted; for each, where you verified it (file/module/doc)>
- hardest_problems_solved: <3–6 bullets — the genuinely difficult/differentiating parts and how they were solved>
- quantitative_facts: <ONLY verifiable numbers with their source: tests/coverage, latency, throughput, dataset sizes, model metrics, users/downloads, lines/modules, supported formats… If none: "unavailable">
- security_privacy_reliability: <auth model, secrets handling, hardening, backups, rate limits, validation, guardrails, human-in-the-loop — only what exists>
- limitations_and_disclaimers: <known limits, "not a medical device"-type statements, experimental status>

## F. Research-only fields (fill if B recommends Research or Either; else "N/A")
- institution: <official name in its original language>  · institutionUrl: <or "">
- department: <lab/center/department, original language>  · departmentUrl: <or "">
- funding_or_grant: <if stated>
- datasets: <name — size — public/private — link>
- methods_and_evaluation: <approach, baselines, metrics reported, validation protocol>
- papers:
  - name: <full title> · url: <DOI/arXiv/PDF or ""> · authors: <"A. Last, B. Last, …" or ""> · venue/year: <…> · status: <published | preprint | in progress>

## G. Visual assets (for a 16:9 cover + gallery of up to 12 images; PNG/WebP/GIF — GIFs become animated)
- assets_in_repo: <path — what it shows — approx resolution/orientation — good as cover? (yes/no)>
- demo_video_or_gif: <path/URL or "none">
- if_none_suggest: <3 concrete screenshots/diagrams worth capturing to represent the project>

## H. Portfolio-ready drafts (the maintainer will edit for voice; respect the limits)
### EN
- title: <≤80 chars recommended (hard max 120); no marketing adjectives>
- description: <2–3 sentences, 250–500 chars (hard max 600). Plain language first, then the technical essence. No project-internal jargon.>
- bullets: <4–6 items, each 1–2 sentences ≤300 chars, start with a past-tense verb ("Built…", "Implemented…", "Reduced…"), include a real metric when one exists in E; otherwise describe the concrete mechanism>
### ES (español neutro — sin voseo ni regionalismos; mantén nombres de instituciones, departamentos, productos y tecnologías en su idioma original)
- title:
- description: <mismos límites>
- bullets: <mismos límites; primera persona del singular en pasado: "Implementé…", "Diseñé…", "Reduje…">

**No bullets about having tests.** Do not write a bullet whose point is that tests exist or how many there are (e.g. "Wrote 56 automated tests…" / "Escribí 56 pruebas automatizadas…"), and do not append test counts to other bullets ("…, backed by 146 passing tests"). Testing is expected of any serious project, so it reads as filler. Test counts still belong in section E as facts.

## I. Open questions for the owner
- <anything unverifiable or ambiguous: institution/dates, whether it may be shown publicly, which screenshots to use, whether metrics can be disclosed, product vs research placement…>
```

## Quality bar before you answer

- Every number in E/H has a source in the repo/docs, or it is `unavailable`.
- No bullet in H is about having tests or a test count (EN or ES).
- `tech_primary` uses canonical casing and contains only things actually used in the code/manifests.
- Dates in C come from git (or docs if git history was squashed/imported — say which).
- EN and ES drafts say the same things; ES is neutral Spanish.
- Nothing confidential, no secrets, no personal data, no NDA names.
- The document follows the template verbatim so it can be mapped field-by-field.
