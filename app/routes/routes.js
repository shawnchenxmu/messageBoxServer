var ObjectID = require('mongodb').ObjectID

let data;

module.exports = function(router, db) {
    router.get('/notes/:id', async (ctx, next) => {
        console.log(ctx.params.id)
        const id = ctx.params.id
        const details = {'_id': new ObjectID(id)}
        data = await db.collection('messagebox').findOne(details, (err, item) => {
            if (err) {
                return {'error':'An error has occurred'}
                console.log(err)
            } else {
                return item
                console.log(item)
            }
        })
        ctx.body = 'ha'
    })
    router.post('/notes', async (ctx, next) => {
        const note = { text:ctx.request.body.body, title: ctx.request.body.title }
        ctx.response.body = db.collection('messagebox').insert(note, (err, result) => {
            if (err) {
                ctx.body = {'error':'An error has occurred'}
            } else {
                ctx.body = result.ops[0]
                console.log(result.ops[0])
            }
        })
    })
    router.del('/notes/:id', async (ctx, next) => {
        const id = ctx.request.params.id
        const details = { '_id': new ObjectID(id) }
        db.collection('messagebox').remove(details, (err, item) => {
            if (err) {
                ctx.body = {'error':'An error has occurred'}
            } else {
                ctx.body = 'Note ' + id + ' deleted!'
            }
        })
    })
}