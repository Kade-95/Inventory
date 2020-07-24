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
                    { element: 'a', attributes: { class: 'icon fas fa-plus', id: 'new-icon', title: 'Create Report', href: 'reports.html?page=create' } },
                    { element: 'span', attributes: { id: 'main-container-body-main-actions-others' } }
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
        let fetch = { reportGenerators: system.get({ collection: 'reportgenerators', query: {}, many: true }), reports: system.get({ collection: 'reports', query: {}, many: true }) };

        perceptor.runParallel(fetch, result => {
            let run = {};
            let types = [];
            for (let report of result.reports) {
                console.log(report);
                report.timeCreated = perceptor.time_date(report.timeCreated);
                report.lastModified = perceptor.time_date(report.lastModified);;

                run[report.author] = system.get({ collection: 'users', query: { _id: report.author }, options: { projection: { userName: 1, _id: 0 } }, changeQuery: { _id: 'objectid' } });
            }

            for (let reportGenerator of result.reportGenerators) {
                if (!types.includes(reportGenerator.name)) {
                    types.push(reportGenerator.name);
                }
            }

            let selectCell = perceptor.cell({ element: 'select', name: 'Report', dataAttributes: {}, options: types });
            document.body.find('#main-container-body-main-actions-others').append(selectCell);

            let renderTable = value => {
                let id = perceptor.array.find(result.reportGenerators, generator => {
                    return generator.name == value;
                })._id;

                let contents = perceptor.array.findAll(result.reports, report => {
                    return report.content._id == id;
                });

                let reportsTable = perceptor.createTable({ title: value + ' Reports Table', contents, search: true, sort: true, projection: { content: -1 } });
                container.render(reportsTable);

                perceptor.listenTable({ options: ['view', 'edit', 'clone', 'delete'], table: reportsTable }, {
                    click: event => {
                        let target = event.target;
                        let { row } = target.getParents('.perceptor-table-column-cell').dataset;
                        let table = target.getParents('.perceptor-table');
                        let id = table.find(`.perceptor-table-column[data-name="_id"]`).find(`.perceptor-table-column-cell[data-row="${row}"]`).dataset.value;

                        if (target.id == 'perceptor-table-option-edit') {
                            system.redirect('reports.html?page=edit&id=' + id);
                        }
                        else if (target.id == 'perceptor-table-option-clone') {
                            system.redirect('reports.html?page=clone&id=' + id);
                        }
                        else if (target.id == 'perceptor-table-option-delete') {
                            system.redirect('reports.html?page=delete&id=' + id);
                        }
                        else if (target.id == 'perceptor-table-option-view') {
                            system.redirect('reports.html?page=show&id=' + id);
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

            perceptor.runParallel(run, authors => {
                for (let report of result.reports) {
                    report.author = authors[report.author].userName;
                }

                renderTable(types[0])
                selectCell.find('#Report-cell').onChanged(value => {
                    renderTable(value);
                });
            });
        });
    }

    show(container) {
        let id = this.url.vars.id;
        let printReport = perceptor.createElement({ element: 'button', attributes: { id: 'print-report', class: 'btn btn-medium' }, text: 'Print Report' });

        document.body.find('#main-container-body-main-actions-others').makeElement([
            {
                element: 'span', attributes: { id: 'item-controls' }, children: [
                    { element: 'i', attributes: { class: 'icon fas fa-pen', href: 'reports.html?page=edit&id=' + id } },
                    { element: 'i', attributes: { class: 'icon fas fa-clone', href: 'reports.html?page=clone&id=' + id } },
                    { element: 'a', attributes: { class: 'icon fas fa-trash-alt', href: 'reports.html?page=delete&id=' + id } },
                ]
            },
            printReport
        ]);

        system.get({ collection: 'reports', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(result => {
            let displayReport = (report) => {
                container.render(report);
            }

            this.renderReport(result.content, displayReport, false);

            printReport.addEventListener("click", event => {
                system.print(container);
            });
        });
    }

    make(content, id) {
        let data = { content: JSON.stringify(content), action: 'createReport' };
        if (perceptor.isset(id)) {
            data.action = 'editReport';
            data.id = id;
        }

        system.connect({ data }).then(result => {
            if (result == true) {
                if (perceptor.isset(id)) {
                    system.notify({ note: 'Report Editted' });
                }
                else {
                    system.notify({ note: 'Report Created' });
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
    }

    edit(container) {
        let id = this.url.vars.id;
        let saveReport = perceptor.createElement({ element: 'button', attributes: { id: 'save-report', class: 'btn btn-medium' }, text: 'Edit Report' });
        document.body.find('#main-container-body-main-actions-others').append(saveReport);

        system.get({ collection: 'reports', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(result => {
            let displayReport = (report, data) => {
                container.render(report);
                saveReport.data = data;
            }

            this.renderReport(result.content, displayReport);

            saveReport.addEventListener('click', event => {
                this.make(saveReport.data, id);
            });
        });
    }

    clone(container) {
        let id = this.url.vars.id;
        let saveReport = perceptor.createElement({ element: 'button', attributes: { id: 'save-report', class: 'btn btn-medium' }, text: 'Clone Report' });
        document.body.find('#main-container-body-main-actions-others').append(saveReport);

        system.get({ collection: 'reports', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(result => {
            let displayReport = (report, data) => {
                container.render(report);
                saveReport.data = data;
            }

            this.renderReport(result.content, displayReport);

            saveReport.addEventListener('click', event => {
                this.make(saveReport.data, id);
            });
        });
    }

    create(container) {
        perceptor.runParallel({
            reportGenerators: system.get({ collection: 'reportgenerators', query: {}, many: true })
        }, result => {
            let reportGenerators = result.reportGenerators;
            let types = perceptor.object.valueOfObjectArray(reportGenerators, 'name');
            let selectCell = perceptor.cell({ element: 'select', name: 'Report', dataAttributes: {}, options: types });
            let saveReport = perceptor.createElement({ element: 'button', attributes: { id: 'save-report', class: 'btn btn-medium', style: { display: 'none' } }, text: 'Save Report' });

            document.body.find('#main-container-body-main-actions-others').append(selectCell, saveReport);

            let selectedGenerator = perceptor.array.find(reportGenerators, generator => {
                return generator.name == types[0];
            });

            let displayReport = (report, data) => {
                container.render(report);
                saveReport.cssRemove(['display']);
                saveReport.data = data;
            }

            selectCell.find('#Report-cell').onChanged(value => {
                saveReport.css({ display: 'none' });
                selectedGenerator = perceptor.array.find(reportGenerators, form => {
                    return form.name == value;
                });
                this.renderReport(selectedGenerator, displayReport);
            });

            saveReport.addEventListener('click', event => {
                this.make(saveReport.data);
            });
        });
    }

    renderReport(data, callback, flag) {

        let done = () => {
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
            for (let content of data.contents) {
                this.displayReport(report.find('#report-window'), content);
            }

            callback(report, data);
        }

        if (perceptor.isset(flag)) {
            done();
        }
        else {
            this.getGraphsDuration(data.contents, durationed => {//set the durations
                data.contents = durationed;
                system.getSources(data.contents, fetched => {
                    for (let content of data.contents) {
                        if (perceptor.isset(fetched[content.name])) {
                            content.fetched = fetched[content.name];
                        }
                    }
                    this.getGraphsLabels(data.contents, labelled => {
                        data.contents = labelled;
                        done();
                    });
                });
            });
        }
    }

    displayReport(container, data) {
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

    getGraphsDuration(contents, callback) {
        let details = perceptor.createElement({ element: 'div', attributes: { class: 'graph-details' } });

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

                if (perceptor.isset(con.duration)) {
                    single.find(`#${con.name}-start-date`).value = con.duration.startDate;
                    single.find(`#${con.name}-start-time`).value = con.duration.startTime;
                    single.find(`#${con.name}-end-date`).value = con.duration.endDate;
                    single.find(`#${con.name}-end-time`).value = con.duration.endTime;
                }
            }
        }

        let popUp = perceptor.popUp(details, { title: 'Set Durtions for Report Graphs' });
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

    getGraphsLabels(contents, callback) {
        let details = perceptor.createElement({ element: 'div', attributes: { class: 'graph-details' } });

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
                        { element: 'input', attributes: { class: `graph-details-single-label-data`, id: `${con.name}-label` } }
                    ]
                });

                if (perceptor.isset(con.labels)) {
                    single.find(`#${con.name}-label`).value = con.labels.join(',');
                }
            }
        }

        let popUp = perceptor.popUp(details, { title: 'Set Labels for Report Graphs' });
        popUp.find('#toggle-window').click();

        if (contents.length) {
            let submit = details.makeElement({ element: 'button', attributes: { class: 'btn btn-medium', id: 'set-graph-details' }, text: 'Set Labels' });

            submit.addEventListener('click', event => {
                for (let i in contents) {
                    contents[i].labels = details.find(`#${contents[i].name}-label`).value.split(',');
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

    delete() {
        if (confirm('Report will be deleted. Continue?')) {
            let id = this.url.vars.id;
            system.connect({ data: { action: 'deleteReport', id } }).then(result => {
                system.redirect(location + '/reports.html?page=view');
            });
        } else {
            window.history.go(-1);
        }
    }
}

export { Reports };