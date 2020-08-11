'use strict'
let { Kerds, Database } = require('kerds');
global.fs = require('fs');
global.zlib = require('zlib');

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
        './css/search.css',
        './css/recycle.css',
        './css/notifications.css',
        './fontawesome/css/all.css',
        './css/tour.css'
    ],
    scripts: {
        './includes/index.js': { type: 'module' },
        './jszip/dist/jszip.min.js': {}
    }
};

global.kerds = new Kerds({ server: { address: "mongodb://localhost:27017/", name: 'inventory' } });
global.db = new Database({ address: "mongodb://localhost:27017/", name: 'inventory' });
global.bcrypt = require('bcrypt');
global.ObjectId = require('mongodb').ObjectId;

let { PostHandler } = require('./includes/classes/PostHandler');
let { View } = require('./includes/classes/View');

let postHandler = new PostHandler();
let view = new View(metadata, 'webapp');

function setup() {
    return new Promise((resolve, rejects) => {
        db.createCollection('sessions');
        resolve(true);
    });
}

let { port, protocol } = kerds.getCommands('-');
port = port || 8080;
protocol = protocol || 'http';

setup().then(() => {
    kerds.createServer(port,
        params => {
            view.createView(params);
            if (!kerds.isset(global.sessions[params.sessionId].db)) {
                global.sessions[params.sessionId].db = new Database({ address: "mongodb://localhost:27017/", name: 'inventory' });
            }
            global.sessions[params.sessionId].db.setName(global.sessions[params.sessionId].account || 'inventory');
        }, protocol,
        { origins: ['*'] },
        {
            key: fs.readFileSync('./permissions/server.key'),
            cert: fs.readFileSync('./permissions/server.crt')
        }
    );
});

kerds.recordSession(24 * 60 * 60 * 1000, ['account', 'user']);
kerds.handleRequests = (req, res, form, params) => {
    if (!kerds.isset(global.sessions[req.sessionId].db)) {
        global.sessions[req.sessionId].db = new Database({ address: "mongodb://localhost:27017/", name: 'inventory' });
    }
    global.sessions[req.sessionId].db.setName(global.sessions[req.sessionId].account || 'inventory');
    postHandler.act(req, res, form);
}

