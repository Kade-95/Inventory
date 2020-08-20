'use strict'
let { Kerds, Database } = require('kerds');
global.fs = require('fs');
global.zlib = require('zlib');
global.bcrypt = require('bcrypt');
global.ObjectId = require('mongodb').ObjectId;

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

let dbDetails = { address: "mongodb://localhost:27017/", name: 'inventory', user: '', password: '' };
let cloudDbDetails = {address: 'test.vqusx.gcp.mongodb.net', name: 'inventory', user: 'me', password: '.June1995', local: false};

global.db = new Database(cloudDbDetails);
global.kerds = new Kerds();
kerds.appPages = [
    'index.html',
    'dashboard.html',
    'items.html',
    'reports.html',
    'forms.html',
    'notifications.html',
    'settings.html',
    'history.html',
    'users.html'
];

let { PostHandler } = require('./includes/classes/PostHandler');
let { View } = require('./includes/classes/View');

let postHandler = new PostHandler();
let view = new View(metadata, 'webapp');
global.sessions = kerds.sessionsManager.sessions;
function setup() {
    return new Promise((resolve, rejects) => {
        resolve(true);
    });
}

let { port, protocol } = kerds.getCommands('-');
port = port || 8080;
protocol = protocol || 'http';

function setDb(session) {
    if (!kerds.isset(global.sessions[session].db)) {
        global.sessions[session].db = new Database(cloudDbDetails);
    }
    if (kerds.isset(global.sessions[session].account)) {
        global.sessions[session].db.setName(global.sessions[session].account);
    }
}

setup().then(() => {
    kerds.createServer({
        port,
        protocol,
        domains: ['*'],
        httpsOptions: {
            key: fs.readFileSync('./permissions/server.key'),
            cert: fs.readFileSync('./permissions/server.crt')
        },
        response: params => {
            setDb(params.sessionId);
            view.createView(params);
        }
    });
});

kerds.recordSession({ period: 24 * 60 * 60 * 1000, remember: ['account', 'user'], server: cloudDbDetails });
kerds.handleRequests = (req, res, form) => {
    setDb(req.sessionId);
    postHandler.act(req, res, form);
}
