/**
 * dsh-session-tree host half.
 *
 * The tree itself is a browser-side sidebar enhancement, but its *data* must
 * outlive site-data cleanup and ports: this half owns a small JSON file under
 * the DSH home and exposes it to the browser over the generic authenticated
 * Connection RPC channel (`/session-tree`).
 *
 * No file is read while the plugin loads; the first `load` call decides
 * whether the browser should hydrate from disk or migrate its existing
 * `localStorage` tree.
 *
 * @module dsh-session-groups
 */

import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** Stable Cordis plugin name. */
export const name = 'session-tree'

/** No required host services; `connection` is injected opportunistically. */
export const inject = []

const CHANNEL = '/session-tree'
const FORMAT = 'dsh-session-tree'
const STATE_VERSION = 1
const MAX_STATE_BYTES = 4 * 1024 * 1024
const MAX_WORKSPACES = 2000
const MAX_GROUPS = 10000

let writeChain = Promise.resolve()

/** Serialize file operations so two browser tabs cannot interleave writes. */
function serialize(task) {
  const run = writeChain.then(task, task)
  writeChain = run.catch(() => {})
  return run
}

/** Resolve the same DSH home the rest of the harness uses. */
function resolveDshHome() {
  const configured = String(process.env.DSH_HOME || '').trim()
  if (configured) {
    if (configured === '~') return homedir()
    if (configured.startsWith('~/') || configured.startsWith('~\\')) {
      return join(homedir(), configured.slice(2))
    }
    return configured
  }
  return join(homedir(), '.dsh')
}

function stateFile() {
  return join(resolveDshHome(), 'storages', 'dsh-session-tree', 'state.json')
}

function backupFile() {
  return stateFile() + '.bak'
}

/**
 * Structural validation only: the browser sanitizes names, parent links and
 * assignments again. This keeps a corrupt or hand-edited file from being
 * written back or served without bound.
 */
function assertState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('state must be an object')
  }
  if (value.version !== STATE_VERSION) {
    throw new Error('unsupported state version')
  }
  if (value.revision !== undefined && (!Number.isFinite(value.revision) || value.revision < 0)) {
    throw new Error('invalid state revision')
  }
  const workspaces = value.workspaces
  if (!workspaces || typeof workspaces !== 'object' || Array.isArray(workspaces)) {
    throw new Error('state.workspaces must be an object')
  }
  const ids = Object.keys(workspaces)
  if (ids.length > MAX_WORKSPACES) throw new Error('too many workspaces')
  let groups = 0
  for (const id of ids) {
    const workspace = workspaces[id]
    if (!workspace || typeof workspace !== 'object' || Array.isArray(workspace)) {
      throw new Error('invalid workspace entry')
    }
    if (workspace.groups !== undefined && !Array.isArray(workspace.groups)) {
      throw new Error('invalid workspace groups')
    }
    if (
      workspace.assignments !== undefined &&
      (!workspace.assignments || typeof workspace.assignments !== 'object' || Array.isArray(workspace.assignments))
    ) {
      throw new Error('invalid workspace assignments')
    }
    groups += Array.isArray(workspace.groups) ? workspace.groups.length : 0
  }
  if (groups > MAX_GROUPS) throw new Error('too many groups')
}

async function readDocument(path) {
  const raw = await readFile(path, 'utf8')
  if (Buffer.byteLength(raw, 'utf8') > MAX_STATE_BYTES) throw new Error('state file is too large')
  const parsed = JSON.parse(raw)
  if (!parsed || parsed.format !== FORMAT || parsed.version !== STATE_VERSION) {
    throw new Error('unsupported state file')
  }
  assertState(parsed.state)
  return {
    state: parsed.state,
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
  }
}

async function loadStored() {
  try {
    return await readDocument(stateFile())
  } catch (error) {
    if (error && error.code === 'ENOENT') return { state: null, updatedAt: null }
    console.warn('[dsh-session-tree] could not read host state, trying backup', error)
    try {
      const backup = await readDocument(backupFile())
      console.warn('[dsh-session-tree] recovered host state from backup')
      return backup
    } catch {
      return { state: null, updatedAt: null }
    }
  }
}

async function saveStored(state) {
  assertState(state)
  const file = stateFile()
  const updatedAt = new Date().toISOString()
  const body = JSON.stringify({ format: FORMAT, version: STATE_VERSION, updatedAt, state }, null, 2)
  if (Buffer.byteLength(body, 'utf8') > MAX_STATE_BYTES) throw new Error('state is too large to save')

  await mkdir(dirname(file), { recursive: true })
  try {
    // Only rotate a readable previous document; a corrupt main file must not
    // replace the last good backup.
    await readDocument(file)
    await copyFile(file, backupFile())
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      console.warn('[dsh-session-tree] skipped host state backup', error)
    }
  }

  const temporary = file + '.' + process.pid + '.' + Date.now().toString(36) + '.tmp'
  await writeFile(temporary, body, 'utf8')
  await rename(temporary, file)
  return updatedAt
}

function failure(code, message) {
  return { ok: false, error: { code, message, details: {} } }
}

function installRpc(scope) {
  const connection = scope.connection || (typeof scope.get === 'function' ? scope.get('connection') : undefined)
  const rpc = connection && connection.rpc
  if (!rpc || typeof rpc.handle !== 'function') {
    console.warn('[dsh-session-tree] connection RPC is unavailable; host persistence is off')
    return
  }

  rpc.handle(CHANNEL, async (endpoint, payload) => {
    if (endpoint === 'load') {
      try {
        const stored = await serialize(loadStored)
        return { ok: true, value: stored }
      } catch (error) {
        console.warn('[dsh-session-tree] host load failed', error)
        return failure('session-tree/load-failed', 'could not read saved groups')
      }
    }

    if (endpoint === 'save') {
      const state = payload && typeof payload === 'object' ? payload.state : undefined
      try {
        assertState(state)
        const savedAt = await serialize(() => saveStored(state))
        return { ok: true, value: { savedAt } }
      } catch (error) {
        console.warn('[dsh-session-tree] host save failed', error)
        return failure('session-tree/save-failed', 'could not save groups')
      }
    }

    return failure('session-tree/not-found', 'unknown endpoint ' + JSON.stringify(String(endpoint)))
  })
}

/** Mount the host half. */
export function apply(ctx) {
  try {
    ctx.inject(['connection'], (scope) => {
      try {
        installRpc(scope)
      } catch (error) {
        console.warn('[dsh-session-tree] could not register host RPC', error)
      }
    })
  } catch (error) {
    console.warn('[dsh-session-tree] could not inject connection', error)
  }
}
