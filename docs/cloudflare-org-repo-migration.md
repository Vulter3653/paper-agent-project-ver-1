# Cloudflare Organization Repository Migration

Updated: 2026-05-18

## Goal

Move Cloudflare automatic builds from the personal GitHub repository to the organization repository:

```text
From: Vulter3653/paper-agent-project
To:   mon-ai-team-project/team_project_test_public
```

The repository contents are already synchronized on:

```text
team-origin/main
```

## Important Notes

- No `wrangler.toml` service names need to change.
- D1 and R2 bindings stay the same.
- Runtime secrets stay in Cloudflare Worker settings.
- Build-time Git connection must be changed in the Cloudflare dashboard unless a valid Cloudflare API token is available.
- Install or configure the Cloudflare GitHub App for the `mon-ai-team-project` organization before changing project Git connections.

## GitHub App Prerequisite

In GitHub:

```text
GitHub -> Settings -> Applications -> Installed GitHub Apps
-> Cloudflare Workers and Pages -> Configure
```

Confirm the app has access to:

```text
mon-ai-team-project/team_project_test_public
```

If the organization is not shown in Cloudflare, reinstall or reconfigure the Cloudflare GitHub App for the organization.

## Worker: paper-agent-project

Cloudflare location:

```text
Cloudflare Dashboard
-> Workers & Pages
-> paper-agent-project
-> Settings
-> Builds
```

Set or reconnect:

| Field | Value |
| --- | --- |
| Git repository | `mon-ai-team-project/team_project_test_public` |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Version command | `npx wrangler versions upload` |
| Build watch paths | `*` |

The Worker name must stay aligned with `wrangler.toml`:

```toml
name = "paper-agent-project"
```

Required runtime bindings remain:

```text
DB -> paper_agent_db
REPORTS -> paper-agent-outputs
```

Required runtime secrets/variables remain:

```text
WOS_API_KEY
CROSSREF_EMAIL
UNPAYWALL_EMAIL
SEARCH_PROVIDER=wos
```

## Pages Dashboard: paper-agent-project

Cloudflare location:

```text
Cloudflare Dashboard
-> Workers & Pages
-> Pages
-> paper-agent-project
-> Settings
-> Builds & deployments
```

Set or reconnect:

| Field | Value |
| --- | --- |
| Git repository | `mon-ai-team-project/team_project_test_public` |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | `/` |
| Build command | `npm run build:web` |
| Build output directory | `apps/web/dist` |

Recommended Pages environment variable:

```text
VITE_API_BASE_URL=https://paper-agent-project.shch3653.workers.dev
```

If Cloudflare Pages does not allow changing the connected repository on the existing project, create a new Pages project from the organization repository, verify it, then move the custom domain from the old Pages project to the new one.

## MCP Worker: paper-agent-mcp

If `paper-agent-mcp` is connected to Workers Builds, set:

| Field | Value |
| --- | --- |
| Git repository | `mon-ai-team-project/team_project_test_public` |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build --workspace apps/mcp` |
| Deploy command | `npx wrangler deploy --config apps/mcp/wrangler.toml` |
| Version command | `npx wrangler versions upload --config apps/mcp/wrangler.toml` |

If it is deployed manually, no Git connection change is required. Use:

```bash
npm run deploy:mcp
```

## Verification After Migration

After reconnecting all Cloudflare projects to the organization repository:

1. Push a small docs-only commit to `team-origin/main`.
2. Confirm Worker Builds trigger for `paper-agent-project`.
3. Confirm Pages build triggers for `paper-agent-project`.
4. Confirm dashboard route:

```text
https://paper-agent-project.pages.dev/
```

5. Confirm Worker health:

```text
https://paper-agent-project.shch3653.workers.dev/api/health
```

6. Confirm MCP health:

```text
https://paper-agent-mcp.shch3653.workers.dev/health
```

7. Confirm dashboard `Run` still creates a completed job.

## Rollback

If organization repository builds fail:

1. Reconnect the affected Cloudflare project back to:

```text
Vulter3653/paper-agent-project
```

2. Keep the same branch and build settings.
3. Re-run the latest successful deployment from Cloudflare build history.
