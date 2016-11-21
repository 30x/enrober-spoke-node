'use strict'
var http = require('http')
var lib = require('http-helper-functions')
var pge = require('pg-event-consumer')

function processEvent(event) {
  // Do something here to align K8S cluster with change decribed by event
  console.log(JSON.stringify(event, null, 4))
  console.log(`enrober: processEvent: event.index: ${event.index} event.topic: ${event.topic} event.data.id: ${event.data.id} event.data.action: ${event.data.action}`)    
}

var IPADDRESS = process.env.PORT !== undefined ? `${process.env.IPADDRESS}:${process.env.PORT}` : process.env.IPADDRESS
var eventConsumer = new pge.eventConsumer(IPADDRESS, processEvent)

function processEventPost(req, res, event) {
  eventConsumer.processEvent(event)
  lib.found(req, res)
}

function requestHandler(req, res) {
  if (req.url == '/events')
    if (req.method == 'POST')
      lib.getServerPostObject(req, res, (e) => processEventPost(req, res, e))
    else 
      lib.methodNotAllowed(req, res, ['POST'])
  else 
    lib.notFound(req, res)
}

function start() {
  var port = process.env.PORT
  eventConsumer.init(function() {
    http.createServer(requestHandler).listen(port, function() {
      console.log(`server is listening on ${port}`)
    })
  })
}

if (process.env.INTERNAL_SY_ROUTER_HOST == 'kubernetes_host_ip') 
  lib.getHostIPThen(function(err, hostIP){
    if (err) 
      process.exit(1)
    else {
      process.env.INTERNAL_SY_ROUTER_HOST = hostIP
      start()
    }
  })
else 
  start()
