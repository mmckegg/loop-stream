var websocket = require('websocket-stream')

websocket('ws://localhost:3142').on('data', function(data) {
  console.log(data.toString())
})