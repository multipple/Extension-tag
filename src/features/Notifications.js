
export default ( appId, context, state ) => {

  return {

    show: message => {
      const 
      { name, favicon } = context.input.meta,
      payload = {
        icon: favicon,
        title: name,
        message
      }

      state && state.notification.new( appId, payload )
    },

    bell: () => this.show('')
  }
}