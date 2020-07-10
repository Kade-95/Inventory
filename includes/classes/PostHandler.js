const { ObjectID } = require("mongodb");

class PostHandler {
    constructor() {
        this.sessions = perceptor.sessionsManager.sessions;
        this.ignoreActive = ['login'];
        this.adminOnly = ['createUser', 'makeAdmin', 'makeStaff', 'deleteUser'];
    }

    act(req, res, data) {
        data = this.prepareData(data);
        let action = data.action;
        delete data.action;

        let deliver = () => {
            if (this.ignoreActive.includes(action)) {
                this[action](req, res, data);
            }
            else if (this.isActive(req.sessionId)) {
                this[action](req, res, data);
            }
            else {
                this.respond(req, res, 'Expired');
            }
        }

        if (perceptor.isset(this[action])) {
            deliver();
            return
            if (this.adminOnly.includes(action)) {
                let user = this.sessions[req.sessionId].user;
                db.find({ collection: 'users', query: { _id: new ObjectId(this.sessions[req.sessionId].user) }, projection: { userType: 1 } }).then(result => {

                    if (result.userType == 'Admin') {
                        deliver();
                    }
                    else {
                        this.respond(req, res, 'Admin only');
                    }
                });
            } else {
                deliver();
            }
        }
        else {
            this.respond(req, res, 'Unknown Request');
        }
    }

    login(req, res, data) {
        if (data.email == 'admin@mail.com') {
            let id = new ObjectID();

            this.respond(req, res, { user: id, userType: 'admin', fullName: 'prototype', image: null });
            this.sessions[req.sessionId].set({ user: ObjectID(id).toString(), active: true });
            return;
        }
        db.find({ collection: 'users', query: { email: data.email }, projection: { currentPassword: 1, userType: 1, fullName: 1, userImage: 1 } }).then(result => {
            if (!perceptor.isnull(result)) {
                bcrypt.compare(data.currentPassword, result.currentPassword).then(valid => {
                    if (valid) {
                        this.respond(req, res, { user: result._id, userType: result.userType, fullName: result.fullName, image: result.userImage });
                        this.sessions[req.sessionId].set({ user: ObjectId(result._id).toString(), active: true });
                    }
                    else {
                        this.respond(req, res, 'Incorrect')
                    }
                });
            }
            else {
                this.respond(req, res, '404')
            }
        });
    }

    makeHistory(flag, event) {
        if (flag) {
            event.timeCreated = new Date().getTime();
            db.insert({ collection: 'history', query: event });
        }
    }

    createUser(req, res, data) {
        bcrypt.hash(data.currentPassword, 10).then(hash => {
            data.currentPassword = hash;
            data.timeCreated = new Date().getTime();
            data.lastModified = new Date().getTime();
            db.ifNotExist({ collection: 'users', query: data, check: [{ userName: data.userName }, { email: data.email }], action: 'insert' }).then(result => {
                this.respond(req, res, result);
                this.makeHistory(result == 1, { action: 'User Creation', data });

            });
        });
    }

    makeAdmin(req, res, data) {
        db.update({ collection: 'users', query: { _id: ObjectId(data.user) }, options: { '$set': { userType: 'Admin' } } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(result == 1, { action: 'Become Admin', data });
        });
    }

    makeStaff(req, res, data) {
        db.update({ collection: 'users', query: { _id: ObjectId(data.user) }, options: { '$set': { userType: 'Staff' } } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(result == 1, { action: 'Become Staff', data });

        });
    }

    deleteUser(req, res, data) {
        db.delete({ collection: 'users', query: { _id: ObjectId(data.user) } }).then(result => {
            perceptor.deleteRecursive(`./userdata/${data.user}`, () => {
                this.respond(req, res, (result.result.ok == 1));

                this.makeHistory(result.result.ok == 1, { action: 'Delete User', data });

            });
        });
    }

    isActive(user) {
        return this.sessions[user].active;
    }

    isUserActive(req, res, data) {
        let active = false;
        for (let id in this.sessions) {
            if (this.sessions[id].user == data.user) {
                active = this.sessions[id].active;
                if (active) break;
            }
        }
        this.respond(req, res, active);
    }

    find(req, res, data) {
        let params = JSON.parse(data.params);
        params = this.organizeData(params);
        let action = params.action;
        delete params.action;

        let prepareResult = result => {
            let preparedResult;
            if (!perceptor.isnull(result)) {
                if (Array.isArray(result)) {
                    preparedResult = [];
                    for (let i in result) {
                        delete result[i].currentPassword;
                    }
                }
                else if (typeof result == 'object') {
                    delete result.currentPassword;
                }
            }
            preparedResult = result;

            return preparedResult
        }

        if (perceptor.isset(action)) {
            this.respond(req, res, 'actioned');
        }
        else {
            db.find(params).then(result => {
                this.respond(req, res, prepareResult(result));
            });
        }

        // let [collection, name] = params.collection.split('#');
        //                 value = collection.find({ query: { name } });
        // if (perceptor.isnull(found)) {
        //     return found;
        // }
        // else {
        //     if (perceptor.isset(params.query)) {
        //         if (perceptor.isset(params.many) && params.many == true) {
        //             found = perceptor.array.findAll(found.contents, item => {
        //                 let flag = true;
        //                 for (let n in params.query) {
        //                     if (item[n] != params.query[n]) flag = false;
        //                     continue;
        //                 }
        //                 return flag;
        //             });
        //         }
        //         else {
        //             found = perceptor.array.find(found.contents, item => {
        //                 let flag = true;
        //                 for (let n in params.query) {
        //                     if (item[n] != params.query[n]) flag = false;
        //                     continue;
        //                 }
        //                 return flag;
        //             });
        //         }
        //     }

        //     if (perceptor.isset(params.projection)) {
        //         if (Array.isArray(found)) {
        //             for (let item of found) {
        //                 for (let p in item) {
        //                     if (p == '_id') {
        //                         if (params.projection[p] == 0) {
        //                             delete found[p];
        //                         }
        //                     }
        //                     else if (!Object.keys(params.projection).includes(p) || params.projection[p] == 0) {
        //                         delete item[p];
        //                     }
        //                 }
        //             }
        //         }
        //         else if (typeof found == 'object') {
        //             for (let p in found) {
        //                 if (p == '_id') {
        //                     if (params.projection[p] == 0) {
        //                         delete found[p];
        //                     }
        //                 }
        //                 else if (!Object.keys(params.projection).includes(p) || params.projection[p] == 0) {
        //                     delete found[p];
        //                 }
        //             }
        //         }
        //     }
        // }

    }

    organizeData(params) {
        if (perceptor.isset(params.query)) {
            if (perceptor.isset(params.changeQuery)) {
                for (var i in params.changeQuery) {
                    if (perceptor.isset(params.query[i])) {
                        if (params.changeQuery[i] == 'objectid') {
                            params.query[i] = new ObjectId(params.query[i]);
                        }
                    }
                }
            }
        }
        return params;
    }

    prepareData(data) {
        let preparedData = {};
        let value;
        for (let i in data) {
            if (!perceptor.isset(preparedData[i])) {

                if (data[i].filename != '') {
                    value = data[i];
                }
                else {
                    value = data[i].value.toString();
                    if (value == '[object Object]') {
                        value = data[i];
                    }
                }
                preparedData[i] = value;
            }
        }

        return preparedData;
    }

    respond(req, res, data) {
        res.end(JSON.stringify(data));
    }

    logout(req, res, data) {
        delete this.sessions[req.sessionId].user;
        this.sessions[req.sessionId].active = false;
        this.respond(req, res, true);
    }

    changeDp(req, res, data) {
        let userPath = `./userdata/${req.sessionId}`;
        let userImage = `./userdata/${req.sessionId}/dp.png`;

        let uploadImage = () => {
            fs.writeFile(userImage, data.newImage.value, c => {
                db.update({ collection: 'users', query: { _id: new ObjectId(this.sessions[req.sessionId].user) }, options: { '$set': { userImage: userImage } } }).then(result => {
                    this.respond(req, res, result == 1);

                    this.makeHistory(result == 1, { action: 'Change Profile Picture', data });

                });
            });
        }

        fs.exists(userPath, foundUser => {
            if (!foundUser) {
                fs.mkdir(userPath, { recursive: true }, () => {
                    uploadImage();
                });
            }
            else {
                uploadImage();
            }
        });
    }

    deleteDp(req, res, data) {
        db.update({ collection: 'users', query: { _id: new ObjectId(this.sessions[req.sessionId].user) }, options: { '$set': { userImage: null } } }).then(result => {
            perceptor.deleteRecursive(`./userdata/${this.sessions[req.sessionId].user}/dp.png`, () => {
                this.respond(req, res, result == 1);
                this.makeHistory(result == 1, { action: 'Delete Profile Picture', data });
            });
        });
    }

    editProfile(req, res, data) {
        data.lastModified = new Date().getTime();
        db.update({ collection: 'users', query: { _id: new ObjectId(this.sessions[req.sessionId].user) }, options: { '$set': data } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(result == 1, { action: 'Edit Profile', data });
        });
    }

    editUser(req, res, data) {
        let id = data._id;
        delete data._id;
        data.lastModified = new Date().getTime();
        db.update({ collection: 'users', query: { _id: new ObjectId(id) }, options: { '$set': data } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(result == 1, { action: 'Edit User', data });
        });
    }

    changePassword(req, res, data) {
        db.find({ collection: 'users', query: { _id: new ObjectId(this.sessions[req.sessionId].user) }, projection: { currentPassword: 1 } }).then(result => {
            if (!perceptor.isnull(result)) {
                bcrypt.compare(data.currentPassword, result.currentPassword).then(valid => {
                    if (valid) {
                        bcrypt.hash(data.newPassword, 10).then(hash => {
                            data.newPassword = hash;
                            db.update({ collection: 'users', query: { _id: new ObjectId(this.sessions[req.sessionId].user) }, options: { '$set': { currentPassword: data.newPassword } } }).then(changed => {
                                this.respond(req, res, true);
                                this.makeHistory(true, { action: 'Change Password', data });
                            });
                        });
                    }
                    else {
                        this.respond(req, res, false);
                    }
                });
            }
            else {
                this.respond(req, res, '404');
            }
        });
    }

    createCategory(req, res, data) {
        data.newCats = data.newCats.trim().split(',');
        let parents = data.parents.trim().split(',');
        data.parents = [];
        data.timeCreated = new Date().getTime();
        data.lastModified = new Date().getTime();
        let run = {};

        for (let i of data.newCats) {
            let name = i.trim();
            if (name != '') {
                run[i] = db.ifNotExist({ collection: 'categories', query: { name, parents: '', image: '' }, check: [{ name }], action: 'insert', getInserted: true });
            }
        }

        perceptor.runParallel(run, result => {
            for (let i in result) {
                if (!perceptor.isset(result[i].found)) {
                    let id = result[i][0]._id;
                    parents.push(id);
                }
            }

            for (let parent of parents) {
                if (parent != '') {
                    data.parents.push(parent);
                }
            }

            data.parents = data.parents.join(',');
            db.ifNotExist({ collection: 'categories', query: { name: data.name, parents: data.parents }, check: [{ name: data.name }], action: 'insert', getInserted: true }).then(result => {

                if (perceptor.isset(result.found)) {
                    this.respond(req, res, result);
                }
                else if (perceptor.isset(result[0]._id) && data.image != '') {
                    let categoriesPath = `./categories/${result[0]._id}`;
                    let image = `./categories/${result[0]._id}/image.png`;

                    let uploadImage = () => {
                        fs.writeFile(image, data.image.value, c => {
                            db.update({ collection: 'categories', query: { _id: new ObjectId(result[0]._id) }, options: { '$set': { image } } }).then(result => {
                                this.respond(req, res, result == 1);
                                this.makeHistory(result == 1, { action: 'Create Category', data });
                            });
                        });
                    }

                    fs.exists(categoriesPath, found => {
                        if (!found) {
                            fs.mkdir(categoriesPath, { recursive: true }, () => {
                                uploadImage();
                            });
                        }
                        else {
                            uploadImage();
                        }
                    });
                }
                else if (data.image == '') {
                    this.respond(req, res, perceptor.isset(result[0]._id));
                }
            });
        });

    }

    deleteCategory(req, res, data) {
        db.delete({ collection: 'categories', query: { _id: new ObjectId(data.id) } }).then(result => {
            perceptor.deleteRecursive(`./categories/${data.id}`, () => {
                this.respond(req, res, result.result.ok == 1);
                this.makeHistory(result.result.ok == 1, { action: 'Delete Category', data });
                db.find({ collection: 'categories', query: {}, many: true, projection: { parents: 1 } }).then(categories => {
                    for (let category of categories) {
                        if (category.parents.includes(data.id)) {
                            let newParents = [];
                            for (let parent of category.parents.split(',')) {
                                if (parent != data.id) newParents.push(parent);
                            }

                            db.update({ collection: 'categories', query: { _id: new ObjectId(category._id) }, options: { '$set': { parents: newParents.join(',') } } });
                        }
                    }
                })
            });
        });
    }

    deleteCategoryImage(req, res, data) {
        db.update({ collection: 'categories', query: { _id: new ObjectId(data.id) }, options: { '$set': { image: null } } }).then(result => {
            perceptor.deleteRecursive(`./categories/${data.id}/image.png`, () => {
                this.respond(req, res, result == 1);
                this.makeHistory(result == 1, { action: 'Delete Category Image', data });
            });
        });
    }

    changeCategoryImage(req, res, data) {
        let categoriesPath = `./categories/${data.id}`;
        let image = `./categories/${data.id}/image.png`;

        let uploadImage = () => {
            fs.writeFile(image, data.newImage.value, c => {
                db.update({ collection: 'categories', query: { _id: new ObjectId(data.id) }, options: { '$set': { image } } }).then(result => {
                    this.respond(req, res, result == 1);
                    this.makeHistory(result == 1, { action: 'Change Category Image', data });

                });
            });
        }

        fs.exists(categoriesPath, found => {
            if (!found) {
                fs.mkdir(categoriesPath, { recursive: true }, () => {
                    uploadImage();
                });
            }
            else {
                uploadImage();
            }
        });
    }

    editCategory(req, res, data) {
        let _id = data.id;
        delete data.id;
        data.lastModified = new Date().getTime();
        db.ifIExist({ collection: 'categories', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }] }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(result == 1, { action: 'Edit Category', data });
        });
    }

    createTag(req, res, data) {
        data.timeCreated = new Date().getTime();
        data.lastModified = new Date().getTime();
        db.ifNotExist({ collection: 'tags', query: { name: data.name }, check: [{ name: data.name }], action: 'insert', getInserted: true }).then(result => {

            if (perceptor.isset(result.found)) {
                this.respond(req, res, result);
            }
            else if (perceptor.isset(result[0]._id) && data.image != '') {
                let tagsPath = `./tags/${result[0]._id}`;
                let image = `./tags/${result[0]._id}/image.png`;

                let uploadImage = () => {
                    fs.writeFile(image, data.image.value, c => {
                        db.update({ collection: 'tags', query: { _id: new ObjectId(result[0]._id) }, options: { '$set': { image } } }).then(result => {
                            this.respond(req, res, result == 1);
                            this.makeHistory(result == 1, { action: 'Create Tag', data });
                        });
                    });
                }

                fs.exists(tagsPath, found => {
                    if (!found) {
                        fs.mkdir(tagsPath, { recursive: true }, () => {
                            uploadImage();
                        });
                    }
                    else {
                        uploadImage();
                    }
                });
            }
            else if (data.image == '') {
                this.respond(req, res, perceptor.isset(result[0]._id));
            }
        });
    }

    deleteTagImage(req, res, data) {
        db.update({ collection: 'tags', query: { _id: new ObjectId(data.id) }, options: { '$set': { image: null } } }).then(result => {
            perceptor.deleteRecursive(`./tags/${data.id}/image.png`, () => {
                this.respond(req, res, result == 1);
                this.makeHistory(result == 1, { action: 'Delete Tag Image', data });
            });
        });
    }

    changeTagImage(req, res, data) {
        let tagsPath = `./tags/${data.id}`;
        let image = `./tags/${data.id}/image.png`;

        let uploadImage = () => {
            fs.writeFile(image, data.newImage.value, c => {
                db.update({ collection: 'tags', query: { _id: new ObjectId(data.id) }, options: { '$set': { image } } }).then(result => {
                    this.respond(req, res, result == 1);
                    this.makeHistory(result == 1, { action: 'Change Tag Image', data });
                });
            });
        }

        fs.exists(tagsPath, found => {
            if (!found) {
                fs.mkdir(tagsPath, { recursive: true }, () => {
                    uploadImage();
                });
            }
            else {
                uploadImage();
            }
        });
    }

    deleteTag(req, res, data) {
        db.delete({ collection: 'tags', query: { _id: new ObjectId(data.id) } }).then(result => {
            perceptor.deleteRecursive(`./tags/${data.id}`, () => {
                this.respond(req, res, result.result.ok == 1);
                this.makeHistory(result.result.ok == 1, { action: 'Delete Tag', data });

            });
        });
    }

    editTag(req, res, data) {
        let _id = data.id;
        delete data.id;
        data.lastModified = new Date().getTime();
        db.ifIExist({ collection: 'tags', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }] }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(result == 1, { action: 'Edit Tag', data });

        });
    }

    createItem(req, res, data) {
        data.newCats = data.newCats.trim().split(',');
        let categories = data.categories.trim().split(',');
        data.categories = [];
        data.timeCreated = new Date().getTime();
        data.lastModified = new Date().getTime();
        let runCats = {};

        for (let i of data.newCats) {
            let name = i.trim();
            if (name != '') {
                runCats[i] = db.ifNotExist({ collection: 'categories', query: { name, parents: '', image: '' }, check: [{ name }], action: 'insert', getInserted: true });
            }
        }

        data.newTags = data.newTags.trim().split(',');
        let tags = data.tags.trim().split(',');
        data.tags = [];

        let runTags = {};

        for (let i of data.newTags) {
            let name = i.trim();
            if (name != '') {
                runTags[i] = db.ifNotExist({ collection: 'tags', query: { name, image: '' }, check: [{ name }], action: 'insert', getInserted: true });
            }
        }

        perceptor.runParallel(runCats, resultCats => {
            for (let i in resultCats) {
                if (!perceptor.isset(resultCats[i].found)) {
                    let id = resultCats[i][0]._id;
                    categories.push(id);
                }
            }

            for (let category of categories) {
                if (category != '') {
                    data.categories.push(category);
                }
            }

            data.categories = data.categories.join(',');

            perceptor.runParallel(runTags, resultTags => {
                for (let i in resultTags) {
                    if (!perceptor.isset(resultTags[i].found)) {
                        let id = resultTags[i][0]._id;
                        tags.push(id);
                    }
                }

                for (let tag of tags) {
                    if (tag != '') {
                        data.tags.push(tag);
                    }
                }

                data.tags = data.tags.join(',');

                let image = data.image;
                delete data.newTags;
                delete data.newCats;
                delete data.image;

                db.ifNotExist({ collection: 'items', query: data, check: [{ name: data.name }, { code: data.code }], action: 'insert', getInserted: true }).then(result => {

                    if (perceptor.isset(result.found)) {
                        this.respond(req, res, result);
                    }
                    else if (perceptor.isset(result[0]._id) && image != '') {
                        let itemPath = `./items/${result[0]._id}`;
                        let imagePath = `./items/${result[0]._id}/image.png`;

                        let uploadImage = () => {
                            fs.writeFile(imagePath, image.value, c => {
                                db.update({ collection: 'items', query: { _id: new ObjectId(result[0]._id) }, options: { '$set': { image: imagePath } } }).then(result => {
                                    this.respond(req, res, result == 1);
                                    this.makeHistory(result == 1, { action: 'Create Item', data });

                                });
                            });
                        }

                        fs.exists(itemPath, found => {
                            if (!found) {
                                fs.mkdir(itemPath, { recursive: true }, () => {
                                    uploadImage();
                                });
                            }
                            else {
                                uploadImage();
                            }
                        });
                    }
                    else {
                        this.respond(req, res, perceptor.isset(result[0]._id));
                    }
                });
            });
        });
    }

    deleteItem(req, res, data) {
        db.delete({ collection: 'items', query: { _id: new ObjectId(data.id) } }).then(result => {
            perceptor.deleteRecursive(`./items/${data.id}`, () => {
                this.respond(req, res, result.result.ok == 1);
                this.makeHistory(result.result.ok == 1, { action: 'Delete Item', data });
            });
        });
    }

    deleteItemImage(req, res, data) {
        db.update({ collection: 'items', query: { _id: new ObjectId(data.id) }, options: { '$set': { image: null } } }).then(result => {
            perceptor.deleteRecursive(`./items/${data.id}/image.png`, () => {
                this.respond(req, res, result == 1);
                this.makeHistory(result == 1, { action: 'Delete Item Image', data });
            });
        });
    }

    changeItemImage(req, res, data) {
        let itemsPath = `./items/${data.id}`;
        let image = `./items/${data.id}/image.png`;

        let uploadImage = () => {
            fs.writeFile(image, data.newImage.value, c => {
                db.update({ collection: 'items', query: { _id: new ObjectId(data.id) }, options: { '$set': { image } } }).then(result => {
                    this.respond(req, res, result == 1);
                    this.makeHistory(result == 1, { action: 'Change Item Image', data });
                });
            });
        }

        fs.exists(itemsPath, found => {
            if (!found) {
                fs.mkdir(itemsPath, { recursive: true }, () => {
                    uploadImage();
                });
            }
            else {
                uploadImage();
            }
        });
    }

    editItem(req, res, data) {
        let _id = data.id;
        delete data.id;
        data.lastModified = new Date().getTime();
        db.ifIExist({ collection: 'items', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }, { query: { name: data.code }, against: { _id } }] }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(result == 1, { action: 'Edit Item', data });
        });
    }

    createCustomForm(req, res, data) {
        data.contents = JSON.parse(data.contents);
        data.tasks = JSON.parse(data.tasks);
        data.timeCreated = new Date().getTime();
        data.lastModified = new Date().getTime();
        db.ifNotExist({ collection: 'customforms', query: data, check: [{ name: data.name }], action: 'insert', getInserted: true }).then(result => {
            if (perceptor.isset(result.found)) {
                this.respond(req, res, result);
            }
            else {
                this.respond(req, res, perceptor.isset(result[0]._id));
                this.makeHistory(perceptor.isset(result[0]._id), { action: 'Create Custom Form', data });
            }
        });
    }

    editCustomForm(req, res, data) {
        let _id = data.id;
        delete data.id;
        data.contents = JSON.parse(data.contents);
        data.tasks = JSON.parse(data.tasks);
        data.lastModified = new Date().getTime();
        db.ifIExist({ collection: 'customforms', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }] }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(result == 1, { action: 'Edit Custom Form', data });
        });
    }

    deleteCustomForm(req, res, data) {
        db.delete({ collection: 'customforms', query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result.result.ok == 1);
            this.makeHistory(result.result.ok == 1, { action: 'Delete Custom Form', data });
        });
    }

    createList(req, res, data) {
        data.author = this.sessions[req.sessionId].user;
        data.time = new Date().getTime();
        data.contents = JSON.parse(data.contents);
        data.timeCreated = new Date().getTime();
        data.lastModified = new Date().getTime();
        db.ifNotExist({ collection: 'lists', query: data, check: [{ name: data.name }], action: 'insert', getInserted: true }).then(result => {

            if (perceptor.isset(result.found)) {
                this.respond(req, res, result);
            }
            else {
                this.respond(req, res, perceptor.isset(result[0]._id));
                this.makeHistory(perceptor.isset(result[0]._id), { action: 'Create List', data });
            }
        });
    }

    insertIntoList(req, res, data) {
        data.new = JSON.parse(data.new);
        data.new.timeCreated = new Date().getTime();
        data.new.lastModified = new Date().getTime();
        let content = { _id: data.new._id };
        for (let name in data.new) {
            content[name] = data.new[name];
        }

        db.find({ collection: 'lists', query: { _id: new ObjectId(data.id) }, }).then(list => {
            let contents = list.contents;

            let ids = perceptor.object.valueOfObjectArray(contents, '_id');
            let id = perceptor.generateRandom(24);
            while (ids.includes(id)) {
                id = perceptor.generateRandom(24);
            }

            content._id = id;
            db.update({ collection: 'lists', query: { _id: new ObjectId(data.id) }, options: { '$push': { contents: content } } }).then(result => {
                this.respond(req, res, result == 1);
                this.makeHistory(result == 1, { action: 'Create List Item', data });
            })
        });
    }

    editListItem(req, res, data) {
        data.item = JSON.parse(data.item);
        data.item.lastModified = new Date().getTime();
        let content = { _id: data.item._id };
        for (let name in data.item) {
            content[name] = data.item[name];
        }

        db.update({ collection: 'lists', query: { _id: new ObjectId(data.id), 'contents._id': data.item._id }, options: { '$set': { 'contents.$': content } } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(result == 1, { action: 'Edit List Item', data });
        });
    }

    deleteListItem(req, res, data) {
        db.update({ collection: 'lists', query: { _id: new ObjectId(data.id) }, options: { '$pull': { contents: { _id: data.row } } } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(result == 1, { action: 'Delete List Item', data });
        });
    }

    deleteList(req, res, data) {
        db.delete({ collection: 'lists', query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result.result.ok == 1);
            this.makeHistory(result.result.ok == 1, { action: 'Delete List', data });
        });
    }

    editList(req, res, data) {
        let _id = data.id;
        delete data.id;
        data.lastModified = new Date().getTime();
        db.ifIExist({ collection: 'lists', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }] }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(result == 1, { action: 'Edit List', data });
        });
    }

    getSourcesNames(req, res, data) {
        let collections = {};
        db.getCollections().then(result => {//Get all collections name
            let run = {};
            for (let i = 0; i < result.length; i++) {
                if (result[i].name.toLowerCase() == 'sessions') {
                    continue;
                }

                run[result[i].name] = db.find({ collection: result[i].name, query: {}, many: true });//get each collection's content
            }

            perceptor.runParallel(run, found => {
                for (let collection in found) {
                    collections[collection] = [];

                    for (let i = 0; i < result.length; i++) {
                        let names = Object.keys(found[collection][i]);
                        for (let name of names) {
                            if (!collections[collection].includes(name)) {
                                collections[collection].push(name)
                            }
                        }
                    }
                }
                this.respond(req, res, collections);
            });
        });
    }

    getCollectionKeys(req, res, data) {
        let keys = [];
        let [collection, item] = data.name.replace('@', '').split('#');

        db.find({ collection, query: {}, many: true }).then(result => {
            for (let i = 0; i < result.length; i++) {
                if (perceptor.isset(item)) {
                    let list = perceptor.array.find(result, single => {
                        return single.name == item;
                    });

                    for (let j = 0; j < list.contents.length; j++) {
                        let names = Object.keys(list.contents[j]);
                        for (let name of names) {
                            if (!keys.includes(name)) {
                                keys.push(name)
                            }
                        }
                    }
                }
                else {
                    let names = Object.keys(result[i]);
                    for (let name of names) {
                        if (!keys.includes(name)) {
                            keys.push(name)
                        }
                    }
                }
            }
            this.respond(req, res, keys);
        });
    }

    getSources(req, res, data) {
        let collections = {};
        db.getCollections().then(result => {//Get all collections name
            let run = {};
            for (let i = 0; i < result.length; i++) {
                if (result[i].name.toLowerCase() == 'sessions') {
                    continue;
                }

                run[result[i].name] = db.find({ collection: result[i].name, query: {}, many: true });//get each collection's content
            }

            perceptor.runParallel(run, found => {
                if (perceptor.isset(found.users)) {
                    for (let user of found.users) {
                        delete user.currentPassword;
                    }
                }

                this.respond(req, res, found);
            });
        });
    }

    performTasks(tasks, type, callback) {
        db.find({ collection: 'customforms', query: { _id: new ObjectId(type) }, projection: { tasks: 1, target: 1, _id: 0 } }).then(customTasks => {//get all the custom tasks
            let target = perceptor.inBetween(customTasks.target, '$#&{', '}&#$');//get the forms target
            try {
                target = JSON.parse(target).collection;
            } catch (error) {
                callback(-1);
                return;
            }
            let run = {};
            let customT;

            for (let name in tasks) {
                customT = perceptor.array.find(customTasks.tasks, t => {//get the tasks sample
                    return t.name == name;
                });

                for (let i = 0; i < tasks[name].length; i++) {
                    let update = {};
                    update[customT.target] = { action: customT.action, value: tasks[name][i].value };
                    run[`${name}.${i}`] = db.modify({ collection: target, query: { _id: new ObjectId(tasks[name][i]._id) }, update });//make the update
                }
            }

            perceptor.runParallel(run, result => {
                for (let name in result) {
                    let [taskName, position] = name.split('.');

                    customT = perceptor.array.find(customTasks.tasks, t => {
                        return t.name == taskName;
                    });

                    tasks[taskName][position].previous = result[name][customT.target];
                }
                callback(tasks);
            });
        });
    }

    revertTasks(tasks, type, callback) {
        db.find({ collection: 'customforms', query: { _id: new ObjectId(type) }, projection: { tasks: 1, target: 1, _id: 0 } }).then(customTasks => {
            let target = perceptor.inBetween(customTasks.target, '$#&{', '}&#$');
            try {
                target = JSON.parse(target).collection;
            } catch (error) {
                callback(-1);
                return;
            }
            let run = {};
            let customT;
            for (let name in tasks) {
                customT = perceptor.array.find(customTasks.tasks, t => {
                    return t.name == name;
                });

                for (let i = 0; i < tasks[name].length; i++) {
                    let update = {};
                    update[customT.target] = { action: 'Set', value: tasks[name][i].previous };
                    run[`${name}.${i}`] = db.modify({ collection: target, query: { _id: new ObjectId(tasks[name][i]._id) }, update });
                }
            }

            perceptor.runParallel(run, result => {
                for (let name in result) {
                    let [taskName, position] = name.split('.');

                    customT = perceptor.array.find(customTasks.tasks, t => {
                        return t.name == taskName;
                    });

                    tasks[taskName][position].value = result[name][customT.target];
                }
                callback(tasks);
            });
        });
    }

    createForm(req, res, data) {
        data.author = this.sessions[req.sessionId].user;
        data.time = new Date().getTime();
        data.contents = JSON.parse(data.contents);
        data.tasks = JSON.parse(data.tasks);
        data.timeCreated = new Date().getTime();
        data.lastModified = new Date().getTime();
        this.performTasks(data.tasks, data.type, tasks => {
            if (tasks != -1) {
                data.tasks = tasks;
                this.makeHistory(tasks != - 1, { action: 'Perform Tasks', tasks });
            }
            db.insert({ collection: 'forms', query: data }).then(result => {
                this.respond(req, res, result);
                this.makeHistory(result == 1, { action: 'Create Form', data });
            });
        });
    }

    deleteForm(req, res, data) {
        db.find({ collection: 'forms', query: { _id: new ObjectId(data.id) }, projection: { type: 1, tasks: 1, _id: 0 } }).then(form => {
            this.revertTasks(form.tasks, form.type, (tasks) => {
                this.makeHistory(tasks != - 1, { action: 'Revert Tasks', tasks });
                db.delete({ collection: 'forms', query: { _id: new ObjectId(data.id) } }).then(result => {
                    this.respond(req, res, result.result.ok == 1);
                });
            });
        });
    }

    editForm(req, res, data) {
        data.time = new Date().getTime();
        data.contents = JSON.parse(data.contents);
        data.tasks = JSON.parse(data.tasks);
        let id = data.id;
        delete data.id;
        data.lastModified = new Date().getTime();
        db.find({ collection: 'forms', query: { _id: new ObjectId(id) }, projection: { type: 1, tasks: 1, _id: 0 } }).then(form => {
            this.revertTasks(form.tasks, form.type, (reverted) => {
                this.makeHistory(reverted != - 1, { action: 'Perform Tasks', reverted });
                this.performTasks(data.tasks, data.type, performed => {
                    this.makeHistory(performed != - 1, { action: 'Perform Tasks', performed });
                    db.update({
                        collection: 'forms', query: { _id: new ObjectId(id) }, options: {
                            '$set': data
                        }
                    }).then(result => {
                        this.respond(req, res, result);
                        this.makeHistory(tasks == 1, { action: 'Update From', data });
                    });
                });
            });
        });
    }

    saveView(req, res, data) {
        data.view = JSON.parse(data.view);
        data.owner = this.sessions[req.sessionId].user;
        db.save({ collection: 'views', query: data, check: { owner: this.sessions[req.sessionId].user } }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(result == 1, { action: 'Save View', data });
        });
    }

    createReportGenerator(req, res, data) {
        data.contents = JSON.parse(data.contents);
        data.timeCreated = new Date().getTime();
        data.lastModified = new Date().getTime();
        db.ifNotExist({ collection: 'reportgenerators', query: data, check: [{ name: data.name }], action: 'insert', getInserted: true }).then(result => {
            if (perceptor.isset(result.found)) {
                this.respond(req, res, result);
            }
            else {
                this.respond(req, res, perceptor.isset(result[0]._id));
                this.makeHistory(perceptor.isset(result[0]._id), { action: 'Create Report Generator', data });
            }
        });
    }

    editReportGenerator(req, res, data) {
        let _id = data.id;
        delete data.id;
        data.contents = JSON.parse(data.contents);
        data.lastModified = new Date().getTime();
        db.ifIExist({ collection: 'reportgenerators', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }] }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(result == 1, { action: 'Edit Report Generator', data });
        });
    }

    deleteReportGenerator(req, res, data) {
        db.delete({ collection: 'reportgenerators', query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result.result.ok == 1);
            this.makeHistory(result.result.ok == 1, { action: 'Delete Report Generator', data });
        });
    }
}

module.exports = { PostHandler };