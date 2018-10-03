const Koa = require('koa')
const multer = require('koa-multer')
const fs = require('fs')
const os = require('os')
const path = require('path')
const bodyParser = require('koa-bodyparser')
const app = new Koa()
const ObjectID = require('mongodb').ObjectID
require('./mongo')(app)
const port = 3000
const router = require('koa-router')()
const server = require('koa-static')
const util = require('./util')
const http = require('http')
const https = require('https')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images')
    },
    filename: function (req, file, cb) {
        cb(null, util.getToday())
  }
})
var options = {
    key: fs.readFileSync('./ssl/private.key'),
    cert: fs.readFileSync('./ssl/full_chain.pem')
};

const upload = multer({ storage: storage })
app.use(bodyParser())
// Koa looks up the files relative to the static directory, so the name of the static directory is not part of the URL.
app.use(server(__dirname + '/images/'))

router.get('/notes/:id', async(ctx) => {
    console.log('get')
    ctx.body = await ctx.app.messagebox.findOne({ '_id': ObjectID(ctx.params.id) });
})

router.post('/notes', async (ctx, next) => {
    const note = {
        text: ctx.request.body.body,
        title: ctx.request.body.title
    }
    ctx.response.body = await ctx.app.messagebox.insert(note)
                                .then(result => {return result.ops[0]})
})

router.del('/notes/:id', async (ctx, next) => {
    const id = ctx.params.id
    const details = { '_id': new ObjectID(id) }
    ctx.response.body = await ctx.app.messagebox.remove(details)
                    .then(item => {return 'Note ' + id + ' deleted!'})
})

router.put('/notes/:id', async (ctx, next) => {
    const id = ctx.params.id
    const details = { '_id': new ObjectID(id) }
    const note = {
        text: ctx.request.body.body,
        title: ctx.request.body.title
    }
    ctx.response.body = await ctx.app.messagebox.update(details, note)
                            .then(() => {return note})
})

router.post('/sendText', async (ctx, next) => {
    const message = {
        date: util.getToday(),
        type: ctx.request.body.type,
        name: ctx.request.body.name,
        content: ctx.request.body.content
    }
    ctx.response.body = await ctx.app.messagebox.insert(message)
                            .then(result => {return result.ops[0]})
})

router.post('/sendImage', upload.single('image'), async ctx => {
    const message = {
        date: util.getToday(),
        type: ctx.req.body.type,
        name: ctx.req.body.name,
        content: `http://101.132.72.209:3000/${util.getToday()}`
    }
    ctx.response.body = await ctx.app.messagebox.insert(message)
    .then(result => {return result.ops[0]})
})

router.post('/receiveText', async (ctx, next) => {
    const name = ctx.request.body.name
    ctx.response.body = await ctx.app.messagebox.find({ 'name': {"$ne": name}, 'date': util.getToday() }).toArray().then(data => {
        return data
    }).then(array => {
        const data = {}
        console.log(array)
        data[array[0].type] = array[0].content
        data[array[1].type] = array[1].content
        console.log(data)
        return data
    })
})

app.use(router.routes())

http.createServer(app.callback()).listen(80);
https.createServer(options, app.callback()).listen(443);
