import { fork, ChildProcess } from 'child_process'
import * as Path from 'path'

const HUD_FILE = Path.join(__dirname, 'hud.ts')
const RESPAWN_COOLDOWN = 20

let hudSpawnTime: number
export let hud: ChildProcess

function spawnHUD() {
  hud = fork(HUD_FILE, [], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] })
  hud.on('exit', () => {
    if (new Date().getTime() - hudSpawnTime < RESPAWN_COOLDOWN) {
      throw new Error('HUD crashed too quickly after respawn')
    }
    spawnHUD()
  })
  if (hudSpawnTime) console.warn("Respawned HUD")
  hudSpawnTime = new Date().getTime()
}

spawnHUD()