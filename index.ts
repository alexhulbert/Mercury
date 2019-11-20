import { KeyboardMIO } from './src/devices/keyboard'
import Application from './src/keybind-router'

Application({
  devices: [],
  binds: {
    'A': {
      icon: 'aa00',
      folder: {
        name: 'A',
        binds: {
          'S': {
            icon: 'aabb',
            folder: {
              name: 'AB',
              binds: {
                'S': {
                  icon: 'abab',
                  command: () => console.log('ABB')
                },
                'D': {
                  icon: 'aabc',
                  folder: {
                    name: 'ABC',
                    binds: {
                      'F': {
                        icon: 'abcd',
                        command: () => console.log('ABCD')
                      },
                      'G':{
                        icon: 'abce',
                        command: () => console.log('ABCE')
                      }
                    }
                  }
                },
                'F': {
                  icon: 'aabd',
                  command: () => console.log('ABD clicked')
                }
              }
            }
          },
          'D': {
            icon: 'aacc',
            command: () => console.log('AC clicked')
          },
          'F': {
            icon: 'aadd',
            command: () => console.log('AD clicked')
          }
        }
      }
    },
    'S': {
      icon: 'bb00',
      command: () => console.log('B clicked')
    },
    'D': {
      icon: 'cc00',
      folder: {
        name: 'C',
        binds: {
          'A': {
            icon: 'ccaa',
            command: () => console.log('CA clicked')
          },
          'S': {
            icon: 'ccbb',
            command: () => console.log('CB clicked')
          }
        }
      }
    },
    'F': {
      icon: 'dd00',
      command: () => console.log('D clicked')
    }
  }
})