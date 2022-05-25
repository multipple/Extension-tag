
import { io } from 'socket.io-client'

function connect( channel ){
  return new Promise( ( resolve, reject ) => {
    if( !channel )
      return reject('Invalid Database Connection URL')
    
    const socket = io( channel )
    socket.on( 'connect', () => resolve( socket ) )
          .on( 'error', reject )
  } )
}

function Query( ios ){

  this.insert = ( data, ops ) => {
    return new Promise( ( resolve, reject ) => {
      ios.emit( 'QUERY::INSERT',
                data, 
                ops || { returnId: true }, 
                ( error, response ) => error ? reject( response ) : resolve( response ) )
    } )
  }

  this.find = ( query, ops ) => {
    return new Promise( ( resolve, reject ) => {
      ios.emit( 'QUERY::FIND',
                query, 
                ops || { limit: 100 }, 
                ( error, response ) => error ? reject( response ) : resolve( response ) )
    } )
  }
  this.findOne = ( query, ops ) => {
    return new Promise( ( resolve, reject ) => {
      ios.emit( 'QUERY::FINDONE',
                query, 
                ops, 
                ( error, response ) => error ? reject( response ) : resolve( response ) )
    } )
  }

  this.update = ( query, data, ops ) => {
    return new Promise( ( resolve, reject ) => {
      ios.emit( 'QUERY::UPDATE',
                query,
                data,
                ops || { upsert: true }, 
                ( error, response ) => error ? reject( response ) : resolve( response ) )
    } )
  }

  this.delete = ( query, ops ) => {
    return new Promise( ( resolve, reject ) => {
      ios.emit( 'QUERY::DELETE',
                query,
                ops || { archive: false }, 
                ( error, response ) => error ? reject( response ) : resolve( response ) )
    } )
  }

  this.aggregate = pipeline => {
    return new Promise( ( resolve, reject ) => {
      ios.emit( 'QUERY::AGGREGATE', pipeline, ( error, response ) => error ? reject( response ) : resolve( response ) )
    } )
  }
}

function DBInterface( options ){

  const { server, version, clientId } = options
  if( !server || !clientId )
    throw new Error('[CloudDB] Invalid Database Access Configuration')

  // Initial instance configurations
  this.configs = {}
  // Database connection & transaction channel
  let ios, channel
  
  this.connect = ({ name, collections, accessToken }) => {
    return new Promise( ( resolve, reject ) => {

      if( !name
          || !Array.isArray( collections ) 
          || !collections.length 
          || !accessToken )
        return reject('[CloudDB] Invalid Database Connection Parameters')
      
      // Instance configuration
      this.configs = { name, collections }
      // Compose database connection channel URL String
      channel = `${server}/${clientId}~${version || '1.0'}/${accessToken}`

      /** Establish connection to database manager then
       *  resolve once connection
       */
      connect( channel )
      .then( socket => {
        ios = socket
        // Add to each collections a query interface
        collections.map( each => DBInterface.prototype[ each ] = new Query( io ) )
        resolve()
      })
      .catch( reject )
    } )
  }
  this.reconnect = () => {
    return new Promise( ( resolve, reject ) => {
      if( !channel || !this.configs.collections ) 
        return reject('[CloudDB] Undefined Database Connection Parameters')

      connect( channel )
      .then( socket => {
        ios = socket
        // Reassign to each collections a query interface with new io connection
        this.configs.collections.map( each => DBInterface.prototype[ each ] = new Query( ios ) )
        resolve()
      })
      .catch( reject )
    } )
  }
  this.disconnect = () => {
    return new Promise( ( resolve, reject ) => {
      if( !ios )
        return reject('[CloudDB] No Active Connection Found')

      ios.disconnect( resolve )
    } )
  }

  this.rename = () => {}
  this.rename = () => {}
  this.size = () => {}
}

export default ( server, version, clientId ) => {
  return new DBInterface({ server, version, clientId })
}