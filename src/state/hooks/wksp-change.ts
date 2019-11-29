import * as I3 from 'i3'
import State from '..'

export const WkspChange = (context: State) => {
  for (let i = 1; i <= 9; i++) {
    context.state[`wksp_${i}_occupied`] = 'false'
    context.state[`wksp_${i}_active`] = 'false'
  }

  const i3 = context.state.i3 || I3.createClient()
  context.state.i3 = i3
  i3.on('workspace', (data) => {
    if (data.change === 'focus') {
      context.state[`wksp_${data.current.num}_occupied`] = 'true'
      for (let i = 1; i <= 9; i++) {
        context.state[`wksp_${i}_active`] = data.current.num === i ? 'true' : 'false'
      }
      context.refresh()
    } else if (data.change === 'empty') {
      context.state[`wksp_${data.current.num}_occupied`] = 'false'
      context.refresh()
    }
  })
}