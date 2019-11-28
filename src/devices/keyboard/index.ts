
import * as x11 from 'x11'
import * as Path from 'path'

import { MercuryIODevice } from '../interface'
import Utils, { XKey, MODIFIERS } from './utils'
import { fork, ChildProcess } from 'child_process'

interface KeyFnMap { [modifiers: number]: { [code: number]: Function } }
interface XEvent { name: string, buttons: number, keycode: number }

const IGNORED_MODIFIERS = [
  MODIFIERS.CAPSLOCK,
  MODIFIERS.NUMLOCK,
  MODIFIERS.SCROLLLOCK,
  MODIFIERS.SHIFTLOCK
]

const KEYS = [
  'KP_Home',    'KP_Up', 'KP_Prior',
  'KP_Left', 'KP_Begin', 'KP_Right',
   'KP_End',  'KP_Down',  'KP_Next'
]
export class KeyboardMIO implements MercuryIODevice {

  hud: ChildProcess
  hudCodes = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  curFolder = ''

  keyDownFns: KeyFnMap = {}
  keyUpFns: KeyFnMap = {}

  grabbedKeys: XKey[] = []
  xDisplay: any
  X: any

  initialize() {
    this.hud = fork(Path.join(__dirname, 'hud.ts'))
    return new Promise<void>((resolve, reject) => {
      x11.createClient((err, { client: X, screen }) => {
        if (err) {
          reject(err)
        } else {
          this.xDisplay = screen[0].root
          this.X = X
          resolve()
        }
      }).on('event', (ev: any) => this.onXKeyPress(ev))
    })
  }

  isKeyFromDevice(key: symbol | string) {
    return typeof key !== 'symbol' && Utils.parseKeySequence(key).length > 0
  }

  reset() {
    this.hud.send({ type: 'hide' })
  }

  displayChars(keyCodes: Record<string, number>) {
    for (const key of Object.keys(keyCodes)) {
      const index = KEYS.indexOf(key)
      if (index >= 0) this.hudCodes[index] = keyCodes[key]
    }
    if (this.curFolder) {
      this.hud.send({ type: 'show', codes: this.hudCodes })
    }
  }

  onKeyDown(key: string, fn: Function) {
    const keycodesToBind = Utils.parseKeySequence(key)
    for (const { code, modifiers } of keycodesToBind) {
      this.xGrabKey(code, modifiers)
      if (!this.keyDownFns[modifiers]) this.keyDownFns[modifiers] = {}
      this.keyDownFns[modifiers][code] = fn
    }
  }

  onKeyUp(key: string, fn: Function) {
    const keycodesToBind = Utils.parseKeySequence(key)
    for (const { code, modifiers } of keycodesToBind) {
      if (!this.keyUpFns[modifiers]) this.keyUpFns[modifiers] = {}
      this.keyUpFns[modifiers][code] = fn
    }
  }

  unbindKey(key: string) {
    const boundKeycodes = Utils.parseKeySequence(key)
    for (const { code, modifiers } of boundKeycodes) {
      this.xUngrabKey(code, modifiers)
      if (this.keyDownFns[modifiers] && this.keyDownFns[modifiers][code]) {
        delete this.keyDownFns[modifiers][code]
      }
      if (this.keyUpFns[modifiers] && this.keyUpFns[modifiers][code]) {
        delete this.keyUpFns[modifiers][code]
      }
    }
  }

  folderEntered(folderName: string) {
    this.curFolder = folderName
    if (!folderName) {
      this.hud.send({ type: 'hide' })
    }
  }

  private onXKeyPress(event: XEvent) {
    let modifiers = event.buttons
    for (const ignoredModifier of IGNORED_MODIFIERS) {
      modifiers &= ~(1 << ignoredModifier)
    }
    if (
      event.name === 'KeyPress' &&
      this.keyDownFns[modifiers] &&
      this.keyDownFns[modifiers][event.keycode]
    ) this.keyDownFns[modifiers][event.keycode]()
    if (
      event.name === 'KeyRelease' &&
      this.keyUpFns[modifiers] &&
      this.keyUpFns[modifiers][event.keycode]
    ) this.keyUpFns[modifiers][event.keycode]()
  }

  private xGrabKey(code: number, baseModifiers: number) {
    this.iterateIgnoredModifiers(code, baseModifiers, (modifiers) => {
      this.X.GrabKey(this.xDisplay, 0, modifiers, code, false, true)
    })
  }

  private xUngrabKey(code: number, baseModifiers: number) {
    this.iterateIgnoredModifiers(code, baseModifiers, (modifiers) => {
      this.X.UngrabKey(this.xDisplay, code, modifiers)
    })
  }

  private iterateIgnoredModifiers(
    code: number,
    baseModifiers: number,
    fn: (modifiers: number) => void,
    ignoredModifiers: number[] = IGNORED_MODIFIERS,
  ) {
    fn(baseModifiers)

    if (
      ignoredModifiers.length === IGNORED_MODIFIERS.length &&
      code >= 79 && code <= 91
    ) {
      ignoredModifiers = ignoredModifiers.filter(m => m != MODIFIERS.NUMLOCK)
    }

    if (ignoredModifiers.length) {
      const newModifiers = baseModifiers | (1 << ignoredModifiers[0])
      const newIgnoredModifiers = ignoredModifiers.slice(1)
      this.iterateIgnoredModifiers(code, baseModifiers, fn, newIgnoredModifiers)
      this.iterateIgnoredModifiers(code, newModifiers, fn, newIgnoredModifiers)
    }
  }
}