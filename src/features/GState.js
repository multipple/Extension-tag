
import SharedState from 'markojs-shared-state'

export default context => {
  const
  ss = SharedState(),
  state = ss

  state.init = payload => context.setState( payload )

  state.bind = ss.bind
  state.unbind = ( _, list ) => {
    stateKeys = stateKeys.filter( each => { return !each.includes( list ) } )
    ss.unbind( _, list )
  }
  state.set = ( key, value ) => {
    !stateKeys.includes( key ) && stateKeys.push( key ) // Record new key
    ss.setState( key, value )
  }
  state.get = ss.getState
  state.dirty = ss.setStateDirty
  state.define = ss.defineAPI
  state.once = ( _event, fn ) => {
    return state.on( _event, value => {
      fn( value )
      state.off( _event )
    } )
  }
  
  return state
}