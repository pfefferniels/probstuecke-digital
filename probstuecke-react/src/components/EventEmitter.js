const EventEmitter = {
  _events: {},
  _pendingEvents: {},

  dispatch: function(event, data) {
    if (!this._events[event]) {
      this._pendingEvents[event] = []
      this._pendingEvents[event].push(data)
      return
    }

    Object.keys(this._events[event]).forEach(key => {
      const callback = this._events[event][key]
      callback(data)
    })
  },

  subscribe: function(event, callback) {
    if (this._pendingEvents[event]) {
      this._pendingEvents[event].forEach(data => callback(data))
      this._pendingEvents[event] = []
    }

    if (!this._events[event]) this._events[event] = [];

    const uid = '_' + Math.random().toString(36).substr(2, 9)
    this._events[event][uid] = callback

    const _this = this
    return {
      cancel: function () {
        delete _this._events[event][uid]
      }
    }
  }
}

export default EventEmitter
