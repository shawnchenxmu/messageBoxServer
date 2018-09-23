const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const app = new Koa()
const ObjectID = require('mongodb').ObjectID
require('./mongo')(app)
const port = 3000
const router = require('koa-router')()

app.use(bodyParser())

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
    const text = {
        text: ctx.request.body.text
    }
    ctx.response.body = await ctx.app.messagebox.insert(text)
                            .then(result => {return result.ops[0]})
})

app.use(router.routes())

app.listen(port, () => {
    console.log('We are live on ' + port)
})
