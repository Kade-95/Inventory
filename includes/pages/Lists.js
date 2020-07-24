let lists = (mainBody) => {
    let settingsMainWindow = mainBody.find('#settings-main-window');
    let loading = perceptor.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });
    let urlVars = perceptor.urlSplitter(location.href).vars;

    let addRow = (list, callback) => {
        let names = [];
        let contents = {};
        
        for (let row of list.contents) {
            for (let name in row) {
                if (!names.includes[name] && name != '_id') {
                    names.push(name);
                    contents[name] = { element: 'input', attributes: { id: name, name }, label: perceptor.createElement({ element: 'label', attributes: { class: 'perceptor-form-label' }, text: name, children: [{ element: 'i', attributes: { class: 'fas fa-trash', id: 'delete' } }] }).innerHTML }
                }
            }
        }

        let addForm = perceptor.createForm({
            title: 'Add Row', contents, attributes: { style: {}, class: 'form' }, columns: 2, buttons: {
                controls: {
                    element: 'span', attributes: { style: { padding: '1em' } }, children: [
                        { element: 'i', attributes: { class: 'fas fa-plus', id: 'add-data' } }
                    ]
                },
                submit: { element: 'button', text: 'Add', attributes: { id: 'submit' } }
            }
        });

        makeRow(addForm, data => {
            system.connect({ data: { action: 'insertIntoList', id: list._id, new: JSON.stringify(data) } }).then(inserted => {
                if (inserted == true) {
                    system.notify({ note: 'Row inserted' });
                    system.reload();
                }
                else {
                    system.notify({ note: 'Row was not inserted' });
                }
            });
        });
    }

    let editRow = (list, id) => {
        let me = perceptor.array.find(list.contents, r => {
            return r._id == id;
        });        

        let names = [];
        let contents = {};
        for (let row of list.contents) {
            for (let name in row) {
                if (name == '_id') continue;
                if (!names.includes[name]) {
                    names.push(name);

                    contents[name] = { element: 'input', attributes: { id: name, name, value: me[name]|| '' }, label: perceptor.createElement({ element: 'label', attributes: { class: 'perceptor-form-label' }, text: name, children: [{ element: 'i', attributes: { class: 'fas fa-trash', id: 'delete' } }] }).innerHTML }
                }
            }
        }

        let editForm = perceptor.createForm({
            title: 'Edit Row', contents, attributes: { style: {}, class: 'form' }, columns: 2, buttons: {
                controls: {
                    element: 'span', attributes: { style: { padding: '1em' } }, children: [
                        { element: 'i', attributes: { class: 'fas fa-plus', id: 'add-data' } }
                    ]
                },
                submit: { element: 'button', text: 'Edit', attributes: { id: 'submit' } }
            }
        });

        makeRow(editForm, item => {
            item._id = id;            
            item = JSON.stringify(item);
            
            let data = { action: 'editListItem', id: urlVars.id, item }
            system.connect({ data }).then(editted => {
                if (editted == true) {
                    system.notify({ note: 'Row Editted' });
                    system.reload();
                }
                else {
                    system.notify({ note: 'Row was not editted' });
                }
            })
        });
    }

    let cloneRow = (list, id) => {
        let me = perceptor.array.find(list.contents, r => {
            return r._id == id;
        });        

        let names = [];
        let contents = {};
        for (let row of list.contents) {
            for (let name in row) {
                if (name == '_id') continue;
                if (!names.includes[name]) {
                    names.push(name);

                    contents[name] = { element: 'input', attributes: { id: name, name, value: me[name] || '' }, label: perceptor.createElement({ element: 'label', attributes: { class: 'perceptor-form-label' }, text: name, children: [{ element: 'i', attributes: { class: 'fas fa-trash', id: 'delete' } }] }).innerHTML }
                }
            }
        }
        let cloneForm = perceptor.createForm({
            title: 'Clone Row', contents, attributes: { style: {}, class: 'form' }, columns: 2, buttons: {
                controls: {
                    element: 'span', attributes: { style: { padding: '1em' } }, children: [
                        { element: 'i', attributes: { class: 'fas fa-plus', id: 'add-data' } }
                    ]
                },
                submit: { element: 'button', text: 'Clone', attributes: { id: 'submit' } }
            }
        });

        makeRow(cloneForm, data => {
            system.connect({ data: { action: 'insertIntoList', id: list._id, new: JSON.stringify(data) } }).then(inserted => {
                if (inserted == true) {
                    system.notify({ note: 'Row Cloned' });
                    system.reload();
                }
                else {
                    system.notify({ note: 'Row was not cloned' });
                }
            });
        });
    }

    let deleteRow = (list, id) => {
        let data = { action: 'deleteListItem', id: list._id, row: id };
        system.connect({ data }).then(deleted => {
            if (deleted == true) {
                system.notify({ note: 'Row deleted' });
                system.reload();
            }
            else {
                system.notify({ note: 'Row was not deleted' });
            }
        })
    }

    let makeRow = (form, callback) => {
        let popUp = perceptor.popUp(form);

        form.find('#add-data').addEventListener('click', event => {
            addData(Object.keys(perceptor.jsonForm(form)), name => {
                form.find('.perceptor-form-contents').makeElement({
                    element: 'div', attributes: { class: 'perceptor-form-single-content' }, children: [
                        { element: 'label', attributes: { class: 'perceptor-form-label' }, text: name, children: [{ element: 'i', attributes: { class: 'fas fa-trash', id: 'delete' } }] },
                        { element: 'input', attributes: { class: 'perceptor-form-data', name, id: name } }
                    ]
                });
            });
        });

        form.addEventListener('click', event => {
            let target = event.target;
            if (target.id == 'delete') {
                target.getParents('.perceptor-form-single-content').remove();
            }
        });

        form.addEventListener('submit', event => {
            event.preventDefault();
            let data = perceptor.jsonForm(form);
            if (Object.keys(data).length == 0) {
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Row must contain some data` });
            }
            else {
                callback(data);
                popUp.remove();
            }
        });
    }

    let addData = (contents, callback) => {
        let addDataForm = perceptor.createForm({
            title: 'Add Data Form', attributes: { class: 'form' },
            contents: {
                name: { element: 'input', attributes: { name: 'name', id: 'name' } }
            },
            buttons: { submit: { element: 'button', text: 'Add Content' } }
        });

        let popUp = perceptor.popUp(addDataForm);

        addDataForm.addEventListener('submit', event => {
            event.preventDefault();
            let name = addDataForm.find('#name').value;

            let formValidation = perceptor.validateForm(addDataForm);

            if (!formValidation.flag) {
                addDataForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            if (contents.includes(name)) {
                addDataForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Name is already in use` });
            }
            else {
                popUp.remove();
                callback(name);
            }
        });
    }

    let show = () => {
        let id = urlVars.id;
        let run = {
            me: system.get({ collection: 'lists', query: { _id: id }, changeQuery: { _id: 'objectid' } }),
            all: system.get({ collection: 'lists', query: {}, options: { projection: { name: 1 } }, many: true })
        };

        perceptor.runParallel(run, result => {
            settingsMainWindow.makeElement([
                {
                    element: 'div', attributes: { id: 'list-details' }, children: [
                        {
                            element: 'span', attributes: { id: 'list-name' }, children: [
                                { element: 'i', attributes: { class: 'icon fas fa-angle-double-left', id: 'toggle-list-side-bar' } },
                                { element: 'h2', attributes: { id: 'list-name-text' }, text: result.me.name },
                                {
                                    element: 'span', attributes: { id: 'list-controls' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-plus', id: 'add-list', title: 'Add' } },
                                        { element: 'i', attributes: { class: 'icon fas fa-pen', id: 'edit-list', title: 'Edit' } },
                                        { element: 'i', attributes: { class: 'icon fas fa-clone', id: 'clone-list', title: 'Clone' } },
                                        { element: 'i', attributes: { class: 'icon fas fa-trash', title: 'Delete', id: 'delete-list' } },
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    element: 'div', attributes: { id: 'show-list-container' }, children: [
                        {
                            element: 'div', attributes: { id: 'all-lists' }, children: [
                                { element: 'p', attributes: { id: 'title' }, text: 'All Lists' },
                                { element: 'div', attributes: { id: 'container' } }
                            ]
                        },
                        { element: 'div', attributes: { id: 'list-contents' } }
                    ]
                }
            ]);

            let listTable = perceptor.createTable({
                contents: result.me.contents, search: true, sort: true
            });

            perceptor.listenTable({ options: ['edit', 'clone', 'delete'], table: listTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.perceptor-table-column-cell').dataset;
                    let table = target.getParents('.perceptor-table');
                    let id = table.find(`.perceptor-table-column[data-name="_id"]`).find(`.perceptor-table-column-cell[data-row="${row}"]`).dataset.value;

                    if (target.id == 'perceptor-table-option-edit') {
                        editRow(result.me, id);
                    }
                    else if (target.id == 'perceptor-table-option-clone') {
                        cloneRow(result.me, id);
                    }
                    else if (target.id == 'perceptor-table-option-delete') {
                        deleteRow(result.me, id);
                    }
                }
            });

            settingsMainWindow.find('#list-contents').render(listTable);

            let panel = settingsMainWindow.find('#all-lists #container');
            for (let list of result.all) {
                panel.makeElement({
                    element: 'span', attributes: { class: 'a-list' }, children: [
                        { element: 'a', attributes: { href: 'settings.html?page=lists&action=show&id=' + list._id }, text: list.name },
                        { element: 'i', attributes: { class: 'icon fas fa-trash', title: 'Delete', 'data-id': list._id, id: 'delete-a-list' } },
                    ]
                });
            }

            settingsMainWindow.find('#add-list').addEventListener('click', event => {
                addRow(result.me);
            });

            settingsMainWindow.find('#edit-list').addEventListener('click', event => {
                edit(result.me);
            });

            settingsMainWindow.find('#clone-list').addEventListener('click', event => {
                clone(id);
            });

            settingsMainWindow.find('#delete-list').addEventListener('click', event => {
                _delete(id);
            });

            settingsMainWindow.addEventListener('click', event => {
                if (event.target.id == 'delete-a-list') {
                    _delete(event.target.dataset.id);
                }
            })
        });
    }

    let clone = (id) => {
        system.get({ collection: 'lists', query: { _id: id }, options: { projection: { image: 0 } }, changeQuery: { _id: 'objectid' } }).then(list => {
            let cloneForm = perceptor.createForm({
                title: 'Clone List', attributes: { enctype: 'multipart/form-data', id: 'clone-list-form', class: 'form' },
                contents: {
                    name: { element: 'input', attributes: { id: 'name', name: 'name', value: list.name } },
                },
                buttons: {
                    submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone', state: { name: 'submit', owner: '#clone-list-form' } },
                }
            });

            let popUp = perceptor.popUp(cloneForm);

            make(cloneForm, list);
        });
    }

    let edit = (list) => {
        let editForm = perceptor.createForm({
            title: 'Edit List', attributes: { enctype: 'multipart/form-data', id: 'edit-list-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: list.name } },
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit', state: { name: 'submit', owner: '#edit-list-form' } },
            }
        });

        let popUp = perceptor.popUp(editForm);

        editForm.addEventListener('submit', event => {
            event.preventDefault();
            let data = perceptor.jsonForm(editForm);
            data.action = 'editList';
            data.id = list._id;

            let formValidation = perceptor.validateForm(editForm);

            if (!formValidation.flag) {
                loading.replaceWith(editForm.getState({ name: 'submit' }));
                editForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            system.connect({ data }).then(result => {
                if (result == 1) {
                    system.notify({ note: 'List Editted' });
                    system.reload();
                }
                else if (result.found == 'name') {
                    system.notify({ note: 'List already in exists' });
                }
                else {
                    system.notify({ note: 'List was not editted' });
                }
            });
        });

    }

    let create = () => {
        let createForm = perceptor.createForm({
            title: 'Create List', attributes: { enctype: 'multipart/form-data', id: 'create-list-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name' } },
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create', state: { name: 'submit', owner: '#create-list-form' } },
            }
        });

        let popUp = perceptor.popUp(createForm);

        make(createForm);
    }

    let _delete = (id) => {
        if (confirm('This list will be deleted')) {
            system.connect({ data: { action: 'deleteList', id } }).then(result => {
                if (result == true) {
                    system.notify({ note: 'List was deleted' });
                    if (location.href.includes(id)) {
                        system.redirect(location.origin + '/settings.html?page=lists');
                    }
                    else {
                        system.reload();
                    }
                }
                else {
                    system.notify({ note: 'List was not deleted' });
                }
            });
        }
    }

    let make = (form, list) => {
        form.addEventListener('submit', event => {
            event.preventDefault();
            let data = perceptor.jsonForm(form);
            data.action = 'createList';
            data.contents = [];
            if (perceptor.isset(list)) {
                data.contents = list.contents;
            }
            data.contents = JSON.stringify(data.contents);
            let formValidation = perceptor.validateForm(form);

            if (!formValidation.flag) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            system.connect({ data }).then(result => {
                if (result == 1) {
                    system.notify({ note: 'List Created' });
                    system.reload();
                }
                else if (result.found == 'name') {
                    system.notify({ note: 'List already in exists' });
                }
                else {
                    system.notify({ note: 'List was not Created' });
                }
            });
        });

    }

    if (!perceptor.isset(urlVars.action) || urlVars.action == 'view') {
        settingsMainWindow.makeElement([
            {
                element: 'div', attributes: { class: 'settings-sub-menu' }, children: [
                    { element: 'i', attributes: { class: 'fas fa-plus', id: 'new-icon', title: 'Create List' } }
                ]
            },
            {
                element: 'div', attributes: { class: 'settings-content-window' }
            }
        ]);
        let mainContentWindow = settingsMainWindow.find('.settings-content-window');

        system.get({ collection: 'lists', query: {}, options: { projection: { name: 1 } }, many: true }).then(tags => {

            let listsTable = perceptor.createTable({
                title: 'All Lists', contents: tags, search: true, sort: true
            });

            mainContentWindow.render(listsTable);
            perceptor.listenTable({ options: ['view', 'clone', 'delete'], table: listsTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.perceptor-table-column-cell').dataset;
                    let table = target.getParents('.perceptor-table');
                    let id = table.find(`.perceptor-table-column[data-name="_id"]`).find(`.perceptor-table-column-cell[data-row="${row}"]`).dataset.value;

                    if (target.id == 'perceptor-table-option-view') {
                        system.redirect('settings.html?page=lists&action=show&id=' + id);
                    }
                    else if (target.id == 'perceptor-table-option-clone') {
                        clone(id);
                    }
                    else if (target.id == 'perceptor-table-option-delete') {
                        _delete(id);
                    }
                }
            });

            settingsMainWindow.find('#new-icon').addEventListener('click', event => {
                create();
            });
        });
    }
    else if (urlVars.action == 'show') {
        show();
    }
    else if (urlVars.action == 'clone') {
        clone();
    }
    else if (urlVars.action == 'delete') {
        _delete();
    }
}

export { lists };