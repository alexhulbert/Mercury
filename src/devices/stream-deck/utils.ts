import * as Path from 'path'
import { Canvas, registerFont } from 'canvas'

// Letter padding used in renderChar
const PADDING = 2

// Space-separated, quoted list of registered font names
// Looks like '"font0" "font1" "font2" ...'
let fontFamilies = ''

export default {
  // Draws character onto canvas and renders canvas into raw buffer
  renderChar(char: string, size: number): Buffer {
    // Create canvas and draw character onto center
    const ctx = new Canvas(size, size).getContext('2d')
    // Looks like '22px "font0" "font1"'
    ctx.font = `${size - (2 * PADDING)}px ${fontFamilies}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'white' // TODO: Change this to custom color
    ctx.fillText(char, size / 2, size / 2)
    // Convert canvas context to rgba Uint8Array
    const rgbaByteArray = ctx.getImageData(0, 0, size, size).data
    // Convert rgba array to rgb Buffer
    const rgbBuffer = new Buffer(rgbaByteArray.byteLength * 3 / 4)
    let destIndex = 0
    for (let srcIndex = 0; srcIndex < rgbaByteArray.length; srcIndex++) {
      // If byte does not represent alpha component, append to rgbBuffer
      if (srcIndex % 4 !== 3) {
        rgbBuffer[destIndex++] = rgbaByteArray[srcIndex]
      }
    }
    return rgbBuffer
  },

  // Allows node-canvas contexts to access external fonts at specified paths
  registerFonts(fontPaths: string[]) {
    fontPaths.forEach((fontPath, index) => {
      // Create dummy name for font (e.g. font0, font1, etc)
      const fontName = 'font' + index
      // Allow font to be referenced from node-canvas
      registerFont(Path.resolve(fontPath), { family: fontName })
      // Split font names by space in fontFamilies
      if (fontFamilies) fontFamilies += ' '
      // Surround font names in fontFamilies by double quotes
      fontFamilies += `"${fontName}"`
    })
  }
}
