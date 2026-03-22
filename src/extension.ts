import * as vscode from 'vscode';
import { COMMANDS } from './commands';
import {
  CONFIG_SECTION,
  getAutoSyncWorkbenchOnDirectionChange,
  getChatDirection,
  migrateLegacyInjectSetting,
  setChatDirection,
  type TextDirection,
} from './config';
import { RightSideTreeProvider } from './treeDataProvider';
import {
  readBundledRtlCss,
  removeInjectionFromWorkbench,
  restoreWorkbenchFromBackup,
  syncChatStylesToWorkbench,
} from './workbenchHtml';

function updateStatusBar(item: vscode.StatusBarItem): void {
  const d = getChatDirection();
  const auto = getAutoSyncWorkbenchOnDirectionChange();
  item.text = d === 'rtl' ? '$(arrow-swap) Chat RTL' : '$(arrow-swap) Chat LTR';
  item.tooltip = auto
    ? `RightSide: ${d.toUpperCase()}. Click toggles direction and syncs workbench.html (window may reload).`
    : `RightSide: ${d.toUpperCase()} (workspace only). Enable rightSide.autoSyncWorkbenchOnDirectionChange to sync on click, or use the panel → Apply styles.`;
  item.command = COMMANDS.toggleDirection;
  item.show();
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  await migrateLegacyInjectSetting();

  const treeProvider = new RightSideTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('rightside.sidebar', treeProvider),
    vscode.window.registerTreeDataProvider('rightside.panel', treeProvider)
  );

  const status = vscode.window.createStatusBarItem('rightside.direction', vscode.StatusBarAlignment.Right, 100_000);
  context.subscriptions.push(status);
  updateStatusBar(status);

  const refreshUi = (): void => {
    updateStatusBar(status);
    treeProvider.refresh();
  };

  function bumpVisibility(): void {
    refreshUi();
    for (const ms of [120, 600, 2000]) {
      setTimeout(() => {
        updateStatusBar(status);
        status.show();
        treeProvider.refresh();
      }, ms);
    }
  }

  const afterWorkbenchMutation = (): void => {
    treeProvider.refresh();
  };

  async function applyDirectionChange(extensionPath: string, dir: TextDirection): Promise<void> {
    await setChatDirection(dir);
    refreshUi();
    if (getAutoSyncWorkbenchOnDirectionChange()) {
      await syncChatStylesToWorkbench(extensionPath, { skipConfirm: true });
      afterWorkbenchMutation();
    }
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(CONFIG_SECTION)) {
        refreshUi();
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      bumpVisibility();
    }),
    vscode.workspace.onDidGrantWorkspaceTrust(() => {
      bumpVisibility();
    }),
    vscode.window.onDidChangeWindowState((s) => {
      if (s.focused) {
        status.show();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.toggleDirection, async () => {
      const next: TextDirection = getChatDirection() === 'rtl' ? 'ltr' : 'rtl';
      await applyDirectionChange(context.extensionPath, next);
    }),
    vscode.commands.registerCommand(COMMANDS.setLtr, async () => {
      await applyDirectionChange(context.extensionPath, 'ltr');
    }),
    vscode.commands.registerCommand(COMMANDS.setRtl, async () => {
      await applyDirectionChange(context.extensionPath, 'rtl');
    }),
    vscode.commands.registerCommand(COMMANDS.openPanel, async () => {
      await vscode.commands.executeCommand('workbench.panel.extension.rightsidePanel');
      await vscode.commands.executeCommand('workbench.view.extension.rightside');
    }),
    vscode.commands.registerCommand(COMMANDS.copyCss, async () => {
      try {
        const css = await readBundledRtlCss(context.extensionPath);
        await vscode.env.clipboard.writeText(css);
        void vscode.window.showInformationMessage(
          'RightSide: Chat CSS copied. Paste it into your custom UI/CSS workflow (recommended over editing workbench.html).'
        );
      } catch (e) {
        void vscode.window.showErrorMessage(`RightSide: ${String(e)}`);
      }
    }),
    vscode.commands.registerCommand(COMMANDS.syncWorkbench, async () => {
      await syncChatStylesToWorkbench(context.extensionPath);
      afterWorkbenchMutation();
    }),
    vscode.commands.registerCommand(COMMANDS.removeInjection, async () => {
      await removeInjectionFromWorkbench();
      afterWorkbenchMutation();
    }),
    vscode.commands.registerCommand(COMMANDS.restoreBackup, async () => {
      await restoreWorkbenchFromBackup();
    }),
    vscode.commands.registerCommand(COMMANDS.reapplyWorkbench, async () => {
      await syncChatStylesToWorkbench(context.extensionPath);
      afterWorkbenchMutation();
    })
  );

  bumpVisibility();
}

export function deactivate(): void {}
