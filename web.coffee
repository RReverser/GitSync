express = require "express"
app = express()

templates =
  github: "git@github.com:balbeko/douhack_sync.git"
  bitbucket: "ssh://git@bitbucket.org/balbeko/douhack_sync.git"

mapping = []
mapping.push
  github:"balbeko/douhack_sync"
  bitbucket: "balbeko/douhack_sync"

app.use express.logger()
app.use express.bodyParser()


app.get '/', (request, response)->
  response.send 'Hello World!'

app.post '/commit/bitbucket', (request, response)->
  console.log request.body.payload
  repository = request.body.payload.repository
  url = "#{repository.owner}/#{repository.name}" # owner/name
  res = mapping.filter (pair)->
    pair.bitbucket == url

  github_url = res[0].github

  response.send "OK"

port = process.env.PORT || 5000
app.listen port, ()->
  console.log "Listening on #{port}"