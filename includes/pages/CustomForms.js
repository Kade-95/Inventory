let customForms = (mainBody) => {
    let settingsMainWindow = mainBody.find('#settings-main-window');
    let loading = kerdx.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });

    let urlVars = kerdx.urlSplitter(location.href);
    let dataContainer, taskContainer, targets = [];

    let makeData = (form, callback, data) => {
        let popUp = kerdx.popUp(form);
        data = data || {};
        form.find('#set-source').addEventListener('click', event => {
            system.setSources((source, type) => {
                if (type == 'list' || type == 'text') {
                    form.find('#source').value = source;
                    return true;
                }
                else {
                    system.notify({ note: `List or Text expected. ${type} provided` });
                    return false;
                }
            });
        });

        form.addEventListener('submit', event => {
            event.preventDefault();

            let formValidation = kerdx.validateForm(form);

            if (!formValidation.flag) {
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            let allData = dataContainer.findAll('.single-form-data');
            for (let i = 0; i < allData.length; i++) {
                if (allData[i].value.name == form.find('#name').value && data.name != form.find('#name').value) {
                    form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: 'Name has been used already' });
                    return;
                }
            }

            callback(kerdx.jsonForm(form));
            popUp.remove();
        });
    }

    let editData = (data, callback) => {
        let editDataForm = kerdx.createForm({
            title: 'Edit Data', attributes: { enctype: 'multipart/form-data', id: 'create-edit-data-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: data.name }, list: targets },
                type: { element: 'select', attributes: { id: 'type', name: 'type', ignore: true }, options: ['Null', 'Text', 'Number', 'Date', 'Time', 'File', 'Link'], selected: data.type },
                source: { element: 'input', attributes: { id: 'source', name: 'source', value: data.source, ignore: true }, label: kerdx.createElement({ element: 'a', text: 'Source', children: [{ element: 'i', attributes: { class: 'icon fas fa-plus', id: 'set-source', ignore: true } }] }).innerHTML },
                multiple: { element: 'select', attributes: { id: 'multiple', name: 'multiple', ignore: true }, options: ['Null', 'True', 'False'], selected: data.multiple },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['False', 'True'], selected: data.show }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit Data', state: { name: 'submit', owner: '#create-edit-data-form' } },
            }, columns: 2
        });

        makeData(editDataForm, callback, data);
    };

    let cloneData = (data, callback) => {
        let cloneDataForm = kerdx.createForm({
            title: 'Clone Data', attributes: { enctype: 'multipart/form-data', id: 'create-clone-data-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: data.name } },
                type: { element: 'select', attributes: { id: 'type', name: 'type', ignore: true }, options: ['Null', 'Text', 'Number', 'Date', 'Time', 'File', 'Link'], selected: data.type },
                source: { element: 'input', attributes: { id: 'source', name: 'source', value: data.source, ignore: true }, label: kerdx.createElement({ element: 'a', text: 'Source', children: [{ element: 'i', attributes: { class: 'icon fas fa-plus', id: 'set-source', ignore: true } }] }).innerHTML },
                multiple: { element: 'select', attributes: { id: 'multiple', name: 'multiple', ignore: true }, options: ['Null', 'True', 'False'], selected: data.multiple },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['False', 'True'], selected: data.show }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone Data', state: { name: 'submit', owner: '#create-clone-data-form' } },
            }, columns: 2
        });

        makeData(cloneDataForm, callback);
    };

    let createData = (callback) => {
        let createDataForm = kerdx.createForm({
            title: 'Create Data', attributes: { enctype: 'multipart/form-data', id: 'create-create-data-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name' } },
                type: { element: 'select', attributes: { id: 'type', name: 'type', ignore: true }, options: ['Null', 'Text', 'Number', 'Date', 'Time', 'File', 'Link'] },
                source: { element: 'input', attributes: { id: 'source', name: 'source', ignore: true }, label: kerdx.createElement({ element: 'a', text: 'Source', children: [{ element: 'i', attributes: { class: 'icon fas fa-plus', id: 'set-source' } }] }).innerHTML },
                multiple: { element: 'select', attributes: { id: 'multiple', name: 'multiple', ignore: true }, options: ['Null', 'True', 'False'] },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['False', 'True'] }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create Data', state: { name: 'submit', owner: '#create-create-data-form' } },
            }, columns: 2
        });

        makeData(createDataForm, callback);
    }

    let getTask = (table, tasks, callback) => {
        let taskWindow = kerdx.picker({ contents: Object.keys(tasks) }, picked => {
            let count = prompt('How many of this tasks');
            kerdx.runParallel({ ids: system.get({ collection: table, query: {}, projection: { _id: 1 }, many: true }) }, result => {
                let generatedTasks = [];
                for (let i = 0; i < count; i++) {
                    let task = kerdx.createElement(tasks[picked]);
                    task.find('.task-id').setOptions(kerdx.object.valueOfObjectArray(result.ids, '_id'));
                    generatedTasks.push(task);
                }
                callback(generatedTasks);
                taskPopup.remove();
            });
        });

        let taskPopup = kerdx.popUp(taskWindow);
    }

    let preview = (form) => {
        let runSources = {};
        let allSources = {};
        let data = kerdx.jsonForm(form);
        data.contents = compileData(form);
        data.tasks = compileTasks(form);

        if (Object.values(data.contents).length == 0) {
            system.notify({ note: 'Please add some data to preview' });
            return;
        }

        system.getSources(data.contents, fetched => {
            for (let name in data.contents) {
                if (data.contents[name].source != '') {
                    delete data.contents[name].source;
                    if (kerdx.isset(data.contents[name].params)) {
                        data.contents[name].params.contents = [];
                        for (let i = 0; i < fetched[name].length; i++) {
                            data.contents[name].params.contents = data.contents[name].params.contents.concat(fetched[name][i])
                        }
                    }
                }
            }

            let previewForm = kerdx.createForm({
                title: data.title, columns: data.columns, attributes: { class: 'form' },
                contents: data.contents,
                buttons: {
                    tasks: {
                        element: 'div', attributes: { id: 'tasks-container' }
                    },
                    actions: {
                        element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                            { element: 'i', attributes: { id: 'add-single-form-task', class: 'action', title: 'Add New Task', 'data-icon': kerdx.icons.plus } },
                        ]
                    },
                    submit: { element: 'button', attributes: {}, text: 'Submit' }
                }
            });

            let table = kerdx.inBetween(data.target, '$#&{', '}&#$');
            try {
                table = JSON.parse(table).collection;
            } catch (error) {
                system.notify({ note: "Form's Target is invalid" });
                return;
            }
            previewForm.find('#add-single-form-task').addEventListener('click', event => {
                getTask(table, data.tasks, task => {
                    previewForm.find('#tasks-container').makeElement(task);
                });
            });

            previewForm.addEventListener('click', event => {
                if (event.target.classList.contains('delete-task') && confirm('Task will be deleted')) {
                    event.target.getParents('.single-task').remove();
                }
            });

            previewForm.addEventListener('submit', event => {
                event.preventDefault();
                previewForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: 'Form previewing' });
            });

            kerdx.popUp(previewForm).find('#toggle-window').click();
        });
    }

    let compileData = () => {
        let allData = dataContainer.findAll('.single-form-data');
        let data = [];
        for (let i = 0; i < allData.length; i++) {
            if (allData[i].value.source != '') {
                data[allData[i].value.name] = { perceptorElement: 'createSelect', params: { attributes: { name: allData[i].value.name } }, source: allData[i].value.source, name: allData[i].value.name };
            }
            else {
                data[allData[i].value.name] = { element: 'input', attributes: { type: allData[i].value.type, name: allData[i].value.name }, name: allData[i].value.name };
            }
        }
        return data;
    }

    let compileTasks = () => {
        let allTasks = taskContainer.findAll('.single-form-task');
        let tasks = [];
        for (let i = 0; i < allTasks.length; i++) {
            tasks[allTasks[i].value.name] = {
                element: 'span', attributes: { class: 'single-task', 'data-name': allTasks[i].value.name }, children: [
                    { element: 'p', attributes: { class: 'task-name' }, text: allTasks[i].value.name },
                    { element: 'select', attributes: { class: 'task-id' } },
                    { element: 'input', attributes: { class: 'task-value' } },
                    { element: 'i', attributes: { 'data-icon': 'fas, fa-trash', class: 'icon delete-task', title: 'Delete Task' } }
                ]
            }
        }
        return tasks;
    }

    let createTask = (callback) => {
        let createTaskForm = kerdx.createForm({
            title: 'Create Task', attributes: { enctype: 'multipart/form-data', id: 'create-create-task-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name' } },
                target: { element: 'input', attributes: { id: 'target', name: 'target', ignore: true }, list: targets },
                action: { element: 'select', attributes: { id: 'action', name: 'action', ignore: true }, options: ['Null', 'Set', 'Increase', 'Decrease'] },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['False', 'True'] }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create Task', state: { name: 'submit', owner: '#create-create-task-form' } },
            }, columns: 2
        });

        makeTask(createTaskForm, callback);
    }

    let cloneTask = (task, callback) => {
        let cloneTaskForm = kerdx.createForm({
            title: 'Clone Task', attributes: { enctype: 'multipart/form-data', id: 'create-clone-task-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: task.name } },
                target: { element: 'input', attributes: { id: 'target', name: 'target', ignore: true, value: task.target }, list: targets },
                action: { element: 'select', attributes: { id: 'action', name: 'action', ignore: true }, options: ['Null', 'Set', 'Increase', 'Decrease'], selected: task.action },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['False', 'True'], selected: task.show }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone Task', state: { name: 'submit', owner: '#create-clone-task-form' } },
            }, columns: 2
        });

        makeTask(cloneTaskForm, callback);
    };

    let editTask = (task, callback) => {
        let editTaskForm = kerdx.createForm({
            title: 'Edit Task', attributes: { enctype: 'multipart/form-data', id: 'create-edit-task-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: task.name } },
                target: { element: 'input', attributes: { id: 'target', name: 'target', ignore: true, value: task.target }, list: targets },
                action: { element: 'select', attributes: { id: 'action', name: 'action', ignore: true }, options: ['Null', 'Set', 'Increase', 'Decrease'], selected: task.action },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['False', 'True'], selected: task.show }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit Task', state: { name: 'submit', owner: '#create-edit-task-form' } },
            }, columns: 2
        });

        makeTask(editTaskForm, callback, task);
    };

    let makeTask = (form, callback, data) => {
        let popUp = kerdx.popUp(form, { title: 'Form Task' });
        data = data || {};

        form.addEventListener('submit', event => {
            event.preventDefault();

            let formValidation = kerdx.validateForm(form);

            if (!formValidation.flag) {
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            let allTasks = taskContainer.findAll('.single-form-task');
            for (let i = 0; i < allTasks.length; i++) {
                if (allTasks[i].value.name == form.find('#name').value && data.name != form.find('#name').value) {
                    form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: 'Name has been used already' });
                    return;
                }
            }

            callback(kerdx.jsonForm(form));
            popUp.remove();
        });
    }

    let show = () => {
        let id = urlVars.vars.id;
        system.get({ collection: 'customforms', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(customform => {
            settingsMainWindow.makeElement([
                {
                    element: 'div', attributes: { id: 'customform-details' }, children: [
                        {
                            element: 'span', attributes: { id: 'customform-name' }, children: [
                                { element: 'h2', attributes: { id: 'customform-name-text' }, text: customform.name },
                                {
                                    element: 'span', attributes: { id: 'customform-controls' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-pen', id: 'edit-customform', title: 'Edit' } },
                                        { element: 'i', attributes: { class: 'icon fas fa-clone', id: 'clone-customform', title: 'Clone' } },
                                        { element: 'a', attributes: { class: 'icon fas fa-trash-alt', title: 'Delete', href: 'settings.html?page=forms&action=delete&id=' + customform._id } },
                                    ]
                                }
                            ]
                        },
                        {
                            element: 'span', attributes: { id: 'customform-other-details' }, children: [
                                {
                                    element: 'div', attributes: { id: 'customform-main-details' }, children: [
                                        {
                                            element: 'span', attributes: { class: 'customform-main-details-single' }, children: [
                                                { element: 'i', attributes: { class: 'icon fas fa-envelope' } },
                                                { element: 'p', attributes: { class: 'customform-main-details-name' }, text: 'Title' },
                                                { element: 'p', attributes: { class: 'customform-main-details-value' }, text: customform.title }
                                            ]
                                        },
                                        {
                                            element: 'span', attributes: { class: 'customform-main-details-single' }, children: [
                                                { element: 'i', attributes: { class: 'icon fas fa-envelope' } },
                                                { element: 'p', attributes: { class: 'customform-main-details-name' }, text: 'Columns' },
                                                { element: 'p', attributes: { class: 'customform-main-details-value' }, text: customform.columns }
                                            ]
                                        },
                                        {
                                            element: 'span', attributes: { class: 'customform-main-details-single' }, children: [
                                                { element: 'i', attributes: { class: 'icon fas fa-envelope' } },
                                                { element: 'p', attributes: { class: 'customform-main-details-name' }, text: 'Target' },
                                                { element: 'p', attributes: { class: 'customform-main-details-value' }, text: customform.target }
                                            ]
                                        }
                                    ]
                                },
                                kerdx.createTable({
                                    title: 'Form Data', contents: customform.contents, sort: true
                                }),
                                kerdx.createTable({
                                    title: 'Form Tasks', contents: customform.tasks, sort: true
                                })
                            ]
                        }
                    ]
                },
            ]);

            settingsMainWindow.find('#clone-customform').addEventListener('click', event => {
                clone(id);
            });

            settingsMainWindow.find('#edit-customform').addEventListener('click', event => {
                edit(customform);
            });
        });
    }

    let clone = (id) => {
        system.get({ collection: 'customforms', query: { _id: id }, projection: { image: 0 }, changeQuery: { _id: 'objectid' } }).then(customform => {
            let cloneForm = kerdx.createForm({
                title: 'Clone Form', attributes: { enctype: 'multipart/form-data', id: 'clone-custom-form-form', class: 'form' },
                contents: {
                    name: { element: 'input', attributes: { id: 'name', name: 'name', value: customform.name } },
                    title: { element: 'input', attributes: { id: 'title', name: 'title', value: customform.title } },
                    target: { element: 'input', attributes: { id: 'target', name: 'target', value: customform.target, ignore: true }, label: kerdx.createElement({ element: 'a', text: 'Target', children: [{ element: 'i', attributes: { class: 'icon fas fa-plus', id: 'set-target', ignore: true } }] }).innerHTML },
                    columns: { element: 'input', attributes: { id: 'columns', name: 'columns', type: 'number', ignore: true } }
                },
                buttons: {
                    'newContainers': {
                        element: 'div', attributes: {
                            id: 'task-data-container'
                        }, children: [
                            { element: 'div', attributes: { id: 'data-container' } },
                            { element: 'div', attributes: { id: 'tasks-container' } }
                        ]
                    },
                    'actions': {
                        element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                            { element: 'i', attributes: { id: 'single-form-data', class: 'action', title: 'Add Data', 'data-icon': kerdx.icons.plus } },
                            { element: 'i', attributes: { id: 'single-form-task', class: 'action', title: 'Add Task', 'data-icon': kerdx.icons.tasks } },
                            { element: 'i', attributes: { id: 'preview-icon', class: 'action', title: 'Preview Form', 'data-icon': kerdx.icons.eye } }
                        ]
                    },
                    submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone', state: { name: 'submit', owner: '#clone-custom-form-form' } },
                }, columns: 2
            });

            dataContainer = cloneForm.find('.kerdx-form-buttons').find('#data-container');
            taskContainer = cloneForm.find('.kerdx-form-buttons').find('#tasks-container');

            for (let content of customform.contents) {
                renderData(content, dataContainer);
            }

            for (let task of customform.tasks) {
                renderTask(task, taskContainer);
            }

            let popUp = kerdx.popUp(cloneForm);
            popUp.find('#toggle-window').click();

            make(cloneForm);
        });
    }

    let edit = (customform) => {
        let editForm = kerdx.createForm({
            title: 'Edit Form', attributes: { enctype: 'multipart/form-data', id: 'edit-custom-form-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: customform.name } },
                title: { element: 'input', attributes: { id: 'title', name: 'title', value: customform.title } },
                target: { element: 'input', attributes: { id: 'target', name: 'target', value: customform.target, ignore: true }, label: kerdx.createElement({ element: 'a', text: 'Target', children: [{ element: 'i', attributes: { class: 'icon fas fa-plus', id: 'set-target', ignore: true } }] }).innerHTML },
                columns: { element: 'input', attributes: { id: 'columns', name: 'columns', type: 'number', ignore: true, value: customform.columns } }
            },
            buttons: {
                'newContainers': {
                    element: 'div', attributes: {
                        id: 'task-data-container'
                    }, children: [
                        { element: 'div', attributes: { id: 'data-container' } },
                        { element: 'div', attributes: { id: 'tasks-container' } }
                    ]
                },
                'actions': {
                    element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                        { element: 'i', attributes: { id: 'single-form-data', class: 'action', title: 'Add Data', 'data-icon': kerdx.icons.plus } },
                        { element: 'i', attributes: { id: 'single-form-task', class: 'action', title: 'Add Task', 'data-icon': kerdx.icons.tasks } },
                        { element: 'i', attributes: { id: 'preview-icon', class: 'action', title: 'Preview Form', 'data-icon': kerdx.icons.eye } }
                    ]
                },
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit', state: { name: 'submit', owner: '#edit-custom-form-form' } },
            }, columns: 2
        });

        dataContainer = editForm.find('.kerdx-form-buttons').find('#data-container');
        taskContainer = editForm.find('.kerdx-form-buttons').find('#tasks-container');

        for (let content of customform.contents) {
            renderData(content, dataContainer);
        }

        for (let task of customform.tasks) {
            renderTask(task, taskContainer);
        }

        let popUp = kerdx.popUp(editForm);
        popUp.find('#toggle-window').click();

        make(editForm, customform._id);
    }

    let create = () => {
        let createForm = kerdx.createForm({
            title: 'Create Form', attributes: { enctype: 'multipart/form-data', id: 'create-custom-form-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name' } },
                title: { element: 'input', attributes: { id: 'title', name: 'title' } },
                target: { element: 'input', attributes: { id: 'target', name: 'target', ignore: true }, label: kerdx.createElement({ element: 'a', text: 'Target', children: [{ element: 'i', attributes: { class: 'icon fas fa-plus', id: 'set-target', ignore: true } }] }).innerHTML },
                columns: { element: 'input', attributes: { id: 'columns', name: 'columns', type: 'number', ignore: true } }
            },
            buttons: {
                'newContainers': {
                    element: 'div', attributes: {
                        id: 'task-data-container'
                    }, children: [
                        { element: 'div', attributes: { id: 'data-container' } },
                        { element: 'div', attributes: { id: 'tasks-container' } }
                    ]
                },
                'actions': {
                    element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                        { element: 'i', attributes: { id: 'single-form-data', class: 'action', title: 'Add Data', 'data-icon': kerdx.icons.plus } },
                        { element: 'i', attributes: { id: 'single-form-task', class: 'action', title: 'Add Task', 'data-icon': kerdx.icons.tasks } },
                        { element: 'i', attributes: { id: 'preview-icon', class: 'action', title: 'Preview Form', 'data-icon': kerdx.icons.eye } }
                    ]
                },
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create', state: { name: 'submit', owner: '#create-custom-form-form' } },
            }, columns: 2
        });

        let popUp = kerdx.popUp(createForm);
        popUp.find('#toggle-window').click();
        dataContainer = createForm.find('.kerdx-form-buttons').find('#data-container');
        taskContainer = createForm.find('.kerdx-form-buttons').find('#tasks-container');

        make(createForm);
    }

    let _delete = () => {
        let id = urlVars.vars.id;
        system.connect({ data: { action: 'deleteCustomForm', id } }).then(result => {
            system.redirect(location + '/settings.html?page=forms');
        });
    }

    let make = (form, id) => {
        dataContainer = form.find('.kerdx-form-buttons').find('#data-container');
        let updateTarget = (targetName) => {
            targetName = kerdx.inBetween(targetName, '$#&{', '}&#$');
            try {
                targetName = JSON.parse(targetName).collection;
            } catch (error) {
                system.notify({ note: "Form's Target is invalid" });
                return;
            }

            system.connect({ data: { action: 'getCollectionKeys', name: targetName } }).then(result => {
                targets = result;
            });
        }

        updateTarget(form.find('#target').value);

        form.find('#single-form-data').addEventListener('click', event => {
            createData(data => {
                renderData(data, dataContainer);
            });
        });

        form.find('#single-form-task').addEventListener('click', event => {
            if (form.find('#target').value == '') {
                system.notify({ note: `You must set the form's target before adding task` });
                return;
            }
            createTask(data => {
                renderTask(data, taskContainer);
            });
        });

        form.find('#set-target').addEventListener('click', event => {
            system.setSources((target, type) => {
                if (type == 'table') {
                    form.find('#target').value = target;
                    form.find('#target').dispatchEvent(new CustomEvent('change'));
                    return true;
                }
                else {
                    system.notify({ note: `Table expected. ${type} provided` });
                    return false;
                }
            });
        });

        form.find('#target').addEventListener('change', event => {
            updateTarget(event.target.value);
        });

        form.find('#preview-icon').addEventListener('click', event => {
            preview(form);
        });

        form.addEventListener('click', event => {
            let target = event.target;
            if (target.classList.contains('remove-data')) {
                target.getParents('.single-form-data').remove();
            }
            else if (target.classList.contains('edit-data')) {
                editData(target.getParents('.single-form-data').value, data => {
                    target.getParents('.single-form-data').find('#readabledata').innerHTML = getReadable(data, 'data').innerHTML;
                    target.getParents('.single-form-data').value = data;
                });
            }
            else if (target.classList.contains('clone-data')) {
                cloneData(target.getParents('.single-form-data').value, data => {
                    renderData(data, dataContainer);
                });
            }
            if (target.classList.contains('remove-task')) {
                target.getParents('.single-form-task').remove();
            }
            else if (target.classList.contains('edit-task')) {
                editTask(target.getParents('.single-form-task').value, task => {
                    target.getParents('.single-form-task').find('#readabletask').innerHTML = getReadable(task, 'task').innerHTML;
                    target.getParents('.single-form-task').value = task;
                });
            }
            else if (target.classList.contains('clone-task')) {
                cloneTask(target.getParents('.single-form-task').value, task => {
                    renderData(task, taskContainer);
                });
            }
        });

        form.addEventListener('submit', event => {
            event.preventDefault();

            let formValidation = kerdx.validateForm(form);

            if (!formValidation.flag) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            let data = kerdx.jsonForm(form);
            data.contents = [];
            let allData = dataContainer.findAll('.single-form-data');
            for (let i = 0; i < allData.length; i++) {
                data.contents.push(allData[i].value);
            }

            data.tasks = [];
            let allTasks = taskContainer.findAll('.single-form-task');
            for (let i = 0; i < allTasks.length; i++) {
                data.tasks.push(allTasks[i].value);
            }

            if (data.contents.length == 0) {
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Please add some data` });
                return;
            }

            data.action = kerdx.isset(id) ? 'editCustomForm' : 'createCustomForm';
            if (kerdx.isset(id)) data.id = id
            data.contents = JSON.stringify(data.contents);
            data.tasks = JSON.stringify(data.tasks);

            system.connect({ data }).then(result => {
                if (result == 1) {
                    system.notify({ note: `Custom Form ${kerdx.isset(id) ? 'Editted' : 'Created'}` });
                    system.reload();
                }
                else if (result.found) {
                    system.notify({ note: `${result.found} already in exists` });
                }
                else {
                    system.notify({ note: `Custom Form was not ${kerdx.isset(id) ? 'Editted' : 'Created'}` });
                }
            });
        });
    }

    let getReadable = (data, type) => {
        let readable = kerdx.createElement({ element: 'span', attributes: { id: `readable${type}`, class: `readable-${type}-container` } });

        for (let name in data) {
            let aRead = readable.makeElement({
                element: 'p', attributes: { class: `single-readable-${type}` }, children: [
                    { element: 'a', text: name, attributes: { class: `single-readable-${type}-name` } },
                    { element: 'a', text: data[name], attributes: { class: `single-readable-${type}-value` } }
                ]
            });

            if (name == 'source') {
                aRead.find(`.single-readable-${type}-value`).textContent = data[name].slice(0, 10) + '...';
            }
        }
        return readable;
    }

    let renderData = (data, dataContainer) => {
        let newData = dataContainer.makeElement({
            element: 'span', attributes: { class: 'single-form-data' }, children: [
                getReadable(data, 'data'),
                {
                    element: 'span', attributes: { class: 'single-form-data-controls' }, children: [
                        { element: 'i', attributes: { class: 'edit-data fas fa-pen icon' } },
                        { element: 'i', attributes: { class: 'clone-data fas fa-clone icon' } },
                        { element: 'i', attributes: { class: 'remove-data fas fa-times icon' } }
                    ]
                }
            ]
        });

        newData.value = data;
    }

    let renderTask = (task, taskContainer) => {
        let newTask = taskContainer.makeElement({
            element: 'span', attributes: { class: 'single-form-task' }, children: [
                getReadable(task, 'task'),
                {
                    element: 'span', attributes: { class: 'single-form-task-controls' }, children: [
                        { element: 'i', attributes: { class: 'edit-task fas fa-pen icon' } },
                        { element: 'i', attributes: { class: 'clone-task fas fa-clone icon' } },
                        { element: 'i', attributes: { class: 'remove-task fas fa-times icon' } }
                    ]
                }
            ]
        });

        newTask.value = task;
    }

    if (!kerdx.isset(urlVars.vars.action) || urlVars.vars.action == 'view') {
        settingsMainWindow.makeElement([
            {
                element: 'div', attributes: { class: 'settings-sub-menu' }, children: [
                    { element: 'i', attributes: { class: 'fas fa-plus', id: 'new-icon' } }
                ]
            },
            {
                element: 'div', attributes: { class: 'settings-content-window' }
            }
        ]);
        let mainContentWindow = settingsMainWindow.find('.settings-content-window');

        system.get({ collection: 'customforms', query: {}, projection: { name: 1, title: 1, recycled: 1 }, many: true }).then(customforms => {
            customforms = kerdx.array.findAll(customforms, item => {
                return item.recycled == undefined || item.recycled == false;
            });

            let customformsTable = kerdx.createTable({
                title: 'All Custom Forms', contents: customforms, search: true, sort: true
            });

            mainContentWindow.render(customformsTable);
            kerdx.listenTable({ options: ['view', 'clone', 'delete'], table: customformsTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.kerdx-table-column-cell').dataset;
                    let table = target.getParents('.kerdx-table');
                    let id = table.find(`.kerdx-table-column[data-name="_id"]`).find(`.kerdx-table-column-cell[data-row="${row}"]`).dataset.value;

                    if (target.id == 'kerdx-table-option-view') {
                        system.redirect('settings.html?page=forms&action=show&id=' + id);
                    }
                    else if (target.id == 'kerdx-table-option-clone') {
                        clone(id);
                    }
                    else if (target.id == 'kerdx-table-option-delete') {
                        system.redirect('settings.html?page=forms&action=delete&id=' + id);
                    }
                }
            });

            settingsMainWindow.find('#new-icon').addEventListener('click', event => {
                create();
            });
        });
    }
    else if (urlVars.vars.action == 'show') {
        show();
    }
    else if (urlVars.vars.action == 'clone') {
        clone();
    }
    else if (urlVars.vars.action == 'delete') {
        _delete();
    }
}

export { customForms };