let JSElements = require('./../../Perceptors/back/classes/JSElements');
class View extends JSElements {
    // set the document on entry
    constructor(metadata, appType) {
        super();
        this.docType = "<!DOCTYPE html>";
        this.pages = [];
        this.object.copy(metadata, this);
        this.appType = appType;
    }

    createView(params) {
        this.object.copy(params, this);

        this.response.setHeader('Content-Type', 'text/html');
        this.setupPage().then((html) => {
            this.response.end();
        });
    }

    setupPage() {
        return new Promise(async (resolve, reject) => {
            let html = this.createElement({
                element: 'html', children: [
                    { element: 'head' },
                    { element: 'body' },
                ]
            });

            let head = html.find('head');
            let body = html.find('body');

            if (perceptor.sessionsManager.sessions[this.sessionId].active) {
                body.dataset.user = perceptor.sessionsManager.sessions[this.sessionId].user;

                let user = await db.find({ collection: 'users', query: { _id: new ObjectId(body.dataset.user) }, projection: { userType: 1, fullName: 1, userImage: 1 } });
                if (!perceptor.isnull(user)) {
                    body.dataset.userType = user.userType;
                    body.dataset.fullName = user.fullName;
                    body.dataset.userImage = user.userImage;
                }
            }

            let ext, type, rel;

            //add the styles
            for (let href of this.styles) {
                ext = href.slice(href.lastIndexOf('.') + 1);
                if (ext == 'ico') {
                    rel = 'shortcut icon'
                    type = 'image/x-icon';
                }
                else {
                    rel = 'stylesheet';
                    type = 'text/css';
                }

                head.makeElement({
                    element: 'link', attributes: { rel, type, href, media: 'screen' }
                });
            }

            head.makeElement({
                element: 'meta', attributes: { content: 'width=device-width, initial-scale=1.0', name: 'viewport' }
            });

            //add the scripts
            for (let src in this.scripts) {
                let type = this.scripts[src].type || 'text/javascript';
                head.makeElement({
                    element: 'script', attributes: { src, type }
                });
            }

            let urlVars = this.getUrlVars(this.request.url);
            if (this.appType == 'webapp') {
                let dom = this.docType + html.outerHTML;
                this.response.write(dom);
                resolve(html);
            } else {
                // this.router(urlVars).then(result => {
                //     body.innerHTML = result;
                //     let dom = this.docType + html.outerHTML;
                //     this.response.write(dom);
                //     resolve(html);
                // });
            }
        });
    }

    router(params) {
        let file = this.filename.slice('./'.length);
        if (file == '') file = 'homepage.html';
        let ext = file.slice(file.lastIndexOf('.'));

        let pathToModule = "./includes/pages/";
        let pathToFile = "./includes/pages/";
        let fileModule = pathToModule + this.capitalize(file.replace(ext, '.js'));
        file = pathToFile + this.capitalize(file.replace(ext, '.js'));

        return new Promise((resolve, reject) => {
            fs.exists(file, async (exists) => {
                if (!exists) {
                    file = pathToFile + 'notfound.js';
                }
                let page;
                if (this.pages.hasOwnProperty(file)) {
                    page = this.pages[file];
                } else {
                    let pageClass = await import('../includes/pages/Home.js');
                    page = new pageClass.Page();
                    this.pages[file] = page;
                }

                let pageHTML = page.getHTML(params);

                resolve(pageHTML);
            });
        });
    }
}

module.exports = { View };