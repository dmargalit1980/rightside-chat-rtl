/** Command IDs — single source of truth (keep in sync with package.json contributes.commands). */
export const COMMANDS = {
  openPanel: 'rightSide.openRightSidePanel',
  toggleDirection: 'rightSide.toggleChatTextDirection',
  setLtr: 'rightSide.setChatTextDirectionLtr',
  setRtl: 'rightSide.setChatTextDirectionRtl',
  copyCss: 'rightSide.copyChatRtlStylesheet',
  syncWorkbench: 'rightSide.syncChatStylesToWorkbench',
  removeInjection: 'rightSide.removeWorkbenchChatStyles',
  restoreBackup: 'rightSide.restoreWorkbenchFromRightSideBackup',
  /** @deprecated */
  reapplyWorkbench: 'rightSide.reapplyWorkbenchChatStyles',
} as const;
