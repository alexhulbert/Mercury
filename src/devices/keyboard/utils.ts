import { execSync } from 'child_process'

const KEYCODE_REGEX = /^keycode\s+([0-9]+) = ?(\S*) ?(\S*)/
const keymapStr = execSync('xmodmap -pke').toString('utf-8')
const keycodeMap: Record<string, Array<{ code: number, shift: boolean }>> = {}
for (const keycodeLine of keymapStr.split('\n')) {
  const lineParts = keycodeLine.match(KEYCODE_REGEX)
  if (!lineParts) continue
  const [keycodeStr, keysym, shiftKeysym] = lineParts.slice(1)
  const keycode = parseInt(keycodeStr, 10)
  if (keysym && keysym !== 'NoSymbol') {
    if (!keycodeMap[keysym]) keycodeMap[keysym] = []
    keycodeMap[keysym].push({ code: keycode, shift: false }) 
  }
  if (shiftKeysym && shiftKeysym !== 'NoSymbol') {
    if (!keycodeMap[shiftKeysym]) keycodeMap[shiftKeysym] = []
    keycodeMap[shiftKeysym].push({ code: keycode, shift: true })
  }
}

enum MODIFIERS {
  SHIFT,
  CONTROL,
  ALT,
  SUPER,
  NUMLOCK,
  CAPSLOCK,
  SHIFTLOCK,
  SCROLLLOCK
}

export const getModifierMask = (modifiers: string[]) => (
  modifiers.reduce((cur, m) => cur | (1 << MODIFIERS[m.toUpperCase()]), 0)
)

export interface XKey {
  code: number
  modifiers: number
}

export default {
  parseKeySequence(keySequence: string): XKey[] {
    const xKeys: XKey[] = []
    const seqSegments = keySequence.split(/[,+\-\s]/)
    const keysym = seqSegments[seqSegments.length - 1]
    const baseModifiers = getModifierMask(seqSegments.slice(0, -1))
    const shiftModifiers = baseModifiers | (1 << MODIFIERS.SHIFT)
    if (keycodeMap.hasOwnProperty(keysym)) {
      for (const { code, shift } of keycodeMap[keysym]) xKeys.push({
        code, modifiers: shift ? shiftModifiers : baseModifiers
      })
    }
    return xKeys
  }
}