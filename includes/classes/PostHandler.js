const { ObjectId, Db } = require("mongodb");

class PostHandler {
    constructor() {
        this.ignoreActive = ['login', 'createAccount'];
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

        if (kerds.isset(this[action])) {
            deliver();
            return
            if (this.adminOnly.includes(action)) {
                let user = global.sessions[req.sessionId].user;
                global.sessions[req.sessionId].db.find({ collection: 'users', query: { _id: new ObjectId(global.sessions[req.sessionId].user) }, projection: { userType: 1 } }).then(result => {

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

    ifNotExist(req, params) {
        if (params.action == 'insert') {
            params.query.timeCreated = new Date().getTime();
            params.query.lastModified = new Date().getTime();
        }
        else if (params.action == 'update') {
            params.query.lastModified = new Date().getTime();
        }
        return new Promise(async (resolve, reject) => {
            let data, found;
            for (let i = 0; i < params.check.length; i++) {
                data = await global.sessions[req.sessionId].db.find({ collection: params.collection, query: params.check[i], many: true });
                data = kerds.array.find(data, d => {
                    return d.recycled != true;
                });

                found = kerds.isset(data);

                if (found) {
                    resolve({ found: Object.keys(params.check[i]) });
                    break
                }
            }
            if (!found) {
                global.sessions[req.sessionId].db[params.action](params).then(worked => {
                    resolve(worked);
                }).catch(error => {
                    reject(error)
                });
            }
        });
    }

    ifIExist(req, params) {
        if (params.action == 'update') {
            if (kerds.isset(params.option)) {
                if (kerds.isset(params.options['$set'])) {
                    params.options['$set'].lastModified = new Date().getTime();
                }
                if (kerds.isset(params.options['$push'])) {
                    params.options['$push'].lastModified = new Date().getTime();
                }
                if (kerds.isset(params.options['$pull'])) {
                    params.options['$pull'].lastModified = new Date().getTime();
                }
            }
        }

        return global.sessions[req.sessionId].db.ifIExist(params);
    }

    insert(req, params) {
        params.query.timeCreated = new Date().getTime();
        params.query.lastModified = new Date().getTime();

        return global.sessions[req.sessionId].db.insert(params);
    }

    set(req, params) {
        params.options['$set'].lastModified = new Date().getTime();

        return global.sessions[req.sessionId].db.update(params);
    }

    pull(req, params) {
        return global.sessions[req.sessionId].db.update(params);
    }

    push(req, params) {
        return global.sessions[req.sessionId].db.update(params);
    }

    update(req, params) {
        params.options['$set'] = params.options['$set'] || { lastModified: new Date().getTime() };

        return global.sessions[req.sessionId].db.update(params);
    }

    removeFromRecycleBin(req, res, data) {
        global.sessions[req.sessionId].db.delete({ collection: data.collection, query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result.result.ok == 1);
            this.makeHistory(req, result.result.ok == 1, { action: 'Removed From Recycle Bin', data, collection: data.collection, item: data.id });
        })
    }

    recycle(req, params) {
        params.options = { $set: { recycled: true, timeDeleted: new Date().getTime() } };
        return global.sessions[req.sessionId].db.update(params);
    }

    revert(req, res, data) {
        this.update(req, { collection: data.collection, query: { _id: new ObjectId(data.id) }, options: { $set: { recycled: false, timeReverted: new Date().getTime() } } }).then(result => {
            this.respond(req, res, (result == 1));
            this.makeHistory(req, result == 1, { action: `Reverted`, data, collection: data.collection, item: data.id });
        });
    }

    emptyRecycleBin(req, res, data) {
        kerds.runParallel({
            items: global.sessions[req.sessionId].db.delete({ collection: 'items', query: { recycled: true }, many: true }),
            categories: global.sessions[req.sessionId].db.delete({ collection: 'categories', query: { recycled: true }, many: true }),
            tags: global.sessions[req.sessionId].db.delete({ collection: 'tags', query: { recycled: true }, many: true }),
            users: global.sessions[req.sessionId].db.delete({ collection: 'users', query: { recycled: true }, many: true }),
            lists: global.sessions[req.sessionId].db.delete({ collection: 'lists', query: { recycled: true }, many: true }),
            forms: global.sessions[req.sessionId].db.delete({ collection: 'forms', query: { recycled: true }, many: true }),
            reports: global.sessions[req.sessionId].db.delete({ collection: 'reports', query: { recycled: true }, many: true }),
            customforms: global.sessions[req.sessionId].db.delete({ collection: 'customforms', query: { recycled: true }, many: true }),
            reportgenerators: global.sessions[req.sessionId].db.delete({ collection: 'reportgenerators', query: { recycled: true }, many: true }),
        }, result => {
            this.respond(req, res, true);
            this.makeHistory(req, true, { action: 'Empty Recycle Bin', data, item: 'System' });
        });
    }

    createAccount(req, res, data) {
        data.account = `${data.account}#onInventory`;
        this.ifNotExist(req, { collection: 'accounts', query: { name: data.account }, check: [{ name: data.account }], action: 'insert' }).then(inserted => {
            if (inserted == 1) {
                global.sessions[req.sessionId].db.setName(data.account);//set database name
                global.sessions[req.sessionId].db.erase().then(erased => {//erase database
                    if (erased) {
                        this.setUpAccount(req, data, user => {

                            this.makeHistory(req, kerds.isset(user), { action: 'User Creation', data, collection: 'users', item: user._id.toString() });
                            this.notify(req, { title: 'Welcome Note', note: 'Your system has been setup, Enjoy', users: [user._id.toString()] });

                            global.sessions[req.sessionId].set({ user: ObjectId(user._id).toString(), active: true, account: data.account });

                            delete user.currentPassword;
                            user.user = user._id;
                            delete user._id;
                            this.respond(req, res, user);
                        });
                    }
                });
            }
            else if (kerds.isset(inserted.found)) {
                this.respond(req, res, 'found');
            }

        });
    }

    setUpAccount (req, data, callback){
        bcrypt.hash(data.password, 10).then(hash => {
            global.sessions[req.sessionId].db.insert({ collection: 'users', query: { userName: data.admin, currentPassword: hash, userType: 'Admin' }, getInserted: true }).then(user => {
                global.sessions[req.sessionId].db.createCollection('lists');
                callback(user[0]);
            });
        });
    }

    login(req, res, data) {
        let [userName, account] = data.email.split('@');
        account = account.slice(0, account.lastIndexOf('.')).replace('.', '#');
        global.sessions[req.sessionId].db.name = account;
        console.log(account, userName);
        global.sessions[req.sessionId].db.find({ collection: 'users', query: { userName: userName }, projection: { currentPassword: 1, userType: 1, fullName: 1, userImage: 1 } }).then(result => {
            if (!kerds.isnull(result)) {
                bcrypt.compare(data.currentPassword, result.currentPassword).then(valid => {
                    if (valid) {
                        this.respond(req, res, { user: result._id, userType: result.userType, fullName: result.fullName, image: result.userImage });
                        global.sessions[req.sessionId].set({ user: ObjectId(result._id).toString(), active: true, account });
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

    makeHistory(req, flag, event) {
        if (flag) {
            event.timeCreated = new Date().getTime();
            event.by = global.sessions[req.sessionId].user;
            global.sessions[req.sessionId].db.insert({ collection: 'history', query: event });
        }
    }

    createUser(req, res, data) {
        bcrypt.hash(data.currentPassword, 10).then(hash => {
            data.currentPassword = hash;

            this.ifNotExist(req, { collection: 'users', query: data, check: [{ userName: data.userName }, { email: data.email }], action: 'insert', getInserted: true }).then(result => {

                if (!kerds.isset(result.found)) {
                    this.respond(req, res, kerds.isset(result[0]));
                    this.makeHistory(req, kerds.isset(result[0]), { action: 'User Creation', data, collection: 'users', item: result[0]._id.toString() });
                    if (data.userType == 'Admin') {
                        this.notify(req, { title: 'User type Change', note: 'You are now an Admin', users: [result[0]._id.toString()] });

                        global.sessions[req.sessionId].db.find({ collection: 'users', query: { userType: 'Admin' }, projection: { _id: 1 }, many: true }).then(admins => {
                            admins = kerds.array.each(admins, a => {
                                return a._id.toString();
                            });
                            this.notify(req, { title: 'Admin Created', note: 'A new admin has been added to the system.', link: `users.html?page=showUser&id=${result[0]._id.toString()}`, users: admins });
                        });
                    }
                }
                else {
                    this.respond(req, res, result);
                }
            });
        });
    }

    makeAdmin(req, res, data) {
        this.set(req, { collection: 'users', query: { _id: ObjectId(data.user) }, options: { '$set': { userType: 'Admin' } } }).then(result => {
            this.respond(req, res, result == 1);
            data.by = global.sessions[req.sessionId].user;
            this.makeHistory(req, result == 1, { action: 'Become Admin', data, collection: 'users', item: data.user });

            this.notify(req, { title: 'User type Change', note: 'You are now an Admin', users: [data.user] });

            global.sessions[req.sessionId].db.find({ collection: 'users', query: { userType: 'Admin' }, projection: { _id: 1 }, many: true }).then(admins => {
                admins = kerds.array.each(admins, a => {
                    return a._id.toString();
                });

                this.notify(req, { title: 'Admin Created', note: 'A new admin has been added to the system.', link: `users.html?page=showUser&id=${data.user}`, users: admins });
            });
        });
    }

    makeStaff(req, res, data) {
        this.set(req, { collection: 'users', query: { _id: ObjectId(data.user) }, options: { '$set': { userType: 'Staff' } } }).then(result => {
            this.respond(req, res, result == 1);
            data.by = global.sessions[req.sessionId].user;
            this.makeHistory(req, result == 1, { action: 'Become Staff', data, collection: 'users', item: data.user });

            if (result == 1) {
                this.notify(req, { title: 'User type Change', note: 'You are no longer an Admin', users: [data.user] });

                global.sessions[req.sessionId].db.find({ collection: 'users', query: { userType: 'Admin' }, projection: { _id: 1 }, many: true }).then(admins => {
                    admins = kerds.array.each(admins, a => {
                        return a._id.toString();
                    });

                    this.notify(req, { title: 'Admin Removal', note: 'An admin has been removed from the system system.', link: '', users: admins });
                });
            }
        });
    }

    tourUser(req, res, data) {
        data.user = global.sessions[req.sessionId].user;
        this.set(req, { collection: 'users', query: { _id: ObjectId(data.user) }, options: { '$set': { toured: true } } }).then(result => {
            this.respond(req, res, result == 1);
        });
    }

    deleteUser(req, res, data) {
        this.recycle(req, { collection: 'users', query: { _id: ObjectId(data.user) } }).then(result => {
            this.respond(req, res, (result == 1));
            this.makeHistory(req, result == 1, { action: 'Delete User', data, collection: 'users', item: data.user });
        });
    }

    isActive(user) {
        return global.sessions[user].active;
    }

    isUserActive(req, res, data) {
        let active = false;
        for (let id in global.sessions) {
            if (global.sessions[id].user == data.user) {
                active = global.sessions[id].active;
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
            if (!kerds.isnull(result)) {
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

        if (kerds.isset(action)) {
            this.respond(req, res, 'actioned');
        }
        else {
            global.sessions[req.sessionId].db.find(params).then(result => {
                this.respond(req, res, prepareResult(result));
            });
        }

        // let [collection, name] = params.collection.split('#');
        //                 value = collection.find({ query: { name } });
        // if (kerds.isnull(found)) {
        //     return found;
        // }
        // else {
        //     if (kerds.isset(params.query)) {
        //         if (kerds.isset(params.many) && params.many == true) {
        //             found = kerds.array.findAll(found.contents, item => {
        //                 let flag = true;
        //                 for (let n in params.query) {
        //                     if (item[n] != params.query[n]) flag = false;
        //                     continue;
        //                 }
        //                 return flag;
        //             });
        //         }
        //         else {
        //             found = kerds.array.find(found.contents, item => {
        //                 let flag = true;
        //                 for (let n in params.query) {
        //                     if (item[n] != params.query[n]) flag = false;
        //                     continue;
        //                 }
        //                 return flag;
        //             });
        //         }
        //     }

        //     if (kerds.isset(params.projection)) {
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
        if (kerds.isset(params.query)) {
            if (kerds.isset(params.changeQuery)) {
                for (var i in params.changeQuery) {
                    if (kerds.isset(params.query[i])) {
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
            if (!kerds.isset(preparedData[i])) {

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
        let id = req.sessionId;
        if (kerds.isset(data.id)) {
            id = data.id;
        }
        kerds.sessionsManager.destroy(id).then(done => {
            this.respond(req, res, true);
        });
    }

    changeDp(req, res, data) {
        let userPath = `./users/${req.sessionId}`;
        let userImage = `./users/${req.sessionId}/dp.png`;

        let uploadImage = () => {
            fs.writeFile(userImage, data.newImage.value, c => {
                this.set(req, { collection: 'users', query: { _id: new ObjectId(global.sessions[req.sessionId].user) }, options: { '$set': { userImage: userImage } } }).then(result => {
                    this.respond(req, res, result == 1);

                    this.makeHistory(req, result == 1, { action: 'Change Profile Picture', data, collection: 'users', item: global.sessions[req.sessionId].user });

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
        this.set(req, { collection: 'users', query: { _id: new ObjectId(global.sessions[req.sessionId].user) }, options: { '$set': { userImage: null } } }).then(result => {
            kerds.deleteRecursive(`./users/${global.sessions[req.sessionId].user}/dp.png`, () => {
                this.respond(req, res, result == 1);
                this.makeHistory(req, result == 1, { action: 'Delete Profile Picture', data, collection: 'users', item: global.sessions[req.sessionId].user });
            });
        });
    }

    editProfile(req, res, data) {
        data.lastModified = new Date().getTime();
        this.set(req, { collection: 'users', query: { _id: new ObjectId(global.sessions[req.sessionId].user) }, options: { '$set': data } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Edit Profile', data, collection: 'users', item: global.sessions[req.sessionId].user });
        });
    }

    editUser(req, res, data) {
        let id = data._id;
        delete data._id;
        data.lastModified = new Date().getTime();
        this.set(req, { collection: 'users', query: { _id: new ObjectId(id) }, options: { '$set': data } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Edit User', data, item: 'users', item: id });
        });
    }

    changePassword(req, res, data) {
        global.sessions[req.sessionId].db.find({ collection: 'users', query: { _id: new ObjectId(global.sessions[req.sessionId].user) }, projection: { currentPassword: 1 } }).then(result => {
            if (!kerds.isnull(result)) {
                bcrypt.compare(data.currentPassword, result.currentPassword).then(valid => {
                    if (valid) {
                        bcrypt.hash(data.newPassword, 10).then(hash => {
                            data.newPassword = hash;
                            this.set(req, { collection: 'users', query: { _id: new ObjectId(global.sessions[req.sessionId].user) }, options: { '$set': { currentPassword: data.newPassword } } }).then(changed => {
                                this.respond(req, res, true);
                                this.makeHistory(req, true, { action: 'Change Password', data, collection: 'users', item: global.sessions[req.sessionId].user });
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
        let run = {};

        for (let i of data.newCats) {
            let name = i.trim();
            if (name != '') {
                run[i] = this.ifNotExist(req, { collection: 'categories', query: { name, parents: '', image: '' }, check: [{ name }], action: 'insert', getInserted: true });
            }
        }

        kerds.runParallel(run, insertCat => {
            for (let i in insertCat) {
                if (!kerds.isset(insertCat[i].found)) {
                    let id = insertCat[i][0]._id;
                    parents.push(id);

                    this.makeHistory(req, kerds.isset(insertCat[0]._id), { action: 'Create Category', data, collection: 'categories', item: insertCat[0]._id });
                }
            }

            for (let parent of parents) {
                if (parent != '') {
                    data.parents.push(parent);
                }
            }

            data.parents = data.parents.join(',');
            this.ifNotExist(req, { collection: 'categories', query: { name: data.name, parents: data.parents }, check: [{ name: data.name }], action: 'insert', getInserted: true }).then(result => {

                if (kerds.isset(result.found)) {
                    this.respond(req, res, result);
                }
                else if (kerds.isset(result[0]._id) && data.image != '') {
                    let categoriesPath = `./categories/${result[0]._id}`;
                    let image = `./categories/${result[0]._id}/image.png`;

                    let uploadImage = () => {
                        fs.writeFile(image, data.image.value, c => {
                            global.sessions[req.sessionId].db.update({ collection: 'categories', query: { _id: new ObjectId(result[0]._id) }, options: { '$set': { image } } }).then(uploaded => {
                                this.respond(req, res, uploaded == 1);
                                this.makeHistory(req, uploaded == 1, { action: 'Create Category', data, collection: 'categories', item: result[0]._id });
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
                    this.respond(req, res, kerds.isset(result[0]._id));
                    this.makeHistory(req, kerds.isset(result[0]._id), { action: 'Create Category', data, collection: 'categories', item: result[0]._id });
                }
            });
        });
    }

    deleteCategory(req, res, data) {
        this.recycle(req, { collection: 'categories', query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Delete Category', data, collection: 'categories', item: data.id });
            // global.sessions[req.sessionId].db.find({ collection: 'categories', query: {}, many: true, projection: { parents: 1 } }).then(categories => {
            //     for (let category of categories) {
            //         if (category.parents.includes(data.id)) {
            //             let newParents = [];
            //             for (let parent of category.parents.split(',')) {
            //                 if (parent != data.id) newParents.push(parent);
            //             }

            //             global.sessions[req.sessionId].db.update({ collection: 'categories', query: { _id: new ObjectId(category._id) }, options: { '$set': { parents: newParents.join(',') } } });
            //         }
            //     }
            // })
        });
    }

    deleteCategoryImage(req, res, data) {
        this.set(req, { collection: 'categories', query: { _id: new ObjectId(data.id) }, options: { '$set': { image: null } } }).then(result => {
            kerds.deleteRecursive(`./categories/${data.id}/image.png`, () => {
                this.respond(req, res, result == 1);
                this.makeHistory(req, result == 1, { action: 'Delete Category Image', data, collection: 'categories', item: data.id });
            });
        });
    }

    changeCategoryImage(req, res, data) {
        let categoriesPath = `./categories/${data.id}`;
        let image = `./categories/${data.id}/image.png`;

        let uploadImage = () => {
            fs.writeFile(image, data.newImage.value, c => {
                this.set(req, { collection: 'categories', query: { _id: new ObjectId(data.id) }, options: { '$set': { image } } }).then(result => {
                    this.respond(req, res, result == 1);
                    this.makeHistory(req, result == 1, { action: 'Change Category Image', data, collection: 'cateogories', item: data.id });

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
        data.newCats = data.newCats.trim().split(',');
        let parents = data.parents.trim().split(',');
        data.parents = [];
        let run = {};
        let _id = data.id;
        delete data.id;

        for (let i of data.newCats) {
            let name = i.trim();
            if (name != '') {
                run[i] = this.ifNotExist(req, { collection: 'categories', query: { name, parents: '', image: '' }, check: [{ name }], action: 'insert', getInserted: true });
            }
        }

        kerds.runParallel(run, insertCat => {
            for (let i in insertCat) {
                if (!kerds.isset(insertCat[i].found)) {
                    let id = insertCat[i][0]._id;
                    parents.push(id);
                    this.makeHistory(req, kerds.isset(insertCat[0]._id), { action: 'Create Category', data, collection: 'categories', item: insertCat[0]._id });
                }
            }

            for (let parent of parents) {
                if (parent != '') {
                    data.parents.push(parent);
                }
            }

            delete data.newCats;
            data.parents = data.parents.join(',');
            this.ifIExist(req, { collection: 'categories', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }] }).then(result => {
                this.respond(req, res, result);
                this.makeHistory(req, result == 1, { action: 'Edit Category', dat, collection: 'categories', item: _id });
            });
        });
    }

    createTag(req, res, data) {
        this.ifNotExist(req, { collection: 'tags', query: { name: data.name }, check: [{ name: data.name }], action: 'insert', getInserted: true }).then(result => {
            if (kerds.isset(result.found)) {
                this.respond(req, res, result);
            }
            else if (kerds.isset(result[0]._id) && data.image != '') {
                let tagsPath = `./tags/${result[0]._id}`;
                let image = `./tags/${result[0]._id}/image.png`;

                let uploadImage = () => {
                    fs.writeFile(image, data.image.value, c => {
                        global.sessions[req.sessionId].db.update({ collection: 'tags', query: { _id: new ObjectId(result[0]._id) }, options: { '$set': { image } } }).then(updated => {
                            this.respond(req, res, updated == 1);
                            this.makeHistory(req, updated == 1, { action: 'Create Tag', data, collection: 'tags', item: result[0]._id });
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
                this.respond(req, res, kerds.isset(result[0]._id));
            }
        });
    }

    deleteTagImage(req, res, data) {
        global.sessions[req.sessionId].db.update({ collection: 'tags', query: { _id: new ObjectId(data.id) }, options: { '$set': { image: null } } }).then(result => {
            kerds.deleteRecursive(`./tags/${data.id}/image.png`, () => {
                this.respond(req, res, result == 1);
                this.makeHistory(req, result == 1, { action: 'Delete Tag Image', data, collection: 'tags', item: data.id });
            });
        });
    }

    changeTagImage(req, res, data) {
        let tagsPath = `./tags/${data.id}`;
        let image = `./tags/${data.id}/image.png`;

        let uploadImage = () => {
            fs.writeFile(image, data.newImage.value, c => {
                global.sessions[req.sessionId].db.update({ collection: 'tags', query: { _id: new ObjectId(data.id) }, options: { '$set': { image } } }).then(result => {
                    this.respond(req, res, result == 1);
                    this.makeHistory(req, result == 1, { action: 'Change Tag Image', data, collection: 'tags', item: data.id });
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
        this.recycle(req, { collection: 'tags', query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Delete Tag', data, collection: 'tags', item: data.id });
        });
    }

    editTag(req, res, data) {
        let _id = data.id;
        delete data.id;
        this.ifIExist(req, { collection: 'tags', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }] }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(req, result == 1, { action: 'Edit Tag', data, collection: 'tags', item: _id });

        });
    }

    createItem(req, res, data) {
        data.newCats = data.newCats.trim().split(',');
        let categories = data.categories.trim().split(',');
        data.categories = [];
        let runCats = {};

        for (let i of data.newCats) {
            let name = i.trim();
            if (name != '') {
                runCats[i] = this.ifNotExist(req, { collection: 'categories', query: { name, parents: '', image: '' }, check: [{ name }], action: 'insert', getInserted: true });
            }
        }

        data.newTags = data.newTags.trim().split(',');
        let tags = data.tags.trim().split(',');
        data.tags = [];

        let runTags = {};

        for (let i of data.newTags) {
            let name = i.trim();
            if (name != '') {
                runTags[i] = this.ifNotExist(req, { collection: 'tags', query: { name, image: '' }, check: [{ name }], action: 'insert', getInserted: true });
            }
        }

        kerds.runParallel(runCats, resultCats => {
            for (let i in resultCats) {
                if (!kerds.isset(resultCats[i].found)) {
                    let id = resultCats[i][0]._id;
                    categories.push(id);

                    this.makeHistory(req, kerds.isset(id), { action: 'Create Category', data, collection: 'categories', item: id });
                }
            }

            for (let category of categories) {
                if (category != '') {
                    data.categories.push(category);
                }
            }

            data.categories = data.categories.join(',');

            kerds.runParallel(runTags, resultTags => {
                for (let i in resultTags) {
                    if (!kerds.isset(resultTags[i].found)) {
                        let id = resultTags[i][0]._id;
                        tags.push(id);

                        this.makeHistory(req, kerds.isset(id), { action: 'Create Tag', data, collection: 'tags', item: id });
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

                this.ifNotExist(req, { collection: 'items', query: data, check: [{ name: data.name }, { code: data.code }], action: 'insert', getInserted: true }).then(result => {

                    if (kerds.isset(result.found)) {
                        this.respond(req, res, result);
                    }
                    else if (kerds.isset(result[0]._id) && image != '') {
                        let itemPath = `./items/${result[0]._id}`;
                        let imagePath = `./items/${result[0]._id}/image.png`;

                        let uploadImage = () => {
                            fs.writeFile(imagePath, image.value, c => {
                                this.set(req, { collection: 'items', query: { _id: new ObjectId(result[0]._id) }, options: { '$set': { image: imagePath } } }).then(result => {
                                    this.respond(req, res, result == 1);
                                    this.makeHistory(req, result == 1, { action: 'Create Item', data, collection: 'items', item: result[0]._id });
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
                        this.respond(req, res, kerds.isset(result[0]._id));
                    }
                });
            });
        });
    }

    deleteItem(req, res, data) {
        this.recycle(req, { collection: 'items', query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Delete Item', data, collection: 'items', item: data.id });
        });
    }

    deleteItemImage(req, res, data) {
        global.sessions[req.sessionId].db.update({ collection: 'items', query: { _id: new ObjectId(data.id) }, options: { '$set': { image: null } } }).then(result => {
            kerds.deleteRecursive(`./items/${data.id}/image.png`, () => {
                this.respond(req, res, result == 1);
                this.makeHistory(req, result == 1, { action: 'Delete Item Image', data, collection: 'items', item: data.id });
            });
        });
    }

    changeItemImage(req, res, data) {
        let itemsPath = `./items/${data.id}`;
        let image = `./items/${data.id}/image.png`;

        let uploadImage = () => {
            fs.writeFile(image, data.newImage.value, c => {
                global.sessions[req.sessionId].db.update({ collection: 'items', query: { _id: new ObjectId(data.id) }, options: { '$set': { image } } }).then(result => {
                    this.respond(req, res, result == 1);
                    this.makeHistory(req, result == 1, { action: 'Change Item Image', data, collection: 'items', item: data.id });
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
        data.newCats = data.newCats.trim().split(',');
        let categories = data.categories.trim().split(',');
        data.categories = [];
        let runCats = {};

        for (let i of data.newCats) {
            let name = i.trim();
            if (name != '') {
                runCats[i] = this.ifNotExist(req, { collection: 'categories', query: { name, parents: '', image: '' }, check: [{ name }], action: 'insert', getInserted: true });
            }
        }

        data.newTags = data.newTags.trim().split(',');
        let tags = data.tags.trim().split(',');
        data.tags = [];

        let runTags = {};

        for (let i of data.newTags) {
            let name = i.trim();
            if (name != '') {
                runTags[i] = this.ifNotExist(req, { collection: 'tags', query: { name, image: '' }, check: [{ name }], action: 'insert', getInserted: true });
            }
        }

        kerds.runParallel(runCats, resultCats => {
            for (let i in resultCats) {
                if (!kerds.isset(resultCats[i].found)) {
                    let id = resultCats[i][0]._id;
                    categories.push(id);

                    this.makeHistory(req, kerds.isset(resultCats[0]._id), { action: 'Create Category', data, collection: 'categories', item: resultCats[0]._id });
                }
            }

            for (let category of categories) {
                if (category != '') {
                    data.categories.push(category);
                }
            }

            data.categories = data.categories.join(',');

            kerds.runParallel(runTags, resultTags => {
                for (let i in resultTags) {
                    if (!kerds.isset(resultTags[i].found)) {
                        let id = resultTags[i][0]._id;
                        tags.push(id);

                        this.makeHistory(req, kerds.isset(resultTags[0]._id), { action: 'Create Tag', data, collection: 'categories', item: resultTags[0]._id });
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

                let _id = data.id;
                delete data.id;
                this.ifIExist(req, { collection: 'items', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }, { query: { name: data.code }, against: { _id } }] }).then(result => {
                    this.respond(req, res, result);
                    this.makeHistory(req, result == 1, { action: 'Edit Item', data, collection: 'items', item: _id });
                });
            });
        });
    }

    createCustomForm(req, res, data) {
        data.contents = JSON.parse(data.contents);
        data.tasks = JSON.parse(data.tasks);

        this.ifNotExist(req, { collection: 'customforms', query: data, check: [{ name: data.name }], action: 'insert', getInserted: true }).then(result => {
            if (kerds.isset(result.found)) {
                this.respond(req, res, result);
            }
            else {
                this.respond(req, res, kerds.isset(result[0]._id));
                this.makeHistory(req, kerds.isset(result[0]._id), { action: 'Create Custom Form', data, collection: 'customforms', item: result[0]._id });
            }
        });
    }

    editCustomForm(req, res, data) {
        let _id = data.id;
        delete data.id;
        data.contents = JSON.parse(data.contents);
        data.tasks = JSON.parse(data.tasks);

        this.ifIExist(req, { collection: 'customforms', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }] }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(req, result == 1, { action: 'Edit Custom Form', data, collection: 'customforms', item: _id });

            if (result == 1) {
                global.sessions[req.sessionId].db.find({ collection: 'customforms', query: { _id: new ObjectId(_id) } }).then(customForm => {
                    this.set(req, { collection: 'forms', query: { 'selectedForm._id': _id }, options: { '$set': { selectedForm: customForm } }, many: true }).then(result => {
                        console.log(result);
                    });
                });
            }
        });
    }

    deleteCustomForm(req, res, data) {
        this.recycle(req, { collection: 'customforms', query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Delete Custom Form', data, collection: 'customforms', item: data.id });
        });
    }

    createList(req, res, data) {
        data.author = global.sessions[req.sessionId].user;
        data.time = new Date().getTime();
        data.contents = JSON.parse(data.contents);

        this.ifNotExist(req, { collection: 'lists', query: data, check: [{ name: data.name }], action: 'insert', getInserted: true }).then(result => {

            if (kerds.isset(result.found)) {
                this.respond(req, res, result);
            }
            else {
                this.respond(req, res, kerds.isset(result[0]._id));
                this.makeHistory(req, kerds.isset(result[0]._id), { action: 'Create List', data, collection: 'lists', item: result[0]._id });
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

        global.sessions[req.sessionId].db.find({ collection: 'lists', query: { _id: new ObjectId(data.id) }, }).then(list => {
            let contents = list.contents;

            let ids = kerds.object.valueOfObjectArray(contents, '_id');
            let id = kerds.generateRandom(24);
            while (ids.includes(id)) {
                id = kerds.generateRandom(24);
            }

            content._id = id;
            this.update(req, { collection: 'lists', query: { _id: new ObjectId(data.id) }, options: { '$push': { contents: content } } }).then(result => {
                this.respond(req, res, result == 1);
                this.makeHistory(req, result == 1, { action: 'Create List Item', data, item: content._id, collection: `lists.${data.id}` });
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

        this.update(req, { collection: 'lists', query: { _id: new ObjectId(data.id), 'contents._id': data.item._id }, options: { '$set': { 'contents.$': content } } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Edit List Item', data, collection: `lists.${data.id}`, item: content._id });
        });
    }

    deleteListItem(req, res, data) {
        this.update(req, { collection: 'lists', query: { _id: new ObjectId(data.id) }, options: { '$pull': { contents: { _id: data.row } } } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Delete List Item', data, collection: `lists.${data.id}`, item: data.row });
        });
    }

    deleteList(req, res, data) {
        this.recycle(req, { collection: 'lists', query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Delete List', data, collection: 'lists', item: data.id });
        });
    }

    editList(req, res, data) {
        let _id = data.id;
        delete data.id;
        data.lastModified = new Date().getTime();
        this.ifIExist(req, { collection: 'lists', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }] }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(req, result == 1, { action: 'Edit List', data, collection: 'lists', item: _id });
        });
    }

    getSourcesNames(req, res, data) {
        let collections = {};
        global.sessions[req.sessionId].db.getCollections().then(result => {//Get all collections name
            let run = {};
            for (let i = 0; i < result.length; i++) {
                if (result[i].name.toLowerCase() == 'sessions') {
                    continue;
                }

                run[result[i].name] = global.sessions[req.sessionId].db.find({ collection: result[i].name, query: {}, many: true });//get each collection's content
            }

            kerds.runParallel(run, found => {
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

        global.sessions[req.sessionId].db.find({ collection, query: {}, many: true }).then(result => {
            for (let i = 0; i < result.length; i++) {
                if (kerds.isset(item)) {
                    let list = kerds.array.find(result, single => {
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
        global.sessions[req.sessionId].db.getCollections().then(result => {//Get all collections name
            let run = {};
            for (let i = 0; i < result.length; i++) {
                if (result[i].name.toLowerCase() == 'sessions') {
                    continue;
                }

                run[result[i].name] = global.sessions[req.sessionId].db.find({ collection: result[i].name, query: {}, many: true });//get each collection's content
            }

            kerds.runParallel(run, found => {
                if (kerds.isset(found.users)) {
                    for (let user of found.users) {
                        delete user.currentPassword;
                    }
                }

                this.respond(req, res, found);
            });
        });
    }

    performTasks(tasks, selectedForm, callback) {
        let target = kerds.inBetween(selectedForm.target, '$#&{', '}&#$');//get the forms target
        try {
            target = JSON.parse(target).collection;
        } catch (error) {
            callback(-1);
            return;
        }
        let run = {};
        let customT;

        for (let name in tasks) {
            customT = kerds.array.find(selectedForm.tasks, t => {//get the tasks sample
                return t.name == name;
            });

            for (let i = 0; i < tasks[name].length; i++) {
                let update = {};
                update[customT.target] = { action: customT.action, value: tasks[name][i].value };
                run[`${name}.${i}`] = global.sessions[req.sessionId].db.modify({ collection: target, query: { _id: new ObjectId(tasks[name][i]._id) }, update });//make the update
            }
        }

        kerds.runParallel(run, result => {
            for (let name in result) {
                let [taskName, position] = name.split('.');

                customT = kerds.array.find(selectedForm.tasks, t => {
                    return t.name == taskName;
                });

                tasks[taskName][position].previous = result[name][customT.target];
            }
            callback(tasks);
        });
    }

    revertTasks(tasks, selectedForm, callback) {
        let target = kerds.inBetween(selectedForm.target, '$#&{', '}&#$');
        try {
            target = JSON.parse(target).collection;
        } catch (error) {
            callback(-1);
            return;
        }
        let run = {};
        let customT;
        for (let name in tasks) {
            customT = kerds.array.find(selectedForm.tasks, t => {
                return t.name == name;
            });

            for (let i = 0; i < tasks[name].length; i++) {
                let update = {};
                update[customT.target] = { action: 'Set', value: tasks[name][i].previous };
                run[`${name}.${i}`] = global.sessions[req.sessionId].db.modify({ collection: target, query: { _id: new ObjectId(tasks[name][i]._id) }, update });
            }
        }

        kerds.runParallel(run, result => {
            for (let name in result) {
                let [taskName, position] = name.split('.');

                customT = kerds.array.find(selectedForm.tasks, t => {
                    return t.name == taskName;
                });

                tasks[taskName][position].value = result[name][customT.target];
            }
            callback(tasks);
        });
    }

    createForm(req, res, data) {
        data.author = global.sessions[req.sessionId].user;
        data.time = new Date().getTime();
        data.contents = JSON.parse(data.contents);
        data.selectedForm = JSON.parse(data.selectedForm);
        data.tasks = JSON.parse(data.tasks);

        this.performTasks(data.tasks, data.selectedForm, tasks => {
            if (tasks != -1) {
                data.tasks = tasks;
                this.makeHistory(req, tasks != - 1, { action: 'Perform Tasks', tasks });
            }
            this.insert(req, { collection: 'forms', query: data, getInserted: true }).then(result => {
                this.respond(req, res, result);
                this.makeHistory(req, result == 1, { action: 'Create Form', data, collection: 'forms', item: result[0]._id });
            });
        });
    }

    deleteForm(req, res, data) {
        global.sessions[req.sessionId].db.find({ collection: 'forms', query: { _id: new ObjectId(data.id) }, projection: { type: 1, tasks: 1, _id: 0 } }).then(form => {
            this.revertTasks(form.tasks, form.type, (tasks) => {
                this.makeHistory(req, tasks != - 1, { action: 'Revert Tasks', tasks });
                global.sessions[req.sessionId].db.delete({ collection: 'forms', query: { _id: new ObjectId(data.id) } }).then(result => {
                    this.respond(req, res, result.result.ok == 1);
                    this.makeHistory(req, result.result.ok == 1, { action: 'Delete Form', data, collection: 'forms', item: data.id })
                });
            });
        });
    }

    editForm(req, res, data) {
        data.time = new Date().getTime();
        data.contents = JSON.parse(data.contents);
        data.selectedForm = JSON.parse(data.selectedForm);
        data.tasks = JSON.parse(data.tasks);
        let id = data.id;
        delete data.id;
        data.lastModified = new Date().getTime();
        global.sessions[req.sessionId].db.find({ collection: 'forms', query: { _id: new ObjectId(id) }, projection: { type: 1, tasks: 1, _id: 0 } }).then(form => {
            this.revertTasks(form.tasks, data.selectedForm, (reverted) => {
                this.makeHistory(req, reverted != - 1, { action: 'Perform Tasks', reverted });
                this.performTasks(data.tasks, data.selectedForm, performed => {
                    this.makeHistory(req, performed != - 1, { action: 'Perform Tasks', performed });
                    this.set(req, {
                        collection: 'forms', query: { _id: new ObjectId(id) }, options: {
                            '$set': data
                        }
                    }).then(result => {
                        this.respond(req, res, result);
                        this.makeHistory(req, result == 1, { action: 'Update From', data, collection: 'forms', item: id });
                    });
                });
            });
        });
    }

    saveView(req, res, data) {
        data.view = JSON.parse(data.view);
        data.owner = global.sessions[req.sessionId].user;
        global.sessions[req.sessionId].db.save({ collection: 'views', query: data, check: { owner: global.sessions[req.sessionId].user } }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(req, result == 1, { action: 'Save View', data, collection: 'views', item: data.owner });
        });
    }

    createReportGenerator(req, res, data) {
        data.contents = JSON.parse(data.contents);

        this.ifNotExist(req, { collection: 'reportgenerators', query: data, check: [{ name: data.name }], action: 'insert', getInserted: true }).then(result => {
            if (kerds.isset(result.found)) {
                this.respond(req, res, result);
            }
            else {
                this.respond(req, res, kerds.isset(result[0]._id));
                this.makeHistory(req, kerds.isset(result[0]._id), { action: 'Create Report Generator', data, collection: 'reportgenerators', item: result[0]._id });
            }
        });
    }

    editReportGenerator(req, res, data) {
        let _id = data.id;
        delete data.id;
        data.contents = JSON.parse(data.contents);
        data.lastModified = new Date().getTime();
        this.ifIExist(req, { collection: 'reportgenerators', query: { _id: new ObjectId(_id) }, options: { '$set': data }, action: 'update', check: [{ query: { name: data.name }, against: { _id } }] }).then(result => {
            this.respond(req, res, result);
            this.makeHistory(req, result == 1, { action: 'Edit Report Generator', data, collection: 'reportgenerators', item: _id });
        });
    }

    deleteReportGenerator(req, res, data) {
        this.recycle(req, { collection: 'reportgenerators', query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Delete Report Generator', data, collection: 'reportgenerators', item: data.id });
        });
    }

    createReport(req, res, data) {
        data.content = JSON.parse(data.content);
        data.author = global.sessions[req.sessionId].user;
        this.insert(req, { collection: 'reports', query: data, getInserted: true }).then(result => {
            this.respond(req, res, kerds.isset(result[0]._id));
            this.makeHistory(req, kerds.isset(result[0]._id), { action: 'Create Report', data, collection: 'reports', item: result[0]._id });
        });
    }

    editReport(req, res, data) {
        data.content = JSON.parse(data.content);

        this.set(req, { collection: 'reports', query: { _id: new ObjectId(data.id) }, options: { '$set': { content: data.content } } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Edit Report', data, collection: 'reports', item: data.id });
        });
    }

    deleteReport(req, res, data) {
        this.recycle(req, { collection: 'reports', query: { _id: new ObjectId(data.id) } }).then(result => {
            this.respond(req, res, result == 1);
            this.makeHistory(req, result == 1, { action: 'Delete Report', data, collection: 'reports', item: data.id });
        });
    }

    search(req, res, data) {
        let found = { items: [], users: [], categories: [], tags: [], lists: [] };
        let query = data.query.toLowerCase();

        kerds.runParallel({
            items: global.sessions[req.sessionId].db.find({ collection: 'items', query: {}, many: true }),
            categories: global.sessions[req.sessionId].db.find({ collection: 'categories', query: {}, many: true }),
            tags: global.sessions[req.sessionId].db.find({ collection: 'tags', query: {}, many: true }),
            users: global.sessions[req.sessionId].db.find({ collection: 'users', query: {}, many: true }),
            lists: global.sessions[req.sessionId].db.find({ collection: 'lists', query: {}, many: true }),
        }, result => {
            return new Promise((resolve, reject) => {
                for (let collection in result) {
                    for (let item of result[collection]) {
                        if (JSON.stringify(item).toLowerCase().includes(query)) {
                            if (collection == 'users') {
                                found[collection].push({ _id: item._id, name: item.userName, image: item.userImage });
                            }
                            else if (collection == 'items') {
                                found[collection].push({ _id: item._id, name: item.name, image: item.image });
                            }
                            else if (collection == 'categories') {
                                found[collection].push({ _id: item._id, name: item.name, image: item.image });
                            }
                            else if (collection == 'tags') {
                                found[collection].push({ _id: item._id, name: item.name, image: item.image });
                            }
                            else if (collection == 'list') {
                                found[collection].push({ _id: item._id, name: item.name });
                            }
                        }
                    }
                }
                this.respond(req, res, found);
                resolve(found);
            });
        });
    }

    notify(req, params) {
        params.time = new Date().getTime();
        params.read = {};
        params.sent = {};

        global.sessions[req.sessionId].db.insert({ collection: 'notifications', query: params });
    }

    getNotifications(req, res, data) {
        let notifications = [];
        let user = data.id || global.sessions[req.sessionId].user;
        global.sessions[req.sessionId].db.find({ collection: 'notifications', query: {}, many: true }).then(found => {
            for (let i = 0; i < found.length; i++) {
                if (found[i].users.includes(user)) {
                    found[i].status = kerds.isset(found[i].read[user]) ? 'Read' : 'UnRead';
                    found[i].delivered = kerds.isset(found[i].sent[user]);
                    delete found[i].read;
                    delete found[i].sent;
                    if (data.flag == 'unsent') {
                        if (!found[i].delivered) {
                            notifications.push(found[i]);
                        }
                    }
                    else if (data.flag == 'unread') {
                        if (found[i].status == 'UnRead') {
                            notifications.push(found[i]);
                        }
                    }
                    else {
                        notifications.push(found[i]);
                    }
                }
            }
            this.respond(req, res, notifications);
        });
    }

    sentNotification(req, res, data) {
        data.id = new ObjectId(data.id);
        global.sessions[req.sessionId].db.find({ collection: 'notifications', query: { _id: data.id }, projection: { sent: 1, _id: 0 } }).then(note => {
            note.sent[global.sessions[req.sessionId].user] = new Date().getTime();
            this.set(req, { collection: 'notifications', query: { _id: data.id }, options: { '$set': { sent: note.sent } } }).then(read => {
                this.respond(req, res, read == 1);
            });
        });
    }

    readNotification(req, res, data) {
        data.id = new ObjectId(data.id);
        global.sessions[req.sessionId].db.find({ collection: 'notifications', query: { _id: data.id }, projection: { read: 1, _id: 0 } }).then(note => {
            note.read[global.sessions[req.sessionId].user] = new Date().getTime();
            this.set(req, { collection: 'notifications', query: { _id: data.id }, options: { '$set': { read: note.read } } }).then(read => {
                this.respond(req, res, read == 1);
            });
        });
    }
}

module.exports = { PostHandler };