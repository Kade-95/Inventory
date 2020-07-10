let reportGenerators = (mainBody) => {
    let settingsMainWindow = mainBody.find('#settings-main-window');
    let loading = perceptor.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });
    let urlVars = perceptor.urlSplitter(location.href);

    let dataContainer;
    let makeData = (form, callback, data) => {
        let popUp = perceptor.popUp(form);
        data = data || {};
        form.find('#display').addEventListener('change', event => {
            form.find('#source').value = '';
        });

        form.find('#set-source').addEventListener('click', event => {
            let display = form.find('#display').value;
            if (display == 'Null') {
                system.notify({ note: 'Please set the display first' });
                return;
            }
            system.setSources((source, type) => {
                if ((display == 'Line Graph' || display == 'Pie Chart' || display == 'Bar Graph') && type == 'list') {
                    form.find('#source').value = source;
                    return true;
                }
                else if (display.toLowerCase() == type.toLowerCase()) {
                    if (display == 'Text') {
                        form.find('#source').value += source;
                    }
                    else {
                        form.find('#source').value = source;
                    }
                    return true;
                }
                else {
                    if (display == 'Line Graph' || display == 'Pie Chart' || display == 'Bar Graph') {
                        system.notify({ note: `List expected. ${type} provided` });
                    }
                    else {
                        system.notify({ note: `${display} expected. ${type} provided` });
                    }
                    return false;
                }
            });
        });

        form.addEventListener('submit', event => {
            event.preventDefault();

            let formValidation = perceptor.validateForm(form);

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

            callback(perceptor.jsonForm(form));
            popUp.remove();
        });
    }

    let editData = (data, callback) => {
        let editDataForm = perceptor.createForm({
            title: 'Edit Data', attributes: { enctype: 'multipart/form-data', id: 'create-edit-data-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: data.name } },
                title: { element: 'input', attributes: { id: 'title', name: 'title', ignore: true, value: data.title } },
                display: { element: 'select', attributes: { id: 'display', name: 'display' }, options: ['Null', 'Line Graph', 'Pie Chart', 'Bar Graph', 'Table', 'List', 'Text'], note: 'Graph must have a source of List only.', selected: data.display },
                source: { element: 'input', note: 'This depends on the display you choose.', attributes: { value: data.source, id: 'source', name: 'source', ignore: true }, label: perceptor.createElement({ element: 'a', text: 'Source', children: [{ element: 'i', attributes: { class: 'fas fa-plus', id: 'set-source' } }] }).innerHTML },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['True', 'False'], selected: data.show }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit Data', state: { name: 'submit', owner: '#create-edit-data-form' } },
            }, columns: 2
        });

        makeData(editDataForm, callback, data);
    };

    let cloneData = (data, callback) => {
        let editDataForm = perceptor.createForm({
            title: 'Clone Data', attributes: { enctype: 'multipart/form-data', id: 'create-clone-data-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: data.name } },
                title: { element: 'select', attributes: { id: 'title', name: 'title', ignore: true, value: data.title } },
                display: { element: 'select', attributes: { id: 'display', name: 'display' }, options: ['Null', 'Line Graph', 'Pie Chart', 'Bar Graph', 'Table', 'List', 'Text'], note: 'Graph must have a source of List only.', selected: data.display },
                source: { element: 'input', note: 'This depends on the display you choose.', attributes: { value: data.source, id: 'source', name: 'source', ignore: true }, label: perceptor.createElement({ element: 'a', text: 'Source', children: [{ element: 'i', attributes: { class: 'fas fa-plus', id: 'set-source' } }] }).innerHTML },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['True', 'False'], selected: data.show }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone Data', state: { name: 'submit', owner: '#create-clone-data-form' } },
            }, columns: 2
        });

        makeData(editDataForm, callback);
    };

    let createData = (callback) => {
        let createDataForm = perceptor.createForm({
            title: 'Create Data', attributes: { enctype: 'multipart/form-data', id: 'create-create-data-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name' } },
                title: { element: 'input', attributes: { id: 'title', name: 'title', ignore: true } },
                display: { element: 'select', attributes: { id: 'display', name: 'display' }, options: ['Null', 'Line Graph', 'Pie Chart', 'Bar Graph', 'Table', 'List', 'Text'], note: 'Graph must have a source of List only.' },
                source: { element: 'input', note: 'This depends on the display you choose.', attributes: { id: 'source', name: 'source', ignore: true }, label: perceptor.createElement({ element: 'a', text: 'Source', children: [{ element: 'i', attributes: { class: 'fas fa-plus', id: 'set-source' } }] }).innerHTML },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['True', 'False'] }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create Data', state: { name: 'submit', owner: '#create-create-data-form' } },
            }, columns: 2
        });

        makeData(createDataForm, callback);
    }

    let preview = (form) => {
        let data = perceptor.jsonForm(form);
        data.contents = compileData(form);

        if (data.contents.length == 0) {
            system.notify({ note: 'Please add some data to preview' });
            return;
        }

        system.getSources(data.contents, fetched => {
            let report = perceptor.createElement({
                element: 'div', attributes: {
                    class: 'report-container'
                }, children: [
                    {
                        element: 'span', attributes: { class: 'report-container-title' },
                        text: data.title
                    },
                    { element: 'div', attributes: { id: 'report-window' } }
                ]
            });

            let reportPopup = perceptor.popUp(report);
            reportPopup.find('#toggle-window').click();
            for (let content of data.contents) {
                if (perceptor.isset(fetched[content.name])) {
                    content.fetched = fetched[content.name];
                }

                displayReport(report.find('#report-window'), content);
            }
        });
    }

    let displayReport = (container, data) => {
        if (data.display == 'Text') {
            let sources = perceptor.allCombine(data.source, '$#&{', '}&#$');
            let text = data.source;

            for (let i = 0; i < sources.length; i++) {
                text = text.replace(sources[i], data.fetched[i]);
            }

            container.makeElement({
                element: 'div', attributes: { class: 'report-single' }, children: [
                    { element: 'h2', attributes: { class: 'report-single-title' }, text: data.title },
                    { element: 'p', attributes: { class: 'text-report report-single-content' }, text }
                ]
            });
        }
        else if (data.display == 'Table') {
            let contents = [];
            for (let i = 0; i < data.fetched.length; i++) {
                contents = contents.concat(data.fetched[i]);
            }
            let table = perceptor.createTable({ title: data.title, contents });
            container.append(table)
        }
        else if (data.display == 'List') {
            let contents = [];
            for (let i = 0; i < data.fetched.length; i++) {
                contents = contents.concat(data.fetched[i]);
            }
            container.makeElement({
                element: 'div', attributes: { class: 'list-report report-single-content' }, children: [
                    { element: 'h2', attributes: { class: 'report-single-title' }, text: data.title },
                    { element: 'span', attributes: { class: 'list-report-content' } }
                ]
            });

            for (let text of contents) {
                container.find('.list-report-content').makeElement({
                    element: 'span', attributes: { class: 'list-report-item' }, children: [
                        { element: 'i', attributes: { class: 'list-report-item-bullet', 'data-icon': 'fas, fa-arrow-right' } },
                        { element: 'a', attributes: { class: 'list-report-item-value' }, text }
                    ]
                });
            }
        }
        else if (data.display.includes('Graph') || data.display.includes('Chart')) {
            let contents = [];

            for (let i = 0; i < data.fetched.length; i++) {
                contents = contents.concat(data.fetched[i]);
            }
            let type;
            if (data.display == 'Pie Chart') type = 'pie';
            else if (data.display == 'Bar Graph') type = 'bar';
            else if (data.display == 'Line Graph') type = 'line';

            system.plot({ type, data: contents, title: data.title }, (canvas, plotted) => {
                container.makeElement({
                    element: 'div', attributes: { class: 'report-single-content' }, children: [
                        canvas
                    ]
                });
                canvas.css({ width: '60vw' });
            });
        }
    }

    let compileData = () => {
        let allData = dataContainer.findAll('.single-form-data');
        let data = [];
        for (let i = 0; i < allData.length; i++) {
            data.push(allData[i].value);
        }
        return data;
    }

    let show = () => {
        let id = urlVars.id;
        system.get({ collection: 'reportgenerators', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(reportgenerator => {
            settingsMainWindow.makeElement([
                {
                    element: 'span', attributes: { id: 'reportgenerator-name' }, children: [
                        { element: 'h2', attributes: { id: 'reportgenerator-name-text' }, text: reportgenerator.name },
                        {
                            element: 'span', attributes: { id: 'reportgenerator-controls' }, children: [
                                { element: 'i', attributes: { class: 'icon fas fa-pen', id: 'edit-reportgenerator', title: 'Edit' } },
                                { element: 'i', attributes: { class: 'icon fas fa-clone', id: 'clone-reportgenerator', title: 'Clone' } },
                                { element: 'a', attributes: { class: 'icon fas fa-trash-alt', title: 'Delete', href: 'settings.html?page=reportGenerators&action=delete&id=' + reportgenerator._id } },
                            ]
                        }
                    ]
                },
                {
                    element: 'div', attributes: { id: 'reportgenerator-details' }, children: [
                        {
                            element: 'div', attributes: { id: 'reportgenerator-main-details' }, children: [
                                {
                                    element: 'span', attributes: { class: 'reportgenerator-main-details-single' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-envelope' } },
                                        { element: 'p', attributes: { class: 'reportgenerator-main-details-name' }, text: 'Title' },
                                        { element: 'p', attributes: { class: 'reportgenerator-main-details-value' }, text: reportgenerator.title }
                                    ]
                                }
                            ]
                        },
                        {
                            element: 'div', attributes: { id: 'reportgenerator-contents' }, children: [
                                perceptor.createTable({
                                    title: 'Report Generator Data', contents: reportgenerator.contents, sort: true
                                })
                            ]
                        }
                    ]
                },
            ]);

            settingsMainWindow.find('#clone-reportgenerator').addEventListener('click', event => {
                clone(id);
            });

            settingsMainWindow.find('#edit-reportgenerator').addEventListener('click', event => {
                edit(reportgenerator);
            });
        });
    }

    let clone = (id) => {
        system.get({ collection: 'reportgenerators', query: { _id: id }, projection: { image: 0 }, changeQuery: { _id: 'objectid' } }).then(reportgenerator => {
            let cloneReportGenerator = perceptor.createForm({
                title: 'Clone Form', attributes: { enctype: 'multipart/form-data', id: 'clone-custom-form-form', class: 'form' },
                contents: {
                    name: { element: 'input', attributes: { id: 'name', name: 'name', value: reportgenerator.name } },
                    title: { element: 'input', attributes: { id: 'title', name: 'title', value: reportgenerator.title } },
                },
                buttons: {
                    'dataContainer': { element: 'div', attributes: { id: 'data-container' } },
                    'data': {
                        element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                            { element: 'i', attributes: { class: 'action', id: 'new-icon', title: 'Add Data', 'data-icon': perceptor.icons.plus } },
                            { element: 'i', attributes: { class: 'action', id: 'preview-icon', title: 'Add Data', 'data-icon': perceptor.icons.eye } }
                        ]
                    },
                    submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone', state: { name: 'submit', owner: '#clone-custom-form-form' } },
                }, columns: 2
            });

            let dataContainer = cloneReportGenerator.find('.perceptor-form-buttons').find('#data-container');

            for (let content of reportgenerator.contents) {
                renderData(content, dataContainer);
            }
            let popUp = perceptor.popUp(cloneReportGenerator);
            popUp.find('#toggle-window').click();

            make(cloneReportGenerator);
        });
    }

    let edit = (reportgenerator) => {
        let editReportGenerator = perceptor.createForm({
            title: 'Edit Report Generator', attributes: { enctype: 'multipart/form-data', id: 'edit-report-generator-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: reportgenerator.name } },
                title: { element: 'input', attributes: { id: 'title', name: 'title', value: reportgenerator.title } },
            },
            buttons: {
                'dataContainer': { element: 'div', attributes: { id: 'data-container' } },
                'data': {
                    element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                        { element: 'i', attributes: { id: 'new-icon', class: 'action', title: 'Add Data', 'data-icon': perceptor.icons.plus } },
                        { element: 'i', attributes: { id: 'preview-icon', class: 'action', title: 'Preview Report', 'data-icon': perceptor.icons.eye } }
                    ]
                },
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit', state: { name: 'submit', owner: '#edit-report-generator-form' } },
            }, columns: 2
        });

        let dataContainer = editReportGenerator.find('.perceptor-form-buttons').find('#data-container');
        for (let content of reportgenerator.contents) {
            renderData(content, dataContainer);
        }
        let popUp = perceptor.popUp(editReportGenerator);
        popUp.find('#toggle-window').click();

        make(editReportGenerator, reportgenerator._id);
    }

    let create = () => {
        let createForm = perceptor.createForm({
            title: 'Create Report Generator', attributes: { enctype: 'multipart/perceptor-form-data', id: 'create-report-generator-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name' } },
                title: { element: 'input', attributes: { id: 'title', name: 'title' } },
            },
            buttons: {
                'dataContainer': { element: 'div', attributes: { id: 'data-container' } },
                'data': {
                    element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                        { element: 'i', attributes: { id: 'new-icon', title: 'Add Data', class: 'action', 'data-icon': perceptor.icons.plus } },
                        { element: 'i', attributes: { id: 'preview-icon', class: 'action', title: 'Preview Report Generator', 'data-icon': perceptor.icons.eye } }
                    ]
                },
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create', state: { name: 'submit', owner: '#create-report-generator-form' } },
            }, columns: 2
        });

        let popUp = perceptor.popUp(createForm);
        popUp.find('#toggle-window').click();
        make(createForm);
    }

    let _delete = () => {
        let id = urlVars.vars.id;
        system.connect({ data: { action: 'deleteReportGenerator', id } }).then(result => {
            system.redirect(location + '/settings.html?page=reportGenerators');
        });
    }

    let make = (form, id) => {
        dataContainer = form.find('.perceptor-form-buttons').find('#data-container');

        form.find('#new-icon').addEventListener('click', event => {
            createData(data => {
                renderData(data, dataContainer);
            });
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
                    target.getParents('.single-form-data').find('#readabledata').innerHTML = getReadable(data, 'data');
                    target.getParents('.single-form-data').value = data;
                });
            }
            else if (target.classList.contains('clone-data')) {
                cloneData(target.getParents('.single-form-data').value, data => {
                    renderData(data, dataContainer);
                });
            }
        });

        form.addEventListener('submit', event => {
            event.preventDefault();

            let formValidation = perceptor.validateForm(form);

            if (!formValidation.flag) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            let data = perceptor.jsonForm(form);
            data.contents = compileData(form);

            if (data.contents.length == 0) {
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Please add some data` });
                return;
            }

            data.action = perceptor.isset(id) ? 'editReportGenerator' : 'createReportGenerator';
            if (perceptor.isset(id)) data.id = id

            data.contents = JSON.stringify(data.contents);
            system.connect({ data }).then(result => {
                if (result == 1) {
                    system.notify({ note: `Report Generator ${perceptor.isset(id) ? 'Editted' : 'Created'}` });
                    system.reload();
                }
                else if (result.found) {
                    system.notify({ note: `${result.found} already in exists` });
                }
                else {
                    system.notify({ note: `Report Generator was not ${perceptor.isset(id) ? 'Editted' : 'Created'}` });
                }
            });
        });
    }

    let getReadable = (data, type) => {
        let readable = perceptor.createElement({ element: 'span', attributes: { id: `readable${type}`, class: `readable-${type}-container` } });

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

    if (!perceptor.isset(urlVars.vars.action) || urlVars.vars.action == 'view') {
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

        system.get({ collection: 'reportgenerators', query: {}, projection: { name: 1, title: 1 }, many: true }).then(customreports => {
            let reportGeneratorTable = perceptor.createTable({
                title: 'All Report Generators', contents: customreports, search: true, sort: true
            });

            mainContentWindow.render(reportGeneratorTable);
            perceptor.listenTable({ options: ['view', 'clone', 'delete'], table: reportGeneratorTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.perceptor-table-column-cell').dataset;
                    let table = target.getParents('.perceptor-table');
                    let id = table.find(`.perceptor-table-column[data-name="_id"]`).find(`.perceptor-table-column-cell[data-row="${row}"]`).dataset.value;

                    if (target.id == 'perceptor-table-option-view') {
                        system.redirect('settings.html?page=reportGenerators&action=show&id=' + id);
                    }
                    else if (target.id == 'perceptor-table-option-clone') {
                        clone(id);
                    }
                    else if (target.id == 'perceptor-table-option-delete') {
                        system.redirect('settings.html?page=reportGenerators&action=delete&id=' + id);
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

export { reportGenerators }