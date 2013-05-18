express = require "express"
app = express()
app.use express.logger()
app.use express.bodyParser()

app.get '/', (request, response)->
  response.send 'Hello World!'

app.get '/commit/bitbucket', (request, response)->
  console.log request.query
  response.send "OK"

port = process.env.PORT || 5000
app.listen port, ()->
  console.log "Listening on #{port}"