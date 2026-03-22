# Releasing a new version (Open VSX + GitHub)

## Option A — GitHub Actions (recommended for repeat)

1. Add **repository secret** `OPEN_VSX_TOKEN` (Open VSX → [Access Tokens](https://open-vsx.org/user-settings/tokens)) under **GitHub → Settings → Secrets and variables → Actions**.
2. On your machine, in the repo:
   - Bump `"version"` in `package.json` (e.g. `0.6.2`).
   - Commit and push to `main`:
     ```bash
     git add package.json package-lock.json
     git commit -m "chore: bump version to 0.6.2"
     git push origin main
     ```
   - Tag and push (must match `version` with a `v` prefix):
     ```bash
     git tag v0.6.2
     git push origin v0.6.2
     ```
3. Watch **Actions** → *Package and publish extension*. When Open VSX finishes indexing, the new version appears in search.

If `OPEN_VSX_TOKEN` is missing, the workflow still builds a **VSIX artifact** you can download from the run.

---

## Option B — Publish from your computer

```bash
npm install
npm run compile
npm run vsix
export OVSX_PAT='paste-token-here'   # Open VSX PAT; do not commit this
npx ovsx publish -p "$OVSX_PAT" -i rightside-chat-rtl-$(node -p "require('./package.json').version").vsix
```

Use the same `version` in `package.json` as the VSIX you upload. Open VSX rejects duplicate versions.

---

## Hebrew checklist (עברית)

| שלב | פעולה |
|-----|--------|
| 1 | עדכן `version` ב־`package.json` |
| 2 | `git commit` + `git push origin main` |
| 3 | `git tag vX.Y.Z` + `git push origin vX.Y.Z` (אם יש secret ב־GitHub) **או** `ovsx publish` מקומית עם טוקן |
| 4 | המתן לאינדוקס ב־Open VSX |

אי אפשר לפרסם בלי **טוקן Open VSX** — לא ב-GitHub Actions ולא ב-CLI.
