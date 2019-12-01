import * as GI from 'node-gtk'
const Gtk = GI.require('Gtk', '3.0')
const Cairo = GI.require('cairo')

interface Message {
  method: 'set' | 'show' | 'hide',
  codes?: number[]
}

const DIM = 3
const FONT_NAME = 'Material Design Icons'
const WIN_PADDING = 35
const MARGIN = 10
const FONT_SIZE = 25000*1.25

let win: any
let labels: any[] = []

// Instantiate new GTK window
GI.startLoop()
Gtk.init()
win = new Gtk.Window({
  title: 'HUD',
  type: Gtk.WindowType.POPUP
})

// Don't allow window manager to focus HUD
win.canFocus = false
win.acceptFocus = false
win.focusOnMap = false

// Set initial window position
refreshPos()

// Put this window above others, but make background semi-transparent
win.setKeepAbove(true)
drawBackgroundWithOpacity(0.66)

// Create a new grid to hold a NxN square of text-containing labels
const grid = new Gtk.Grid()
grid.halign = Gtk.Align.FILL
grid.valign = Gtk.Align.FILL
grid.setBorderWidth(MARGIN)
grid.setMarginTop(MARGIN)
grid.setMarginBottom(MARGIN)
grid.setMarginStart(MARGIN)
grid.setMarginEnd(MARGIN)
grid.setRowSpacing(MARGIN)
grid.setColumnSpacing(MARGIN)
grid.setRowHomogeneous(true)
grid.setColumnHomogeneous(true)
win.add(grid)

// Create N*N new labels and attach them to grid cells
for (let i = 0; i < DIM * DIM; i++) {
  const label = new Gtk.Label("<span></span>")
  label.useMarkup = true
  label.halign = Gtk.Align.CENTER
  label.valign = Gtk.Align.CENTER
  label.hexpand = true
  label.vexpand = true
  labels[i] = label
  grid.attach(label, i % DIM, i / DIM, 1, 1)
}

// Show all elements except for root element (invisible on program start)
win.showAll()
win.visible = false

// Start main GTK loop after parent process finishes bindings
process.on('message', ({ method, codes }: Message) => {
  if (method === 'set') set(codes)
  if (method === 'show') show()
  if (method === 'hide') hide()
})

// Set icons to new characters
function set(codes: number[]) {
  // Loop over each of the NxN GTK labels
  for (let i = 0; i < DIM * DIM; i++) {
    // Create a span containing the char to display and attach it to the label
    const char = codes[i] ? String.fromCharCode(codes[i]) : ''
    labels[i].setMarkup(
      `<span font_desc='${FONT_NAME}' size='${FONT_SIZE}'>${char}</span>`
    )
  }
}

// Reposition HUD and make it visible
function show() {
  refreshPos()
  win.visible = true
}

function hide() {
  win.visible = false
}

// Queries monitor width and positions HUD on top right corner
function refreshPos() {
  const screenWidth = win.getScreen().getWidth()
  // Wait one tick to allow GTK windows to realize
  setImmediate(() => {
    const windowWidth = win.getSize()[0]
    win.move(screenWidth - windowWidth - WIN_PADDING, WIN_PADDING)
  })
}

// Draws a background on the main HUD window with the specified opacity 
function drawBackgroundWithOpacity(opacity: number) {
  // Get original background color from color scheme
  const styleContext = win.getStyleContext()
  const bgColor = styleContext.getBackgroundColor(Gtk.StateType.NORMAL)

  // Paint RGBA layers on window draw
  win.on('draw', (context: any) => {
    context.setSourceRgba(bgColor.red, bgColor.green, bgColor.blue, opacity)
    context.setOperator(Cairo.Operator.SOURCE)
    context.paint()
  })

  // Redraw RGBA layers now and whenever screen changes
  win.on('screen-changed', () => {
    win.setVisual(win.screen.getRgbaVisual())
  })
  win.setAppPaintable(true)
  win.setVisual(win.screen.getRgbaVisual())
}

// Start main GTK loop
process.send({})
Gtk.main()