const MongoClient = require('mongodb').MongoClient
const db = require('./config/db')

module.exports = function(app) {
    MongoClient.connect(db.url)
        .then((connection) => {
            app.messagebox = connection.collection('messagebox');
            console.log("Database connection established")
        })
        .catch((err) => console.log(err))
}