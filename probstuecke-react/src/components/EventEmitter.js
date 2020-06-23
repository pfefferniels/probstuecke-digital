const EventEmitter = {
  _events: {},
  _pendingEvents: {},

  dispatch: function(event, data) {
    console.log('offering', data, 'as', event)
    if (!this._events[event]) {
      this._pendingEvents[event] = []
      this._pendingEvents[event].push(data)
      return
    }

    this._events[event].forEach(callback => callback(data))
  },

  subscribe: function(event, callback) {
    console.log('subscribing for', event)
    if (this._pendingEvents[event]) {
      this._pendingEvents[event].forEach(data => callback(data))
      this._pendingEvents[event] = []
    }

    if (!this._events[event]) this._events[event] = [];

    this._events[event].push(callback)
  }
}

export default EventEmitter
