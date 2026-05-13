# Cursor Model Rankings

A small Next.js app that publishes a **weekly, research-backed leaderboard** of the coding models available **inside the Cursor IDE** (Composer 2 Fast, Claude Opus 4.7 high, Sonnet 4.6, GPT-5.3 Codex, GPT-5.5, etc.)—ranking them by **best features, speed, and what to actually use each one for in coding tasks**, with transparent sources and a draft → review → publish flow backed by DynamoDB.

## Tech stack

- **Next.js** (App Router) + **Tailwind CSS**
- **Amazon DynamoDB** (AWS SDK v3 DocumentClient)
- **OpenAI API** for structured research (`scripts/update-rankings.js`)
- **GitHub Actions** cron (Mondays 09:00 UTC) to refresh and publish rankings

## Prerequisites

- Node.js 20+
- An AWS account and DynamoDB table
- OpenAI API access

## DynamoDB setup

Create a table (e.g. `CodingModelRankings`) with:

| Attribute | Type   | Key            |
|-----------|--------|----------------|
| `pk`      | String | Partition key  |
| `sk`      | String | Sort key       |

No GSIs are required. The app stores:

- **Ranking rows**: `pk = BATCH#<batchId>`, `sk = RANK#01` … `RANK#10`, plus attributes  
  `batchId`, `rank`, `modelName`, `provider`, `codingScore`, `bestFor`, `strengths`, `weaknesses`, `pricingSummary`, `sourceUrls`, `status` (`DRAFT` | `PUBLISHED`), `updatedAt`.
- **Meta rows**: `pk = META`, `sk = LATEST_PUBLISHED` or `LATEST_DRAFT`, with `batchId` and `updatedAt`.

Example AWS CLI (adjust region/name):

```bash
aws dynamodb create-table \
  --table-name CodingModelRankings \
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Environment variables

| Variable | Required for | Description |
|----------|----------------|-------------|
| `CODING_MODEL_RANKINGS_TABLE` | App, script, CI | DynamoDB table name (defaults to `CodingModelRankings` if unset—fine for local experiments only). |
| `DYNAMODB_REGION` | App (e.g. Amplify), optional elsewhere | Region for DynamoDB. **`AWS_REGION` is reserved on AWS Amplify**; use this there. If unset, falls back to `AWS_REGION`, then `us-east-1`. |
| `DYNAMODB_ACCESS_KEY_ID` / `DYNAMODB_SECRET_ACCESS_KEY` | Amplify, or anywhere you avoid `AWS_*` | Same IAM permissions as below. When both are set, the app uses them for the DynamoDB client; otherwise the SDK default chain applies (`AWS_*`, instance/SSR role, etc.). Optional `DYNAMODB_SESSION_TOKEN` for temp creds. |
| `AWS_REGION` | Script, CI, local | Region for DynamoDB when not using `DYNAMODB_REGION`. |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Script, CI, local writes | Standard AWS credentials with `dynamodb:PutItem`, `Query`, `GetItem`, `BatchWriteItem`, `DeleteItem` on the table. |
| `ADMIN_API_KEY` | Draft/publish APIs, admin UI | Shared secret; send as header `x-admin-api-key`. |
| `OPENAI_API_KEY` | `update-rankings` script, CI | Key for OpenAI. |
| `OPENAI_RANKINGS_MODEL` | Optional | Model id (default `gpt-4o-mini` in the script). |
| `NEXT_PUBLIC_APP_URL` | Recommended in prod | Absolute site URL for server-side `fetch` to `/api/rankings` (e.g. `https://your-domain.vercel.app`). Falls back to `VERCEL_URL` on Vercel. |

> **Vercel:** configure the same variables in the project settings. The build does not need OpenAI keys unless you run the script there (you normally run the script in GitHub Actions or locally).

> **AWS Amplify:** the console blocks custom variables whose names start with `AWS_`. Set `DYNAMODB_REGION`, and either use an [SSR IAM role](https://docs.aws.amazon.com/amplify/latest/userguide/amplify-SSR-compute-role.html) for DynamoDB (preferred) or `DYNAMODB_ACCESS_KEY_ID` / `DYNAMODB_SECRET_ACCESS_KEY`. The repo’s `amplify.yml` copies these into `.env.production` for Next.js SSR.

## Local development

```bash
npm install
cp .env.example .env.local   # if you maintain an example; otherwise export vars manually
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The homepage calls `GET /api/rankings` (server-side `fetch`). Admin UI: [http://localhost:3000/admin](http://localhost:3000/admin).

### Save a draft manually

`POST /api/rankings/draft` with header `x-admin-api-key: <ADMIN_API_KEY>` and a JSON body that is **either** a raw array of 10 models **or** `{ "models": [ ... ] }`, each model matching the schema validated in `lib/rankingValidation.js`.

### Publish

`POST /api/rankings/publish` with `{ "batchId": "<uuid>" }` and the same admin header.

### Weekly ranking from OpenAI

```bash
export OPENAI_API_KEY=...
export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... AWS_REGION=...  # or DYNAMODB_* equivalents
export CODING_MODEL_RANKINGS_TABLE=CodingModelRankings
npm run update-rankings -- "Optional extra instructions for this run"
npm run update-rankings -- --publish "Optional extra instructions and publish immediately"
```

By default this writes a **new draft** only (`saveDraftRanking`). Passing `--publish` immediately promotes that generated batch to **published**, which is what the homepage table reads.

## GitHub Actions secrets

Workflow: `.github/workflows/update-rankings.yml` (cron **Monday 09:00 UTC** + `workflow_dispatch`).

Configure repository secrets:

- `OPENAI_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `CODING_MODEL_RANKINGS_TABLE`

Optional **variable** (not secret): `OPENAI_RANKINGS_MODEL`.

After the action runs, the generated ranking is published automatically and the homepage table updates from `LATEST_PUBLISHED`.

## Review / publish flow

1. **Cron or manual** `npm run update-rankings -- --publish` → new **DRAFT** batch in DynamoDB, then immediate publish to `META` / `LATEST_PUBLISHED`.
2. Optional manual review flow: run `npm run update-rankings` without `--publish`, visit **`/admin`**, paste **`ADMIN_API_KEY`**, load the draft, then click **Publish**.

## API summary

- `GET /api/rankings` — latest **published** top 10 (public).
- `GET /api/rankings/draft` — latest **draft** (requires `x-admin-api-key`).
- `POST /api/rankings/draft` — save draft from JSON body (admin key).
- `POST /api/rankings/publish` — publish a `batchId` (admin key).

## Deploying to Vercel

1. Push the repo and import it in Vercel.
2. Set env vars: `CODING_MODEL_RANKINGS_TABLE`, `ADMIN_API_KEY`, `NEXT_PUBLIC_APP_URL`, and either `AWS_REGION` + `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` or the `DYNAMODB_*` equivalents (see table above).
3. Ensure the AWS principal can reach DynamoDB from the **same** table/region (Vercel serverless = outbound internet; no VPC unless you configure it).
4. Point the GitHub Action at the same table so weekly published rankings land where production reads them.

## Deploying to AWS Amplify

This repo includes `amplify.yml`; builds pick it up automatically. **Environment variables are not committed** — you add them in the AWS console (this project cannot connect to your AWS account).

In **Amplify** → your app → **Hosting** → **Environment variables**, create:

| Name | Notes |
|------|--------|
| `CODING_MODEL_RANKINGS_TABLE` | DynamoDB table name (e.g. `CodingModelRankings`). |
| `DYNAMODB_REGION` | Table region (e.g. `us-east-1`). Amplify disallows `AWS_`-prefixed names. |
| `ADMIN_API_KEY` | Same value as local; required for `/admin` and draft/publish APIs. |
| `NEXT_PUBLIC_APP_URL` | Full production URL with `https://` (Amplify default domain or custom domain). Used for server-side `fetch` to your own `/api/rankings`. After the first successful deploy, confirm this matches the live URL and **redeploy** if you change it. |

**DynamoDB credentials — use one approach:**

1. **Recommended:** Configure an [SSR compute IAM role](https://docs.aws.amazon.com/amplify/latest/userguide/amplify-SSR-compute-role.html) on the app with `dynamodb:GetItem`, `Query`, `PutItem`, `BatchWriteItem`, `DeleteItem` (and any other operations you use) on the table. Then **do not** set `DYNAMODB_ACCESS_KEY_ID` / `DYNAMODB_SECRET_ACCESS_KEY`.
2. **Alternative:** Add **`DYNAMODB_ACCESS_KEY_ID`** and **`DYNAMODB_SECRET_ACCESS_KEY`** for an IAM principal that has those DynamoDB permissions. Optional **`DYNAMODB_SESSION_TOKEN`** for temporary keys.

You do **not** need `OPENAI_API_KEY` in Amplify unless you change the build to run `npm run update-rankings` there; the usual flow keeps OpenAI research + weekly publish in GitHub Actions.

**If the homepage shows “Could not load credentials from any providers”:** the DynamoDB client found no credentials at runtime. Fix one of: (1) set **`DYNAMODB_ACCESS_KEY_ID`** and **`DYNAMODB_SECRET_ACCESS_KEY`** on the app (same IAM permissions as local) and **redeploy**, or (2) attach Amplify’s **[SSR compute role](https://docs.aws.amazon.com/amplify/latest/userguide/amplify-SSR-compute-role.html)** with DynamoDB policy on your table (no access-key env vars). Also set **`NEXT_PUBLIC_APP_URL`** to your live URL (e.g. `https://main.<id>.amplifyapp.com`) so server-side `fetch` hits the deployed host.

---

MIT-licensed starter; swap research prompts and scoring rules to match your editorial standards.
