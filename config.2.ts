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

const numpadAliases = {
  [K7]: { aliasTo: A1 }, [K8]: { aliasTo: A2 }, [K9]: { aliasTo: A3 },
  [K4]: { aliasTo: B1 }, [K5]: { aliasTo: B2 }, [K6]: { aliasTo: B3 },
  [K1]: { aliasTo: C1 }, [K2]: { aliasTo: C2 }, [K3]: { aliasTo: C3 },
  [KMINUS]: { aliasTo: A4 }, [KPLUS]: { aliasTo: B4 }, [KSLASH]: { aliasTo: C4 }
}

const cmd = cmdStr => () => spawn(cmdStr, { shell: true, detached: true })
const digits = (fn: (n: number) => any) => ({
  [A1]: fn(7), [A2]: fn(8), [A3]: fn(9),
  [B1]: fn(4), [B2]: fn(5), [B3]: fn(6),
  [C1]: fn(1), [C2]: fn(2), [C3]: fn(3)
})

const firefox = host => `firefox --new-window https://${host}`
const OPEN_INTERNET = {
  name: 'Open Program (Online)',
  binds: {
    [C1]: { icon: 'F2AD', command: cmd(firefox('google.com')) },
    [C2]: { icon: 'F1EE', command: cmd(firefox('gmail.com')) },
    [C3]: { icon: 'F5C3', command: cmd(firefox('youtube.com')) },
    [B1]: { icon: 'F474', command: cmd(firefox('moodle.umass.edu')) },
    [B2]: { icon: 'F2AF', command: cmd('google-chrome-stable') },
    [B3]: { icon: 'F2FE', command: cmd(firefox('instagram.com')) },
    [A1]: { icon: 'F0ED', command: cmd(firefox('calendar.google.com')) },
    [A2]: { icon: 'F2A4', command: cmd(firefox('github.com')) },
    [A3]: { icon: 'F44D', command: cmd(firefox('reddit.com')) }
  }
}

const chrome = host => `chromium --app="https://${host}"`
const OPEN_PROGRAM = {
  name: 'Open Program',
  binds: {
    [C1]: { folder: OPEN_INTERNET, icon: 'FFB1' },
    [C2]: SIDEBAR('F7B6', 'terminal', 'top', 0.4, 'konsole'),
    [C3]: { icon: 'FA1D', command: cmd('code') },
    [B1]: SIDEBAR('F139', 'todoist', 'left', 0.3, chrome('todoist.com')),
    [B2]: { icon: 'F494', command: cmd('echo') },
    [B3]: SIDEBAR('F20E', 'messenger', 'right', 0.4, chrome('messenger.com')),
    [A1]: { icon: 'F314', command: cmd('kodi') },
    [A2]: SIDEBAR('F759', 'tidal', 'top', 0.66, chrome('listen.tidal.com')),
    [A3]: { icon: 'F253', command: cmd('dolphin') }
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
      command: (context: any) => {
        context.state[`wksp_${n}_occupied`] = 'true'
        context.state.i3.command(`move container to workspace number ${n}`)
      }
    })),
    [D2]: {
      command: (context) => context.state.i3.command('move scratchpad'),
      icon: 'F489'
    }
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
      context.state.i3.command(`workspace ${n}`)
    }
  })),
  [D2]: {
    command: (context) => {
      cmd('i3-select-scratchpad --not -m "^hide_in_scratchpad"')()
      context.state.i3.command('sticky enable')
    },
    icon: 'FD0E'
  }
} as KeyMap

export default {
  [A4]: { command: ctxt => ctxt.state.i3.command('kill'), icon: 'F1C0' },
  [B4]: { folder: OPEN_PROGRAM, icon: 'FD22' },
  [C4]: { folder: MOVE_WINDOW, icon: 'F2B3' },
  [KSTAR]: { folder: { name: 'Open Workspace', binds: OPEN_WORKSPACE } },
  ...OPEN_WORKSPACE,
  ...numpadAliases
} as KeyMap