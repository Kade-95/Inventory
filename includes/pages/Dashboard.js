class Dashboard {
    constructor() {

    }

    display() {
        let main = document.body.find('#main-window');
        let mainBody = main.find('#main-container-body');

        mainBody.render({
            element: 'div', attributes: { class: '.main-container-section', id: 'dashboard-details' }, children: [
                {
                    element: 'span', attributes: { class: 'dashboard-tile' }, children: [
                        {
                            element: 'span', attributes: { class: 'dashboard-tile-title' }, children: [
                                { element: 'a', attributes: { class: 'dashboard-tile-name' }, text: 'Items' },
                                { element: 'a', attributes: { class: 'dashboard-tile-count' }, text: 40 }
                            ]
                        },
                        {
                            element: 'span', attributes: { class: 'dashboard-tile-stats' }, children: [
                                {
                                    element: 'span', attributes: { class: 'dashboard-tile-stats-title' }, children: [
                                        { element: 'a', attributes: { class: 'dashboard-tile-stats-name' }, text: 'Low' },
                                        { element: 'a', attributes: { class: 'dashboard-tile-stats-count' }, text: '24' }
                                    ]
                                },
                                {
                                    element: 'span', attributes: { class: 'dashboard-tile-stats-title' }, children: [
                                        { element: 'a', attributes: { class: 'dashboard-tile-stats-name' }, text: 'Stable' },
                                        { element: 'a', attributes: { class: 'dashboard-tile-stats-count' }, text: '16' }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    element: 'span', attributes: { class: 'dashboard-tile' }, children: [
                        {
                            element: 'span', attributes: { class: 'dashboard-tile-title' }, children: [
                                { element: 'a', attributes: {}, text: 'Items' },
                                { element: 'a', attributes: {}, text: 40 }
                            ]
                        },
                        {
                            element: 'span', attributes: {}, children: [
                                {
                                    element: 'span', attributes: {}, children: [
                                        { element: 'a', attributes: {}, text: 'Low' },
                                        { element: 'a', attributes: {}, text: '24' }
                                    ]
                                },
                                {
                                    element: 'span', attributes: {}, children: [
                                        { element: 'a', attributes: {}, text: 'Stable' },
                                        { element: 'a', attributes: {}, text: '16' }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    element: 'span', attributes: { class: 'dashboard-tile' }, children: [
                        {
                            element: 'span', attributes: { class: 'dashboard-tile-title' }, children: [
                                { element: 'a', attributes: {}, text: 'Items' },
                                { element: 'a', attributes: {}, text: 40 }
                            ]
                        },
                        {
                            element: 'span', attributes: {}, children: [
                                {
                                    element: 'span', attributes: {}, children: [
                                        { element: 'a', attributes: {}, text: 'Low' },
                                        { element: 'a', attributes: {}, text: '24' }
                                    ]
                                },
                                {
                                    element: 'span', attributes: {}, children: [
                                        { element: 'a', attributes: {}, text: 'Stable' },
                                        { element: 'a', attributes: {}, text: '16' }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    }
}

export { Dashboard };