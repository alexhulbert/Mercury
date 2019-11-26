import { KeyboardMIO } from './devices/keyboard'
import startKeybindRouter from './keybind-router'
import State from './state'
import CONFIG from '../config'

const DEVICES = [
  new KeyboardMIO()
]

startKeybindRouter({
  devices: DEVICES,
  binds: CONFIG,
  state: new State()
})