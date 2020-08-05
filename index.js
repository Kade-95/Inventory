'use strict'
let { Kerds, Database } = require('./../Libraries/Kerds');
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
        './fontawesome/css/all.css'
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
        resolve(true);
    });
}

global.setUpAccount = (data, callback) => {
    bcrypt.hash(data.password, 10).then(hash => {
        db.insert({ collection: 'users', query: { userName: data.admin, currentPassword: hash, userType: 'Admin' }, getInserted: true }).then(user => {
            db.createCollection('lists');
            callback(user[0]);
        });
    });
}

let { port, protocol } = kerds.getCommands('-');
port = port || 8080;
protocol = protocol || 'http';

setup().then(() => {
    kerds.createServer(port,
        params => {
            view.createView(params);
            db.setName(global.sessions[params.sessionId].account || 'inventory');
        }, protocol,
        { origins: ['*'] },
        {
            key: fs.readFileSync('./permissions/server.key'),
            cert: fs.readFileSync('./permissions/server.crt')
        }
    );
});

kerds.recordSession(24 * 60 * 60 * 1000);
kerds.handleRequests = (req, res, form) => {
    postHandler.act(req, res, form);
}