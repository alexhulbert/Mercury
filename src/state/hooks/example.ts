import State from '..'

export default (context: State) => {
  // Toggles state.example every 5 seconds
  setInterval(() => {
    const curValue = context.get('example')
    context.put('example', curValue === 'true' ? 'false' : 'true')
  }, 5000)
}