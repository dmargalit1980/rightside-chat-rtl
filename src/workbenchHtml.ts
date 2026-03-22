import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import * as path from 'path';
import { CONFIG_SECTION, getAutoReloadAfterWorkbenchWrite, getChatDirection } from './config';

const MARKER_BEGIN = '<!-- RIGHTSIDE_CHAT_STYLE_BEGIN -->';
const MARKER_END = '<!-- RIGHTSIDE_CHAT_STYLE_END -->';
const MARKER_RE = /<!-- RIGHTSIDE_CHAT_STYLE_BEGIN -->[\s\S]*?<!-- RIGHTSIDE_CHAT_STYLE_END -->\s*/g;

function workbenchHtmlCandidates(appRoot: string): string[] {
  return [
    path.join(appRoot, 'out', 'vs', 'code', 'electron-sandbox', 'workbench', 'workbench.html'),
    path.join(appRoot, 'out', 'vs', 'workbench', 'workbench.html'),
  ];
}

export async function resolveWorkbenchHtmlPath(): Promise<string | undefined> {
  const appRoot = vscode.env.appRoot;
  if (!appRoot) {
    return undefined;
  }
  for (const candidate of workbenchHtmlCandidates(appRoot)) {
    try {
      await fs.stat(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return undefined;
}

type ReadWorkbenchResult =
  | { ok: true; workbenchPath: string; html: string }
  | { ok: false; message: string };

export async function readWorkbenchHtml(): Promise<ReadWorkbenchResult> {
  const workbenchPath = await resolveWorkbenchHtmlPath();
  if (!workbenchPath) {
    return { ok: false, message: 'Could not find workbench.html (appRoot).' };
  }
  try {
    const html = await fs.readFile(workbenchPath, 'utf8');
    return { ok: true, workbenchPath, html };
  } catch (e) {
    return { ok: false, message: `Failed to read workbench.html: ${String(e)}` };
  }
}

export function stripRightSideStyleBlock(html: string): string {
  return html.replace(MARKER_RE, '');
}

function injectStyleBlock(html: string, css: string): string {
  const cleaned = stripRightSideStyleBlock(html);
  const block = `${MARKER_BEGIN}\n<style id="rightside-chat-direction" type="text/css">\n${css}\n</style>\n${MARKER_END}\n`;
  const bodyClose = cleaned.lastIndexOf('</body>');
  if (bodyClose !== -1) {
    return cleaned.slice(0, bodyClose) + block + cleaned.slice(bodyClose);
  }
  const htmlClose = cleaned.lastIndexOf('</html>');
  if (htmlClose !== -1) {
    return cleaned.slice(0, htmlClose) + block + cleaned.slice(htmlClose);
  }
  return cleaned + block;
}

async function assertWritable(filePath: string): Promise<void> {
  await fs.access(filePath, fsConstants.W_OK);
}

async function ensureBackupBeforeFirstWrite(workbenchHtmlPath: string): Promise<void> {
  const bak = `${workbenchHtmlPath}.rightside.bak`;
  try {
    await fs.access(bak);
  } catch {
    await fs.copyFile(workbenchHtmlPath, bak);
  }
}

export async function readBundledRtlCss(extensionPath: string): Promise<string> {
  return fs.readFile(path.join(extensionPath, 'media', 'chat-rtl.css'), 'utf8');
}

async function maybeReloadWindow(autoReload?: boolean): Promise<void> {
  const reload = autoReload ?? getAutoReloadAfterWorkbenchWrite();
  if (reload) {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
    return;
  }
  const choice = await vscode.window.showInformationMessage(
    'RightSide: Reload the window for workbench changes to take effect.',
    'Reload Window'
  );
  if (choice === 'Reload Window') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

export async function writeWorkbenchHtmlIfChanged(
  workbenchPath: string,
  currentHtml: string,
  nextHtml: string,
  options?: { autoReload?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  if (nextHtml === currentHtml) {
    return { ok: true };
  }
  try {
    await assertWritable(workbenchPath);
  } catch {
    return {
      ok: false,
      error:
        'workbench.html is not writable (typical under /Applications on macOS). Copy CSS to clipboard instead, or use a writable Cursor install.',
    };
  }
  try {
    await ensureBackupBeforeFirstWrite(workbenchPath);
    await fs.writeFile(workbenchPath, nextHtml, 'utf8');
  } catch (e) {
    return { ok: false, error: `Failed to write workbench.html: ${String(e)}` };
  }
  await maybeReloadWindow(options?.autoReload);
  return { ok: true };
}

export async function syncChatStylesToWorkbench(
  extensionPath: string,
  options?: { skipConfirm?: boolean; autoReload?: boolean }
): Promise<void> {
  if (!options?.skipConfirm) {
    const confirm = await vscode.window.showWarningMessage(
      'RightSide: Writing to workbench.html can trigger Cursor’s “installation appears corrupt” warning until you restore from backup or reinstall.\n\n' +
        'A one-time backup is saved as workbench.html.rightside.bak next to workbench.html. Use “Restore workbench.html from RightSide backup” to undo.\n\n' +
        'Safer alternative: “Copy Chat Direction CSS” and load it with a custom UI/CSS extension.\n\n' +
        'Continue and write workbench.html?',
      { modal: true },
      'Write workbench.html',
      'Cancel'
    );
    if (confirm !== 'Write workbench.html') {
      return;
    }
  }

  const loaded = await readWorkbenchHtml();
  if (!loaded.ok) {
    void vscode.window.showErrorMessage(`RightSide: ${loaded.message}`);
    return;
  }
  const { workbenchPath, html } = loaded;

  const dir = getChatDirection();
  let next: string;
  if (dir === 'rtl') {
    let css: string;
    try {
      css = await readBundledRtlCss(extensionPath);
    } catch (e) {
      void vscode.window.showErrorMessage(`RightSide: Failed to read media/chat-rtl.css: ${String(e)}`);
      return;
    }
    next = injectStyleBlock(html, css);
  } else {
    next = stripRightSideStyleBlock(html);
  }

  const result = await writeWorkbenchHtmlIfChanged(workbenchPath, html, next, {
    autoReload: options?.autoReload,
  });
  if (!result.ok) {
    void vscode.window.showErrorMessage(`RightSide: ${result.error}`);
  }
}

export async function removeInjectionFromWorkbench(options?: {
  skipConfirm?: boolean;
  autoReload?: boolean;
}): Promise<void> {
  if (!options?.skipConfirm) {
    const c = await vscode.window.showWarningMessage(
      'RightSide: Remove the injected style block from workbench.html (uses the same backup rules as install)?',
      { modal: true },
      'Remove',
      'Cancel'
    );
    if (c !== 'Remove') {
      return;
    }
  }

  const loaded = await readWorkbenchHtml();
  if (!loaded.ok) {
    void vscode.window.showErrorMessage(`RightSide: ${loaded.message}`);
    return;
  }
  const { workbenchPath, html } = loaded;
  const next = stripRightSideStyleBlock(html);
  const result = await writeWorkbenchHtmlIfChanged(workbenchPath, html, next, {
    autoReload: options?.autoReload,
  });
  if (!result.ok) {
    void vscode.window.showErrorMessage(`RightSide: ${result.error}`);
  } else if (next === html) {
    void vscode.window.showInformationMessage('RightSide: No RightSide style block was present in workbench.html.');
  }
}

export async function restoreWorkbenchFromBackup(): Promise<void> {
  const workbenchPath = await resolveWorkbenchHtmlPath();
  if (!workbenchPath) {
    void vscode.window.showErrorMessage('RightSide: Could not find workbench.html.');
    return;
  }
  const bak = `${workbenchPath}.rightside.bak`;
  try {
    await fs.access(bak);
  } catch {
    void vscode.window.showErrorMessage(
      'RightSide: No backup found (workbench.html.rightside.bak). Reinstall Cursor or repair the app bundle.'
    );
    return;
  }
  const ok = await vscode.window.showWarningMessage(
    'RightSide: Overwrite workbench.html with workbench.html.rightside.bak? This is the usual fix for “corrupt installation” after using RightSide.',
    { modal: true },
    'Restore',
    'Cancel'
  );
  if (ok !== 'Restore') {
    return;
  }
  try {
    await assertWritable(workbenchPath);
    await fs.copyFile(bak, workbenchPath);
    const choice = await vscode.window.showInformationMessage(
      'RightSide: Restored workbench.html from backup. Reload the window (or restart Cursor).',
      'Reload Window'
    );
    if (choice === 'Reload Window') {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } catch (e) {
    void vscode.window.showErrorMessage(`RightSide: Restore failed: ${String(e)}`);
  }
}
