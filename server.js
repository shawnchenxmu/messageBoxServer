const Koa = require('koa')
const multer = require('koa-multer')
const fs = require('fs')
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
        cb(null, `./images/${req.body.name}`)
    },
    filename: function (req, file, cb){
        cb(null, util.getToday())
  }
})
const musicStorage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, `./music`)
    },
    filename: function (req, file, cb){
        cb(null, file.originalname)
    }
})
var options = {
    key: fs.readFileSync('./ssl/private.key'),
    cert: fs.readFileSync('./ssl/full_chain.pem')
};

const upload = multer({ storage: storage })
const musicUpload = multer({ storage: musicStorage })
app.use(bodyParser())
// Koa looks up the files relative to the static directory, so the name of the static directory is not part of the URL.
app.use(server(__dirname))

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
        content: `https://www.alloween.xyz/images/${ctx.req.body.name}/${util.getToday()}`
    }
    ctx.response.body = await ctx.app.messagebox.insert(message)
    .then(result => {return result.ops[0]})
})

router.post('/uploadMusic', musicUpload.single('music'), async ctx => {
    const message = {
        date: util.getToday(),
        type: 'music',
        content: `https://www.alloween.xyz/music/${ctx.req.file.originalname}`,
        songName: ctx.req.body.songName,
        artist: ctx.req.body.artist
    }
    ctx.response.body = await ctx.app.messagebox.insert(message)
    .then(result => {return result.ops[0]})
})

router.post('/receiveText', async (ctx, next) => {
    const name = ctx.request.body.name
    const text = await ctx.app.messagebox.find({ 'name': {"$ne": name}, 'date': util.getToday(), 'type': 'text'}).toArray().then(data => {
        return data
    }).then(array => {
        console.log(array)
        if(array.length) {
            return array[0].content
        } else {
            return '没有数据啦！！！'
        }
    })
    const image = await ctx.app.messagebox.find({ 'name': {"$ne": name}, 'date': util.getToday(), 'type': 'image'}).toArray().then(data => {
        return data
    }).then(array => {
        console.log(array)
        if(array.length) {
            return array[0].content
        } else {
            return 'https://www.alloween.xyz/nodata.JPG'
        }
    })
    const data = {text, image}
    ctx.response.body = data
})

router.post('/getHistory', async (ctx, next) => {
    const name = ctx.request.body.name
    const date = util.getToday(new Date(new Date() - 86400000 * ctx.request.body.prevCount))
    const text = await ctx.app.messagebox.find({ 'name': {"$ne": name}, 'date': date, 'type': 'text' }).toArray().then(data => {
        return data
    }).then(array => {
        console.log(array)
        if(array.length) {
            return array[0].content
        } else {
            return '没有数据啦！！！'
        }
    })
    const image = await ctx.app.messagebox.find({ 'name': {"$ne": name}, 'date': date, 'type': 'image'}).toArray().then(data => {
        return data
    }).then(array => {
        console.log(array)
        if(array.length) {
            return array[0].content
        } else {
            return 'https://www.alloween.xyz/nodata.JPG'
        }
    })
    const music = await ctx.app.messagebox.find({ 'date': date, 'type': 'music'}).toArray().then(data => {
        return data
    }).then(array => {
        console.log(array)
        if(array.length) {
            return array[0].content
        } else {
            return 'https://www.alloween.xyz/music/小幸运_田馥甄.mp3'
        }
    })
    const data = {text, image, music}
    ctx.response.body = data
})

router.get('/getMusic', async (ctx, next) => {
    const music = await ctx.app.messagebox.find({ 'date': util.getToday(), 'type': 'music'}).toArray().then(data => {
        return data
    }).then(array => {
        console.log(array)
        if(array.length) {
            return array[0].content
        } else {
            return 'https://www.alloween.xyz/music/小幸运_田馥甄.mp3'
        }
    })
    const data = {music}
    ctx.response.body = data
})

app.use(router.routes())

http.createServer(app.callback()).listen(80);
https.createServer(options, app.callback()).listen(443);
