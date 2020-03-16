import { SIDEBAR } from './src/state/hooks/sidebar'
import { spawn } from 'child_process'
import { KeyMap, Folder } from './src/keybind-router/index'
import { Keys } from './src/devices/stream-deck'

const {
  A1, A2, A3, A4, A5, A6, A7, A8,
  B1, B2, B3, B4, B5, B6, B7, B8,
  C1, C2, C3, C4, C5, C6, C7, C8,
  D1, D2, D3, D4, D5, D6, D7, D8
} = Keys

const [
  K7, K8, K9,
  K4, K5, K6,
  K1, K2, K3,
  K0, KDOT, KENTER,
  KSLASH, KSTAR,
  KPLUS, KMINUS
] = [
  'KP_Home', 'KP_Up', 'KP_Prior',
  'KP_Left', 'KP_Begin', 'KP_Right',
  'KP_End', 'KP_Down', 'KP_Next',
  'KP_Insert', 'KP_Delete', 'KP_Enter', 
  'KP_Divide', 'KP_Multiply',
  'KP_Add', 'KP_Subtract'
]

const cmd = cmdStr => () => spawn(cmdStr, { shell: true, detached: true })
const i3cmd = cmdStr => context => context.state.i3.command(cmdStr)

const digits = (fn: (n: number) => any, prefix: string = '') => ({
  [prefix + K7]: fn(7), [prefix + K8]: fn(8), [prefix + K9]: fn(9),
  [prefix + K4]: fn(4), [prefix + K5]: fn(5), [prefix + K6]: fn(6),
  [prefix + K1]: fn(1), [prefix + K2]: fn(2), [prefix + K3]: fn(3)
})

const firefox = host => `firefox --new-window https://${host}`
const OPEN_INTERNET = {
  name: 'Open Program (Online)',
  binds: {
    [K1]: { icon: 'F2AD', command: cmd(firefox('google.com')) },
    [K2]: { icon: 'F1EE', command: cmd(firefox('gmail.com')) },
    [K3]: { icon: 'F5C3', command: cmd(firefox('youtube.com')) },
    [K4]: { icon: 'F474', command: cmd(firefox('moodle.umass.edu')) },
    [K5]: { icon: 'F2AF', command: cmd('google-chrome-stable') },
    [K6]: { icon: 'F2FE', command: cmd(firefox('instagram.com')) },
    [K7]: { icon: 'F0ED', command: cmd(firefox('calendar.google.com')) },
    [K8]: { icon: 'F2A4', command: cmd(firefox('github.com')) },
    [K9]: { icon: 'F44D', command: cmd(firefox('reddit.com')) }
  }
}

const chrome = host => `chromium --app="https://${host}"`
const OPEN_PROGRAM = {
  name: 'Open Program',
  binds: {
    [K1]: { folder: OPEN_INTERNET, icon: 'FFB1' },
    [K2]: SIDEBAR('F7B6', 'terminal', 'top', 0.4, 'konsole'),
    [`shift+${K2}`]: { icon: 'F18D', command: cmd('konsole') },
    [K3]: { icon: 'FA1D', command: cmd('code') },
    [K4]: SIDEBAR('F139', 'todoist', 'left', 0.3, chrome('todoist.com')),
    [K5]: { icon: 'F494', command: cmd('echo') },
    [K6]: SIDEBAR('F20E', 'messenger', 'right', 0.4, chrome('messenger.com')),
    [K7]: { icon: 'F314', command: cmd('kodi') },
    [K8]: SIDEBAR('F759', 'tidal', 'top', 0.66, chrome('listen.tidal.com')),
    [K9]: { icon: 'F253', command: cmd('dolphin') }
  }
} as Folder

const MOVE_WINDOW = {
  name: 'Move Window',
  binds: {
    ...digits(n => ({
      icon: {
        [`wksp_${n}_active`]: { true: 'F12E' },
        [`wksp_${n}_occupied`]: { true: 'F855', false: 'F131' },
      },
      command: (context) => {
        context.state[`wksp_${n}_occupied`] = 'true'
        i3cmd(`move container to workspace number ${n}`)(context)
      }
    })),
    ...digits(n => ({
      command: (context) => {
        i3cmd(`move container to workspace number ${n}`)(context)
        i3cmd(`workspace ${n}`)(context)
      }
    }), 'shift+'),
    [K0]: { command: i3cmd('move scratchpad') }
  }
} as Folder

const ACTIONS = {
  name: 'Actions',
  binds: {
    [K1]: { icon: 'F614', command: i3cmd('floating toggle') },
    [K2]: { icon: 'F8A1', command: i3cmd('split v') },
    [K3]: { icon: 'F293', command: i3cmd('fullscreen') },
    [K4]: { icon: 'FBA8', command: i3cmd('layout splith') },
    [K5]: { icon: 'F18D', command: cmd('krunner') },
    [K6]: { icon: 'F8A4', command: i3cmd('split h') },
    [K7]: { icon: 'F328', command: i3cmd('layout stacking') },
    [K8]: { icon: 'FBA7', command: i3cmd('layout splitv') },
    [K9]: { icon: 'F5D0', command: i3cmd('sticky toggle') }
  }
} as Folder

const OPEN_WORKSPACE = {
  ...digits(n => ({
    icon: {
      [`wksp_${n}_active`]: { true: 'F764' },
      [`wksp_${n}_occupied`]: { true: 'FAA4', false: 'F130' },
    },
    command: (context) => {
      for (let i = 1; i <= 9; i++) {
        context.state[`wksp_${i}_active`] = n === i ? 'true' : 'false'
      }
      i3cmd(`workspace ${n}`)(context)
    }
  })),
  [K0]: {
    command: (context) => {
      cmd('i3-select-scratchpad --not -m "^hide_in_scratchpad"')()
      i3cmd('sticky enable')(context)
    }
  }
} as KeyMap

const TRANSLATE_WINDOW = {
  [`shift+${K2}`]: { command: i3cmd('move down') },
  [`shift+${K4}`]: { command: i3cmd('move left') },
  [`shift+${K6}`]: { command: i3cmd('move right') },
  [`shift+${K8}`]: { command: i3cmd('move up') }
} as KeyMap

export default {
  [KMINUS]: { command: i3cmd('kill') },
  [KPLUS]: { folder: OPEN_PROGRAM },
  [KSLASH]: { folder: MOVE_WINDOW },
  [KSTAR]: { folder: { name: 'Open Workspace', binds: OPEN_WORKSPACE } },
  [KENTER]: { folder: ACTIONS },
  ...OPEN_WORKSPACE,
  ...TRANSLATE_WINDOW
} as KeyMap