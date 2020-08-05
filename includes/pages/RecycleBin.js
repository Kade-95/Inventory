let recycleBin = (mainBody) => {
    let settingsMainWindow = mainBody.find('#settings-main-window');
    let loading = kerdx.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });
    let urlVars = kerdx.urlSplitter(location.href);

    let _delete = (id, collection) => {
        if (confirm('Do you want to continue with this action?!')) {
            system.connect({ data: { action: 'removeFromRecycleBin', id, collection } }).then(result => {
                if (result == 1) {
                    system.reload();
                    system.notify({ note: 'Deleted from Recyclebin' });
                }
                else {
                    system.notify({ note: `Could not delete from Recyclebin` });
                }
            });
        }
    }

    let revert = (id, collection) => {
        if (confirm('Do want to revert this deletion?!')) {
            system.connect({ data: { action: 'revert', id, collection } }).then(result => {
                if (result == 1) {
                    system.redirect(system.getLink(collection, id, 'show'));
                    system.notify({ note: 'Deletion reverted' });
                }
                else {
                    system.notify({ note: `Could not revert deletion` });
                }
            });
        }
    }

    let view = () => {
        settingsMainWindow.makeElement([
            {
                element: 'div', attributes: { class: 'settings-sub-menu' }, children: [
                    { element: 'i', attributes: { class: 'fas fa-trash', id: 'empty-bin' } },
                    { element: 'i', attributes: { class: 'fas fa-plus', id: 'remove-selected' } }
                ]
            },
            {
                element: 'div', attributes: { class: 'settings-content-window' }
            }
        ]);

        settingsMainWindow.find('#empty-bin').addEventListener('click', empty);

        let mainContentWindow = settingsMainWindow.find('.settings-content-window');

        let recycleWindow = kerdx.createElement({
            element: 'div', attributes: { id: 'recycle' }, children: [
                {
                    element: 'menu', attributes: { id: 'recycle-menu' }, children: [
                        { element: 'a', attributes: { class: 'recycle-menu-item active', id: 'recycle-all' }, text: 'All' },
                        { element: 'a', attributes: { class: 'recycle-menu-item', id: 'recycle-items' }, text: 'Items' },
                        { element: 'a', attributes: { class: 'recycle-menu-item', id: 'recycle-users' }, text: 'Users' },
                        { element: 'a', attributes: { class: 'recycle-menu-item', id: 'recycle-forms' }, text: 'Forms' },
                        { element: 'a', attributes: { class: 'recycle-menu-item', id: 'recycle-reports' }, text: 'Reports' },
                        { element: 'a', attributes: { class: 'recycle-menu-item', id: 'recycle-categories' }, text: 'Categories' },
                        { element: 'a', attributes: { class: 'recycle-menu-item', id: 'recycle-tags' }, text: 'Tags' },
                        { element: 'a', attributes: { class: 'recycle-menu-item', id: 'recycle-lists' }, text: 'Lists' },
                        { element: 'a', attributes: { class: 'recycle-menu-item', id: 'recycle-customforms' }, text: 'Custom Forms' },
                        { element: 'a', attributes: { class: 'recycle-menu-item', id: 'recycle-reportgenerators' }, text: 'Report Generators' }
                    ]
                },
                {
                    element: 'section', attributes: { id: 'recycle-window' }, children: [
                        { element: 'div', attributes: { class: 'recycle-window-item active', id: 'recycle-all' }, text: 'All' },
                        { element: 'div', attributes: { class: 'recycle-window-item', id: 'recycle-items' }, text: 'Items' },
                        { element: 'div', attributes: { class: 'recycle-window-item', id: 'recycle-users' }, text: 'Users' },
                        { element: 'div', attributes: { class: 'recycle-window-item', id: 'recycle-forms' }, text: 'Forms' },
                        { element: 'div', attributes: { class: 'recycle-window-item', id: 'recycle-reports' }, text: 'Reports' },
                        { element: 'div', attributes: { class: 'recycle-window-item', id: 'recycle-categories' }, text: 'Categories' },
                        { element: 'div', attributes: { class: 'recycle-window-item', id: 'recycle-tags' }, text: 'Tags' },
                        { element: 'div', attributes: { class: 'recycle-window-item', id: 'recycle-lists' }, text: 'Lists' },
                        { element: 'div', attributes: { class: 'recycle-window-item', id: 'recycle-customforms' }, text: 'Custom Forms' },
                        { element: 'div', attributes: { class: 'recycle-window-item', id: 'recycle-reportgenerators' }, text: 'Report Generators' }
                    ]
                }
            ]
        });

        mainContentWindow.render(recycleWindow);
        let target, id;

        recycleWindow.addEventListener('click', event => {
            target = event.target;
            id = target.id;
            if (target.classList.contains('recycle-menu-item')) {
                recycleWindow.find('.recycle-menu-item.active').classList.remove('active');
                recycleWindow.find('.recycle-window-item.active').classList.remove('active');

                target.classList.add('active');
                recycleWindow.find(`#recycle-window #${id}`).classList.add('active');
            }
        });

        kerdx.runParallel({
            items: system.get({ collection: 'items', query: { recycled: true }, projection: { name: 1, _id: 1, timeDeleted: 1 }, many: true }),
            users: system.get({ collection: 'users', query: { recycled: true }, projection: { userName: 1, _id: 1, timeDeleted: 1 }, many: true }),
            reports: system.get({ collection: 'reports', query: { recycled: true }, projection: { name: 1, _id: 1, timeDeleted: 1 }, many: true }),
            categories: system.get({ collection: 'categories', query: { recycled: true }, projection: { name: 1, _id: 1, timeDeleted: 1 }, many: true }),
            tags: system.get({ collection: 'tags', query: { recycled: true }, projection: { name: 1, _id: 1, timeDeleted: 1 }, many: true }),
            lists: system.get({ collection: 'lists', query: { recycled: true }, projection: { name: 1, _id: 1, timeDeleted: 1 }, many: true }),
            forms: system.get({ collection: 'forms', query: { recycled: true }, projection: { name: 1, _id: 1, timeDeleted: 1 }, many: true }),
            customforms: system.get({ collection: 'customforms', query: { recycled: true }, projection: { name: 1, _id: 1, timeDeleted: 1 }, many: true }),
            reportgenerators: system.get({ collection: 'reportgenerators', query: { recycled: true }, projection: { name: 1, _id: 1, timeDeleted: 1 }, many: true }),
        }, bin => {
            let allRecycled = [];
            for (let collection in bin) {

                handleTable(collection, bin[collection], recycleWindow);

                for (let row of bin[collection]) {
                    row.collection = collection;
                    allRecycled.push(row);
                }
            }

            handleTable('all', allRecycled, recycleWindow);
        });
    }

    let handleTable = (collection, contents, container) => {
        let table = kerdx.createTable({
            title: `${collection} Recycled`, contents, search: true, sort: true
        });
        container.find(`#recycle-window #recycle-${collection}`).innerHTML = '';
        container.find(`#recycle-window #recycle-${collection}`).render(table);

        kerdx.listenTable({ options: ['view', 'revert', 'delete'], table: table }, {
            click: event => {
                let target = event.target;
                let { row } = target.getParents('.kerdx-table-column-cell').dataset;
                let table = target.getParents('.kerdx-table');
                let id = table.find(`.kerdx-table-column[data-name="_id"]`).find(`.kerdx-table-column-cell[data-row="${row}"]`).dataset.value;

                let theCollection = collection;
                if (theCollection == 'all') {
                    theCollection = table.find(`.kerdx-table-column[data-name="collection"]`).find(`.kerdx-table-column-cell[data-row="${row}"]`).dataset.value;
                }

                if (target.id == 'kerdx-table-option-revert') {
                    revert(id, theCollection);
                }
                else if (target.id == 'kerdx-table-option-delete') {
                    _delete(id, theCollection);
                }
            }
        });
    }

    let empty = () => {
        if (confirm('You are going to empty bin?!')) {
            system.connect({ data: { action: 'emptyRecycleBin' } }).then(result => {
                if (result == 1) {
                    system.notify({ note: 'Recyclebin has been emptied' });
                    system.reload();
                }
                else {
                    system.notify({ note: `Could not empty Recyclebin` });
                }
            });
        }
    }

    if (!kerdx.isset(urlVars.vars.action) || urlVars.vars.action == 'view') {
        view();
    }
}

export { recycleBin };