class Notifications {
    constructor() {
        this.url;
    }

    display() {
        let main = document.body.find('#main-window');
        let mainBody = main.find('#main-container-body');

        mainBody.render([
            {
                element: 'div', attributes: { id: 'main-container-body-main-actions' }, children: [
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
        system.getNotifications().then(notifications => {
            notifications = kerdx.array.each(notifications, note => {
                note.message = note.note;
                note.note = note.note.slice(0, 20) + '...';
                note.time = kerdx.time_date(note.time);
                return note;
            });

            let table = kerdx.createTable({
                title: `My Notifications`, contents: notifications, search: true, projection: { title: 1, note: 1, time: 1, status: 1 }
            });

            container.render(table);

            kerdx.listenTable({ options: ['view'], table: table }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.kerdx-table-column-cell').dataset;
                    let table = target.getParents('.kerdx-table');
                    let id = table.find(`.kerdx-table-column[data-name="_id"]`).find(`.kerdx-table-column-cell[data-row="${row}"]`).dataset.value;
                    let note = kerdx.array.find(notifications, note => {
                        return note._id == id;
                    });

                    if (note) {
                        if (target.id == 'kerdx-table-option-view') {
                            this.show(note, { table, row });
                        }
                    }
                }
            });
        });
    }

    show(item, params) {
        let noteWindow = kerdx.createElement({
            element: 'div', attributes: { class: 'notification-item' }, children: [
                { element: 'p', attributes: { id: 'notification-message' }, html: item.message }
            ]
        });

        if (kerdx.isset(item.link)) {
            noteWindow.makeElement({
                element: 'a', attributes: { class: 'btn btn-medium', href: item.link }, text: 'View'
            });
        }

        let popUp = kerdx.popUp(noteWindow, { title: item.title, attributes: { style: { width: '50%', height: '100%', justifySelf: 'flex-end' } } });

        if (item.status == 'UnRead') {
            system.connect({ data: { action: 'readNotification', id: item._id } }).then(result => {
                if (result == 1) {
                    item.status = 'Read';
                    if (kerdx.isset(params.table)) {
                        params.table.find(`.kerdx-table-column[data-name="status"]`).find(`.kerdx-table-column-cell[data-row="${params.row}"]`).textContent = 'Read';
                    }

                    if (kerdx.isset(params.status)) {
                        params.status.textContent = 'Read';
                    }
                }
            });
        }
    }
}

export { Notifications };