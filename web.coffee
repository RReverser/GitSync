express = require "express"
app = express()
exec = require('child_process').exec
fs = require('fs')

servers =
  github: "git@github.com:balbeko/douhack_sync.git"
  bitbucket: "ssh://git@bitbucket.org/balbeko/douhack_sync.git"

mappings = JSON.parse fs.readFileSync "mappings.json"

app.use express.logger()
app.use express.bodyParser()

app.get '/', (request, response) ->
  response.send 'Hello World!'

app.post '/commit/bitbucket', (request, response) ->
  payload = JSON.parse request.body.payload
  relative_url = "#{payload.repository.owner}/#{payload.repository.name}"
  git_url = "ssh://git@bitbucket.org/#{relative_url}.git"
  res = mappings.filter (pair) ->
    pair.bitbucket == relative_url
  pair = res[0]
  fs.exists pair.local, (exists) ->
    if !exists
      exec "git clone #{git_url} -o bitbucket #{pair.local} && cd #{pair.local} && git remote add github #{pair.github}", (err, out, outErr) ->
        console.log "Creation...\n#{out}\n#{outErr}"
    else
      exec "git pull bitbucket --all", (err, out, outErr) ->
        console.log "Updating...\n#{out}\n#{outErr}"
    response.send "OK"

port = process.env.PORT || 5000
app.listen port, ()->
  console.log "Listening on #{port}"
