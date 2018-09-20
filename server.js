const Koa = require('koa')
const MongoClient = require('mongodb').MongoClient
const bodyParser = require('koa-bodyparser')
const db = require('./config/db')
const app = new Koa()
const router = require('koa-router')()

const port = 3000

app.use(bodyParser())

MongoClient.connect(db.url, (err, database) => {
    if(err) return console.log(err)
    require('./app/routes')(router, database)
    app.use(router.routes())
    app.listen(port, () => {
        console.log('We are live on ' + port)
    })
})