import * as vscode from 'vscode';
import { COMMANDS } from './commands';
import { getAutoSyncWorkbenchOnDirectionChange, getChatDirection } from './config';

export class RightSideTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly _onDidChange = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  refresh(): void {
    this._onDidChange.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.TreeItem[] {
    const dir = getChatDirection();

    const autoSync = getAutoSyncWorkbenchOnDirectionChange();
    const hint = new vscode.TreeItem(
      autoSync
        ? 'Auto-sync ON: each direction change updates workbench.html (may reload).'
        : 'Auto-sync OFF: toggle only saves setting — use Apply styles or Copy CSS.',
      vscode.TreeItemCollapsibleState.None
    );
    hint.iconPath = new vscode.ThemeIcon('info');
    hint.tooltip =
      'Setting: rightSide.autoSyncWorkbenchOnDirectionChange. When on, no extra confirm dialog before writing workbench.html.';
    hint.contextValue = 'rightsideHint';

    const toggle = new vscode.TreeItem(
      dir === 'rtl' ? 'Direction: RTL → click for LTR' : 'Direction: LTR → click for RTL',
      vscode.TreeItemCollapsibleState.None
    );
    toggle.iconPath = new vscode.ThemeIcon('arrow-swap');
    toggle.command = { command: COMMANDS.toggleDirection, title: 'Toggle' };

    const apply = new vscode.TreeItem('Apply styles to Cursor (sync workbench.html)');
    apply.iconPath = new vscode.ThemeIcon('paintcan');
    apply.command = { command: COMMANDS.syncWorkbench, title: 'Sync' };
    apply.tooltip =
      'Writes CSS into workbench.html. May show “corrupt install” until you restore backup. Window reloads.';

    const copy = new vscode.TreeItem('Copy chat CSS (safer — use with custom UI extension)');
    copy.iconPath = new vscode.ThemeIcon('clippy');
    copy.command = { command: COMMANDS.copyCss, title: 'Copy CSS' };

    const remove = new vscode.TreeItem('Remove injected styles from workbench.html');
    remove.iconPath = new vscode.ThemeIcon('trash');
    remove.command = { command: COMMANDS.removeInjection, title: 'Remove' };

    const restore = new vscode.TreeItem('Restore workbench.html from backup');
    restore.iconPath = new vscode.ThemeIcon('history');
    restore.command = { command: COMMANDS.restoreBackup, title: 'Restore' };

    return [hint, toggle, apply, copy, remove, restore];
  }
}
