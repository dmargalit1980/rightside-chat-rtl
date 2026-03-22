import * as vscode from 'vscode';

export const CONFIG_SECTION = 'rightSide';

export const CONFIG_KEYS = {
  chatTextDirection: 'chatTextDirection',
  /** @deprecated no longer read for auto-inject; cleared on activate if true */
  legacyWorkbenchInjection: 'workbenchStyleInjection',
  autoReloadAfterWorkbenchWrite: 'autoReloadAfterWorkbenchWrite',
  /** After toggle / set LTR-RTL, write workbench.html (no confirm dialog). */
  autoSyncWorkbenchOnDirectionChange: 'autoSyncWorkbenchOnDirectionChange',
  /** Ask before calling Reload Window after workbench writes (when auto-reload is on). */
  confirmBeforeReloadWindow: 'confirmBeforeReloadWindow',
} as const;

export type TextDirection = 'ltr' | 'rtl';

export function getChatDirection(): TextDirection {
  const v = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEYS.chatTextDirection);
  return v === 'rtl' ? 'rtl' : 'ltr';
}

export async function setChatDirection(dir: TextDirection): Promise<void> {
  const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
  await cfg.update(CONFIG_KEYS.chatTextDirection, dir, vscode.ConfigurationTarget.Workspace);
}

/** Turn off deprecated auto-inject flag if user still had it enabled. */
export async function migrateLegacyInjectSetting(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const legacy = cfg.inspect(CONFIG_KEYS.legacyWorkbenchInjection);
  let cleared = false;
  if (legacy?.globalValue === true) {
    await cfg.update(CONFIG_KEYS.legacyWorkbenchInjection, false, vscode.ConfigurationTarget.Global);
    cleared = true;
  }
  if (legacy?.workspaceValue === true) {
    await cfg.update(CONFIG_KEYS.legacyWorkbenchInjection, false, vscode.ConfigurationTarget.Workspace);
    cleared = true;
  }
  if (cleared) {
    void vscode.window.showWarningMessage(
      'RightSide: Automatic workbench injection is turned off (it triggered Cursor “corrupt installation” warnings). Use “Copy Chat Direction CSS” (safer) or “Sync chat styles to workbench” only if you accept the risk.'
    );
  }
}

export function getAutoReloadAfterWorkbenchWrite(): boolean {
  return vscode.workspace.getConfiguration(CONFIG_SECTION).get<boolean>(CONFIG_KEYS.autoReloadAfterWorkbenchWrite) ?? true;
}

export function getAutoSyncWorkbenchOnDirectionChange(): boolean {
  return (
    vscode.workspace.getConfiguration(CONFIG_SECTION).get<boolean>(CONFIG_KEYS.autoSyncWorkbenchOnDirectionChange) ?? true
  );
}

export function getConfirmBeforeReloadWindow(): boolean {
  return vscode.workspace.getConfiguration(CONFIG_SECTION).get<boolean>(CONFIG_KEYS.confirmBeforeReloadWindow) ?? true;
}
