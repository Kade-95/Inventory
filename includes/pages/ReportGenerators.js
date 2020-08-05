let reportGenerators = (mainBody) => {
    let settingsMainWindow = mainBody.find('#settings-main-window');
    let loading = kerdx.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });
    let urlVars = kerdx.urlSplitter(location.href);

    let dataContainer;
    let makeData = (form, callback, data) => {
        let popUp = kerdx.popUp(form);
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
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: data.name } },
                title: { element: 'input', attributes: { id: 'title', name: 'title', ignore: true, value: data.title } },
                display: { element: 'select', attributes: { id: 'display', name: 'display' }, options: ['Null', 'Line Graph', 'Pie Chart', 'Bar Graph', 'Table', 'List', 'Text'], note: 'Graph must have a source of List only.', selected: data.display },
                source: { element: 'input', note: 'This depends on the display you choose.', attributes: { value: data.source, id: 'source', name: 'source', ignore: true }, label: kerdx.createElement({ element: 'a', text: 'Source', children: [{ element: 'i', attributes: { class: 'fas fa-plus', id: 'set-source' } }] }).innerHTML },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['True', 'False'], selected: data.show }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit Data', state: { name: 'submit', owner: '#create-edit-data-form' } },
            }, columns: 2
        });

        makeData(editDataForm, callback, data);
    };

    let cloneData = (data, callback) => {
        let editDataForm = kerdx.createForm({
            title: 'Clone Data', attributes: { enctype: 'multipart/form-data', id: 'create-clone-data-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: data.name } },
                title: { element: 'select', attributes: { id: 'title', name: 'title', ignore: true, value: data.title } },
                display: { element: 'select', attributes: { id: 'display', name: 'display' }, options: ['Null', 'Line Graph', 'Pie Chart', 'Bar Graph', 'Table', 'List', 'Text'], note: 'Graph must have a source of List only.', selected: data.display },
                source: { element: 'input', note: 'This depends on the display you choose.', attributes: { value: data.source, id: 'source', name: 'source', ignore: true }, label: kerdx.createElement({ element: 'a', text: 'Source', children: [{ element: 'i', attributes: { class: 'fas fa-plus', id: 'set-source' } }] }).innerHTML },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['True', 'False'], selected: data.show }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone Data', state: { name: 'submit', owner: '#create-clone-data-form' } },
            }, columns: 2
        });

        makeData(editDataForm, callback);
    };

    let createData = (callback) => {
        let createDataForm = kerdx.createForm({
            title: 'Create Data', attributes: { enctype: 'multipart/form-data', id: 'create-create-data-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name' } },
                title: { element: 'input', attributes: { id: 'title', name: 'title', ignore: true } },
                display: { element: 'select', attributes: { id: 'display', name: 'display' }, options: ['Null', 'Line Graph', 'Pie Chart', 'Bar Graph', 'Table', 'List', 'Text'], note: 'Graph must have a source of List only.' },
                source: { element: 'input', note: 'This depends on the display you choose.', attributes: { id: 'source', name: 'source', ignore: true }, label: kerdx.createElement({ element: 'a', text: 'Source', children: [{ element: 'i', attributes: { class: 'fas fa-plus', id: 'set-source' } }] }).innerHTML },
                show: { element: 'select', attributes: { id: 'show', name: 'show' }, options: ['True', 'False'] }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create Data', state: { name: 'submit', owner: '#create-create-data-form' } },
            }, columns: 2
        });

        makeData(createDataForm, callback);
    }

    let preview = (form) => {
        let data = kerdx.jsonForm(form);
        data.contents = compileData(form);

        if (data.contents.length == 0) {
            system.notify({ note: 'Please add some data to preview' });
            return;
        }
        getGraphsDuration(data.contents, durationed => {//set the durations
            data.contents = durationed;
            system.getSources(data.contents, fetched => {
                let report = kerdx.createElement({
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

                for (let content of data.contents) {
                    if (kerdx.isset(fetched[content.name])) {
                        content.fetched = fetched[content.name];
                    }
                }
                getGraphsLabels(data.contents, labelled => {
                    data.contents = labelled;

                    let reportPopup = kerdx.popUp(report);
                    reportPopup.find('#toggle-window').click();
                    for (let content of data.contents) {
                        displayReport(report.find('#report-window'), content);
                    }
                });
            });
        });
    }

    let displayReport = (container, data) => {
        if (data.display == 'Text') {
            let sources = kerdx.allCombine(data.source, '$#&{', '}&#$');
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
            let table = kerdx.createTable({ title: data.title, contents });
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

            system.plot({ type, data: contents, title: data.title, labels: data.labels }, (canvas, plotted) => {
                container.makeElement({
                    element: 'div', attributes: { class: 'report-single-content' }, children: [
                        canvas
                    ]
                });
                canvas.css({ width: '60vw' });
            });
        }
    }

    let getGraphsDuration = (contents, callback) => {
        let details = kerdx.createElement({ element: 'div', attributes: { class: 'graph-details' } });

        for (let con of contents) {
            if (con.display.includes('Graph') || con.display.includes('Chart')) {
                let single = details.makeElement({
                    element: 'div', attributes: { class: 'graph-details-single' }, children: [
                        { element: 'h2', attributes: { class: 'graph-details-single-name' }, text: con.name },
                        {
                            element: 'div', attributes: { class: 'graph-details-single-content' }, children: [
                                {
                                    element: 'span', attributes: { class: 'graph-details-single-duration-start' }, children: [
                                        { element: 'label', attributes: { class: 'graph-details-single-duration-start-label' }, text: 'Start' },
                                        { element: 'input', attributes: { class: 'graph-details-single-duration-start-date', type: 'date', id: `${con.name}-start-date` } },
                                        { element: 'input', attributes: { class: 'graph-details-single-duration-start-time', type: 'time', id: `${con.name}-start-time` } }
                                    ]
                                },
                                {
                                    element: 'span', attributes: { class: 'graph-details-single-duration-end' }, children: [
                                        { element: 'label', attributes: { class: 'graph-details-single-duration-end-label' }, text: 'End' },
                                        { element: 'input', attributes: { class: 'graph-details-single-duration-end-date', type: 'date', id: `${con.name}-end-date` } },
                                        { element: 'input', attributes: { class: 'graph-details-single-duration-end-time', type: 'time', id: `${con.name}-end-time` } }
                                    ]
                                }
                            ]
                        }
                    ]
                });
            }
        }

        let popUp = kerdx.popUp(details, { title: 'Set Durtions for Report Graphs' });
        popUp.find('#toggle-window').click();

        if (contents.length) {
            let submit = details.makeElement({ element: 'button', attributes: { class: 'btn btn-medium', id: 'set-graph-details' }, text: 'Set Durations' });

            let data = {}
            submit.addEventListener('click', event => {
                for (let i in contents) {
                    contents[i].duration = {
                        startDate: details.find(`#${contents[i].name}-start-date`).value,
                        startTime: details.find(`#${contents[i].name}-start-time`).value,
                        endDate: details.find(`#${contents[i].name}-end-date`).value,
                        endTime: details.find(`#${contents[i].name}-end-time`).value
                    };
                }
                callback(contents);
                popUp.remove();
            });
        }
        else {
            callback(contents);
            popUp.remove();
        }
    }

    let getGraphsLabels = (contents, callback) => {
        let details = kerdx.createElement({ element: 'div', attributes: { class: 'graph-details' } });

        for (let con of contents) {
            if (con.display.includes('Graph') || con.display.includes('Chart')) {
                let single = details.makeElement({
                    element: 'div', attributes: { class: 'graph-details-single' }, children: [
                        { element: 'h2', attributes: { class: 'graph-details-single-name' }, text: con.name }
                    ]
                });

                let length = 0;

                for (let f of con.fetched) {
                    if (length < f.length) length = f.length;
                }
                single.makeElement({
                    element: 'div', attributes: { class: 'graph-details-single-content' }, children: [
                        { element: 'span', attributes: { class: 'graph-details-single-label-note' }, text: `Set ${length} ',' seperated labels` },
                        { element: 'input', attributes: { class: `graph-details-single-label-data ${con.name}-label` } }
                    ]
                });
            }
        }

        let popUp = kerdx.popUp(details, { title: 'Set Labels for Report Graphs' });
        popUp.find('#toggle-window').click();

        if (contents.length) {
            let submit = details.makeElement({ element: 'button', attributes: { class: 'btn btn-medium', id: 'set-graph-details' }, text: 'Set Labels' });

            submit.addEventListener('click', event => {
                for (let i in contents) {
                    contents[i].labels = [];
                    let labels = details.findAll(`.${contents[i].name}-label`);
                    for (let j = 0; j < labels.length; j++) {
                        contents[i].labels.push(labels[j].value.split(','));
                    }
                }
                callback(contents);
                popUp.remove();
            });
        }
        else {
            callback(contents);
            popUp.remove();
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
                                kerdx.createTable({
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
            let cloneReportGenerator = kerdx.createForm({
                title: 'Clone Form', attributes: { enctype: 'multipart/form-data', id: 'clone-custom-form-form', class: 'form' },
                contents: {
                    name: { element: 'input', attributes: { id: 'name', name: 'name', value: reportgenerator.name } },
                    title: { element: 'input', attributes: { id: 'title', name: 'title', value: reportgenerator.title } },
                },
                buttons: {
                    'dataContainer': { element: 'div', attributes: { id: 'data-container' } },
                    'data': {
                        element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                            { element: 'i', attributes: { class: 'action', id: 'new-icon', title: 'Add Data', 'data-icon': kerdx.icons.plus } },
                            { element: 'i', attributes: { class: 'action', id: 'preview-icon', title: 'Add Data', 'data-icon': kerdx.icons.eye } }
                        ]
                    },
                    submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone', state: { name: 'submit', owner: '#clone-custom-form-form' } },
                }, columns: 2
            });

            let dataContainer = cloneReportGenerator.find('.kerdx-form-buttons').find('#data-container');

            for (let content of reportgenerator.contents) {
                renderData(content, dataContainer);
            }
            let popUp = kerdx.popUp(cloneReportGenerator);
            popUp.find('#toggle-window').click();

            make(cloneReportGenerator);
        });
    }

    let edit = (reportgenerator) => {
        let editReportGenerator = kerdx.createForm({
            title: 'Edit Report Generator', attributes: { enctype: 'multipart/form-data', id: 'edit-report-generator-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: reportgenerator.name } },
                title: { element: 'input', attributes: { id: 'title', name: 'title', value: reportgenerator.title } },
            },
            buttons: {
                'dataContainer': { element: 'div', attributes: { id: 'data-container' } },
                'data': {
                    element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                        { element: 'i', attributes: { id: 'new-icon', class: 'action', title: 'Add Data', 'data-icon': kerdx.icons.plus } },
                        { element: 'i', attributes: { id: 'preview-icon', class: 'action', title: 'Preview Report', 'data-icon': kerdx.icons.eye } }
                    ]
                },
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit', state: { name: 'submit', owner: '#edit-report-generator-form' } },
            }, columns: 2
        });

        let dataContainer = editReportGenerator.find('.kerdx-form-buttons').find('#data-container');
        for (let content of reportgenerator.contents) {
            renderData(content, dataContainer);
        }
        let popUp = kerdx.popUp(editReportGenerator);
        popUp.find('#toggle-window').click();

        make(editReportGenerator, reportgenerator._id);
    }

    let create = () => {
        let createForm = kerdx.createForm({
            title: 'Create Report Generator', attributes: { enctype: 'multipart/kerdx-form-data', id: 'create-report-generator-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name' } },
                title: { element: 'input', attributes: { id: 'title', name: 'title' } },
            },
            buttons: {
                'dataContainer': { element: 'div', attributes: { id: 'data-container' } },
                'data': {
                    element: 'div', attributes: { id: 'single-form-actions-container' }, children: [
                        { element: 'i', attributes: { id: 'new-icon', title: 'Add Data', class: 'action', 'data-icon': kerdx.icons.plus } },
                        { element: 'i', attributes: { id: 'preview-icon', class: 'action', title: 'Preview Report Generator', 'data-icon': kerdx.icons.eye } }
                    ]
                },
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create', state: { name: 'submit', owner: '#create-report-generator-form' } },
            }, columns: 2
        });

        let popUp = kerdx.popUp(createForm);
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
        dataContainer = form.find('.kerdx-form-buttons').find('#data-container');

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

            let formValidation = kerdx.validateForm(form);

            if (!formValidation.flag) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            let data = kerdx.jsonForm(form);
            data.contents = compileData(form);

            if (data.contents.length == 0) {
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Please add some data` });
                return;
            }

            data.action = kerdx.isset(id) ? 'editReportGenerator' : 'createReportGenerator';
            if (kerdx.isset(id)) data.id = id

            data.contents = JSON.stringify(data.contents);
            system.connect({ data }).then(result => {
                if (result == 1) {
                    system.notify({ note: `Report Generator ${kerdx.isset(id) ? 'Editted' : 'Created'}` });
                    system.reload();
                }
                else if (result.found) {
                    system.notify({ note: `${result.found} already in exists` });
                }
                else {
                    system.notify({ note: `Report Generator was not ${kerdx.isset(id) ? 'Editted' : 'Created'}` });
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

        system.get({ collection: 'reportgenerators', query: {}, projection: { name: 1, title: 1, recycled: 1 }, many: true }).then(foundReportGenerators => {
            foundReportGenerators = kerdx.array.findAll(foundReportGenerators, item => {
                return item.recycled == undefined || item.recycled == false;
            });

            let reportGeneratorTable = kerdx.createTable({
                title: 'All Report Generators', contents: foundReportGenerators, search: true, sort: true
            });

            mainContentWindow.render(reportGeneratorTable);
            kerdx.listenTable({ options: ['view', 'clone', 'delete'], table: reportGeneratorTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.kerdx-table-column-cell').dataset;
                    let table = target.getParents('.kerdx-table');
                    let id = table.find(`.kerdx-table-column[data-name="_id"]`).find(`.kerdx-table-column-cell[data-row="${row}"]`).dataset.value;

                    if (target.id == 'kerdx-table-option-view') {
                        system.redirect('settings.html?page=reportGenerators&action=show&id=' + id);
                    }
                    else if (target.id == 'kerdx-table-option-clone') {
                        clone(id);
                    }
                    else if (target.id == 'kerdx-table-option-delete') {
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