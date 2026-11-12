window.__ModuleLoader__.load({
  id: "dsh-session-groups",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /**
     * dsh-session-tree, browser half.
     *
     * DSH's sidebar renders Workspaces and their Sessions. This plugin adds a
     * user-defined folder tree *inside* each Workspace without touching the
     * official React tree: group headers are ordinary DOM nodes inserted into
     * the Workspace section, and session rows are ordered with CSS `order`.
     * Group membership is metadata (a host JSON file, cached in localStorage)
     * and never changes a Session's cwd, log, archive state, or Workspace.
     *
     * The integration surface is deliberately attribute-based:
     *   [data-row-key="workspace:<id>"]  Workspace header
     *   [data-row-key="session:<id>"]    Session row (direct child of section)
     *   [data-row-key="overflow:<id>"]   the "show more" row
     * Those attributes are part of the official DOM contract (the React row
     * keys); hashed CSS-module class names are not used.
     */

    const MARK = "dsh-session-tree";
    const DEBUG = false;
    const STORAGE_KEY = "dsh-session-tree.state.v1";
    const HOST_CHANNEL = "/session-tree";
    const BROADCAST_NAME = "dsh-session-tree";
    const HOST_SAVE_DELAY = 250;
    const GROUP_MIME = "application/x-dsh-session-tree-group";
    const UNGROUPED = "__ungrouped__";
    const INDENT_BASE = 12;
    const INDENT_STEP = 14;
    const OVERFLOW_ORDER = 900001;

    const ICONS = {
      chevron:
        '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
      folder:
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.2 4.6c0-.7.5-1.2 1.2-1.2h2.1l1.2 1.4h4.9c.7 0 1.2.5 1.2 1.2v6.2c0 .7-.5 1.2-1.2 1.2H3.4c-.7 0-1.2-.5-1.2-1.2V4.6Z"/></svg>',
      plus:
        '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M8 3.5v9M3.5 8h9"/></svg>',
      pencil:
        '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l.9-3.1 6.7-6.7 2.2 2.2-6.7 6.7L3 13Z"/><path d="M9.8 4l2.2 2.2"/></svg>',
      trash:
        '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 4.5h9M6.2 4.5V3h3.6v1.5M5 4.5l.5 8h5l.5-8"/></svg>',
    };

    const STRINGS = {
      zh: {
        newGroup: "新建分组",
        newSession: "新建会话",
        newSessionInGroup: "在此分组新建会话",
        sessionCreateFailed: "新建会话失败",
        newSubgroup: "新建子分组",
        rename: "重命名",
        deleteGroup: "删除分组",
        deleteTitle: "删除分组",
        deleteMessage: "删除「{name}」后，其中的会话和子分组会移到上一级，不会被删除。",
        ungrouped: "未分组",
        moveSession: "移动会话",
        noGroups: "暂无分组",
        orderSessions: "排序",
        orderGroups: "分组排序",
        orderByName: "按名称排序",
        orderTop: "移到最前",
        orderUp: "上移",
        orderDown: "下移",
        orderBottom: "移到最后",
        orderReset: "恢复默认顺序",
        removeFromGroup: "移出分组",
        newGroupAndMove: "新建分组并移入",
        showAll: "显示全部会话",
        expandAllGroups: "展开全部分组",
        collapseAllGroups: "折叠全部分组",
        nameLabel: "分组名称",
        namePlaceholder: "例如：需求分析",
        create: "创建",
        cancel: "取消",
        confirm: "确定",
        delete: "删除",
        expand: "展开",
        collapse: "折叠",
        groupDefault: "新分组",
        shownAll: "已展开全部会话",
        nameRequired: "请输入分组名称",
        moveTop: "移到顶层",
        emptyGroup: "空分组",
        groupMoved: "分组已移动",
        exportData: "导出分组数据",
        importData: "导入分组数据",
        exported: "分组数据已导出",
        importTitle: "导入分组数据",
        importMessage: "将用导入文件替换当前分组：{groups} 个分组、{sessions} 个已归类会话。此操作不会删除任何会话。",
        importConfirm: "替换",
        imported: "分组数据已导入",
        importFailed: "导入失败：文件不是有效的分组数据",
        exportFailed: "导出失败",
        importEmpty: "文件中没有可导入的分组",
        saveFailed: "分组数据保存失败，已保留在浏览器本地存储",
        externalUpdate: "已同步另一个窗口的分组更新",
      },
      en: {
        newGroup: "New group",
        newSession: "New session",
        newSessionInGroup: "New session in this group",
        sessionCreateFailed: "Could not create a session",
        newSubgroup: "New subgroup",
        rename: "Rename",
        deleteGroup: "Delete group",
        deleteTitle: "Delete group",
        deleteMessage: "Deleting “{name}” moves its sessions and subgroups up one level. Nothing is deleted.",
        ungrouped: "Ungrouped",
        moveSession: "Move session",
        noGroups: "No groups yet",
        orderSessions: "Order",
        orderGroups: "Order groups",
        orderByName: "Sort by name",
        orderTop: "Move to first",
        orderUp: "Move up",
        orderDown: "Move down",
        orderBottom: "Move to last",
        orderReset: "Reset order",
        removeFromGroup: "Remove from group",
        newGroupAndMove: "New group and move here",
        showAll: "Show all sessions",
        expandAllGroups: "Expand all groups",
        collapseAllGroups: "Collapse all groups",
        nameLabel: "Group name",
        namePlaceholder: "e.g. Requirements",
        create: "Create",
        cancel: "Cancel",
        confirm: "Confirm",
        delete: "Delete",
        expand: "Expand",
        collapse: "Collapse",
        groupDefault: "New group",
        shownAll: "All sessions are shown",
        nameRequired: "Enter a group name",
        moveTop: "Move to top level",
        emptyGroup: "Empty group",
        groupMoved: "Group moved",
        exportData: "Export group data",
        importData: "Import group data",
        exported: "Group data exported",
        importTitle: "Import group data",
        importMessage: "Replaces the current groups with the imported file: {groups} groups and {sessions} grouped sessions. No session is ever deleted.",
        importConfirm: "Replace",
        imported: "Group data imported",
        importFailed: "Import failed: the file is not valid group data",
        exportFailed: "Export failed",
        importEmpty: "The file contains no groups to import",
        saveFailed: "Could not save group data; it is still kept in browser storage",
        externalUpdate: "Synced group changes from another window",
      },
    };

    const CSS = `
[data-dsh-st-section] { display: flex !important; flex-direction: column; }
[data-dsh-st-container] { display: contents; }
.dsh-st-groups-hidden { display: none !important; }
.dsh-st-group {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  margin-top: 2px;
  padding: 2px 8px 2px calc(var(--dsh-sidebar-row-padding, 12px) - var(--dsh-sidebar-paint-inset, 3px) + var(--dsh-workspace-indent, 0px) + var(--dsh-st-indent, 0px));
  border: 0;
  border-inline: var(--dsh-sidebar-paint-inset, 3px) solid transparent;
  border-radius: var(--dsw-radius-md, 8px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #5f6368);
  font: 12px/16px var(--dsw-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);
  text-align: start;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
@media (hover: hover) {
  .dsh-st-group:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04)); }
}
.dsh-st-group:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-state-business-primary, #2563eb); outline-offset: -2px; }
.dsh-st-group.dsh-st-drop { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #2563eb) 14%, transparent); box-shadow: inset 0 0 0 1px var(--dsw-alias-state-business-primary, #2563eb); }
.dsh-st-group.dsh-st-editing { cursor: default; }
.dsh-st-chevron { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; color: var(--dsw-alias-label-tertiary, #8a8f98); transition: transform 0.15s var(--ds-ease-in-out, ease); }
.dsh-st-group[aria-expanded="true"] .dsh-st-chevron { transform: rotate(90deg); }
.dsh-st-folder { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; color: var(--dsw-alias-label-tertiary, #8a8f98); }
.dsh-st-group[data-dsh-st-virtual="1"] .dsh-st-folder { opacity: 0.5; }
.dsh-st-name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-st-count { flex: none; color: var(--dsw-alias-label-tertiary, #8a8f98); font-size: 10px; line-height: 16px; }
.dsh-st-actions { flex: none; display: none; align-items: center; gap: 2px; }
@media (hover: hover) {
  .dsh-st-group:hover .dsh-st-actions { display: inline-flex; }
}
.dsh-st-group:focus-within .dsh-st-actions,
.dsh-st-group.dsh-st-editing .dsh-st-actions { display: inline-flex; }
.dsh-st-group[data-dsh-st-virtual="1"] .dsh-st-actions { display: none !important; }
.dsh-st-action {
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #8a8f98);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dsh-st-action:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06)); color: var(--dsw-alias-label-secondary, #5f6368); }
.dsh-st-action.dsh-st-danger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #dc2626) 12%, transparent); color: var(--dsw-alias-state-error-primary, #dc2626); }
.dsh-st-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 40px;
  padding: 0 3px;
  border: 0.5px solid var(--dsw-alias-border-l4, #c9ccd1);
  border-radius: var(--dsw-radius-sm, 4px);
  background: var(--dsw-alias-button-elevated-fill, #fff);
  color: inherit;
  font: inherit;
  line-height: 18px;
  outline: none;
}
.dsh-st-input:focus { border-color: var(--dsw-alias-state-business-primary, #2563eb); }
[data-dsh-st-depth] {
  padding-inline-start: calc(var(--dsh-sidebar-row-padding, 12px) - var(--dsh-sidebar-paint-inset, 3px) + var(--dsh-workspace-indent, 0px) + var(--dsh-st-indent, 0px)) !important;
}
[data-dsh-st-hidden="1"] { display: none !important; }
.dsh-st-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 18, 22, 0.3);
  animation: dsh-st-fade 0.12s ease-out;
}
.dsh-st-dialog {
  box-sizing: border-box;
  width: min(380px, calc(100vw - 48px));
  padding: 18px;
  border-radius: 12px;
  background: var(--dsw-alias-bg-elevated, #fff);
  color: var(--dsw-alias-label-primary, #1f2328);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.24);
  font: 13px/1.55 var(--dsw-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);
}
.dsh-st-dialog-title { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
.dsh-st-dialog-message { margin: 0 0 14px; color: var(--dsw-alias-label-secondary, #5f6368); }
.dsh-st-dialog-label { display: block; margin-bottom: 6px; color: var(--dsw-alias-label-secondary, #5f6368); font-size: 12px; }
.dsh-st-dialog-field {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 0.5px solid var(--dsw-alias-border-l4, #c9ccd1);
  border-radius: 6px;
  background: var(--dsw-alias-button-elevated-fill, #fff);
  color: var(--dsw-alias-label-primary, #1f2328);
  font: inherit;
  outline: none;
}
.dsh-st-dialog-field:focus { border-color: var(--dsw-alias-state-business-primary, #2563eb); }
.dsh-st-dialog-error { min-height: 18px; margin-top: 6px; color: var(--dsw-alias-state-error-primary, #dc2626); font-size: 12px; }
.dsh-st-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.dsh-st-btn {
  height: 30px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l4, #c9ccd1);
  border-radius: 6px;
  background: var(--dsw-alias-button-elevated-fill, #fff);
  color: var(--dsw-alias-label-primary, #1f2328);
  font: inherit;
  cursor: pointer;
}
.dsh-st-btn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04)); }
.dsh-st-btn-primary { border-color: transparent; background: var(--dsw-alias-state-business-primary, #2563eb); color: #fff; }
.dsh-st-btn-primary:hover { background: var(--dsw-alias-state-business-primary, #2563eb); filter: brightness(1.05); }
.dsh-st-btn-danger { border-color: transparent; background: var(--dsw-alias-state-error-primary, #dc2626); color: #fff; }
.dsh-st-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.dsh-st-toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  z-index: 2147483700;
  transform: translateX(-50%);
  max-width: min(420px, calc(100vw - 48px));
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(24, 28, 33, 0.9);
  color: #fff;
  font: 12px/18px var(--dsw-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: dsh-st-fade 0.14s ease-out;
}
@keyframes dsh-st-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .dsh-st-chevron, .dsh-st-backdrop, .dsh-st-toast { transition: none; animation: none; }
}
`;

    // ---------------------------------------------------------------------
    // Runtime state
    // ---------------------------------------------------------------------

    /** @type {{ version: number, workspaces: Record<string, WorkspaceState> }} */
    let state = emptyState();
    let ctxRef = null;
    let observer = null;
    let styleEl = null;
    let scheduled = false;
    let applying = false;
    let disposed = false;
    let storageHandler = null;
    let editing = null;
    let toastEl = null;
    let dialogEls = [];
    let hostRpc = null;
    let hostMode = false;
    let hostSaveTimer = null;
    let hostSaving = false;
    let hostSaveQueued = false;
    let hostSaveWarned = false;
    let hostLoaded = false;
    let hostRevision = 0;
    let dirty = false;
    const expandedAttempted = new Set();
    const expanding = new Set();
    const sectionUis = new Map();
    const instance = { dispose: null };

    function emptyState() {
      return { version: 1, revision: 0, workspaces: {} };
    }

    function uid(prefix) {
      return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    }

    function isZh() {
      const lang = (document.documentElement.lang || navigator.language || "").toLowerCase();
      return lang.startsWith("zh");
    }

    function t(key, vars) {
      const table = isZh() ? STRINGS.zh : STRINGS.en;
      let text = table[key] ?? STRINGS.en[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) text = text.split("{" + name + "}").join(String(value));
      }
      return text;
    }

    function icon(name) {
      const span = document.createElement("span");
      span.className = "dsh-st-icon";
      span.innerHTML = ICONS[name] || "";
      return span;
    }

    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    let debugEl = null;
    function debug(text, isError) {
      if (!DEBUG || typeof document === "undefined" || !document.body) return;
      if (!debugEl || !debugEl.isConnected) {
        debugEl = document.createElement("div");
        debugEl.id = MARK + "-debug";
        debugEl.style.cssText =
          "position:fixed;right:10px;bottom:10px;z-index:2147483750;" +
          "max-width:900px;padding:4px 8px;border-radius:6px;" +
          "font:11px/16px ui-monospace,Consolas,monospace;color:#fff;" +
          "background:rgba(24,28,33,.9);pointer-events:none;white-space:pre-wrap";
        document.body.append(debugEl);
      }
      debugEl.textContent = String(text);
      debugEl.style.background = isError ? "rgba(180,28,28,.94)" : "rgba(24,28,33,.9)";
    }

    function normalizePath(value) {
      return String(value || "").replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
    }

    function getService(name) {
      try {
        if (!ctxRef) return undefined;
        if (typeof ctxRef.get === "function") {
          const value = ctxRef.get(name);
          if (value !== undefined && value !== null) return value;
        }
        return ctxRef[name];
      } catch {
        return undefined;
      }
    }

    // ---------------------------------------------------------------------
    // Persistence
    // ---------------------------------------------------------------------

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return emptyState();
        return sanitizeState(JSON.parse(raw));
      } catch (error) {
        console.warn("[" + MARK + "] could not read saved groups", error);
        return emptyState();
      }
    }

    function writeLocalCache() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn("[" + MARK + "] could not save groups", error);
      }
    }

    function saveState(force) {
      // Another window may be ahead of this one; never overwrite a newer
      // revision with stale in-memory groups. Import/reset pass `true`
      // because replacing everything is the explicit intent.
      const stored = loadState();
      const storedRevision = Number.isFinite(stored.revision) ? stored.revision : 0;
      const localRevision = Number.isFinite(state.revision) ? state.revision : 0;
      if (!force && storedRevision > localRevision) {
        state = stored;
        scheduleApply();
        toast(t("externalUpdate"));
        return;
      }
      dirty = true;
      const base = Math.max(localRevision, hostRevision, storedRevision);
      state.revision = base + 1;
      writeLocalCache();
      if (hostMode) scheduleHostSave();
    }

    function hasGroupData(value) {
      if (!value || value.version !== 1 || !value.workspaces || typeof value.workspaces !== "object") {
        return false;
      }
      return Object.values(value.workspaces).some(
        (workspace) => workspace && Array.isArray(workspace.groups) && workspace.groups.length > 0,
      );
    }

    function scheduleHostSave() {
      if (!hostRpc) return;
      if (hostSaveTimer !== null) clearTimeout(hostSaveTimer);
      hostSaveTimer = setTimeout(() => {
        hostSaveTimer = null;
        void flushHostSave();
      }, HOST_SAVE_DELAY);
    }

    async function flushHostSave() {
      if (!hostRpc) return;
      if (hostSaving) {
        hostSaveQueued = true;
        return;
      }
      hostSaving = true;
      const snapshot = state;
      const snapshotRevision = Number.isFinite(snapshot.revision) ? snapshot.revision : 0;
      try {
        const result = await hostRpc.call(HOST_CHANNEL, "save", { state: snapshot });
        if (!result || result.ok !== true) {
          throw new Error(result && result.error && result.error.message ? result.error.message : "save failed");
        }
        hostRevision = Math.max(hostRevision, snapshotRevision);
      } catch (error) {
        console.warn("[" + MARK + "] could not save groups to disk", error);
        if (!hostSaveWarned) {
          hostSaveWarned = true;
          toast(t("saveFailed"));
        }
      } finally {
        hostSaving = false;
        if (hostSaveQueued) {
          hostSaveQueued = false;
          scheduleHostSave();
        }
      }
    }

    async function hydrateFromHost(rpc) {
      hostRpc = rpc;
      try {
        const result = await rpc.call(HOST_CHANNEL, "load", {});
        if (!result || result.ok !== true) {
          throw new Error(result && result.error && result.error.message ? result.error.message : "load failed");
        }
        hostMode = true;
        hostLoaded = true;
        const remote = result.value && result.value.state;
        const localRevision = Number.isFinite(state.revision) ? state.revision : 0;
        const remoteRevision = remote && Number.isFinite(remote.revision) ? remote.revision : 0;
        hostRevision = remoteRevision;

        if (dirty || localRevision > remoteRevision) {
          // The browser has edits the file has not seen (including a reset to
          // an empty tree); push them instead of adopting the older file.
          scheduleHostSave();
        } else if (hasGroupData(remote)) {
          state = sanitizeState(remote);
          writeLocalCache();
          scheduleApply();
        } else if (hasGroupData(state)) {
          // First run after upgrading: move the browser's tree onto disk.
          scheduleHostSave();
        }
      } catch (error) {
        hostMode = false;
        hostLoaded = false;
        console.warn("[" + MARK + "] host storage unavailable, staying on localStorage", error);
      }
    }

    function countState(value) {
      let groups = 0;
      let sessions = 0;
      for (const workspace of Object.values(value.workspaces || {})) {
        if (!workspace) continue;
        groups += Array.isArray(workspace.groups) ? workspace.groups.length : 0;
        sessions += workspace.assignments ? Object.keys(workspace.assignments).length : 0;
      }
      return { groups, sessions };
    }

    function exportPayload() {
      return {
        format: "dsh-session-tree",
        version: 1,
        exportedAt: new Date().toISOString(),
        state,
      };
    }

    function exportJson() {
      return JSON.stringify(exportPayload(), null, 2);
    }

    function exportData() {
      try {
        const blob = new Blob([exportJson()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "dsh-session-tree-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast(t("exported"));
      } catch (error) {
        console.error("[" + MARK + "] could not export groups", error);
        toast(t("exportFailed"));
      }
    }

    function importDataFromText(text) {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        toast(t("importFailed"));
        return;
      }
      const candidate = parsed && typeof parsed === "object" && parsed.state ? parsed.state : parsed;
      const next = sanitizeState(candidate);
      if (!hasGroupData(next)) {
        toast(t("importEmpty"));
        return;
      }
      openConfirm({
        title: t("importTitle"),
        message: t("importMessage", countState(next)),
        confirmText: t("importConfirm"),
        danger: false,
        onConfirm: () => {
          state = next;
          saveState(true);
          scheduleApply();
          toast(t("imported"));
        },
      });
    }

    function pickImportFile() {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.style.display = "none";
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) {
          input.remove();
          return;
        }
        if (file.size > 4 * 1024 * 1024) {
          input.remove();
          toast(t("importFailed"));
          return;
        }
        file.text().then(
          (text) => {
            input.remove();
            importDataFromText(text);
          },
          (error) => {
            input.remove();
            console.warn("[" + MARK + "] could not read import file", error);
            toast(t("importFailed"));
          },
        );
      });
      document.body.append(input);
      input.click();
    }

    function sanitizeState(raw) {
      if (!raw || typeof raw !== "object" || raw.version !== 1 || !raw.workspaces || typeof raw.workspaces !== "object") {
        return emptyState();
      }
      const next = emptyState();
      next.revision = Number.isFinite(raw.revision) && raw.revision >= 0 ? Math.floor(raw.revision) : 0;
      for (const [wsId, value] of Object.entries(raw.workspaces)) {
        if (!wsId || !value || typeof value !== "object") continue;
        const ws = { groups: [], assignments: {}, sessionOrder: {}, ungroupedCollapsed: value.ungroupedCollapsed === true };
        const ids = new Set();
        for (const group of Array.isArray(value.groups) ? value.groups : []) {
          if (!group || typeof group !== "object") continue;
          const id = typeof group.id === "string" ? group.id : "";
          if (!id || ids.has(id) || id === UNGROUPED) continue;
          ids.add(id);
          ws.groups.push({
            id,
            name: typeof group.name === "string" && group.name.trim() ? group.name.trim().slice(0, 80) : t("groupDefault"),
            parentId: typeof group.parentId === "string" ? group.parentId : null,
            order: Number.isFinite(group.order) ? group.order : 0,
            collapsed: group.collapsed === true,
          });
        }
        for (const group of ws.groups) {
          if (group.parentId && !ids.has(group.parentId)) group.parentId = null;
        }
        // Break accidental parent cycles.
        for (const group of ws.groups) {
          const seen = new Set([group.id]);
          let cursor = group.parentId;
          while (cursor) {
            if (seen.has(cursor)) { group.parentId = null; break; }
            seen.add(cursor);
            const parent = ws.groups.find((candidate) => candidate.id === cursor);
            cursor = parent ? parent.parentId : null;
          }
        }
        if (value.assignments && typeof value.assignments === "object") {
          for (const [sessionId, groupId] of Object.entries(value.assignments)) {
            if (typeof sessionId === "string" && typeof groupId === "string" && ids.has(groupId)) {
              ws.assignments[sessionId] = groupId;
            }
          }
        }
        if (value.sessionOrder && typeof value.sessionOrder === "object") {
          for (const [sessionId, order] of Object.entries(value.sessionOrder)) {
            if (ws.assignments[sessionId] && Number.isFinite(order)) {
              ws.sessionOrder[sessionId] = order;
            }
          }
        }
        next.workspaces[wsId] = ws;
      }
      return next;
    }

    function getWorkspace(wsId, create) {
      if (!wsId) return undefined;
      let ws = state.workspaces[wsId];
      if (!ws && create) {
        ws = { groups: [], assignments: {}, sessionOrder: {}, ungroupedCollapsed: false };
        state.workspaces[wsId] = ws;
      }
      return ws;
    }

    function findGroup(ws, groupId) {
      if (!ws || !groupId) return undefined;
      return ws.groups.find((group) => group.id === groupId);
    }

    function sortedChildren(ws, parentId) {
      const parent = parentId ?? null;
      return ws.groups
        .filter((group) => (group.parentId ?? null) === parent)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
    }

    function nextOrder(ws, parentId) {
      const children = sortedChildren(ws, parentId);
      let max = 0;
      for (const child of children) max = Math.max(max, child.order ?? 0);
      return max + 1;
    }

    function collectGroupIds(ws, rootId) {
      const ids = new Set([rootId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const group of ws.groups) {
          if (group.parentId && ids.has(group.parentId) && !ids.has(group.id)) {
            ids.add(group.id);
            changed = true;
          }
        }
      }
      return ids;
    }

    function uniqueGroupName(ws, parentId, base) {
      const names = new Set(sortedChildren(ws, parentId).map((group) => group.name));
      if (!names.has(base)) return base;
      for (let index = 2; index < 1000; index++) {
        const candidate = base + " " + index;
        if (!names.has(candidate)) return candidate;
      }
      return base + " " + Date.now().toString(36);
    }

    // ---------------------------------------------------------------------
    // Section discovery and decoration
    // ---------------------------------------------------------------------

    function workspaceHeaders() {
      return Array.from(document.querySelectorAll('[data-row-key^="workspace:"]'));
    }

    function headerWorkspaceId(header) {
      const key = header.getAttribute("data-row-key") || "";
      return key.startsWith("workspace:") ? key.slice("workspace:".length) : "";
    }

    function sessionIdOf(row) {
      const key = row.getAttribute("data-row-key") || "";
      return key.startsWith("session:") ? key.slice("session:".length) : "";
    }

    /**
     * Official rows are wrapped by a HoverCard/Tooltip span, so the flex item
     * that carries `order` is the wrapper, while padding and row semantics
     * stay on the row itself. When a row is a direct child, it is its own
     * wrapper.
     */
    function wrapperOf(row) {
      const parent = row.parentElement;
      if (!parent) return row;
      if (parent.hasAttribute("data-dsh-st-section")) return row;
      return parent;
    }

    /**
     * The Workspace section a row belongs to: the wrapper's parent, i.e. the
     * element whose parent is the `role="tree"` list (or the nested
     * `role="group"` container).
     */
    function sectionForElement(element) {
      let node = element.parentElement;
      if (!node) return null;
      for (let depth = 0; node && depth < 6; depth++) {
        const parent = node.parentElement;
        if (!parent) return node;
        const role = parent.getAttribute("role");
        if (role === "tree" || role === "group") return node;
        node = parent;
      }
      return element.parentElement?.parentElement || element.parentElement;
    }

    function sectionForHeader(header) {
      return sectionForElement(header);
    }

    function headerInSection(section) {
      return section.querySelector('[data-row-key^="workspace:"]');
    }

    function sessionRowsInSection(section) {
      return Array.from(section.querySelectorAll('[data-row-key^="session:"]')).filter(
        (row) => sectionForElement(row) === section,
      );
    }

    function overflowInSection(section) {
      return Array.from(section.querySelectorAll('[data-row-key^="overflow:"]')).find(
        (row) => sectionForElement(row) === section,
      );
    }

    function findSectionByWorkspace(wsId) {
      for (const [section, ui] of sectionUis) {
        if (ui.wsId === wsId && section.isConnected) return section;
      }
      for (const header of workspaceHeaders()) {
        if (headerWorkspaceId(header) === wsId) return sectionForHeader(header);
      }
      return null;
    }

    function ensureSectionUi(section, wsId) {
      let ui = sectionUis.get(section);
      const header = headerInSection(section);
      if (ui && (!section.contains(ui.container) || ui.header !== header)) {
        for (const unsubscribe of ui.listeners) {
          try {
            unsubscribe();
          } catch {
            /* ignore */
          }
        }
        ui.container.remove();
        ui = undefined;
      }
      if (ui) {
        ui.wsId = wsId;
        return ui;
      }
      if (!section.hasAttribute("data-dsh-st-section")) {
        section.setAttribute("data-dsh-st-section", "");
      }
      section.setAttribute("data-dsh-st-ws", wsId);

      const container = document.createElement("div");
      container.setAttribute("data-dsh-st-container", "");
      container.className = "dsh-st-groups";
      section.append(container);

      ui = { wsId, section, header, container, headers: new Map(), listeners: [] };
      sectionUis.set(section, ui);
      installWorkspaceDropTarget(ui);
      return ui;
    }

    function installWorkspaceDropTarget(ui) {
      const header = headerInSection(ui.section);
      if (!header) return;
      const hasGroup = (event) => {
        try {
          return Array.from(event.dataTransfer?.types || []).includes(GROUP_MIME);
        } catch {
          return false;
        }
      };
      const over = (event) => {
        if (!hasGroup(event)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        header.classList.add("dsh-st-drop");
      };
      const leave = (event) => {
        if (!hasGroup(event)) return;
        header.classList.remove("dsh-st-drop");
      };
      const drop = (event) => {
        if (!hasGroup(event)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        header.classList.remove("dsh-st-drop");
        try {
          const payload = JSON.parse(event.dataTransfer.getData(GROUP_MIME) || "{}");
          if (payload.workspaceId === ui.wsId && payload.groupId) {
            moveGroup(ui.wsId, payload.groupId, null);
          }
        } catch {
          /* malformed payload */
        }
      };
      header.addEventListener("dragover", over, true);
      header.addEventListener("dragleave", leave, true);
      header.addEventListener("drop", drop, true);
      ui.listeners.push(() => {
        header.removeEventListener("dragover", over, true);
        header.removeEventListener("dragleave", leave, true);
        header.removeEventListener("drop", drop, true);
      });
    }

    function resetRow(row) {
      const wrapper = wrapperOf(row);
      wrapper.classList.remove("dsh-st-hidden");
      wrapper.style.removeProperty("order");
      delete wrapper.dataset.dshStHidden;
      row.classList.remove("dsh-st-hidden");
      row.style.removeProperty("order");
      row.style.removeProperty("--dsh-st-indent");
      delete row.dataset.dshStDepth;
      delete row.dataset.dshStHidden;
    }

    function resetSection(ui) {
      if (ui.container.childElementCount > 0) ui.container.replaceChildren();
      ui.headers.clear();
      ui.container.style.display = "none";
      for (const row of sessionRowsInSection(ui.section)) resetRow(row);
      const overflow = overflowInSection(ui.section);
      if (overflow) resetRow(overflow);
    }

    // ---------------------------------------------------------------------
    // Group tree plan
    // ---------------------------------------------------------------------

    function sessionOrderOf(ws, sessionId, fallback) {
      const order = ws && ws.sessionOrder ? ws.sessionOrder[sessionId] : undefined;
      return Number.isFinite(order) ? order : fallback;
    }

    function buildPlan(ws, rows) {
      const groups = ws ? ws.groups : [];
      const assignments = ws ? ws.assignments : {};
      const rowIds = rows.map(sessionIdOf);
      const groupIds = new Set(groups.map((group) => group.id));
      const byParent = new Map();
      for (const group of groups) {
        const parentId = group.parentId && groupIds.has(group.parentId) ? group.parentId : null;
        const list = byParent.get(parentId) || [];
        list.push(group);
        byParent.set(parentId, list);
      }
      for (const list of byParent.values()) {
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
      }
      const directCount = new Map();
      for (const id of rowIds) {
        const groupId = assignments[id];
        if (groupId && groupIds.has(groupId)) directCount.set(groupId, (directCount.get(groupId) || 0) + 1);
      }
      const totals = new Map();
      const totalOf = (groupId) => {
        if (totals.has(groupId)) return totals.get(groupId);
        let total = directCount.get(groupId) || 0;
        for (const child of byParent.get(groupId) || []) total += totalOf(child.id);
        totals.set(groupId, total);
        return total;
      };

      const plan = [];
      const seen = new Set();
      const walk = (parentId, depth) => {
        for (const group of byParent.get(parentId) || []) {
          plan.push({
            type: "group",
            group,
            depth,
            collapsed: group.collapsed === true,
            count: totalOf(group.id),
            virtual: false,
          });
          if (group.collapsed === true) continue;
          walk(group.id, depth + 1);
          const members = [];
          for (let index = 0; index < rows.length; index++) {
            if (assignments[rowIds[index]] !== group.id) continue;
            members.push({ row: rows[index], id: rowIds[index], index });
          }
          members.sort(
            (a, b) => sessionOrderOf(ws, a.id, a.index) - sessionOrderOf(ws, b.id, b.index) || a.index - b.index,
          );
          for (const member of members) {
            plan.push({ type: "session", row: member.row, id: member.id, depth: depth + 1 });
            seen.add(member.id);
          }
        }
      };
      walk(null, 0);

      const ungroupedMembers = [];
      for (let index = 0; index < rows.length; index++) {
        const groupId = assignments[rowIds[index]];
        if (groupId && groupIds.has(groupId)) continue;
        ungroupedMembers.push({ row: rows[index], id: rowIds[index], index });
      }
      ungroupedMembers.sort(
        (a, b) => sessionOrderOf(ws, a.id, a.index) - sessionOrderOf(ws, b.id, b.index) || a.index - b.index,
      );
      const ungroupedCollapsed = ws ? ws.ungroupedCollapsed === true : false;
      plan.push({
        type: "group",
        group: { id: UNGROUPED, name: t("ungrouped") },
        depth: 0,
        collapsed: ungroupedCollapsed,
        count: ungroupedMembers.length,
        virtual: true,
      });
      if (!ungroupedCollapsed) {
        for (const member of ungroupedMembers) {
          plan.push({ type: "session", row: member.row, id: member.id, depth: 1 });
          seen.add(member.id);
        }
      }

      return { plan, seen };
    }

    function ensureGroupHeader(ui, wsId, item) {
      const group = item.group;
      let header = ui.headers.get(group.id);
      if (header && !ui.container.contains(header)) {
        ui.headers.delete(group.id);
        header = undefined;
      }
      if (!header) {
        header = createGroupHeader(wsId, group, item.virtual);
        ui.headers.set(group.id, header);
        ui.container.append(header);
      }

      header.style.order = String(item.order);
      header.dataset.dshStGroup = group.id;
      header.dataset.dshStWs = wsId;
      header.dataset.dshStVirtual = item.virtual ? "1" : "0";
      header.style.setProperty("--dsh-st-indent", INDENT_BASE + item.depth * INDENT_STEP + "px");
      header.setAttribute("aria-expanded", item.collapsed ? "false" : "true");
      header.title = group.name;

      const countEl = header.querySelector(".dsh-st-count");
      if (countEl && countEl.textContent !== String(item.count)) countEl.textContent = String(item.count);

      const nameEl = header.querySelector(".dsh-st-name");
      const isEditing = editing && editing.wsId === wsId && editing.groupId === group.id;
      if (nameEl) {
        if (isEditing) {
          header.classList.add("dsh-st-editing");
          renderRenameInput(header, nameEl, editing);
        } else {
          header.classList.remove("dsh-st-editing");
          const input = nameEl.querySelector("input");
          if (input) input.remove();
          if (nameEl.textContent !== group.name) nameEl.textContent = group.name;
        }
      }

      const actions = header.querySelector(".dsh-st-actions");
      if (actions) actions.style.display = item.virtual ? "none" : "";
      return header;
    }

    function createGroupHeader(wsId, group, virtual) {
      const header = document.createElement("div");
      header.className = "dsh-st-group";
      header.setAttribute("role", "treeitem");
      header.tabIndex = 0;
      header.innerHTML =
        '<span class="dsh-st-chevron" aria-hidden="true">' +
        ICONS.chevron +
        "</span>" +
        '<span class="dsh-st-folder" aria-hidden="true">' +
        ICONS.folder +
        "</span>" +
        '<span class="dsh-st-name"></span>' +
        '<span class="dsh-st-count"></span>' +
        '<span class="dsh-st-actions">' +
        '<button type="button" class="dsh-st-action" data-action="subgroup" title="' +
        escapeAttr(t("newSubgroup")) +
        '" aria-label="' +
        escapeAttr(t("newSubgroup")) +
        '">' +
        ICONS.plus +
        "</button>" +
        '<button type="button" class="dsh-st-action" data-action="rename" title="' +
        escapeAttr(t("rename")) +
        '" aria-label="' +
        escapeAttr(t("rename")) +
        '">' +
        ICONS.pencil +
        "</button>" +
        '<button type="button" class="dsh-st-action dsh-st-danger" data-action="delete" title="' +
        escapeAttr(t("deleteGroup")) +
        '" aria-label="' +
        escapeAttr(t("deleteGroup")) +
        '">' +
        ICONS.trash +
        "</button>" +
        "</span>";

      header.addEventListener("click", (event) => {
        if (event.target.closest("button, input")) return;
        if (virtual) toggleGroup(wsId, UNGROUPED);
        else toggleGroup(wsId, group.id);
      });
      header.addEventListener("dblclick", (event) => {
        if (virtual || event.target.closest("button, input")) return;
        beginRename(wsId, group.id, false);
      });
      header.addEventListener("keydown", (event) => {
        if (event.target !== header) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (virtual) toggleGroup(wsId, UNGROUPED);
          else toggleGroup(wsId, group.id);
        } else if (event.key === "F2" && !virtual) {
          event.preventDefault();
          beginRename(wsId, group.id, false);
        }
      });
      header.addEventListener("contextmenu", (event) => {
        if (virtual) return;
        event.preventDefault();
        event.stopPropagation();
        // The action buttons are the primary surface; right-click toggles the
        // same actions via the small menu anchored at the pointer.
        openGroupMiniMenu(wsId, group.id, event.clientX, event.clientY);
      });

      const actions = header.querySelector(".dsh-st-actions");
      actions.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        event.stopPropagation();
        if (button.dataset.action === "subgroup") createGroup(wsId, group.id);
        else if (button.dataset.action === "rename") beginRename(wsId, group.id, false);
        else if (button.dataset.action === "delete") confirmDeleteGroup(wsId, group.id);
      });

      if (!virtual) {
        header.draggable = true;
        header.addEventListener("dragstart", (event) => {
          if (editing && editing.groupId === group.id) {
            event.preventDefault();
            return;
          }
          event.stopPropagation();
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(GROUP_MIME, JSON.stringify({ workspaceId: wsId, groupId: group.id }));
          event.dataTransfer.setData("text/plain", "dsh-session-tree-group:" + group.id);
        });
      }

      header.addEventListener("dragover", (event) => {
        let types = [];
        try {
          types = Array.from(event.dataTransfer?.types || []);
        } catch {
          return;
        }
        const isGroup = types.includes(GROUP_MIME);
        const isSession = types.includes("text/plain");
        if (!isGroup && !isSession) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        header.classList.add("dsh-st-drop");
      });
      header.addEventListener("dragleave", (event) => {
        if (event.relatedTarget && header.contains(event.relatedTarget)) return;
        header.classList.remove("dsh-st-drop");
      });
      header.addEventListener("drop", (event) => {
        let types = [];
        try {
          types = Array.from(event.dataTransfer?.types || []);
        } catch {
          return;
        }
        const isGroup = types.includes(GROUP_MIME);
        const isSession = types.includes("text/plain");
        if (!isGroup && !isSession) return;
        event.preventDefault();
        event.stopPropagation();
        header.classList.remove("dsh-st-drop");
        if (isGroup) {
          try {
            const payload = JSON.parse(event.dataTransfer.getData(GROUP_MIME) || "{}");
            if (payload.workspaceId === wsId && payload.groupId && !virtual) {
              moveGroup(wsId, payload.groupId, group.id);
            }
          } catch {
            /* malformed payload */
          }
          return;
        }
        const sessionId = event.dataTransfer.getData("text/plain");
        if (!sessionId || !sessionId.startsWith("session-")) return;
        const sessionWorkspace = workspaceForSession(sessionId);
        if (sessionWorkspace && sessionWorkspace !== wsId) return;
        if (virtual) moveSession(wsId, sessionId, null);
        else moveSession(wsId, sessionId, group.id);
      });

      return header;
    }

    function renderRenameInput(header, nameEl, draft) {
      let input = nameEl.querySelector("input");
      if (!input) {
        nameEl.textContent = "";
        input = document.createElement("input");
        input.className = "dsh-st-input";
        input.type = "text";
        input.maxLength = 80;
        input.value = draft.draft;
        input.setAttribute("aria-label", t("nameLabel"));
        input.addEventListener("input", () => {
          draft.draft = input.value;
        });
        input.addEventListener("click", (event) => event.stopPropagation());
        input.addEventListener("dblclick", (event) => event.stopPropagation());
        input.addEventListener("keydown", (event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            commitRename();
          } else if (event.key === "Escape") {
            event.preventDefault();
            cancelRename();
          }
        });
        input.addEventListener("blur", () => {
          if (editing === draft) commitRename();
        });
        nameEl.append(input);
        requestAnimationFrame(() => {
          if (input.isConnected) {
            input.focus();
            input.select();
          }
        });
      } else if (input.value !== draft.draft) {
        input.value = draft.draft;
      }
    }

    function escapeAttr(value) {
      return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    }

    // ---------------------------------------------------------------------
    // Apply layout
    // ---------------------------------------------------------------------

    function scheduleApply() {
      if (disposed || scheduled) return;
      scheduled = true;
      const run = () => {
        scheduled = false;
        applyNow();
      };
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
      else setTimeout(run, 16);
    }

    function applyNow() {
      if (disposed || applying) return;
      applying = true;
      try {
        const live = new Set();
        for (const header of workspaceHeaders()) {
          const section = sectionForHeader(header);
          if (!section) continue;
          const wsId = headerWorkspaceId(header);
          if (!wsId) continue;
          live.add(section);
          decorateSection(header, section, wsId);
        }
        for (const [section, ui] of Array.from(sectionUis.entries())) {
          if (live.has(section) && section.isConnected) continue;
          disposeSectionUi(section, ui);
        }
        if (editing) {
          const ui = sectionUis.get(document.querySelector('[data-dsh-st-ws="' + cssEscape(editing.wsId) + '"]'));
          const header = ui && ui.headers.get(editing.groupId);
          if (!header || !header.isConnected) editing = null;
        }
      } finally {
        applying = false;
      }
    }

    function decorateSection(header, section, wsId) {
      const expanded = header.getAttribute("aria-expanded") !== "false";
      const rows = sessionRowsInSection(section);
      const ui = ensureSectionUi(section, wsId);
      const ws = getWorkspace(wsId, false);
      const hasGroups = !!ws && ws.groups.length > 0;
      const headerWrapper = wrapperOf(header);

      headerWrapper.style.order = "0";
      for (const child of Array.from(section.children)) {
        if (child === headerWrapper || child === ui.container) continue;
        if (child.getAttribute("role") === "group") {
          child.style.order = "1";
          continue;
        }
        if (child.querySelector?.('[data-row-key^="overflow:"]')) {
          child.style.order = String(OVERFLOW_ORDER);
          continue;
        }
        if (child.querySelector?.('[data-row-key^="session:"]')) continue;
        child.style.order = "5";
      }

      if (!expanded) {
        resetSection(ui);
        return;
      }

      ui.container.style.display = "contents";

      if (!hasGroups) {
        if (ui.container.childElementCount > 0) ui.container.replaceChildren();
        ui.headers.clear();
        for (const row of rows) resetRow(row);
        const overflow = overflowInSection(section);
        if (overflow) wrapperOf(overflow).style.order = String(OVERFLOW_ORDER);
        return;
      }

      const { plan, seen } = buildPlan(ws, rows);
      let order = 10;
      for (const item of plan) {
        item.order = order++;
        if (item.type === "group") {
          ensureGroupHeader(ui, wsId, item);
        } else {
          const row = item.row;
          const wrapper = wrapperOf(row);
          wrapper.style.order = String(item.order);
          wrapper.classList.remove("dsh-st-hidden");
          delete wrapper.dataset.dshStHidden;
          row.dataset.dshStDepth = String(item.depth);
          row.style.setProperty("--dsh-st-indent", INDENT_BASE + item.depth * INDENT_STEP + "px");
          row.classList.remove("dsh-st-hidden");
          delete row.dataset.dshStHidden;
        }
      }

      const planGroupIds = new Set(plan.filter((item) => item.type === "group").map((item) => item.group.id));
      for (const [groupId, groupHeader] of Array.from(ui.headers.entries())) {
        if (planGroupIds.has(groupId)) continue;
        groupHeader.remove();
        ui.headers.delete(groupId);
      }

      for (const row of rows) {
        const id = sessionIdOf(row);
        if (!id || seen.has(id)) continue;
        const wrapper = wrapperOf(row);
        wrapper.classList.add("dsh-st-hidden");
        wrapper.dataset.dshStHidden = "1";
      }

      const overflow = overflowInSection(section);
      if (overflow) {
        wrapperOf(overflow).style.order = String(OVERFLOW_ORDER);
        // The native "show more" row often appears after our first attempt;
        // retry whenever a grouped workspace still has hidden sessions.
        maybeExpandAll(wsId);
      }
    }

    function disposeSectionUi(section, ui) {
      for (const unsubscribe of ui.listeners) {
        try {
          unsubscribe();
        } catch {
          /* ignore */
        }
      }
      ui.container.remove();
      for (const row of sessionRowsInSection(section)) resetRow(row);
      const overflow = overflowInSection(section);
      if (overflow) resetRow(overflow);
      const header = headerInSection(section);
      if (header) {
        wrapperOf(header).style.removeProperty("order");
        header.style.removeProperty("order");
      }
      for (const child of Array.from(section.children)) {
        if (child === header) continue;
        if (child.getAttribute("role") === "group") child.style.removeProperty("order");
      }
      section.removeAttribute("data-dsh-st-section");
      section.removeAttribute("data-dsh-st-ws");
      sectionUis.delete(section);
      if (editing && editing.wsId === ui.wsId) editing = null;
    }

    // ---------------------------------------------------------------------
    // Group mutations
    // ---------------------------------------------------------------------

    function createGroup(wsId, parentId, options) {
      const opts = options || {};
      const ws = getWorkspace(wsId, true);
      if (!ws) return;
      ensureWorkspaceExpanded(wsId);
      let parent = parentId ? findGroup(ws, parentId) : undefined;
      if (parentId && !parent) parentId = null;
      const name = uniqueGroupName(ws, parentId ?? null, t("groupDefault"));
      const group = {
        id: uid("g"),
        name,
        parentId: parentId ?? null,
        order: nextOrder(ws, parentId ?? null),
        collapsed: false,
      };
      ws.groups.push(group);
      if (parent) parent.collapsed = false;
      if (opts.assignSessionId) {
        ws.assignments[opts.assignSessionId] = group.id;
        ws.sessionOrder = ws.sessionOrder || {};
        ws.sessionOrder[opts.assignSessionId] = nextSessionOrder(ws, group.id);
      }
      saveState();
      editing = { wsId, groupId: group.id, draft: name, isNew: true };
      scheduleApply();
      if (!opts.silent) maybeExpandAll(wsId);
      return group;
    }

    async function createSession(wsId, groupId) {
      const sessions = getService("sessions");
      if (!sessions || typeof sessions.create !== "function") {
        toast(t("sessionCreateFailed"));
        return;
      }
      try {
        ensureWorkspaceExpanded(wsId);
        const sessionId = await sessions.create({ workspaceId: wsId });
        if (!sessionId) throw new Error("session create returned no id");

        if (groupId) {
          const ws = getWorkspace(wsId, true);
          const group = findGroup(ws, groupId);
          if (ws && group) {
            const previous = ws.assignments[sessionId];
            if (previous !== groupId) {
              normalizeGroupOrder(wsId, groupId);
              ws.assignments[sessionId] = groupId;
              ws.sessionOrder = ws.sessionOrder || {};
              ws.sessionOrder[sessionId] = nextSessionOrder(ws, groupId);
            }
            group.collapsed = false;
            let parentId = group.parentId;
            while (parentId) {
              const parent = findGroup(ws, parentId);
              if (!parent) break;
              parent.collapsed = false;
              parentId = parent.parentId;
            }
            saveState();
            scheduleApply();
          }
        }

        const uiWorkspace = getService("uiWorkspace");
        if (uiWorkspace && typeof uiWorkspace.openSession === "function") {
          uiWorkspace.openSession(sessionId);
        }
      } catch (error) {
        console.warn("[" + MARK + "] could not create a session", error);
        toast(t("sessionCreateFailed"));
      }
    }

    function beginRename(wsId, groupId, isNew) {
      const ws = getWorkspace(wsId, false);
      const group = findGroup(ws, groupId);
      if (!group) return;
      editing = { wsId, groupId, draft: group.name, isNew: !!isNew };
      scheduleApply();
    }

    function commitRename() {
      if (!editing) return;
      const draft = editing;
      editing = null;
      const ws = getWorkspace(draft.wsId, false);
      const group = findGroup(ws, draft.groupId);
      if (!group) return;
      const name = String(draft.draft || "").trim();
      if (!name) {
        if (draft.isNew) removeGroupSilent(draft.wsId, draft.groupId);
        scheduleApply();
        return;
      }
      group.name = name.slice(0, 80);
      saveState();
      scheduleApply();
    }

    function cancelRename() {
      if (!editing) return;
      const draft = editing;
      editing = null;
      if (draft.isNew) removeGroupSilent(draft.wsId, draft.groupId);
      scheduleApply();
    }

    function toggleGroup(wsId, groupId) {
      const ws = getWorkspace(wsId, false);
      if (!ws) return;
      if (groupId === UNGROUPED) {
        ws.ungroupedCollapsed = !ws.ungroupedCollapsed;
      } else {
        const group = findGroup(ws, groupId);
        if (!group) return;
        group.collapsed = !group.collapsed;
      }
      saveState();
      scheduleApply();
    }

    function removeGroupSilent(wsId, groupId) {
      const ws = getWorkspace(wsId, false);
      const group = findGroup(ws, groupId);
      if (!ws || !group) return;
      const parentId = group.parentId ?? null;
      let movedSessions = 0;
      let movedChildren = 0;
      for (const child of ws.groups) {
        if (child.parentId !== groupId) continue;
        child.parentId = parentId;
        movedChildren += 1;
      }
      let destinationOrder = 0;
      if (parentId) {
        normalizeGroupOrder(wsId, parentId);
        destinationOrder = nextSessionOrder(ws, parentId);
      }
      for (const [sessionId, assigned] of Object.entries(ws.assignments)) {
        if (assigned !== groupId) continue;
        movedSessions += 1;
        if (parentId) {
          ws.assignments[sessionId] = parentId;
          ws.sessionOrder = ws.sessionOrder || {};
          ws.sessionOrder[sessionId] = destinationOrder;
          destinationOrder += 1;
        } else {
          delete ws.assignments[sessionId];
          if (ws.sessionOrder) delete ws.sessionOrder[sessionId];
        }
      }
      ws.groups = ws.groups.filter((candidate) => candidate.id !== groupId);
      // The destination must be visible, otherwise deleting a group looks
      // like it deleted its sessions too.
      if (parentId) {
        const parent = findGroup(ws, parentId);
        if (parent && (movedSessions > 0 || movedChildren > 0)) parent.collapsed = false;
      } else if (movedSessions > 0) {
        ws.ungroupedCollapsed = false;
      }
      if (ws.groups.length === 0) expandedAttempted.delete(wsId);
      saveState();
    }

    function confirmDeleteGroup(wsId, groupId) {
      const ws = getWorkspace(wsId, false);
      const group = findGroup(ws, groupId);
      if (!group) return;
      openConfirm({
        title: t("deleteTitle"),
        message: t("deleteMessage", { name: group.name }),
        confirmText: t("delete"),
        danger: true,
        onConfirm: () => {
          removeGroupSilent(wsId, groupId);
          scheduleApply();
        },
      });
    }

    function moveGroup(wsId, groupId, newParentId) {
      const ws = getWorkspace(wsId, false);
      const group = findGroup(ws, groupId);
      if (!ws || !group) return;
      if (newParentId === groupId) return;
      const descendants = collectGroupIds(ws, groupId);
      if (newParentId && descendants.has(newParentId)) return;
      if (newParentId && !findGroup(ws, newParentId)) return;
      group.parentId = newParentId ?? null;
      group.order = nextOrder(ws, group.parentId);
      if (newParentId) {
        const parent = findGroup(ws, newParentId);
        if (parent) parent.collapsed = false;
      }
      saveState();
      scheduleApply();
      toast(t("groupMoved"));
    }

    function moveGroupOrder(wsId, groupId, action) {
      const ws = getWorkspace(wsId, false);
      const group = findGroup(ws, groupId);
      if (!ws || !group) return;
      const parentId = group.parentId ?? null;
      const siblings = sortedChildren(ws, parentId).slice();
      const index = siblings.findIndex((candidate) => candidate.id === groupId);
      if (index < 0) return;
      let target = index;
      if (action === "up") target = index - 1;
      else if (action === "down") target = index + 1;
      else if (action === "top") target = 0;
      else if (action === "bottom") target = siblings.length - 1;
      if (target < 0 || target >= siblings.length || target === index) return;
      siblings.splice(index, 1);
      siblings.splice(target, 0, group);
      siblings.forEach((sibling, position) => {
        sibling.order = position;
      });
      saveState();
      scheduleApply();
    }

    function sortGroupsByName(wsId, parentId) {
      const ws = getWorkspace(wsId, false);
      if (!ws) return;
      const siblings = sortedChildren(ws, parentId ?? null)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
      siblings.forEach((sibling, position) => {
        sibling.order = position;
      });
      saveState();
      scheduleApply();
    }

    function moveSession(wsId, sessionId, groupId) {
      const ws = getWorkspace(wsId, true);
      if (!ws || !sessionId) return;
      if (!groupId) {
        delete ws.assignments[sessionId];
        if (ws.sessionOrder) delete ws.sessionOrder[sessionId];
      } else {
        const group = findGroup(ws, groupId);
        if (!group) return;
        const previous = ws.assignments[sessionId];
        if (previous !== groupId) normalizeGroupOrder(wsId, groupId);
        ws.assignments[sessionId] = groupId;
        if (previous !== groupId) {
          ws.sessionOrder = ws.sessionOrder || {};
          ws.sessionOrder[sessionId] = nextSessionOrder(ws, groupId);
        }
        group.collapsed = false;
        let parentId = group.parentId;
        while (parentId) {
          const parent = findGroup(ws, parentId);
          if (!parent) break;
          parent.collapsed = false;
          parentId = parent.parentId;
        }
      }
      saveState();
      scheduleApply();
    }

    function setAllGroupsCollapsed(wsId, collapsed) {
      const ws = getWorkspace(wsId, false);
      if (!ws) return;
      for (const group of ws.groups) group.collapsed = collapsed;
      ws.ungroupedCollapsed = collapsed;
      saveState();
      scheduleApply();
    }

    function ensureWorkspaceExpanded(wsId) {
      const section = findSectionByWorkspace(wsId);
      if (!section) return;
      const header = headerInSection(section);
      if (header && header.getAttribute("aria-expanded") === "false") header.click();
    }

    function maybeExpandAll(wsId) {
      if (expandedAttempted.has(wsId) || expanding.has(wsId)) return;
      const section = findSectionByWorkspace(wsId);
      if (!section) return;
      const header = headerInSection(section);
      if (!header || header.getAttribute("aria-expanded") === "false") return;
      expandedAttempted.add(wsId);
      setTimeout(async () => {
        const clicked = await expandAllSessions(wsId, true);
        // The overflow row may not be rendered yet when the list is still
        // loading. Leave the workspace retryable instead of giving up.
        if (clicked === 0) expandedAttempted.delete(wsId);
      }, 120);
    }

    async function expandAllSessions(wsId, silent) {
      if (expanding.has(wsId)) return 0;
      expanding.add(wsId);
      let clicked = 0;
      try {
        for (let index = 0; index < 60; index++) {
          const section = findSectionByWorkspace(wsId);
          if (!section) break;
          const overflow = overflowInSection(section);
          if (!overflow) break;
          overflow.click();
          clicked += 1;
          await delay(70);
        }
        if (clicked > 0 && !silent) toast(t("shownAll"));
      } finally {
        expanding.delete(wsId);
      }
      return clicked;
    }

    // ---------------------------------------------------------------------
    // Context menu contributions
    // ---------------------------------------------------------------------

    function workspaceForSession(sessionId) {
      try {
        const row = document.querySelector('[data-row-key="session:' + cssEscape(sessionId) + '"]');
        if (row) {
          const section = row.closest("[data-dsh-st-section]") || sectionForElement(row);
          const wsId = section && section.getAttribute("data-dsh-st-ws");
          if (wsId) return wsId;
          const header = section && headerInSection(section);
          if (header) return headerWorkspaceId(header);
        }
      } catch {
        /* CSS.escape may be unavailable */
      }
      try {
        const workspacesService = getService("workspaces");
        const items = workspacesService?.list?.getSnapshot?.()?.items || [];
        // Authoritative ownership, independent of whether the row is rendered.
        const owner = items.find(
          (workspace) => Array.isArray(workspace.sessionIds) && workspace.sessionIds.includes(sessionId),
        );
        if (owner && owner.workspaceId) return owner.workspaceId;

        const sessionsService = getService("sessions");
        const session = sessionsService?.list?.getSnapshot?.()?.byId?.[sessionId];
        const cwd = session?.cwd;
        if (cwd) {
          const target = normalizePath(cwd);
          const match = items.find((workspace) => normalizePath(workspace.path) === target);
          if (match) return match.workspaceId;
        }
      } catch {
        /* optional service */
      }
      return undefined;
    }

    function nextSessionOrder(ws, groupId) {
      let max = -1;
      if (!ws || !ws.assignments) return 0;
      for (const [sessionId, assigned] of Object.entries(ws.assignments)) {
        if (assigned !== groupId) continue;
        const order = ws.sessionOrder ? ws.sessionOrder[sessionId] : undefined;
        if (Number.isFinite(order)) max = Math.max(max, order);
      }
      return max + 1;
    }

    function normalizeGroupOrder(wsId, groupId) {
      const ws = getWorkspace(wsId, false);
      if (!ws) return;
      ws.sessionOrder = ws.sessionOrder || {};
      const members = orderedGroupMembers(wsId, groupId);
      if (members.length > 0) {
        members.forEach((sessionId, index) => {
          ws.sessionOrder[sessionId] = index;
        });
        return;
      }
      let index = 0;
      for (const [sessionId, assigned] of Object.entries(ws.assignments)) {
        if (assigned !== groupId) continue;
        ws.sessionOrder[sessionId] = index++;
      }
    }

    function orderedGroupMembers(wsId, groupId) {
      const ws = getWorkspace(wsId, false);
      const section = findSectionByWorkspace(wsId);
      if (!ws || !section) return [];
      const rows = sessionRowsInSection(section);
      const members = [];
      for (let index = 0; index < rows.length; index++) {
        const sessionId = sessionIdOf(rows[index]);
        if (!sessionId || ws.assignments[sessionId] !== groupId) continue;
        members.push({ id: sessionId, index });
      }
      members.sort(
        (a, b) => sessionOrderOf(ws, a.id, a.index) - sessionOrderOf(ws, b.id, b.index) || a.index - b.index,
      );
      return members.map((member) => member.id);
    }

    function sessionOrderInfo(wsId, sessionId) {
      const ws = getWorkspace(wsId, false);
      const groupId = ws ? ws.assignments[sessionId] : undefined;
      if (!groupId) return null;
      const members = orderedGroupMembers(wsId, groupId);
      const index = members.indexOf(sessionId);
      if (index < 0) return null;
      let custom = false;
      for (const id of members) {
        const order = ws.sessionOrder ? ws.sessionOrder[id] : undefined;
        if (Number.isFinite(order)) {
          custom = true;
          break;
        }
      }
      return { groupId, index, length: members.length, custom };
    }

    function moveSessionOrder(wsId, sessionId, action) {
      const ws = getWorkspace(wsId, false);
      const groupId = ws ? ws.assignments[sessionId] : undefined;
      if (!ws || !groupId) return;
      const members = orderedGroupMembers(wsId, groupId);
      const index = members.indexOf(sessionId);
      if (index < 0) return;
      let target = index;
      if (action === "up") target = index - 1;
      else if (action === "down") target = index + 1;
      else if (action === "top") target = 0;
      else if (action === "bottom") target = members.length - 1;
      if (target < 0 || target >= members.length || target === index) return;
      members.splice(index, 1);
      members.splice(target, 0, sessionId);
      ws.sessionOrder = ws.sessionOrder || {};
      members.forEach((id, position) => {
        ws.sessionOrder[id] = position;
      });
      saveState();
      scheduleApply();
    }

    function resetGroupOrder(wsId, groupId) {
      const ws = getWorkspace(wsId, false);
      if (!ws || !ws.sessionOrder) return;
      for (const sessionId of Object.keys(ws.sessionOrder)) {
        if (ws.assignments[sessionId] === groupId) delete ws.sessionOrder[sessionId];
      }
      saveState();
      scheduleApply();
    }

    function flattenGroups(ws) {
      const result = [];
      const byParent = new Map();
      for (const group of ws.groups) {
        const parentId = group.parentId ?? null;
        const list = byParent.get(parentId) || [];
        list.push(group);
        byParent.set(parentId, list);
      }
      for (const list of byParent.values()) {
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
      }
      const walk = (parentId, depth) => {
        for (const group of byParent.get(parentId) || []) {
          result.push({ group, depth });
          walk(group.id, depth + 1);
        }
      };
      walk(null, 0);
      return result;
    }

    function installContextMenus(ctx) {
      if (!ctx.contextMenus || typeof ctx.contextMenus.register !== "function") return;
      ctx.effect(
        () =>
          ctx.contextMenus.register({
            id: MARK + ".workspace",
            target: "workspace",
            order: 250,
            resolve: ({ workspaceId }) => {
              if (!workspaceId) return [];
              return [
                { id: "new-session", label: t("newSession"), run: () => createSession(workspaceId) },
                { id: "new-group", label: t("newGroup") + "…", run: () => createGroup(workspaceId, null) },
                { id: "show-all", label: t("showAll"), run: () => expandAllSessions(workspaceId, false) },
                { id: "expand-groups", label: t("expandAllGroups"), run: () => setAllGroupsCollapsed(workspaceId, false) },
                { id: "collapse-groups", label: t("collapseAllGroups"), run: () => setAllGroupsCollapsed(workspaceId, true) },
                { id: "export-data", label: t("exportData"), separatorBefore: true, run: exportData },
                { id: "import-data", label: t("importData") + "…", run: pickImportFile },
              ];
            },
          }),
        MARK + ": workspace menu",
      );
      ctx.effect(
        () =>
          ctx.contextMenus.register({
            id: MARK + ".group",
            target: MARK + "-group",
            order: 100,
            resolve: ({ workspaceId, groupId }) => {
              const ws = getWorkspace(workspaceId, false);
              const group = findGroup(ws, groupId);
              if (!group) return [];
              const parentId = group.parentId ?? null;
              const siblings = sortedChildren(ws, parentId);
              const orderIndex = siblings.findIndex((candidate) => candidate.id === groupId);
              const orderLast = siblings.length - 1;
              return [
                {
                  id: "new-session",
                  label: t("newSessionInGroup"),
                  run: () => createSession(workspaceId, groupId),
                },
                { id: "subgroup", label: t("newSubgroup") + "…", run: () => createGroup(workspaceId, groupId) },
                { id: "rename", label: t("rename") + "…", run: () => beginRename(workspaceId, groupId, false) },
                {
                  id: "toggle",
                  label: group.collapsed ? t("expand") : t("collapse"),
                  run: () => toggleGroup(workspaceId, groupId),
                },
                {
                  id: "top",
                  label: t("moveTop"),
                  disabled: !group.parentId,
                  run: () => moveGroup(workspaceId, groupId, null),
                },
                {
                  id: "order",
                  label: t("orderGroups"),
                  children: [
                    {
                      id: "order:top",
                      label: t("orderTop"),
                      disabled: orderIndex <= 0,
                      run: () => moveGroupOrder(workspaceId, groupId, "top"),
                    },
                    {
                      id: "order:up",
                      label: t("orderUp"),
                      disabled: orderIndex <= 0,
                      run: () => moveGroupOrder(workspaceId, groupId, "up"),
                    },
                    {
                      id: "order:down",
                      label: t("orderDown"),
                      disabled: orderIndex < 0 || orderIndex >= orderLast,
                      run: () => moveGroupOrder(workspaceId, groupId, "down"),
                    },
                    {
                      id: "order:bottom",
                      label: t("orderBottom"),
                      disabled: orderIndex < 0 || orderIndex >= orderLast,
                      run: () => moveGroupOrder(workspaceId, groupId, "bottom"),
                    },
                    {
                      id: "order:name",
                      label: t("orderByName"),
                      separatorBefore: true,
                      disabled: siblings.length < 2,
                      run: () => sortGroupsByName(workspaceId, parentId),
                    },
                  ],
                },
                {
                  id: "delete",
                  label: t("deleteGroup"),
                  danger: true,
                  separatorBefore: true,
                  run: () => confirmDeleteGroup(workspaceId, groupId),
                },
              ];
            },
          }),
        MARK + ": group menu",
      );
      ctx.effect(
        () =>
          ctx.contextMenus.register({
            id: MARK + ".session",
            target: "session",
            order: 350,
            resolve: ({ sessionId }) => {
              const wsId = workspaceForSession(sessionId);
              if (!wsId) return [];
              const ws = getWorkspace(wsId, false);
              const groups = ws ? flattenGroups(ws) : [];
              const current = ws ? ws.assignments[sessionId] : undefined;
              const moveChildren = groups.map(({ group, depth }) => ({
                id: "move:" + group.id,
                label: "　".repeat(Math.min(depth, 6)) + group.name + (current === group.id ? " ✓" : ""),
                disabled: current === group.id,
                run: () => moveSession(wsId, sessionId, group.id),
              }));
              if (groups.length === 0) {
                moveChildren.push({ id: "move:empty", label: t("noGroups"), disabled: true });
              }
              moveChildren.push({
                id: "move:new",
                label: t("newGroupAndMove") + "…",
                separatorBefore: true,
                run: () => createGroup(wsId, null, { assignSessionId: sessionId }),
              });
              if (current !== undefined) {
                moveChildren.push({
                  id: "move:none",
                  label: t("removeFromGroup"),
                  separatorBefore: true,
                  run: () => moveSession(wsId, sessionId, null),
                });
              }
              const items = [{ id: "move", label: t("moveSession"), children: moveChildren }];
              const orderInfo = current ? sessionOrderInfo(wsId, sessionId) : null;
              if (orderInfo && (orderInfo.length > 1 || orderInfo.custom)) {
                const last = orderInfo.length - 1;
                items.push({
                  id: "order",
                  label: t("orderSessions"),
                  children: [
                    {
                      id: "order:top",
                      label: t("orderTop"),
                      disabled: orderInfo.index === 0,
                      run: () => moveSessionOrder(wsId, sessionId, "top"),
                    },
                    {
                      id: "order:up",
                      label: t("orderUp"),
                      disabled: orderInfo.index === 0,
                      run: () => moveSessionOrder(wsId, sessionId, "up"),
                    },
                    {
                      id: "order:down",
                      label: t("orderDown"),
                      disabled: orderInfo.index >= last,
                      run: () => moveSessionOrder(wsId, sessionId, "down"),
                    },
                    {
                      id: "order:bottom",
                      label: t("orderBottom"),
                      disabled: orderInfo.index >= last,
                      run: () => moveSessionOrder(wsId, sessionId, "bottom"),
                    },
                    {
                      id: "order:reset",
                      label: t("orderReset"),
                      separatorBefore: true,
                      disabled: !orderInfo.custom,
                      run: () => resetGroupOrder(wsId, orderInfo.groupId),
                    },
                  ],
                });
              }
              return items;
            },
          }),
        MARK + ": session menu",
      );
    }

    function openGroupMiniMenu(wsId, groupId, x, y) {
      // Reuse the platform context-menu overlay with a plugin-private target;
      // the group action buttons cover the same verbs for pointer users.
      try {
        const menus = getService("contextMenus");
        if (menus?.open) {
          menus.open({ kind: MARK + "-group", value: { workspaceId: wsId, groupId } }, { x, y });
          return;
        }
      } catch {
        /* fall through */
      }
      beginRename(wsId, groupId, false);
    }

    // ---------------------------------------------------------------------
    // Dialog primitives
    // ---------------------------------------------------------------------

    function openConfirm({ title, message, confirmText, danger, onConfirm }) {
      const backdrop = document.createElement("div");
      backdrop.className = "dsh-st-backdrop";
      const dialog = document.createElement("div");
      dialog.className = "dsh-st-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      const heading = document.createElement("h2");
      heading.className = "dsh-st-dialog-title";
      heading.textContent = title;
      const body = document.createElement("p");
      body.className = "dsh-st-dialog-message";
      body.textContent = message;
      const actions = document.createElement("div");
      actions.className = "dsh-st-dialog-actions";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "dsh-st-btn";
      cancel.textContent = t("cancel");
      const ok = document.createElement("button");
      ok.type = "button";
      ok.className = "dsh-st-btn " + (danger ? "dsh-st-btn-danger" : "dsh-st-btn-primary");
      ok.textContent = confirmText || t("confirm");
      actions.append(cancel, ok);
      dialog.append(heading, body, actions);
      backdrop.append(dialog);

      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        document.removeEventListener("keydown", onKey, true);
        backdrop.remove();
        dialogEls = dialogEls.filter((item) => item !== backdrop);
      };
      const onKey = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      };
      cancel.addEventListener("click", close);
      ok.addEventListener("click", () => {
        close();
        onConfirm();
      });
      backdrop.addEventListener("mousedown", (event) => {
        if (event.target === backdrop) close();
      });
      document.addEventListener("keydown", onKey, true);
      document.body.append(backdrop);
      dialogEls.push(backdrop);
      requestAnimationFrame(() => (danger ? cancel : ok).focus());
    }

    function toast(text) {
      if (toastEl) toastEl.remove();
      toastEl = document.createElement("div");
      toastEl.className = "dsh-st-toast";
      toastEl.textContent = text;
      document.body.append(toastEl);
      setTimeout(() => {
        if (toastEl) toastEl.remove();
        toastEl = null;
      }, 2200);
    }

    // ---------------------------------------------------------------------
    // Utilities / lifecycle
    // ---------------------------------------------------------------------

    function cssEscape(value) {
      if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
      return String(value).replace(/["\\]/g, "\\$&");
    }

    function injectStyle() {
      if (styleEl) return;
      styleEl = document.createElement("style");
      styleEl.id = MARK + "-style";
      styleEl.textContent = CSS;
      document.head.append(styleEl);
    }

    function observe() {
      if (observer) return;
      observer = new MutationObserver((records) => {
        if (applying || disposed) return;
        for (const record of records) {
          if (record.type === "childList" && (record.addedNodes.length > 0 || record.removedNodes.length > 0)) {
            scheduleApply();
            return;
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    function cleanup() {
      disposed = true;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (storageHandler) {
        window.removeEventListener("storage", storageHandler);
        storageHandler = null;
      }
      for (const [section, ui] of Array.from(sectionUis.entries())) disposeSectionUi(section, ui);
      for (const dialog of dialogEls.splice(0)) dialog.remove();
      if (toastEl) {
        toastEl.remove();
        toastEl = null;
      }
      if (styleEl) {
        styleEl.remove();
        styleEl = null;
      }
      editing = null;
      expandedAttempted.clear();
      expanding.clear();
      sectionUis.clear();
      if (hostSaveTimer !== null) {
        clearTimeout(hostSaveTimer);
        hostSaveTimer = null;
      }
      hostRpc = null;
      hostMode = false;
      hostSaving = false;
      hostSaveQueued = false;
      hostSaveWarned = false;
      hostLoaded = false;
      hostRevision = 0;
      dirty = false;
      if (window.__DSH_SESSION_TREE_INSTANCE__ === instance) {
        delete window.__DSH_SESSION_TREE_INSTANCE__;
        delete window.__DSH_SESSION_TREE__;
      }
    }

    function apply(ctx) {
      debug("ST apply:start");
      if (window.__DSH_SESSION_TREE_INSTANCE__) {
        try {
          window.__DSH_SESSION_TREE_INSTANCE__.dispose();
        } catch {
          /* ignore a stale instance */
        }
      }
      if (!document.body) {
        debug("ST apply: no body", true);
        return;
      }
      ctxRef = ctx;
      state = loadState();
      injectStyle();
      observe();

      // Context menus are optional for the first paint: apply immediately so
      // the tree renders even if the menu service has not activated yet.
      try {
        ctx.inject(["contextMenus"], (scope) => {
          try {
            installContextMenus(scope);
            debug("ST menus:on");
          } catch (error) {
            console.error("[" + MARK + "] context menus failed", error);
          }
        });
      } catch (error) {
        console.warn("[" + MARK + "] context menu service unavailable", error);
      }

      // Host persistence is optional: the tree keeps working from
      // localStorage until the authenticated Connection RPC is available.
      try {
        ctx.inject(["connection"], (scope) => {
          try {
            const connection = scope.connection || (typeof scope.get === "function" ? scope.get("connection") : undefined);
            const rpc = connection && connection.rpc;
            if (rpc && typeof rpc.call === "function") void hydrateFromHost(rpc);
          } catch (error) {
            console.warn("[" + MARK + "] host connection unavailable", error);
          }
        });
      } catch (error) {
        console.warn("[" + MARK + "] connection service unavailable", error);
      }

      storageHandler = (event) => {
        if (event.key !== STORAGE_KEY) return;
        state = loadState();
        // Another tab wrote a newer tree; do not let a late host hydrate
        // overwrite it with an older snapshot.
        dirty = true;
        scheduleApply();
      };
      window.addEventListener("storage", storageHandler);

      instance.dispose = cleanup;
      window.__DSH_SESSION_TREE_INSTANCE__ = instance;
      window.__DSH_SESSION_TREE__ = {
        get state() {
          return state;
        },
        get hostMode() {
          return hostMode;
        },
        get hostLoaded() {
          return hostLoaded;
        },
        apply: applyNow,
        createGroup,
        moveSession,
        moveGroup,
        expandAllSessions,
        exportData,
        exportJson,
        importData: pickImportFile,
        importJson: importDataFromText,
        flushHostSave,
        reset: () => {
          state = emptyState();
          saveState(true);
          scheduleApply();
        },
      };

      ctx.effect(() => () => cleanup(), MARK + ": sidebar tree");
      scheduleApply();

      setTimeout(() => {
        if (disposed) return;
        debug("ST ready · apply");
        for (const wsId of Object.keys(state.workspaces)) {
          if (state.workspaces[wsId]?.groups?.length) maybeExpandAll(wsId);
        }
      }, 300);

      console.info("[" + MARK + "] ready");
    }

    debug("ST module · waiting for apply");
    exports.apply = apply;
    exports.inject = [];
    return module.exports;
  },
});
