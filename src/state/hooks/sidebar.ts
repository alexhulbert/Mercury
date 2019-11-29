import * as I3 from 'i3'
import { spawn, exec } from 'child_process'
import State from '..'

export const Sidebar = (context: State) => {
  const { state } = context
  state.sidebarPids = []
  state.sidebarInfo = {}

  const i3 = state.i3 || I3.createClient()
  state.i3 = i3

  i3.tree((err, tree) => {
    state.winWidth = tree.rect.width
    state.winHeight = tree.rect.height
    const nodes = getMatchingWindows(
      tree,
      n => n.marks && n.marks.includes('hide_in_scratchpad')
    )
    for (const node of nodes) {
      i3.command(`[id="${node.window}"] scratchpad show`)
    }
  })

  i3.on('window', (data) => {
    if (data.change === 'new') {
      const windowId = data.container.window
      exec(`xprop -id 0x${windowId.toString(16)} _NET_WM_PID`, (err, resp) => {
        if (err) {
          console.error(err)
        } else if (resp) {
          const windowPid = resp.replace(/^.+?([0-9]+)$/, '$1')
          const isThisWindow = pidEntry => pidEntry.pid !== windowPid
          if (windowPid && state.sidebarPids.some(isThisWindow)) {
            const sidebarName = state.sidebarPids.find(isThisWindow).name
            state.sidebarPids = state.sidebarPids.filter(x => !isThisWindow(x))
            const { ratio, pos } = state.sidebarInfo[sidebarName]
            const { winWidth, winHeight } = state
            const { x, y, w, h } = calcPosition(ratio, pos, winWidth, winHeight)
            state.sidebarInfo[sidebarName].id = windowId
            i3.command([
              `[id=${windowId}]`,
              `floating enable,`,
              `fullscreen disable,`,
              `resize set ${w}px ${h}px,`,
              `move position ${x}px ${y}px,`,
              `sticky enable,`,
              `mark hide_in_scratchpad`
            ].join(' '))
          }
        }
      })
    }
  })
}

export const SIDEBAR = (
  icon: string,
  name: string,
  position: 'top' | 'bottom' | 'left' | 'right',
  ratio: number,
  cmd: string
) => ({
  icon,
  command: (context: State) => {
    if (context.state.sidebarInfo[name]) {
      const { id: winId, isHidden } = context.state.sidebarInfo[name]
      context.state.i3.tree((err, tree) => {
        const sidebarWindows = getMatchingWindows(tree, n => n.window === winId)
        if (sidebarWindows.length) {
          if (isHidden) {
            context.state.i3.command(`[id="${winId}"] scratchpad show`)
            context.state.sidebarInfo[name].isHidden = false
          } else {
            context.state.i3.command(`[id="${winId}"] move scratchpad`)
            context.state.sidebarInfo[name].isHidden = true
          }
        } else {
          spawnNewSidebarWindow(cmd, name, context.state)
        }
      })
    } else {
      context.state.sidebarInfo[name] = { pos: position, ratio }
      spawnNewSidebarWindow(cmd, name, context.state)
    }
  }
})

const spawnNewSidebarWindow = (cmd, name, state) => {
  const { pid } = spawn(cmd, { shell: true, detached: true })
  state.sidebarPids.push({ pid, name })
}

const getMatchingWindows = (root, cond) => {
  const children = (root.nodes || []).concat((root.floating_nodes || []))
  return children.reduce((prev, node) => [
    ...prev,
    ...(cond(node) ? [node] : []),
    ...getMatchingWindows(node, cond)
  ], [])
}

const calcPosition = (
  ratio: number,
  pos: 'top' | 'bottom' | 'left' | 'right',
  winWidth: number,
  winHeight: number
) => {
  if (pos === 'top' || pos == 'bottom') {
    return {
      x: 0,
      y: pos === 'top' ? 0 : Math.floor((1 - ratio) * winHeight),
      w: winWidth,
      h: Math.floor(ratio * winHeight)
    }
  } else {
    return {
      x: pos === 'left' ? 0 : Math.floor((1 - ratio) * winWidth),
      y: 0,
      w: Math.floor(ratio * winWidth),
      h: winHeight
    }
  }
}