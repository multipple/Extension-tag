
export default ( id, extension ) => {
  return async ( url, options ) => {
    return await extension.Request({ extensionId: id, url, ...options })
  }
}