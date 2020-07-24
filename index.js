'use strict'

let { Perceptor, Database } = require('./Perceptors/back');
global.fs = require('fs');

let metadata = {
    styles: [
        './css/root.css',
        './css/header.css',
        './css/main.css',
        './css/sidebar.css',
        './css/random.css',
        './css/dashboard.css',
        './css/users.css',
        './css/settings.css',
        './css/categories.css',
        './css/tag.css',
        './css/customforms.css',
        './css/reportgenerators.css',
        './css/items.css',
        './css/forms.css',
        './css/reports.css',
        './css/history.css',
        './css/lists.css',
        './css/views.css',
        './css/sources.css',
        './css/components.css',
        './css/notifications.css',
        './fontawesome/css/all.css'
    ],
    scripts: {
        './includes/index.js': { type: 'module' },
    }
};

global.perceptor = new Perceptor({ server: { address: "mongodb://localhost:27017/", name: 'inventory' } });
global.db = new Database({ address: "mongodb://localhost:27017/", name: 'inventory' });
global.bcrypt = require('bcrypt');
global.ObjectId = require('mongodb').ObjectId;

let { PostHandler } = require('./includes/classes/PostHandler');
let { View } = require('./includes/classes/View');

let postHandler = new PostHandler();
let view = new View(metadata, 'webapp');

function setup() {
    return db.getCollections()
        .then(result => {
            let lists = perceptor.array.find(result, collection => {
                return collection.name == 'lists';
            });

            if (!perceptor.isset(lists)) {
                db.createCollection('lists');
            }

        });
}
let { port, protocol } = perceptor.getCommands('-');
port = port || 8080;
protocol = protocol || 'http';

setup()
    .then(() => {
        perceptor.createServer(port,
            params => {
                view.createView(params);
            }, protocol,
            { origins: ['*'] },
            {
                key: fs.readFileSync('./permissions/server.key'),
                cert: fs.readFileSync('./permissions/server.crt')
            }
        );
    })

perceptor.recordSession(24 * 60 * 60 * 1000);
perceptor.handleRequests = (req, res, form) => {
    postHandler.act(req, res, form);
}