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

        this.url = kerdx.urlSplitter(location.href);
        let page = this.url.vars.page;
        if (!Object.values(this.url.vars).length) {
            this.view(mainBody.find('#history-main-window'));
        }
        else if (kerdx.isset(this[page])) {
            this[page](mainBody.find('#history-main-window'));
        }
        else {
            system.display404(mainBody.find('#history-main-window'));
        }
    }

    view(container) {
        system.get({ collection: 'history', query: {}, projection: {}, many: true }).then(result => {

            let historyTable = kerdx.createTable({ title: 'Items Table', contents: result, search: true, sort: true, filter: ['All', 'Enough', 'Excess', 'Low'], projection: { action: 1, timeCreated: 1, by: 1 } });
            container.render(historyTable);

            let performers = kerdx.array.toSet(kerdx.object.valueOfObjectArray(result, 'by'));//get the performers set

            let run = {};
            for (let p of performers) {
                run[p] = system.get({ collection: 'users', query: { _id: p }, options: { projection: { fullName: 1, _id: 0 } }, changeQuery: { _id: 'objectid' } })
            }

            let byColumns = historyTable.find(`.kerdx-table-column[data-name="by"]`).findAll('.kerdx-table-column-cell');

            kerdx.runParallel(run, ran => {
                let row;
                let time;
                for (let i = 0; i < byColumns.length; i++) {
                    if (!kerdx.isnull(ran[byColumns[i].textContent])) {
                        result[i].author = ran[byColumns[i].textContent].fullName;
                        byColumns[i].textContent = ran[byColumns[i].textContent].fullName;
                    }
                    row = byColumns[i].dataset.row;
                    time = historyTable.find(`.kerdx-table-column-cell[data-row="${row}"][data-name="timeCreated"]`);
                    time.textContent = kerdx.time_date(time.textContent);
                    result[i].period = time.textContent;
                }
            });

            kerdx.listenTable({ options: ['view'], table: historyTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.kerdx-table-column-cell').dataset;
                    let table = target.getParents('.kerdx-table');
                    let id = table.find(`.kerdx-table-column[data-name="_id"]`).find(`.kerdx-table-column-cell[data-row="${row}"]`).dataset.value;
                    let item = kerdx.array.find(result, t => {
                        return t._id == id;
                    });

                    if (target.id == 'kerdx-table-option-view') {
                        this.show(item, result);
                    }
                },

                filter: (sortValue, row) => {
                    let hide = false;
                    let cell = kerdx.array.find(row, value => {
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

    show(event, histories) {
        let related = kerdx.array.findAll(histories, h => {
            return h.item == event.item && h.collection == event.collection;
        });

        let position = related.indexOf(event);

        let eventWindow = kerdx.createElement({
            element: 'div', attributes: { class: 'history-event' }, children: [
                {
                    element: 'div', attributes: { class: 'history-event-nav' }, children: [
                        { element: 'i', attributes: { class: 'icon fas fa-arrow-left', id: 'arrow-left' } },
                        { element: 'i', attributes: { class: 'icon fas fa-arrow-right', id: 'arrow-right' } },
                    ]
                },
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

        eventWindow.addEventListener('click', clicked => {
            if (clicked.target.id == 'arrow-left') {
                if (position == 0) {
                    system.notify({ note: "No more histories on this item in that direction" });
                }
                else{
                    this.show(related[position - 1], histories);
                }
            }

            if (clicked.target.id == 'arrow-right') {
                if (position >= related.length - 1) {
                    system.notify({ note: "No more histories on this item in that direction" });
                }
                else{
                    this.show(related[position + 1], histories);
                }
            }
        });

        let eventData = eventWindow.find('.history-event-data');
        kerdx.displayData(event.data, eventData);

        let popUp = kerdx.popUp(eventWindow);
        popUp.find('#toggle-window').click();
    }
}

export { History };