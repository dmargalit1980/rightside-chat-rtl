# RightSide — Agent Chat RTL/LTR (Cursor / VS Code)

Workspace preference for **LTR / RTL** in Agent chat, plus **status bar** and **sidebar/panel** UI.  
Visual RTL requires applying bundled CSS (sync to `workbench.html` or copy-paste — see in-extension warnings).

## Development

```bash
npm install
npm run compile
```

Press **F5** in this folder (**Run Extension**) and use the **[Extension Development Host]** window.

## Build a `.vsix` (installable package)

```bash
npm install
npm run compile
npm run vsix
```

This runs `@vscode/vsce` and produces `rightside-chat-rtl-<version>.vsix` (see `version` in `package.json`).

Install in Cursor: **Extensions → … → Install from VSIX…**

### Showing up in Cursor’s Extensions search

Cursor’s marketplace is mainly fed from **[Open VSX](https://open-vsx.org/)** (not only Microsoft’s Marketplace). After your version is **published and active** (not stuck in “Under review”), wait a bit for sync, then search in **Cursor → Extensions** by `displayName`, `name`, or keywords. If it still doesn’t appear, check Cursor’s [extension docs](https://cursor.com/docs) for the current registry and any allowlisting. Publishing the same extension to the **Visual Studio Marketplace** can help users on setups that query both.

---

## Publishing

### 1. Open VSX (used by Cursor / VSCodium)

1. Create an account on [Open VSX](https://open-vsx.org/).
2. Create a [personal access token](https://open-vsx.org/user-settings/tokens).
3. Install CLI: `npx ovsx --version` (or `npm i -g ovsx`).
4. From this repo (after `npm run compile`):

   ```bash
   npx ovsx publish -p <YOUR_TOKEN>
   ```

   You need a valid `publisher` in `package.json` that matches your Open VSX namespace (create the namespace first on the site if needed).

### 2. Visual Studio Marketplace (VS Code only)

1. Create a [publisher](https://marketplace.visualstudio.com/manage) on Microsoft Marketplace.
2. Create an Azure DevOps [PAT](https://learn.microsoft.com/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate) with **Marketplace (Manage)** scope.
3. Login and publish:

   ```bash
   npx vsce login <publisher-id>
   npm run vsix   # or: npx vsce publish
   npx vsce publish
   ```

Cursor often pulls from **Open VSX**, not necessarily the Microsoft Marketplace — check [Cursor extension docs](https://cursor.com/docs).

### 3. Before first publish

- Set `"publisher"` in `package.json` to your real publisher id (not `rightside` unless you own that namespace).
- Add `"repository": { "type": "git", "url": "https://github.com/you/rightSide.git" }` if you use GitHub.
- Add a `LICENSE` file (e.g. MIT) if you ship publicly.
- Optionally add `"icon": "media/icon-128.png"` (128×128) for the marketplace listing.

### 4. `vsce` validation

If `vsce package` complains about missing fields, follow its messages (README, license, repository, etc.).

---

## GitHub Actions (אוטומציה — אתה רק מוסיף secrets)

אם הפרויקט ב־GitHub:

1. **Settings → Secrets and variables → Actions**  
   - `OPEN_VSX_TOKEN` — PAT מ־[Open VSX](https://open-vsx.org/user-settings/tokens)  
   - (אופציונלי) `VSCE_PAT` — ל־Microsoft Marketplace  
2. עדכן `version` ב־`package.json`, commit.  
3. `git tag v0.6.1 && git push origin v0.6.1` (התאם גרסה) — או **Actions → Package and publish extension → Run workflow**.  
4. ב־Actions תמצא **Artifact** בשם `vsix` להורדה גם בלי פרסום.

הקובץ: [`.github/workflows/publish-extension.yml`](.github/workflows/publish-extension.yml).

---

## פרסום בקצרה (עברית)

1. **בניית VSIX:** `npm run compile` ואז `npm run vsix` → קובץ `.vsix` להתקנה ידנית ב-Cursor (**התקנה מ-VSIX**).  
2. **חנות ציבורית:** Cursor נוטה ל-**Open VSX** — הירשמו, צרו namespace, והריצו `ovsx publish`.  
3. **Marketplace של מיקרוסופט:** רק ל-VS Code הקלאסי — דורש `vsce login` + `vsce publish`.  
4. עדכנו ב-`package.json` את `publisher` (ושם התצוגה) לפני פרסום אמיתי.
