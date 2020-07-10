class Reports {
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

        this.url = perceptor.urlSplitter(location.href);
        let page = this.url.vars.page;
        if (!Object.values(this.url.vars).length) {
            this.view(mainBody.find('#main-container-body-main-window'));
        }
        else if (perceptor.isset(this[page])) {
            this[page](mainBody.find('#main-container-body-main-window'));
        }
        else {
            system.display404(mainBody.find('#main-container-body-main-window'));
        }
    }

    view(container) {
        let fetch = { reportgenerators: system.get({ collection: 'reportgenerators', query: {}, many: true }), reports: system.get({ collection: 'reports', query: {}, many: true }) };

        perceptor.runParallel(fetch, result => {
            let run = {};
            let types = [];
            for (let report of result.reports) {
                // form.time = new Date(Math.floor(form.time)).toLocaleDateString();

                run[report.author] = system.get({ collection: 'users', query: { _id: form.author }, options: { projection: { userName: 1, _id: 0 } }, changeQuery: { _id: 'objectid' } });
            }

            perceptor.runParallel(run, authors => {
                for (let report of result.reports) {
                    report.author = authors[report.author].userName;
                }
            });

            for (let report of result.reportgenerators) {                
                if (!types.includes(report.name)) {
                    types.push(report.name);
                }
            }

            let selectCell = perceptor.cell({ element: 'select', name: 'Form', dataAttributes: {}, options: types });
            document.body.find('#more-forms-controls').append(selectCell);
            let renderTable = value => {
                let contents = [];
                let selectedReport = perceptor.array.find(result.reportgenerators, report => {
                    return report.name == value;
                });

                for (let report of result.reports) {
                    if (report.type == selectedReport._id) {
                        let reportContent = {};
                        perceptor.object.copy(report, reportContent);
                        for (let content of selectedReport.contents) {
                            if (content.show == 'True') {
                                reportContent[content.name] = report.contents[content.name];
                            }
                        }
                        reportContent.contents = Object.keys(reportContent.contents).length;
                        reportContent.tasks = Object.keys(reportContent.tasks).length;
                        contents.push(reportContent);
                    }
                }

                let reportsTable = perceptor.createTable({ title: value + ' Reports Table', contents, search: true, sort: true, filter: ['All', 'Enough', 'Excess', 'Low'] });
                container.render(reportsTable);

                perceptor.listenTable({ options: ['edit', 'clone', 'delete'], table: reportsTable }, {
                    click: event => {
                        let target = event.target;
                        let { row } = target.getParents('.perceptor-table-column-cell').dataset;
                        let table = target.getParents('.perceptor-table');
                        let id = table.find(`.perceptor-table-column[data-name="_id"]`).find(`.perceptor-table-column-cell[data-row="${row}"]`).dataset.value;

                        if (target.id == 'perceptor-table-option-edit') {
                            system.redirect('forms.html?page=edit&id=' + id);
                        }
                        else if (target.id == 'perceptor-table-option-clone') {
                            system.redirect('forms.html?page=clone&id=' + id);
                        }
                        else if (target.id == 'perceptor-table-option-delete') {
                            system.redirect('forms.html?page=delete&id=' + id);
                        }
                    },

                    filter: (sortValue, row) => {
                        let hide = true;
                        let cell = perceptor.array.find(row, value => {
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
                let uploadImageForm = perceptor.createElement({
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

                let popUp = perceptor.popUp(uploadImageForm);

                uploadImageForm.find('#new-image').onChanged(value => {
                    uploadImageForm.find('#preview-image').src = value.src;
                });

                uploadImageForm.find('#upload').addEventListener('click', event => {
                    event.preventDefault();
                    let data = perceptor.jsonForm(uploadImageForm);
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
        let loading = perceptor.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });

        let nameTasks = () => {
            let singleTasks = form.find('#tasks-container').findAll('.single-task');
            for (let i = 0; i < singleTasks.length; i++) {
                singleTasks[i].find('.task-id').setAttribute('name', `${singleTasks[i].dataset.name}Id ${i}`);
                singleTasks[i].find('.task-value').setAttribute('name', `${singleTasks[i].dataset.name}Value ${i}`);
            }
        };
        let table = perceptor.inBetween(form.dataset.target, '$#&{', '}&#$');
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
            let formValidation = perceptor.validateForm(form, { nodeNames: ['INPUT', 'select-element', 'select'] });

            if (!formValidation.flag) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            let data = {
                action: 'createForm',
                type: form.dataset.type,
                contents: JSON.stringify(perceptor.jsonForm(form.find('.perceptor-form-contents'))),
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

            if (perceptor.isset(id)) {
                data.action = 'editForm';
                data.id = id;
            }
            // form.getState({ name: 'submit' }).replaceWith(loading);
            form.setState({ name: 'error', attributes: { style: { display: 'none' } }, text: '' });

            system.connect({ data }).then(result => {
                // loading.replaceWith(form.getState({ name: 'submit' }));
                if (result == true) {
                    if (perceptor.isset(id)) {
                        system.notify({ note: 'Form Editted' });
                    }
                    else {
                        system.notify({ note: 'Form Created' });
                    }
                    window.history.go(-1);
                }
                else if (perceptor.isset(result.found)) {
                    form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `${perceptor.camelCasedToText(result.found).toUpperCase()} is already in use` });
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
            system.get({ collection: 'reportgenerators', query: { _id: type }, changeQuery: { _id: 'objectid' } }).then(selectedReport => {
                let displayForm = (contents, tasks) => {
                    for (let i = 0; i < selectedReport.contents.length; i++) {
                        contents[selectedReport.contents[i].name].attributes.value = result.contents[selectedReport.contents[i].name];
                    }

                    let editForm = perceptor.createForm({
                        title: 'Edit ' + selectedReport.title, attributes: { enctype: 'multipart/form-data', id: 'edit-form-form', class: 'form', 'data-type': selectedReport._id, 'data-target': selectedReport.target, style: { border: '1px solid var(--secondary-color)', maxWidth: '100%' } },
                        contents: contents,
                        buttons: {
                            tasks: {
                                element: 'div', attributes: { id: 'tasks-container', style: { display: 'grid', gap: '1em' } }
                            },
                            actions: {
                                element: 'div', attributes: { style: { display: 'flex' } }, children: [
                                    { element: 'i', attributes: { id: 'add-new-task', class: 'action', title: 'Add New Task', 'data-icon': perceptor.icons.plus, style: { margin: '1em' } } },
                                ]
                            },
                            submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit', state: { name: 'submit', owner: '#edit-form-form' } },
                        },
                        columns: 2
                    });
                    let target = perceptor.inBetween(selectedReport.target, '$#&{', '}&#$');
                    try {
                        target = JSON.parse(target).collection;
                    } catch (error) {
                        system.notify({ note: "Form's Target is invalid" });
                        target = '';
                    }

                    if (target != '') {
                        perceptor.runParallel({ ids: system.get({ collection: target, query: {}, projection: { _id: 1 }, many: true }) }, fetched => {
                            let list = perceptor.object.valueOfObjectArray(fetched.ids, '_id');
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

                this.renderForm(selectedReport, displayForm);
            });
        });
    }

    clone(container) {
        let id = this.url.vars.id;
        system.get({ collection: 'forms', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(result => {
            let type = result.contents.type;
            system.get({ collection: 'reportgenerators', query: { _id: type }, changeQuery: { _id: 'objectid' } }).then(selectedReport => {
                let displayForm = (contents, tasks) => {
                    for (let i = 0; i < selectedReport.contents.length; i++) {
                        contents[selectedReport.contents[i].name].attributes.value = result.contents[selectedReport.contents[i].name];
                    }

                    let cloneForm = perceptor.createForm({
                        title: 'Clone ' + selectedReport.title, attributes: { enctype: 'multipart/form-data', id: 'clone-form-form', class: 'form', 'data-type': selectedReport._id, 'data-target': selectedReport.target, style: { border: '1px solid var(--secondary-color)', maxWidth: '100%' } },
                        contents: contents,
                        buttons: {
                            tasks: {
                                element: 'div', attributes: { id: 'tasks-container', style: { display: 'grid', gap: '1em' } }
                            },
                            actions: {
                                element: 'div', attributes: { style: { display: 'flex' } }, children: [
                                    { element: 'i', attributes: { id: 'add-new-task', class: 'action', title: 'Add New Task', 'data-icon': perceptor.icons.plus, style: { margin: '1em' } } },
                                ]
                            },
                            submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone', state: { name: 'submit', owner: '#clone-form-form' } },
                        },
                        columns: 2
                    });

                    container.render(cloneForm);
                    this.make(cloneForm, tasks);
                };

                this.renderForm(selectedReport, displayForm);
            });
        });
    }

    create(container) {
        perceptor.runParallel({
            reportGenerators: system.get({ collection: 'reportgenerators', query: {}, many: true })
        }, result => {
            let reportGenerators = result.reportGenerators;
            let types = perceptor.object.valueOfObjectArray(reportGenerators, 'name');
            let selectCell = perceptor.cell({ element: 'select', name: 'Form', dataAttributes: {}, options: types });

            document.body.find('#more-forms-controls').append(selectCell);

            let selectedReport = perceptor.array.find(reportGenerators, form => {
                return form.name == types[0];
            });

            let displayForm = (contents, tasks) => {
                let createForm = perceptor.createForm({
                    title: 'Create ' + selectedReport.title, attributes: { enctype: 'multipart/form-data', id: 'create-form-form', class: 'form', 'data-type': selectedReport._id, 'data-target': selectedReport.target, style: { border: '1px solid var(--secondary-color)', maxWidth: '100%' } },
                    contents: contents,
                    buttons: {
                        tasks: {
                            element: 'div', attributes: { id: 'tasks-container', style: { display: 'grid', gap: '1em' } }
                        },
                        actions: {
                            element: 'div', attributes: { style: { display: 'flex' } }, children: [
                                { element: 'i', attributes: { id: 'add-new-task', class: 'action', title: 'Add New Task', 'data-icon': perceptor.icons.plus, style: { margin: '1em' } } },
                            ]
                        },
                        submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create', state: { name: 'submit', owner: '#create-form-form' } },
                    },
                    columns: 2
                });

                container.render(createForm);
                this.make(createForm, tasks);
            }

            this.renderForm(selectedReport, displayForm);
            selectCell.find('#Form-cell').onChanged(value => {
                selectedReport = perceptor.array.find(reportGenerators, form => {
                    return form.name == value;
                });
                this.renderForm(selectedReport, displayForm);
            });
        });
    }

    getTask(table, tasks, callback) {
        let tasksHolder = perceptor.createElement({ element: 'div', attributes: { style: { display: 'block', padding: '4em 2em', cursor: 'pointer' } } });

        for (let task in tasks) {
            tasksHolder.makeElement({ element: 'span', attributes: { class: 'single-task', 'data-name': task, style: { padding: '2em', display: 'inline', margin: '1em', border: '1px solid var(--secondary-color)' } }, text: task })
        }

        let taskPopup = perceptor.popUp(tasksHolder, { title: 'Pick Task' });

        tasksHolder.addEventListener('dblclick', event => {
            if (event.target.classList.contains('single-task')) {
                let count = prompt('How many of this tasks');
                perceptor.runParallel({ ids: system.get({ collection: table, query: {}, projection: { _id: 1 }, many: true }) }, result => {
                    let generatedTasks = [];
                    let list = perceptor.object.valueOfObjectArray(result.ids, '_id');
                    list.unshift('Null');
                    for (let i = 0; i < count; i++) {
                        let task = perceptor.createElement(tasks[event.target.dataset.name]);
                        task.find('.task-id').setOptions(list)
                        generatedTasks.push(task);
                    }
                    callback(generatedTasks);
                    taskPopup.remove();
                });
            }
        });
    }

    renderForm(selectedReport, callback) {
        let contents = {};
        let tasks = {};

        for (let i = 0; i < selectedReport.contents.length; i++) {
            if (selectedReport.contents[i].source != '') {
                contents[selectedReport.contents[i].name] = { element: 'select-element', attributes: { name: selectedReport.contents[i].name, 'data-action': selectedReport.contents[i].action }, source: selectedReport.contents[i].source };
            }
            else {
                contents[selectedReport.contents[i].name] = { element: 'input', attributes: { type: selectedReport.contents[i].type, name: selectedReport.contents[i].name } };
            }
        }

        for (let i = 0; i < selectedReport.tasks.length; i++) {
            tasks[selectedReport.tasks[i].name] = {
                element: 'span', attributes: { class: 'single-task', 'data-name': selectedReport.tasks[i].name, 'data-action': selectedReport.tasks[i].action, style: { display: 'grid', gap: '1em', gridTemplateColumns: '1fr repeat(3, max-content)', border: '1px solid var(--secondary-color)', padding: '1em', alignItems: 'center' } }, children: [
                    { element: 'p', attributes: { class: 'task-name' }, text: selectedReport.tasks[i].name },
                    { element: 'select', attributes: { class: 'task-id' } },
                    { element: 'input', attributes: { class: 'task-value' } },
                    { element: 'i', attributes: { 'data-icon': 'fas, fa-trash', class: 'delete-task', title: 'Delete Task', style: { cursor: 'pointer' } } }
                ]
            }
        }

        perceptor.getSources(selectedReport.contents, fetched => {
            for (let name in contents) {
                if (contents[name].source != '') {
                    delete contents[name].source;
                    contents[name].attributes.contents = [];
                    for (let i = 0; i < fetched[name].length; i++) {
                        contents[name].attributes.contents = contents[name].attributes.contents.concat(fetched[name][i]);
                    }
                    contents[name].attributes.contents = JSON.stringify(contents[name].attributes.contents);
                }
            }

            callback(contents, tasks);
        });
    }

    delete() {
        if (confirm('Report will be deleted. Continue?')) {
            let id = this.url.vars.id;
            system.connect({ data: { action: 'deleteReport', id } }).then(result => {
                system.redirect(location + '/reports.html?page=view');
            });
        } else {
            system.redirect(location + '/reports.html?page=view');
        }
    }
}

export { Reports };