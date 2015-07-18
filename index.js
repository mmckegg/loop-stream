var websocket = require('websocket-stream')

module.exports = LoopStream

function LoopStream(setups, port) {
  
  var subscribers = []

  websocket.createServer({port: port || 3142}, function(stream) {
    subscribers.push(stream)
    console.log('subscriber connect')

    stream.on('close', closed)
    stream.on('error', closed)

    function closed() {
      console.log('subscriber disconnect')
      var index = subscribers.indexOf(stream)
      subscribers.splice(index, 1)
    }
  })

  setups(rebind) // watch for changes (Observ)

  var currentSetups = []
  var listeners = []

  function rebind() {
    if (!matches(setups, currentSetups)) {
      currentSetups = setups._list.slice()
      listeners.forEach(invoke)
      listeners.length = 0

      currentSetups.forEach(function(setup, i) {
        setup.node.controllers.forEach(function(controller, x) {
          listeners.push(
            streamValue([i, x, 'active'], controller.gridState.active),
            streamValue([i, x, 'playing'], controller.gridState.playing),
            streamValue([i, x, 'triggers'], controller.gridState.triggers),
            streamValue([i, x, 'recording'], controller.gridState.recording),
            streamValue([i, x, 'position'], controller.playback.loopPosition),
            streamValue([i, x, 'loopLength'], controller.playback.loopLength)
          )
        })
      })      
    }
  }

  function streamValue(id, obs) {
    return obs(function(object) {
      if (subscribers.length) {
        var data = stringifyCompress({
          id: id,
          value: object
        })

        subscribers.forEach(function(s) {
          s.write(data)
        })
      }
    })
  }
}

function matches(obs, list) {
  if (obs.getLength() === list.length) {
    for (var i=0;i<list.length;i++) {
      if (list[i] !== obs.get(i)) {
        return false
      }
    }
    return true
  } else {
    return false
  }
}

function stringifyCompress(object) {
  return JSON.stringify(object, function(k, v) {
    if (!v) {
      return 0
    } else if (v === true) {
      return 1
    } else {
      return v
    }
  })
}

function invoke(f){
  f()
}