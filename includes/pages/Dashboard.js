class Dashboard {
    constructor() {

    }

    display() {
        let main = document.body.find('#main-window');
        let mainBody = main.find('#main-container-body');

        let cardUnit = new kerdx.Shadow(kerdx.createElement({
            element: 'span', attributes: { class: 'dashboard-tile' }, children: [
                {
                    element: 'span', attributes: { class: 'dashboard-tile-title' }, children: [
                        { element: 'a', attributes: { class: 'dashboard-tile-name' } },
                        { element: 'a', attributes: { class: 'dashboard-tile-count' } }
                    ]
                },
                {
                    element: 'span', attributes: { class: 'dashboard-tile-stats' }, children: [
                        {
                            element: 'span', attributes: { class: 'dashboard-tile-stats-title' }, children: [
                                { element: 'a', attributes: { class: 'dashboard-tile-stats-name' } },
                                { element: 'a', attributes: { class: 'dashboard-tile-stats-count' } }
                            ]
                        },
                        {
                            element: 'span', attributes: { class: 'dashboard-tile-stats-title' }, children: [
                                { element: 'a', attributes: { class: 'dashboard-tile-stats-name' } },
                                { element: 'a', attributes: { class: 'dashboard-tile-stats-count' } }
                            ]
                        }
                    ]
                }
            ]
        }));

        let itemUnit = new kerdx.Shadow(kerdx.createElement({
            element: 'span', attributes: { class: 'dashboard-list-item' }, children: [
                { element: 'a', attributes: { class: 'dashboard-list-item-name' } },
                { element: 'a', attributes: { class: 'dashboard-list-item-count' } }
            ]
        }));

        let notificationUnit = new kerdx.Shadow(kerdx.createElement({
            element: 'div', attributes: { class: 'dashboard-notification-item' }, children: [
                { element: 'a', attributes: { class: 'dashboard-notification-item-title' } },
                { element: 'a', attributes: { class: 'dashboard-notification-item-read' } },
                { element: 'a', attributes: { class: 'dashboard-notification-item-message' } },
                { element: 'a', attributes: { class: 'btn btn-small dashboard-notification-item-open' }, text: 'Open' },
            ]
        }));

        kerdx.runParallel({
            items: system.get({ collection: 'items', query: {}, projection: { name: 1, count: 1, min: 1, _id: 0 }, many: true }),
            users: system.get({ collection: 'users', query: {}, projection: { _id: 0 }, many: true }),
            reports: system.get({ collection: 'reports', query: {}, projection: { name: 1, _id: 0 }, many: true }),
            categories: system.get({ collection: 'categories', query: {}, projection: { name: 1, _id: 0 }, many: true }),
            tags: system.get({ collection: 'tags', query: {}, projection: { name: 1, _id: 0 }, many: true }),
            lists: system.get({ collection: 'lists', query: {}, projection: { name: 1, _id: 0 }, many: true }),
            forms: system.get({ collection: 'forms', query: {}, projection: { name: 1, _id: 0 }, many: true }),
            customforms: system.get({ collection: 'customforms', query: {}, projection: { name: 1, _id: 0 }, many: true }),
            reportgenerators: system.get({ collection: 'reportgenerators', query: {}, projection: { name: 1, _id: 0 }, many: true }),
            notifications: system.getNotifications('all')
        }, result => {
            let lowItems = 0, onlineUsers, myForms, myReports;
            let itemsCount = [], itemsLabels = [], categoriesItemCount = {};

            for (let item of result.items) {
                if (Math.floor(item.count) <= Math.floor(item.min)) {
                    lowItems++;
                }
                itemsCount.push(item.count);
                itemsLabels.push(item.name);

            }

            let itemsCard = cardUnit.createElement({
                childDetails: {
                    properties: {
                        '.dashboard-tile-name': [
                            { properties: { textContent: 'Items' } }
                        ],
                        '.dashboard-tile-count': [
                            { properties: { textContent: result.items.length } }
                        ],
                        '.dashboard-tile-stats-name': [
                            { properties: { textContent: 'Low' }, positions: [0] },
                            { properties: { textContent: 'Stable' }, positions: [1] }
                        ],
                        '.dashboard-tile-stats-count': [
                            { properties: { textContent: lowItems }, positions: [0] },
                            { properties: { textContent: result.items.length - lowItems }, positions: [1] }
                        ]
                    }
                }
            });

            let usersCard = cardUnit.createElement({
                childDetails: {
                    properties: {
                        '.dashboard-tile-name': [
                            { properties: { textContent: 'Users' } }
                        ],
                        '.dashboard-tile-count': [
                            { properties: { textContent: result.users.length } }
                        ]
                    }
                }
            });

            let formsCard = cardUnit.createElement({
                childDetails: {
                    properties: {
                        '.dashboard-tile-name': [
                            { properties: { textContent: 'Custom Forms' } }
                        ],
                        '.dashboard-tile-count': [
                            { properties: { textContent: result.customforms.length } }
                        ]
                    }
                }
            });

            let reportsCard = cardUnit.createElement({
                childDetails: {
                    properties: {
                        '.dashboard-tile-name': [
                            { properties: { textContent: 'Report Generators' } }
                        ],
                        '.dashboard-tile-count': [
                            { properties: { textContent: result.reportgenerators.length } }
                        ]
                    }
                }
            });

            mainBody.render([
                { element: 'div' },
                {
                    element: 'div', attributes: { id: 'dashboard-window' }, children: [
                        {
                            element: 'div', attributes: { class: '.main-container-section', id: 'dashboard-details' }, children: [
                                itemsCard, usersCard, formsCard, reportsCard
                            ]
                        },
                        {
                            element: 'div', attributes: { id: 'dashboard-other-details' }, children: [
                                {
                                    element: 'div', attributes: { id: 'dashboard-list' }, children: [

                                        itemUnit.createElement({
                                            childDetails: {
                                                properties: {
                                                    '.dashboard-list-item-name': [
                                                        { properties: { textContent: 'Categories' } }
                                                    ],
                                                    '.dashboard-list-item-count': [
                                                        { properties: { textContent: result.categories.length } }
                                                    ]
                                                }
                                            }
                                        }),

                                        itemUnit.createElement({
                                            childDetails: {
                                                properties: {
                                                    '.dashboard-list-item-name': [
                                                        { properties: { textContent: 'Tags' } }
                                                    ],
                                                    '.dashboard-list-item-count': [
                                                        { properties: { textContent: result.tags.length } }
                                                    ]
                                                }
                                            }
                                        }),

                                        itemUnit.createElement({
                                            childDetails: {
                                                properties: {
                                                    '.dashboard-list-item-name': [
                                                        { properties: { textContent: 'Lists' } }
                                                    ],
                                                    '.dashboard-list-item-count': [
                                                        { properties: { textContent: result.lists.length } }
                                                    ]
                                                }
                                            }
                                        }),

                                        itemUnit.createElement({
                                            childDetails: {
                                                properties: {
                                                    '.dashboard-list-item-name': [
                                                        { properties: { textContent: 'Report Generators' } }
                                                    ],
                                                    '.dashboard-list-item-count': [
                                                        { properties: { textContent: result.reportgenerators.length } }
                                                    ]
                                                }
                                            }
                                        }),

                                        itemUnit.createElement({
                                            childDetails: {
                                                properties: {
                                                    '.dashboard-list-item-name': [
                                                        { properties: { textContent: 'Custom Forms' } }
                                                    ],
                                                    '.dashboard-list-item-count': [
                                                        { properties: { textContent: result.customforms.length } }
                                                    ]
                                                }
                                            }
                                        })
                                    ]
                                },
                                {
                                    element: 'div', attributes: { id: 'dashboard-notifications' }
                                },
                                {
                                    element: 'div', attributes: { id: 'dashboard-items-graph' }
                                },
                                {
                                    element: 'div', attributes: { id: 'dashboard-categories-graph' }
                                }
                            ]
                        },
                    ]
                }
            ]);

            let notificationWindow = mainBody.find('#dashboard-notifications');
            for (let note of result.notifications) {
                note.message = note.note;
                note.note = note.note.slice(0, 30) + '...';
                notificationWindow.makeElement(notificationUnit.createElement({
                    childDetails: {
                        properties: {
                            '.dashboard-notification-item-title': [
                                { properties: { textContent: note.title } }
                            ],
                            '.dashboard-notification-item-read': [
                                { properties: { textContent: note.status } }
                            ],
                            '.dashboard-notification-item-message': [
                                { properties: { textContent: note.note } }
                            ],
                            '.dashboard-notification-item-open': [
                                { properties: { note: note } }
                            ]
                        }
                    }
                }));
            }
            notificationWindow.addEventListener('click', event => {
                let target = event.target;
                if (target.classList.contains('dashboard-notification-item-open')) {
                    system.notificationsWindow.show(target.note, { status: target.getParents('.dashboard-notification-item').find('.dashboard-notification-item-read') });
                }
            });

            system.plot({ type: 'bar', title: 'Items Quantity', data: itemsCount, labels: itemsLabels }, (ctx, graph) => {
                mainBody.find('#dashboard-items-graph').makeElement(ctx);
            });

            // system.plot({type: 'pie', title: 'Categories Item', data: categoriesItemCount, labels: categoriesLabels}, (ctx, graph) => {
            //     mainBody.find('#dashboard-categories-graph').makeElement(ctx);
            // });
        });
    }
}

export { Dashboard };