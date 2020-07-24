class History {
    constructor() {
        this.url;
    }

    display() {
        let main = document.body.find('#main-window');
        let mainBody = main.find('#main-container-body');

        mainBody.render([
            {
                element: 'div', attributes: { id: 'main-container-body-main-actions' }, children: [
                    { element: 'span', attributes: { id: 'more-items-controls' } }
                ]
            },
            {
                element: 'div', attributes: { id: 'history-main-window' }
            }
        ]);

        this.url = perceptor.urlSplitter(location.href);
        let page = this.url.vars.page;
        if (!Object.values(this.url.vars).length) {
            this.view(mainBody.find('#history-main-window'));
        }
        else if (perceptor.isset(this[page])) {
            this[page](mainBody.find('#history-main-window'));
        }
        else {
            system.display404(mainBody.find('#history-main-window'));
        }
    }

    view(container) {
        system.get({ collection: 'history', query: {}, projection: {}, many: true }).then(result => {

            let historyTable = perceptor.createTable({ title: 'Items Table', contents: result, search: true, sort: true, filter: ['All', 'Enough', 'Excess', 'Low'], projection: { action: 1, timeCreated: 1, by: 1 } });
            container.render(historyTable);

            let performers = perceptor.array.toSet(perceptor.object.valueOfObjectArray(result, 'by'));//get the performers set

            let run = {};
            for (let p of performers) {
                run[p] = system.get({ collection: 'users', query: { _id: p }, options: { projection: { fullName: 1, _id: 0 } }, changeQuery: { _id: 'objectid' } })
            }

            let byColumns = historyTable.find(`.perceptor-table-column[data-name="by"]`).findAll('.perceptor-table-column-cell');

            perceptor.runParallel(run, ran => {
                let row;
                let time;
                for (let i = 0; i < byColumns.length; i++) {
                    if (!perceptor.isnull(ran[byColumns[i].textContent])) {
                        result[i].author = ran[byColumns[i].textContent].fullName;
                        byColumns[i].textContent = ran[byColumns[i].textContent].fullName;
                    }
                    row = byColumns[i].dataset.row;
                    time = historyTable.find(`.perceptor-table-column-cell[data-row="${row}"][data-name="timeCreated"]`);
                    time.textContent = perceptor.time_date(time.textContent);
                    result[i].period = time.textContent;
                }
            });

            perceptor.listenTable({ options: ['view'], table: historyTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.perceptor-table-column-cell').dataset;
                    let table = target.getParents('.perceptor-table');
                    let id = table.find(`.perceptor-table-column[data-name="_id"]`).find(`.perceptor-table-column-cell[data-row="${row}"]`).dataset.value;
                    let item = perceptor.array.find(result, t => {
                        return t._id == id;
                    });

                    if (target.id == 'perceptor-table-option-view') {
                        this.show(item)
                    }
                },

                filter: (sortValue, row) => {
                    let hide = false;
                    let cell = perceptor.array.find(row, value => {
                        return value.dataset.name == 'range';
                    });

                    if (sortValue == 'Enough') {
                        hide = cell.textContent != 'Enough';
                    }
                    else if (sortValue == 'Excess') {
                        hide = cell.textContent != 'Excess';
                    }
                    else if (sortValue == 'Low') {
                        hide = cell.textContent != 'Low';
                    }

                    return hide;
                }
            });
        });
    }

    show(event) {
        let eventWindow = perceptor.createElement({
            element: 'div', attributes: { class: 'history-event' }, children: [
                {
                    element: 'div', attributes: { class: 'history-event-details' }, children: [
                        {
                            element: 'span', attributes: { class: 'history-event-action-id' }, children: [
                                { element: 'h2', attributes: { class: 'history-event-action' }, text: event.action },
                                { element: 'a', attributes: { class: 'history-event-id' }, text: event._id }
                            ]
                        },
                        {
                            element: 'span', attributes: { class: 'history-event-time-by' }, children: [
                                { element: 'a', attributes: { class: 'history-event-time' }, text: event.period },
                                { element: 'a', attributes: { class: 'history-event-author' }, text: event.author }
                            ]
                        }
                    ]
                },
                {
                    element: 'div', attributes: { class: 'history-event-data' }
                }
            ]
        });

        let eventData = eventWindow.find('.history-event-data');
        perceptor.displayData(event.data, eventData);

        let popUp = perceptor.popUp(eventWindow);
        popUp.find('#toggle-window').click();
    }
}

export { History };