const Koa = require('koa')
const multer = require('koa-multer')
const fs = require('fs')
const bodyParser = require('koa-bodyparser')
const app = new Koa()
const ObjectID = require('mongodb').ObjectID
require('./mongo')(app)
const port = 4000
const router = require('koa-router')()
const server = require('koa-static')
const util = require('./util')
const http = require('http')
const https = require('https')
const domain = process.env.NODE_ENV == 'dev'? `http://localhost:${port}` : 'https://www.alloween.xyz'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./images/${req.body.name}`)
    },
    filename: function (req, file, cb){
        cb(null, file.originalname)
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

// router.get('/notes/:id', async(ctx) => {
//     ctx.body = await ctx.app.messagebox.findOne({ '_id': ObjectID(ctx.params.id) });
// })

// router.post('/notes', async (ctx, next) => {
//     const note = {
//         text: ctx.request.body.body,
//         title: ctx.request.body.title
//     }
//     ctx.response.body = await ctx.app.messagebox.insert(note)
//                                 .then(result => {return result.ops[0]})
// })

// router.del('/notes/:id', async (ctx, next) => {
//     const id = ctx.params.id
//     const details = { '_id': new ObjectID(id) }
//     ctx.response.body = await ctx.app.messagebox.remove(details)
//                     .then(item => {return 'Note ' + id + ' deleted!'})
// })

// router.put('/notes/:id', async (ctx, next) => {
//     const id = ctx.params.id
//     const details = { '_id': new ObjectID(id) }
//     const note = {
//         text: ctx.request.body.body,
//         title: ctx.request.body.title
//     }
//     ctx.response.body = await ctx.app.messagebox.update(details, note)
//                             .then(() => {return note})
// })

router.post('/sendText', async (ctx, next) => {
    const body = ctx.request.body
    const message = {
        date: util.getToday(),
        type: body.type,
        name: body.name,
        content: body.content
    }
    ctx.response.body = await ctx.app.messagebox.insert(message)
                            .then(result => {return result.ops[0]})
})

// router.post('/sendImage', upload.single('image'), async ctx => {
//     const message = {
//         date: util.getToday(),
//         type: ctx.req.body.type,
//         name: ctx.req.body.name,
//         content: `https://www.alloween.xyz/images/${ctx.req.body.name}/${util.getToday()}`
//     }
//     ctx.response.body = await ctx.app.messagebox.insert(message)
//     .then(result => {return result.ops[0]})
// })

router.post('/sendImage', upload.single('image'), async ctx => {
    const file = ctx.req.file
    const body = ctx.req.body
    const message = {
        date: util.getToday(),
        type: body.type,
        name: body.name,
        content: `${domain}/images/${body.name}/${file.originalname}`
    }
    ctx.response.body = await ctx.app.messagebox.insert(message)
    .then(result => {return result.ops[0]})
})

router.post('/uploadMusic', musicUpload.single('music'), async ctx => {
    const body = ctx.req.body
    const message = {
        date: body.date || util.getToday(),
        type: 'music',
        content: `${domain}/music/${ctx.req.file.originalname}`,
        songName: body.songName,
        artist: body.artist
    }
    ctx.response.body = await ctx.app.messagebox.insert(message)
    .then(result => {return result.ops[0]})
})

router.post('/receiveText', async (ctx, next) => {
    const name = ctx.request.body.name
    const text = await ctx.app.messagebox.find({ 'name': {"$ne": name}, 'date': util.getToday(), 'type': 'text'}).toArray().then(data => {
        return data
    }).then(array => {
        if(array.length) {
            return array[0].content
        } else {
            return '没有数据啦！！！'
        }
    })
    const image = await ctx.app.messagebox.find({ 'name': {"$ne": name}, 'date': util.getToday(), 'type': 'image'}).toArray().then(data => {
        return data
    }).then(array => {
        if(array.length) {
            return {
                image: array[0].content,
                imagePlaceholder: typeof array[0].min == 'undefined' ? `${domain}/images/min-nodata.JPG` : array[0].min
            }
        } else {
            return {
                image: `${domain}/images/nodata.JPG`,
                imagePlaceholder: `${domain}/images/min-nodata.JPG`
            }
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
        if(array.length) {
            return array[0].content
        } else {
            return '没有数据啦！！！'
        }
    })
    const image = await ctx.app.messagebox.find({ 'name': {"$ne": name}, 'date': date, 'type': 'image'}).toArray().then(data => {
        return data
    }).then(array => {
        if(array.length) {
            return array[0].content
        } else {
            return `${domain}/images/nodata.JPG`
        }
    })
    // const music = await ctx.app.messagebox.find({ 'date': date, 'type': 'music'}).toArray().then(data => {
    //     return data
    // }).then(array => {
    //     if(array.length) {
    //         return array[0].content
    //     } else {
    //         return `${domain}/music/小幸运_田馥甄.mp3`
    //     }
    // })
    const data = {text, image}
    ctx.response.body = data
})

router.get('/getMusic', async (ctx, next) => {
    const music = await ctx.app.messagebox.find({ 'date': util.getToday(), 'type': 'music'}).toArray().then(data => {
        return data
    }).then(array => {
        if(array.length) {
            return array[0].content
        } else {
            return `${domain}/music/小幸运_田馥甄.mp3`
        }
    })
    const data = {music}
    ctx.response.body = data
})

app.use(router.routes())

http.createServer(app.callback()).listen(80);
https.createServer(options, app.callback()).listen(443);
