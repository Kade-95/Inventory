class Forms {
    constructor() {
        this.url;
    }

    display() {
        let main = document.body.find('#main-window');
        let mainBody = main.find('#main-container-body');

        mainBody.render([
            {
                element: 'div', attributes: { id: 'main-container-body-main-actions' }, children: [
                    { element: 'a', attributes: { class: 'icon fas fa-plus', id: 'new-icon', title: 'Create Form', href: 'forms.html?page=create' } },
                    { element: 'span', attributes: { id: 'more-forms-controls' } }
                ]
            },
            {
                element: 'div', attributes: { id: 'main-container-body-main-window' }
            }
        ]);

        this.url = kerdx.urlSplitter(location.href);
        let page = this.url.vars.page;
        if (!Object.values(this.url.vars).length) {
            this.view(mainBody.find('#main-container-body-main-window'));
        }
        else if (kerdx.isset(this[page])) {
            this[page](mainBody.find('#main-container-body-main-window'));
        }
        else {
            system.display404(mainBody.find('#main-container-body-main-window'));
        }
    }

    view(container) {
        let fetch = { customForms: system.get({ collection: 'customforms', query: {}, many: true }), forms: system.get({ collection: 'forms', query: {}, many: true }) };

        kerdx.runParallel(fetch, result => {
            let run = {};
            let types = [];

            result.customForms = kerdx.array.findAll(result.customForms, item => {
                return item.recycled == undefined || item.recycled == false;
            });

            for (let form of result.forms) {
                form.time = new Date(Math.floor(form.time)).toLocaleDateString();

                run[form.author] = system.get({ collection: 'users', query: { _id: form.author }, options: { projection: { userName: 1, _id: 0 } }, changeQuery: { _id: 'objectid' } });
            }

            kerdx.runParallel(run, authors => {
                for (let form of result.forms) {
                    form.author = authors[form.author].userName;
                }
            });

            for (let customForm of result.customForms) {
                if (!types.includes(customForm.name)) {
                    types.push(customForm.name);
                }
            }

            let selectCell = kerdx.cell({ element: 'select', name: 'Form', dataAttributes: {}, options: types });
            document.body.find('#more-forms-controls').append(selectCell);

            let renderTable = value => {
                let contents = [];
                let selectedForm = kerdx.array.find(result.customForms, form => {
                    return form.name == value;
                });

                for (let form of result.forms) {
                    if (form.type == selectedForm._id) {
                        let formContent = {};
                        kerdx.object.copy(form, formContent);
                        for (let content of selectedForm.contents) {
                            if (content.show == 'True') {
                                formContent[content.name] = form.contents[content.name];
                            }
                        }
                        formContent.contents = Object.keys(formContent.contents).length;
                        formContent.tasks = Object.keys(formContent.tasks).length;
                        contents.push(formContent);
                    }
                }

                let formsTable = kerdx.createTable({ title: value + ' Forms Table', contents, search: true, sort: true, filter: ['All', 'Enough', 'Excess', 'Low'] });
                container.render(formsTable);

                kerdx.listenTable({ options: ['edit', 'clone', 'delete'], table: formsTable }, {
                    click: event => {
                        let target = event.target;
                        let { row } = target.getParents('.kerdx-table-column-cell').dataset;
                        let table = target.getParents('.kerdx-table');
                        let id = table.find(`.kerdx-table-column[data-name="_id"]`).find(`.kerdx-table-column-cell[data-row="${row}"]`).dataset.value;

                        if (target.id == 'kerdx-table-option-edit') {
                            system.redirect('forms.html?page=edit&id=' + id);
                        }
                        else if (target.id == 'kerdx-table-option-clone') {
                            system.redirect('forms.html?page=clone&id=' + id);
                        }
                        else if (target.id == 'kerdx-table-option-delete') {
                            system.redirect('forms.html?page=delete&id=' + id);
                        }
                    },

                    filter: (sortValue, row) => {
                        let hide = true;
                        let cell = kerdx.array.find(row, value => {
                            return value.dataset.name == 'status';
                        });
                        for (let j = 0; j < row.length; j++) {
                            if (sortValue == 'Enough') {
                                hide = cell.textContent != 'Enough';
                            }
                            else if (sortValue == 'Excess') {
                                hide = cell.textContent != 'Excess';
                            }
                            else if (sortValue == 'Low') {
                                hide = cell.textContent != 'Low';
                            }
                        }

                        return hide;
                    }
                });
            };

            renderTable(types[0])
            selectCell.find('#Form-cell').onChanged(value => {
                renderTable(value);
            });
        });
    }

    show(container) {
        let id = this.url.vars.id;
        system.get({ collection: 'items', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(item => {
            container.makeElement([
                {
                    element: 'div', attributes: { id: 'item-details' }, children: [
                        {
                            element: 'span', attributes: { id: 'item-name' }, children: [
                                { element: 'h2', attributes: { id: 'item-name-text' }, text: item.name },
                                {
                                    element: 'span', attributes: { id: 'item-controls' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-pen', href: 'items.html?page=edit&id=' + item._id } },
                                        { element: 'i', attributes: { class: 'icon fas fa-clone', href: 'items.html?page=clone&id=' + item._id } },
                                        { element: 'a', attributes: { class: 'icon fas fa-trash-alt', href: 'items.html?page=delete&id=' + item._id } },
                                    ]
                                }
                            ]
                        },
                        {
                            element: 'span', attributes: { id: 'item-other-details' }, children: [
                                system.editableImage('item-image', item.image),
                                {
                                    element: 'span', attributes: { id: 'show-user-work-details' }, children: [
                                        {
                                            element: 'span', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                { element: 'i', attributes: { class: 'icon fas fa-user' } },
                                                { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Price' },
                                                { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: item.price }
                                            ]
                                        },
                                        {
                                            element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                { element: 'i', attributes: { class: 'icon fas fa-envelope' } },
                                                { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Unit' },
                                                { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: item.unit }
                                            ]
                                        },
                                        {
                                            element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                { element: 'i', attributes: { class: 'icon fas fa-phone' } },
                                                { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Count' },
                                                { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: item.count }
                                            ]
                                        },
                                        {
                                            element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                { element: 'i', attributes: { class: 'icon fas fa-building' } },
                                                { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Minimium' },
                                                { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: item.min }
                                            ]
                                        },
                                        {
                                            element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                { element: 'i', attributes: { class: 'icon fas fa-users' } },
                                                { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Maximium' },
                                                { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: item.max }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                { element: 'div', attributes: { id: 'item-items' } }
            ]);

            container.find('#edit-item-image').addEventListener('click', event => {
                let uploadImageForm = kerdx.createElement({
                    element: 'form', attributes: { class: 'single-upload-form' }, children: [
                        {
                            element: 'span', attributes: { class: 'single-upload-form-controls' }, children: [
                                { element: 'input', attributes: { type: 'file', name: 'newImage', id: 'new-image' } },
                                { element: 'button', attributes: { id: 'upload', class: 'btn btn-small' }, text: 'upload' }
                            ]
                        },
                        {
                            element: 'img', attributes: { id: 'preview-image' }
                        }
                    ]
                });

                let popUp = kerdx.popUp(uploadImageForm);

                uploadImageForm.find('#new-image').onChanged(value => {
                    uploadImageForm.find('#preview-image').src = value.src;
                });

                uploadImageForm.find('#upload').addEventListener('click', event => {
                    event.preventDefault();
                    let data = kerdx.jsonForm(uploadImageForm);
                    data.action = 'changeItemImage';
                    data.id = id;

                    system.connect({ data }).then(result => {
                        if (result == true) {
                            system.notify({ note: 'Image was successfully uploaded' });
                            container.find('#editable-image').src = uploadImageForm.find('#preview-image').src;
                            popUp.remove();
                        }
                        else {
                            system.notify({ note: 'Could not upload Image' });
                        }
                    });
                });
            });

            container.find('#delete-item-image').addEventListener('click', event => {
                let data = { action: 'deleteItemImage', id };
                system.connect({ data }).then(result => {
                    if (result == true) {
                        system.notify({ note: 'Image was successfully deleted' });
                        container.find('#editable-image').src = '';
                    }
                    else {
                        system.notify({ note: 'Could not delete Image' });
                    }
                });
            });
        });
    }

    make(form, tasks, id) {
        let loading = kerdx.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });

        let nameTasks = () => {
            let singleTasks = form.find('#tasks-container').findAll('.single-task');
            for (let i = 0; i < singleTasks.length; i++) {
                singleTasks[i].find('.task-id').setAttribute('name', `${singleTasks[i].dataset.name}Id ${i}`);
                singleTasks[i].find('.task-value').setAttribute('name', `${singleTasks[i].dataset.name}Value ${i}`);
            }
        };
        let table = kerdx.inBetween(form.dataset.target, '$#&{', '}&#$');
        try {
            table = JSON.parse(table).collection;
        } catch (error) {
            system.notify({ note: "Form's Target is invalid" });
            return;
        }
        form.find('#add-new-task').addEventListener('click', event => {
            this.getTask(table, tasks, task => {
                form.find('#tasks-container').makeElement(task);
                nameTasks();
            });
        });

        form.addEventListener('click', event => {
            if (event.target.classList.contains('delete-task') && confirm('Task will be deleted')) {
                event.target.getParents('.single-task').remove();
            }
        });

        form.addEventListener('submit', event => {
            event.preventDefault();
            let formValidation = kerdx.validateForm(form, { nodeNames: ['INPUT', 'select-element', 'select'] });

            if (!formValidation.flag) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            let data = {
                action: 'createForm',
                type: form.dataset.type,
                contents: JSON.stringify(kerdx.jsonForm(form.find('.kerdx-form-contents'))),
                tasks: {}
            }
            let allTasks = form.findAll('.single-task');
            for (let i = 0; i < allTasks.length; i++) {
                let { name } = allTasks[i].dataset;
                data.tasks[name] = data.tasks[name] || [];
                let _id = allTasks[i].find('.task-id').value;
                let value = allTasks[i].find('.task-value').value;

                data.tasks[allTasks[i].dataset.name].push({ _id, value });
            }

            data.tasks = JSON.stringify(data.tasks);

            if (kerdx.isset(id)) {
                data.action = 'editForm';
                data.id = id;
            }
            // form.getState({ name: 'submit' }).replaceWith(loading);
            form.setState({ name: 'error', attributes: { style: { display: 'none' } }, text: '' });

            system.connect({ data }).then(result => {
                // loading.replaceWith(form.getState({ name: 'submit' }));
                if (result == true) {
                    if (kerdx.isset(id)) {
                        system.notify({ note: 'Form Editted' });
                    }
                    else {
                        system.notify({ note: 'Form Created' });
                    }
                    window.history.go(-1);
                }
                else if (kerdx.isset(result.found)) {
                    form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `${kerdx.camelCasedToText(result.found).toUpperCase()} is already in use` });
                }
                else {
                    form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Error Unknown` });
                }
            });
        });
    }

    edit(container) {
        let id = this.url.vars.id;
        system.get({ collection: 'forms', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(result => {
            let type = result.contents.type;
            system.get({ collection: 'customforms', query: { _id: type }, changeQuery: { _id: 'objectid' } }).then(selectedForm => {
                let displayForm = (contents, tasks) => {
                    for (let i = 0; i < selectedForm.contents.length; i++) {
                        contents[selectedForm.contents[i].name].attributes.value = result.contents[selectedForm.contents[i].name];
                    }

                    let editForm = kerdx.createForm({
                        title: 'Edit ' + selectedForm.title, attributes: { enctype: 'multipart/form-data', id: 'edit-form-form', class: 'form', 'data-type': selectedForm._id, 'data-target': selectedForm.target, style: { border: '1px solid var(--secondary-color)', maxWidth: '100%' } },
                        contents: contents,
                        buttons: {
                            tasks: {
                                element: 'div', attributes: { id: 'tasks-container' }
                            },
                            actions: {
                                element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                                    { element: 'i', attributes: { class: 'action', id: 'add-new-task', title: 'Add New Task', 'data-icon': kerdx.icons.plus } },
                                ]
                            },
                            submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit', state: { name: 'submit', owner: '#edit-form-form' } },
                        },
                        columns: 2
                    });
                    let target = kerdx.inBetween(selectedForm.target, '$#&{', '}&#$');
                    try {
                        target = JSON.parse(target).collection;
                    } catch (error) {
                        system.notify({ note: "Form's Target is invalid" });
                        target = '';
                    }

                    if (target != '') {
                        kerdx.runParallel({ ids: system.get({ collection: target, query: {}, projection: { _id: 1 }, many: true }) }, fetched => {
                            let list = kerdx.object.valueOfObjectArray(fetched.ids, '_id');
                            list.unshift('Null');

                            for (let name in result.tasks) {
                                for (let done of result.tasks[name]) {
                                    let task = editForm.find('#tasks-container').makeElement(tasks[name]);
                                    task.find('.task-id').setOptions(list, { selected: done._id });
                                    task.find('.task-value').value = done.value;
                                    task.dataset.action = done.action;
                                }
                            }
                        });
                    }

                    container.render(editForm);
                    this.make(editForm, tasks, id);
                };

                this.renderForm(selectedForm, displayForm);
            });
        });
    }

    clone(container) {
        let id = this.url.vars.id;
        system.get({ collection: 'forms', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(result => {
            let type = result.contents.type;
            system.get({ collection: 'customforms', query: { _id: type }, changeQuery: { _id: 'objectid' } }).then(selectedForm => {
                let displayForm = (contents, tasks) => {
                    for (let i = 0; i < selectedForm.contents.length; i++) {
                        contents[selectedForm.contents[i].name].attributes.value = result.contents[selectedForm.contents[i].name];
                    }

                    let cloneForm = kerdx.createForm({
                        title: 'Clone ' + selectedForm.title, attributes: { enctype: 'multipart/form-data', id: 'clone-form-form', class: 'form', 'data-type': selectedForm._id, 'data-target': selectedForm.target, style: { border: '1px solid var(--secondary-color)', maxWidth: '100%' } },
                        contents: contents,
                        buttons: {
                            tasks: {
                                element: 'div', attributes: { id: 'tasks-container' }
                            },
                            actions: {
                                element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                                    { element: 'i', attributes: { class: 'action', id: 'add-new-task', title: 'Add New Task', 'data-icon': kerdx.icons.plus } },
                                ]
                            },
                            submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone', state: { name: 'submit', owner: '#clone-form-form' } },
                        },
                        columns: 2
                    });

                    container.render(cloneForm);
                    this.make(cloneForm, tasks);
                };

                this.renderForm(selectedForm, displayForm);
            });
        });
    }

    create(container) {
        kerdx.runParallel({
            customForms: system.get({ collection: 'customforms', query: {}, many: true })
        }, result => {
            let customForms = result.customForms;
            let types = kerdx.object.valueOfObjectArray(customForms, 'name');
            let selectCell = kerdx.cell({ element: 'select', name: 'Form', dataAttributes: {}, options: types });

            document.body.find('#more-forms-controls').append(selectCell);

            let selectedForm = kerdx.array.find(customForms, form => {
                return form.name == types[0];
            });

            let displayForm = (contents, tasks) => {
                let createForm = kerdx.createForm({
                    title: 'Create ' + selectedForm.title, attributes: { enctype: 'multipart/form-data', id: 'create-form-form', class: 'form', 'data-type': selectedForm._id, 'data-target': selectedForm.target, style: { border: '1px solid var(--secondary-color)', maxWidth: '100%' } },
                    contents: contents,
                    buttons: {
                        tasks: {
                            element: 'div', attributes: { id: 'tasks-container' }
                        },
                        actions: {
                            element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                                { element: 'i', attributes: { class: 'action', id: 'add-new-task', title: 'Add New Task', 'data-icon': kerdx.icons.plus } },
                            ]
                        },
                        submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create', state: { name: 'submit', owner: '#create-form-form' } },
                    },
                    columns: 2
                });

                container.render(createForm);
                this.make(createForm, tasks);
            }

            this.renderForm(selectedForm, displayForm);
            selectCell.find('#Form-cell').onChanged(value => {
                selectedForm = kerdx.array.find(customForms, form => {
                    return form.name == value;
                });
                this.renderForm(selectedForm, displayForm);
            });
        });
    }

    getTask(table, tasks, callback) {
        let tasksHolder = kerdx.createElement({ element: 'div', attributes: { style: { display: 'block', padding: '4em 2em', cursor: 'pointer' } } });

        for (let task in tasks) {
            tasksHolder.makeElement({ element: 'span', attributes: { class: 'single-task', 'data-name': task, style: { padding: '2em', display: 'inline', margin: '1em', border: '1px solid var(--secondary-color)' } }, text: task })
        }

        let taskPopup = kerdx.popUp(tasksHolder, { title: 'Pick Task' });

        tasksHolder.addEventListener('dblclick', event => {
            if (event.target.classList.contains('single-task')) {
                let count = prompt('How many of this tasks');
                kerdx.runParallel({ ids: system.get({ collection: table, query: {}, projection: { _id: 1 }, many: true }) }, result => {
                    let generatedTasks = [];
                    let list = kerdx.object.valueOfObjectArray(result.ids, '_id');
                    list.unshift('Null');
                    for (let i = 0; i < count; i++) {
                        let task = kerdx.createElement(tasks[event.target.dataset.name]);
                        task.find('.task-id').setOptions(list)
                        generatedTasks.push(task);
                    }
                    callback(generatedTasks);
                    taskPopup.remove();
                });
            }
        });
    }

    renderForm(selectedForm, callback) {
        let contents = {};
        let tasks = {};

        for (let i = 0; i < selectedForm.contents.length; i++) {
            if (selectedForm.contents[i].source != '') {
                contents[selectedForm.contents[i].name] = { perceptorElement: 'createSelect', params: { attributes: {} }, source: selectedForm.contents[i].source, name: selectedForm.contents[i].name, 'data-action': selectedForm.contents[i].action };
            }
            else {
                contents[selectedForm.contents[i].name] = { element: 'input', attributes: { type: selectedForm.contents[i].type, name: selectedForm.contents[i].name, 'data-action': selectedForm.contents[i].action } };
            }
        }

        for (let i = 0; i < selectedForm.tasks.length; i++) {
            tasks[selectedForm.tasks[i].name] = {
                element: 'span', attributes: { class: 'single-task', 'data-name': selectedForm.tasks[i].name, 'data-action': selectedForm.tasks[i].action, style: { display: 'grid', gap: '1em', gridTemplateColumns: '1fr repeat(3, max-content)', border: '1px solid var(--secondary-color)', padding: '1em', alignItems: 'center' } }, children: [
                    { element: 'p', attributes: { class: 'task-name' }, text: selectedForm.tasks[i].name },
                    { element: 'select', attributes: { class: 'task-id' } },
                    { element: 'input', attributes: { class: 'task-value' } },
                    { element: 'i', attributes: { 'data-icon': 'fas, fa-trash', class: 'delete-task', title: 'Delete Task', style: { cursor: 'pointer' } } }
                ]
            }
        }

        system.getSources(selectedForm.contents, fetched => {
            for (let name in contents) {
                if (contents[name].source != '') {
                    delete contents[name].source;
                    contents[name].params.contents = [];
                    for (let i = 0; i < fetched[name].length; i++) {
                        contents[name].params.contents = contents[name].params.contents.concat(fetched[name][i]);
                    }
                }
            }

            callback(contents, tasks);
        });
    }

    delete() {
        if (confirm('Form will be deleted. Continue?')) {
            let id = this.url.vars.id;
            system.connect({ data: { action: 'deleteForm', id } }).then(result => {
                system.redirect(location + '/forms.html?page=view');
            });
        } else {
            system.redirect(location + '/forms.html?page=view');
        }
    }
}

export { Forms };