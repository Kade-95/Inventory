window.system = {};

import { Kerdx } from 'https://kade-95.github.io/kerdx/index.js';
import { App } from './pages/App.js';
import * as chart from './Chart.js';

window.kerdx = new Kerdx();
const app = new App();
let viewSet = false;
window.log = console.log;

function setupView(user) {
    let view = {};
    view.primaryColor = 'rgb(255, 255, 255)';
    view.secondaryColor = 'rgb(0, 0, 0)';
    view.accientColor = 'rgb(64, 168, 45)';

    if (kerdx.isset(user) && user != 'undefined') {
        system.get({ collection: 'views', query: { owner: user } }).then(myView => {
            if (kerdx.isnull(myView)) {
                system.connect({ data: { action: 'saveView', view: JSON.stringify(view) } });
            }
            else {
                kerdx.object.copy(myView.view, view);
            }

            system.loadView(view);
        });
    }
    else {
        system.loadView(view);
    }

    viewSet = true;
}

function route() {
    document.body.removeChildren({ except: ['#main-notifications', '#open-notifications'] });
    let user = document.body.dataset.user;
    if (!viewSet) {
        setupView(user);
    }

    document.body.makeElement({
        element: 'header', attributes: { id: 'main-header' }
    });

    document.body.makeElement({
        element: 'main', attributes: { id: 'main-window' }
    });

    document.body.makeElement({
        element: 'footer', attributes: { id: 'main-footer' }
    });

    let { url, pathname } = location;
    if (!kerdx.isset(user) || user == 'undefined') {
        if (!(pathname == '/' || pathname == '/index.html')) {
            system.redirect('index.html');
        }
        else {
            display();
        }

    }
    else if (pathname == '/' || pathname == '/index.html') {
        if (user == 'undefined') {
            display();
        }
        else {
            system.redirect('dashboard.html');
        }
    }
    else if (pathname == '/aboutus.html') {

    }
    else {
        app.init();
    }

    toggleNotifications();
}

function display() {
    let header = document.body.find('#main-header');
    document.body.cssRemove(['grid-template-rows']);
    header.cssRemove(['display']);
    setupView();
    header.makeElement([
        {
            element: 'a', attributes: { id: 'site-details', href: 'index.html' }, children: [
                { element: 'img', attributes: { id: 'site-logo', src: 'images/logo.png' } },
                { element: 'h5', attributes: { id: 'site-name' }, text: 'Inventory' }
            ]
        },
        {
            element: 'nav', attributes: { id: 'big-nav' }, children: [
                { element: 'a', attributes: { href: 'aboutus.html', class: 'nav-link' }, text: 'About us' },
                { element: 'a', attributes: { href: 'work.html', class: 'nav-link' }, text: 'Work' },
                { element: 'a', attributes: { href: 'info.html', class: 'nav-link' }, text: 'Info' },
                { element: 'a', attributes: { href: 'index.html?page=login', class: 'get-started btn btn-medium' }, text: 'Sign In' }
            ]
        },
        {
            element: 'nav', attributes: { id: 'small-nav' }, children: [
                { element: 'span', attributes: { class: 'toggle toggle-open' } },
                {
                    element: 'div', attributes: { id: 'header-side-bar' }, children: [
                        { element: 'a', attributes: { href: 'aboutus.html', class: 'nav-link' }, text: 'About us' },
                        { element: 'a', attributes: { href: 'work.html', class: 'nav-link' }, text: 'Work' },
                        { element: 'a', attributes: { href: 'info.html', class: 'nav-link' }, text: 'Info' },
                        { element: 'a', attributes: { href: 'index.html?page=login', class: 'get-started btn btn-medium' }, text: 'Sign In' }
                    ]
                }
            ]
        }
    ]);
    let url = kerdx.urlSplitter(location.href);

    header.find('.toggle').addEventListener('click', event => {
        event.target.classList.toggle('toggle-open');
        event.target.classList.toggle('toggle-close');
        if (!kerdx.isset(header.find('#header-side-bar').css().display)) {
            header.find('#header-side-bar').css({ display: 'grid' });
        }
        else {
            header.find('#header-side-bar').cssRemove(['display']);
        }
    });

    let main = document.body.find('#main-window');
    main.makeElement({
        element: 'section', attributes: { id: 'landing' }, children: [
            {
                element: 'div', attributes: { id: 'main-window-container' }, children: [
                    {
                        element: 'div', attributes: { class: 'descriptive-link' }, children: [
                            { element: 'h5', attributes: { class: 'descriptive-link-title' }, html: 'Inventory</br>Management' },
                            { element: 'p', attributes: { class: 'descriptive-link-text' }, text: 'This is a simple Inventory Management system for automating most of your work in store management.' },
                            { element: 'a', attributes: { class: 'btn btn-big', href: 'index.html?page=newAccount' }, text: 'Create Account' }
                        ]
                    },
                ]
            },
            {
                element: 'img', attributes: { id: 'main-banner', src: 'images/banner.png' }
            }
        ]
    });

    if (url.vars.page == 'login') {
        login(main.find('#main-window-container'));
    }
    else if (url.vars.page == 'newAccount') {
        createAccount(main.find('#main-window-container'));
    }
}

function login(container) {
    let loading = kerdx.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });

    let loginForm = kerdx.createForm({
        title: 'Login Form', attributes: { id: 'login-form', class: 'form' },
        contents: {
            email: { element: 'input', attributes: { id: 'email', name: 'email' } },
            password: {
                element: 'input', attributes: { id: 'current-password', name: 'currentPassword', type: 'password', autoComplete: true }
            }
        },
        buttons: {
            submit: { element: 'button', attributes: { id: 'submit' }, text: 'Submit', state: { name: 'submit', owner: '#login-form' } },
        }
    });

    container.render(loginForm);

    loginForm.getState({ name: 'submit' }).addEventListener('click', event => {
        event.preventDefault();
        loginForm.getState({ name: 'submit' }).replaceWith(loading);
        loginForm.setState({ name: 'error', attributes: { style: { display: 'none' } }, text: '' });

        if (!kerdx.validateForm(loginForm)) {
            loading.replaceWith(loginForm.getState({ name: 'submit' }));
            loginForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: 'Faulty form' });

            return;
        }

        loading.replaceWith(loginForm.getState({ name: 'submit' }));
        let data = kerdx.jsonForm(loginForm);
        data.action = 'login';

        system.connect({ data }).then(result => {
            let note;
            if (result == '404') {
                note = 'User not found';
            }
            else if (result == 'Incorrect') {
                note = 'Username or Password Incorrect';
            }
            else {
                document.body.dataset.user = result.user;
                document.body.dataset.userType = result.userType;
                setupView(result.user);
                system.redirect(app.currentPage);
                note = 'Welcome back!!! ' + data.email;
            }

            system.notify({ note });
        });
    });
}

function createAccount(container) {
    let accountForm = kerdx.createForm({
        title: 'Account Form', attributes: { id: 'account-form', class: 'form' },
        contents: {
            account: { element: 'input', attributes: { id: 'account', name: 'account' } },
            admin: { element: 'input', attributes: { id: 'admin', name: 'admin' } },
            password: {
                element: 'input', attributes: { id: 'password', name: 'password', type: 'password', autoComplete: true }
            }
        },
        buttons: {
            submit: { element: 'button', attributes: { id: 'submit' }, text: 'Submit' },
        }
    });

    container.render(accountForm);

    accountForm.addEventListener('submit', event => {
        event.preventDefault();

        if (!kerdx.validateForm(accountForm)) {
            accountForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: 'Faulty form' });
            return;
        }

        let data = kerdx.jsonForm(accountForm);
        data.action = 'createAccount';

        system.connect({ data }).then(result => {
            let note;
            if (result == 'found') {
                note = 'Account already Exists';
            }
            else {
                document.body.dataset.user = result.user;
                document.body.dataset.userType = result.userType;
                setupView(result.user);
                system.redirect('dashboard.html');
                note = 'Welcome' + data.admin;
            }

            system.notify({ note });
        });
    });
}

function toggleNotifications() {
    let openNotifications = document.body.find('#open-notifications');
    let closeNotifications = document.body.find('#close-notifications');
    let notificationsBlock = closeNotifications.parentNode;

    openNotifications.addEventListener('click', event => {
        notificationsBlock.css({ display: 'grid' });
    });

    closeNotifications.addEventListener('click', event => {
        notificationsBlock.cssRemove(['display']);
    });
}

system.smallScreen = window.matchMedia("(min-width: 700px)");
system.realSmallScreen = window.matchMedia("(min-width: 500px)");

system.redirect = url => {
    window.history.pushState('page', 'title', kerdx.api.prepareUrl(url));
    route();
}

system.reload = () => {
    system.redirect(location.href);
}

system.get = (params) => {
    let data = { params: JSON.stringify(params) };
    data.action = 'find';
    return system.connect({ data });
}

system.notify = (params) => {

    params.duration = params.duration || 10;

    let openNotifications = document.body.find('#open-notifications');
    let closeNotifications = document.body.find('#close-notifications');
    let notificationsBlock = closeNotifications.parentNode;

    openNotifications.click();

    let note = kerdx.createElement({
        element: 'span', attributes: { class: 'single-notification' }, children: [
            { element: 'p', attributes: { class: 'single-notification-text' }, text: params.note }
        ]
    });

    if (kerdx.isset(params.link)) {
        note.makeElement({ element: 'a', attributes: { href: params.link, class: 'fas fa-eye', title: 'see notification' } }
        );
    }

    let closeNote = () => {
        note.remove();
        if (notificationsBlock.findAll('.single-notification').length == 0) {
            closeNotifications.click();
        }
    }

    let close = note.makeElement({ element: 'i', attributes: { class: 'fas fa-times', title: 'close notification' } }
    );

    close.addEventListener('click', closeNote)

    if (params.duration != 'sticky') {
        params.duration = 1000 * params.duration;

        let animate = setTimeout(() => {
            closeNote();
            clearTimeout(animate);
        }, params.duration);
    }

    notificationsBlock.find('#main-notifications-window').prepend(note);
}

system.connect = (params) => {
    let progressBar = kerdx.createElement({ element: 'input', attributes: { class: 'ajax-progress', type: 'progress' } });
    params.onprogress = (stage) => {
        progressBar.css({ width: stage + '%' })
    }

    return new Promise((resolve, reject) => {
        document.body.append(progressBar);
        kerdx.api.ajax(params)
            .then(result => {
                result = JSON.parse(result);

                if (result == 'Expired') {
                    document.body.dataset.user = 'undefined';
                    document.body.dataset.userType = 'undefined';
                    system.redirect(location.href + 'index.html');
                    system.notify({ note: 'Session has Expired. Login again' });
                }
                else if (result == 'Admin only') {
                    resolve(result);
                    system.notify({ note: 'You are not allowed to do that' });
                }
                else if (result == 'Unknown Request') {
                    system.notify({ note: 'Request Unknown' });
                }
                else {
                    resolve(result);
                }
            })
            .catch(err => {
                reject(err);
            })
            .finally(final => {
                progressBar.remove();
            });
    });
}

system.display404 = (container) => {
    container.render({
        element: 'h1', text: '404 Not Found', attributes: {
            style: {
                width: `var(--match-parent)`, height: `var(--match-parent)`, padding: '5em', textAlign: 'center'
            }
        }
    });
}

system.editableImage = (name, image) => {
    let editableImage = kerdx.createElement({
        element: 'span', attributes: { id: 'editable-image-container' }, children: [
            { element: 'img', attributes: { id: 'editable-image', src: image || 'images/logo.png' } },
            {
                element: 'span', attributes: { id: 'editable-image-controls' }, children: [
                    { element: 'a', attributes: { id: 'view-' + name, href: image || 'images/logo.png', class: 'icon fas fa-eye', target: '_blank' } },
                    { element: 'i', attributes: { id: 'edit-' + name, class: 'icon fas fa-pen' } },
                    { element: 'i', attributes: { id: 'delete-' + name, class: 'icon fas fa-trash-alt' } }
                ]
            }
        ]
    });

    editableImage.addEventListener('mouseenter', event => {
        editableImage.find('#editable-image-controls').css({ visibility: 'visible' });
    });

    editableImage.addEventListener('mouseleave', event => {
        editableImage.find('#editable-image-controls').css({ visibility: 'hidden' });
    });

    return editableImage;
}

system.loadView = (view) => {
    view.lightPrimaryColor = kerdx.colorHandler.addOpacity(view.primaryColor, 0.5);
    view.lighterPrimaryColor = kerdx.colorHandler.addOpacity(view.primaryColor, 0.2);
    view.lightSecondaryColor = kerdx.colorHandler.addOpacity(view.secondaryColor, 0.5);
    view.lighterSecondaryColor = kerdx.colorHandler.addOpacity(view.secondaryColor, 0.2);
    view.lightAccientColor = kerdx.colorHandler.addOpacity(view.accientColor, 0.5);
    view.lighterAccientColor = kerdx.colorHandler.addOpacity(view.accientColor, 0.2);

    let rootCss = document.head.find('#root-css');
    if (kerdx.isnull(rootCss)) {
        rootCss = document.head.makeElement({ element: 'style', attributes: { id: 'root-css' } });
    }

    let colors = `:root {
        --match-parent: -webkit-fill-available;
        --fill-parent: 100%;
        --primary-color: ${view.primaryColor};
        --light-primary-color: ${view.lightPrimaryColor};
        --lighter-primary-color: ${view.lighterPrimaryColor};
        --secondary-color: ${view.secondaryColor};
        --light-secondary-color: ${view.lightSecondaryColor};
        --lighter-secondary-color: ${view.lighterSecondaryColor};
        --accient-color: ${view.accientColor};
        --light-accient-color: ${view.lightAccientColor};
        --lighter-accient-color: ${view.lighterAccientColor};
    }`;
    rootCss.textContent = colors;
}

system.plot = (params, callback) => {
    let canvas = kerdx.createElement({ element: 'canvas' });
    let ctx = canvas.getContext('2d');

    let getLabels = (size) => {
        let getting = prompt(`Enter the labels of size ${size} for ${params.title} data, ',' seperated`);
        if (kerdx.isnull(getting)) getting = Array(size).fill('');
        else getting = getting.split(',');

        if (getting.length < size) {
            alert(`Labels must be upto ${size}`)
            getting = getLabels(size);
        }
        return getting;
    }

    let labels = params.labels || getLabels(params.data.length);
    let myChart = new Chart(ctx, {
        type: params.type,
        data: {
            labels,
            datasets: [{
                label: params.title,
                data: params.data,
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });

    callback(canvas, myChart);
}

system.setSources = (callback) => {
    let sourceHistory = [];
    let sourceHistoryPosition = -1;
    let navigating = false;

    let sources = kerdx.createElement({
        element: 'section', attributes: { class: 'sources-body' }, children: [
            {
                element: 'div', attributes: { id: 'sources-side-bar' }, children: [
                    { element: 'button', attributes: { class: 'btn btn-medium', id: 'add-filter' }, text: 'Add Filter' },
                    { element: 'div', attributes: { id: 'sources-panel' } }
                ]
            },
            {
                element: 'div', attributes: { id: 'sources-main-window' }, children: [
                    { element: 'span', text: 'Fetching Data...' }
                ]
            },
        ]
    });

    let filters = {};
    let filterOptions = {
        home: ['Null', 'Name', 'Length', 'Type'],
        table: ['Null', 'Length', 'Name', 'Sum', 'Product', 'Date', 'Before', 'After'],
        list: ['Null', 'Length', 'Positions', 'Equals', 'Less than', 'Greater than']
    }

    let popUp = kerdx.popUp(sources);
    popUp.find('#toggle-window').click();
    let allSources;

    let showTables = (tables) => {
        let data = {
            contents: [],
            path: 'Home',
            type: 'home',
            children: [],
            contentType: 'table',
            source: {}
        }
        tables = tables || allSources;

        let sources = {};
        kerdx.object.copy(tables, sources);
        for (let list of sources.lists) {
            sources[list.name] = list.contents;
        }

        for (let table in sources) {
            let value = { collection: table };
            if (!kerdx.isset(tables[table])) {
                value = { collection: 'lists', item: table };
            }
            data.children.push({ value, name: table });
            data.contents = data.contents.concat(kerdx.object.keysOfObjectArray(sources[table]));
        }
        data.source = sources;
        return data;
    }

    let showLists = (details) => {
        details = JSON.parse(details);
        let { collection, item } = details;
        let tableContent = allSources[collection];

        let data = {
            details,
            contents: [],
            path: '',
            type: 'table',
            children: [],
            contentType: 'list',
            source: []
        }
        for (let name in details) {
            data.path += ' -> ' + details[name];
        }

        if (kerdx.isset(item)) {
            let theList = kerdx.array.find(tableContent, list => {
                return list.name == item;
            });

            tableContent = theList.contents;
        }

        for (let content of tableContent) {
            for (let name in content) {
                if (data.contents.includes(name)) {
                    continue;
                }
                let value = { collection, name };
                if (kerdx.isset(item)) {
                    value = { collection, item, name };
                }
                data.children.push({ value, name });
                data.contents.push(name);
            }
        }

        data.source = tableContent;
        return data;
    }

    let showTexts = (details) => {
        details = JSON.parse(details);
        let { collection, item, name } = details;
        let tableContent = allSources[collection];
        let data = {
            details,
            contents: [],
            path: '',
            type: 'list',
            children: [],
            contentType: 'text',
            source: []
        }
        for (let name in details) {
            data.path += ' -> ' + details[name];
        }

        if (kerdx.isset(item)) {
            let theList = kerdx.array.find(tableContent, list => {
                return list.name == item;
            });

            tableContent = theList.contents;
        }

        for (let i = 0; i < tableContent.length; i++) {
            let text = tableContent[i][name];
            let value = { collection, name, position: i };
            if (kerdx.isset(item)) {
                value.item = item;
            }
            data.contents.push(i + 1);
            data.children.push({ value, name: text });
        }
        data.source = tableContent;
        return data;
    }

    let render = (data) => {
        if (!navigating) {
            let newSourceHistory = [];
            for (let i = 0; i < sourceHistory.length; i++) {
                if (i <= sourceHistoryPosition) {
                    newSourceHistory.push(sourceHistory[i]);
                }
            }
            sourceHistory = newSourceHistory;
            sourceHistory.push(data);
            sourceHistoryPosition++;
        }
        navigating = false;

        if (!kerdx.isset(data)) {
            data = sources.find('.sources-main-window-content').data;
        }

        let filters = sources.findAll('.sources-panel-filter');
        let filteredData = {}
        kerdx.object.copy(data, filteredData);
        for (let i = 0; i < filters.length; i++) {
            let filter = filters[i];

            if (filter.sourcePath != data.path) {
                filter.css({ display: 'none' });
            }
            else {
                filteredData = runFilter(filteredData, filter.filterData);
                filter.cssRemove(['display']);
            }
        }

        let contents = kerdx.createElement({
            element: 'div', attributes: { class: 'sources-main-window-content', 'data-path': data.path, 'data-details': JSON.stringify(data.details), 'data-type': data.type }, children: [
                {
                    element: 'span', attributes: { id: 'sources-main-window-content-header' }, children: [
                        {
                            element: 'span', attributes: { id: 'sources-main-window-content-navigator-container' }, children: [
                                {
                                    element: 'i', attributes: {
                                        class: 'sources-main-window-content-navigator', id: 'sources-main-window-content-navigate-backward', title: 'Backward', 'data-icon': 'fas, fa-arrow-left', style: {
                                            visibility: `${(sourceHistoryPosition == 0) ? 'hidden' : 'visible'}`
                                        }
                                    }
                                },
                                {
                                    element: 'i', attributes: {
                                        class: 'sources-main-window-content-navigator', id: 'sources-main-window-content-navigate-forward', title: 'Forward', 'data-icon': 'fas, fa-arrow-right', style: {
                                            visibility: `${(sourceHistoryPosition == sourceHistory.length - 1) ? 'hidden' : 'visible'}`
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            element: 'span', attributes: { id: 'sources-main-window-content-title' }, children: [
                                { element: 'p', text: `Path: ${data.path}` },
                                { element: 'p', text: `Type: ${data.type}` }
                            ]
                        },
                    ]
                },
                { element: 'div', attributes: { id: 'sources-main-window-content-container' } },
                { element: 'div', attributes: { class: 'sources-main-window-content-buttons' } }
            ]
        });
        let container = contents.find('#sources-main-window-content-container');
        contents.data = data;
        for (let child of filteredData.children) {
            container.makeElement({
                element: 'span', attributes: { class: 'sources-single', 'data-type': data.contentType, 'data-value': JSON.stringify(child.value) }, children: [
                    { element: 'p', attributes: { class: 'sources-single-name' }, text: child.name },
                    {
                        element: 'span', attributes: { class: 'sources-single-options' }, children: [
                            { element: 'a', attributes: { class: 'btn btn-small', id: 'sources-single-select' }, text: 'Select' },
                            { element: 'a', attributes: { class: 'btn btn-small', id: 'sources-single-open' }, text: 'Open' }
                        ]
                    }
                ]
            });
        }

        sources.find('#sources-main-window').render(contents);

        if (data.type == 'table') {
            let createTable = kerdx.createTable({ title: 'Table Contents', attributes: { id: data.path }, contents: data.source, search: true, sort: true });

            sources.find('.sources-main-window-content').append(createTable);

            kerdx.listenTable({ options: ['save'], table: createTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.kerdx-table-column-cell').dataset;
                    let table = target.getParents('.kerdx-table');
                    let id = table.find(`.kerdx-table-column[data-name="_id"]`).find(`.kerdx-table-column-cell[data-row="${row}"]`).dataset.value;

                    if (target.id == 'kerdx-table-option-save') {
                        console.log(row);
                    }
                }
            });

            sources.find('.sources-main-window-content').makeElement({
                element: 'div', attributes: { class: 'sources-main-window-content-buttons' }, children: [
                    {
                        element: 'button', attributes: { id: 'select-highlighted', class: 'btn btn-medium', 'data-path': data.path }, text: 'Select Highlighted'
                    },
                    {
                        element: 'button', attributes: { id: 'select-table', class: 'btn btn-medium', 'data-path': data.path }, text: 'Select Table'
                    }
                ]
            });
        }
        if (data.path != 'Home') {
            sources.find('.sources-main-window-content-buttons').render([
                {
                    element: 'button', attributes: { id: 'select-group', class: 'btn btn-medium', 'data-path': data.path }, text: 'Select Group'
                },
                {
                    element: 'button', attributes: { id: 'select-filtered', class: 'btn btn-medium', 'data-path': data.path }, text: 'Select Filtered'
                }
            ]);
        }

        return contents;
    }

    system.connect({ data: { action: 'getSources' } }).then(result => {
        allSources = result;
        render(showTables(result));
    });

    let done = (value, type, filterValues) => {
        if (kerdx.isset(filterValues)) {
            value += '***filterValues:' + JSON.stringify(filterValues);
        }
        if (callback(`$#&{${value}}&#$`, type) != false) {
            popUp.remove();
        }
    }

    sources.addEventListener('click', event => {
        let { target } = event;
        if (target.id == 'sources-single-select') {
            let { value, type } = target.getParents('.sources-single').dataset;
            done(value, type);
        }
        else if (target.id == 'sources-single-open') {
            let singleSource = target.getParents('.sources-single');
            let { type, value } = singleSource.dataset;

            if (type == 'table') {
                render(showLists(value));
            }
            else if (type == 'list') {
                render(showTexts(value));
            }
            else if (type == 'text') {
                alert(value);
            }
        }
        else if (target.id == 'add-filter') {
            filter();
        }
        else if (target.id == 'select-group') {
            let { details, type } = target.getParents('.sources-main-window-content').dataset;
            done(details, type);
        }
        else if (target.id == 'select-filtered') {
            let { details, type, path } = target.getParents('.sources-main-window-content').dataset;
            details = JSON.parse(details);
            details.filter = [];

            let filters = sources.findAll('.sources-panel-filter');

            for (let i = 0; i < filters.length; i++) {
                let filter = filters[i];
                if (filter.sourcePath == path) {
                    details.filter.push(filter.filterData);
                }
            }
            details = JSON.stringify(details);
            done(details, type);
        }
        else if (target.id == 'select-highlighted') {
            let { details, type } = target.getParents('.sources-main-window-content').dataset;
            details = JSON.parse(details);
            details.filter = [];

            let table = sources.find('.kerdx-table');
            let firstColumn = table.find('.kerdx-table-column');
            let firstCells = firstColumn.findAll('.kerdx-table-column-cell');
            let positions = [];

            for (let i = 0; i < firstCells.length; i++) {
                if (firstCells[i].classList.contains('table-selected-row')) {
                    positions.push(firstCells[i].dataset.row);
                }
            }

            details.filter = [{ options: 'position', value: positions.join(',') }];
            details = JSON.stringify(details);
            done(details, type);
        }
        else if (target.id == 'select-table') {
            let { details, type, path } = target.getParents('.sources-main-window-content').dataset;
            details = JSON.parse(details);
            details.filter = [];

            let table = sources.find('.kerdx-table');
            let firstColumn = table.find('.kerdx-table-column');
            let firstCells = firstColumn.findAll('.kerdx-table-column-cell');
            let positions = [];

            for (let i = 0; i < firstCells.length; i++) {
                if (firstCells[i].css().display != 'none') {
                    positions.push(firstCells[i].dataset.row);
                }
            }

            details.filter = [{ options: 'position', value: positions.join(',') }];
            details = JSON.stringify(details);
            done(details, type);
        }
        else if (target.classList.contains('edit-filter')) {
            let filter = target.getParents('.sources-panel-filter');
        }
        else if (target.classList.contains('delete-filter')) {
            if (confirm('This filter will be deleted. Continue?')) {
                target.getParents('.sources-panel-filter').remove();
                navigating = true;
                render();
            }
        }
        else if (target.id == "sources-main-window-content-navigate-backward") {
            navigating = true;
            render(sourceHistory[--sourceHistoryPosition]);
        }
        else if (target.id == "sources-main-window-content-navigate-forward") {
            navigating = true;
            render(sourceHistory[++sourceHistoryPosition]);
        }
    });

    sources.addEventListener('dblclick', event => {
        let { target } = event;
        if (target.classList.contains('sources-single')) {
            let { value, type } = target.dataset;
            done(value, type);
        }
        else if (!kerdx.isnull(target.getParents('.sources-single'))) {
            let { value, type } = target.getParents('.sources-single').dataset;
            done(value, type);
        }
    });

    let runFilter = (data, filterData) => {
        let action = kerdx.textToCamelCased(filterData.options);
        let run = {
            equals: () => {
                let children = [];
                for (let child of data.children) {
                    if (child.name != filterData.value) {
                        continue;
                    }
                    children.push(child);
                }
                data.children = children;
                return data;
            },

            lessThan: () => {
                let children = [];
                filterData.value = Math.floor(filterData.value);
                if (!isNaN(filterData.value)) {
                    for (let child of data.children) {
                        let name = Math.floor(child.name);
                        if (isNaN(name) || name >= filterData.value) {
                            continue;
                        }
                        children.push(child);
                    }
                    data.children = children;
                }
                return data;
            },

            greaterThan: () => {
                let children = [];
                filterData.value = Math.floor(filterData.value);
                if (!isNaN(filterData.value)) {
                    for (let child of data.children) {
                        let name = Math.floor(child.name);
                        if (isNaN(name) || name <= filterData.value) {
                            continue;
                        }
                        children.push(child);
                    }
                    data.children = children;
                }
                return data;
            },

            name: () => {
                let children = [];
                for (let child of data.children) {
                    if (child.name != filterData.value) {
                        continue;
                    }
                    children.push(child);
                }
                data.children = children;
                return data;
            },

            length: () => {
                let children = [];
                if (data.type == 'home') {
                    for (let child of data.children) {
                        if (data.source[child.name].length != filterData.value) {
                            continue;
                        }
                        children.push(child);
                    }
                    data.children = children;
                }
                else if (data.type == 'table') {
                    let lengths = [];
                    for (let source of data.source) {
                        for (let name in source) {
                            lengths[name] = lengths[name] || 0;
                            lengths[name]++;
                        }
                    }

                    for (let child of data.children) {
                        if (lengths[child] != filterData.value) {
                            continue;
                        }
                        children.push(child);
                    }
                    data.children = children;
                }
                else if (data.type == 'list') {
                    for (let child of data.children) {
                        if (child.name.length != filterData.value) {
                            continue;
                        }
                        children.push(child);
                    }
                    data.children = children;
                }
                return data;
            },

            type: () => {
                let children = [];
                for (let child of data.children) {
                    let type = kerdx.isset(allSources[child.name]) ? 'table' : 'list';
                    if (type != filterData.value) {
                        continue;
                    }
                    children.push(child);
                }
                data.children = children;

                return data;
            },

            positions: () => {
                let children = [];
                let value = kerdx.array.each(filterData.value.split(','), v => {
                    return v.trim();
                });

                for (let i = 0; i < data.children.length; i++) {
                    let pos = (i + 1).toString();
                    if (!value.includes(pos)) {
                        continue;
                    }
                    children.push(data.children[i]);
                }
                data.children = children;
                return data;
            },

            sum: () => {
                let children = [];
                let contents = [];
                for (let source of data.source) {
                    for (let name in source) {
                        contents[name] = contents[name] || [];
                        contents[name].push(source[name]);
                    }
                }


                for (let child of data.children) {
                    let sum = kerdx.array.sum(contents[child.name]);
                    if (sum != filterData.value) {
                        continue;
                    }
                    children.push(child);
                }
                data.children = children;
                return data;
            },

            product: () => {
                let children = [];
                let contents = [];
                for (let source of data.source) {
                    for (let name in source) {
                        contents[name] = contents[name] || [];
                        contents[name].push(source[name]);
                    }
                }


                for (let child of data.children) {
                    let product = kerdx.array.product(contents[child.name]);
                    if (product != filterData.value) {
                        continue;
                    }
                    children.push(child);
                }
                data.children = children;
                return data;
            },

            date: () => {
                let children = [];
                for (let source of data.source) {
                    console.log(source);

                }
                data.children = children;
                return data;
            },

            beforeDate: () => {
                let children = [];
                for (let child of data.children) {
                    if (child.timeCreated >= filterData.value) {
                        continue;
                    }
                    children.push(child);
                }
                data.children = children;
                return data;
            },

            afterDate: () => {

            }
        }

        return run[action]();
    }

    let filter = () => {
        let data = sources.find('.sources-main-window-content').data;
        filters[data.path] = filters[data.path] || {};
        let contents = kerdx.array.toSet(data.contents);
        contents.unshift('Null');
        let filterForm = kerdx.createForm({
            title: 'Create Filter', attributes: { class: 'form', style: { border: '1px solid var(--secondary-color)' } },
            contents: {
                options: { element: 'select', attributes: { name: 'options', id: 'options' }, options: filterOptions[data.type] },
                value: { element: 'input', attributes: { name: 'value', id: 'value', ignore: true } }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit' }, text: 'Add Filter' }
            }
        });

        let filterPopUp = kerdx.popUp(filterForm);
        filterPopUp.find('#toggle-window').click();

        filterForm.addEventListener("submit", event => {
            event.preventDefault();
            let formValidation = kerdx.validateForm(filterForm);

            if (!formValidation.flag) {
                filterForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            let filterData = kerdx.jsonForm(filterForm);
            let readableData = `Options: ${filterData.options}, value: ${filterData.value}`;

            let filterContainer = sources.find('#sources-panel');
            let aFilter = filterContainer.makeElement({
                element: 'span', attributes: { class: 'sources-panel-filter' }, children: [
                    { element: 'p', attributes: { class: 'sources-panel-filter-text', title: readableData }, text: readableData.slice(0, 10) },
                    { element: 'i', attributes: { class: 'icon edit-filter', 'data-icon': 'fas, fa-pen', title: 'Edit Filter' } },
                    { element: 'i', attributes: { class: 'icon delete-filter', 'data-icon': 'fas, fa-trash', title: 'Delete Filter' } }
                ]
            });
            aFilter.sourcePath = data.path;
            aFilter.filterData = filterData;
            navigating = true;
            render();

            filterPopUp.remove();
        });
    }
}

system.getSources = (data, callback) => {
    let allSources = {},
        sources,
        collection,
        item,
        name,
        position,
        filter,
        projection,
        contentName,
        runSources = {},
        content,
        duration;

    for (let i in data) {
        content = data[i];
        contentName = content.name;
        if (kerdx.isset(content.source) && content.source != '') {
            let setSources = () => {
                for (let source of sources) {
                    source = JSON.parse(kerdx.inBetween(source, '$#&{', '}&#$'));
                    collection = source.collection;
                    item = source.item;
                    name = source.name;
                    position = source.position;
                    filter = source.filter;

                    if (!kerdx.isset(item)) {
                        find = JSON.stringify({ contentName, position, name, filter });
                        if (kerdx.isset(name)) {
                            projection = { _id: 0, [name]: 1, timeCreated: 1, lastModified: 1 };
                            runSources[find] = system.get({ collection, query: {}, projection, many: true });
                        }
                        else {
                            runSources[find] = system.get({ collection, query: {}, many: true });
                        }
                    }
                    else {
                        find = JSON.stringify({ contentName, item, position, name, filter });
                        runSources[find] = system.get({ collection, query: { name: item } });
                    }
                }
            }
            sources = kerdx.allCombine(content.source, '$#&{', '}&#$');
            setSources();
        }
    }

    kerdx.runParallel(runSources, results => {
        let source, content;

        for (let i in results) {
            source = JSON.parse(i);
            contentName = source.contentName;
            item = source.item;
            name = source.name;
            position = source.position;
            filter = source.filter;
            duration = kerdx.array.find(data, d => {
                return d.name == contentName;
            }).duration || {};

            if (!kerdx.isset(item)) {
                if (kerdx.isset(name)) {
                    content = kerdx.object.valueOfObjectArray(system.runFilters(results[i], filter, duration), name);
                }
                else {
                    content = system.runFilters(results[i], filter, duration);
                }
            }
            else {
                if (kerdx.isset(name)) {
                    content = kerdx.object.valueOfObjectArray(system.runFilters(results[i].contents, filter, duration), name);
                }
                else {
                    content = system.runFilters(results[i].contents, filter, duration);
                }
            }

            allSources[contentName] = allSources[contentName] || [];

            if (kerdx.isset(position)) {
                allSources[contentName].push(content[position]);
            }
            else {
                allSources[contentName].push(content);
            }
        }

        callback(allSources);
    });
}

system.runFilters = (contents, filters, duration = {}) => {
    let filterData, action, start, end, moment;

    let run = {
        equals: () => {
            let children = [];
            for (let child of contents) {
                if (child.name != filterData.value) {
                    continue;
                }
                children.push(child);
            }
            return children;
        },

        lessThan: () => {
            let children = [];
            filterData.value = Math.floor(filterData.value);
            if (!isNaN(filterData.value)) {
                for (let child of contents) {
                    let name = Math.floor(child.name);
                    if (isNaN(name) || name >= filterData.value) {
                        continue;
                    }
                    children.push(child);
                }
            }
            return children;
        },

        greaterThan: () => {
            let children = [];
            filterData.value = Math.floor(filterData.value);
            if (!isNaN(filterData.value)) {
                for (let child of contents) {
                    let name = Math.floor(child.name);
                    if (isNaN(name) || name <= filterData.value) {
                        continue;
                    }
                    children.push(child);
                }
            }
            return children;
        },

        name: () => {
            if (!Array.isArray(contents)) {
                let children = {};
                for (let name of contents) {
                    if (name != filterData.value) {
                        continue;
                    }
                    children[name] = contents[name];
                }
                return children;
            }
            else {
                let children = [];
                for (let child of contents) {
                    if (child.name != filterData.value) {
                        continue;
                    }
                    children.push(child);
                }
                return children;
            }
        },

        length: () => {
            let children = [];
            for (let child of contents) {
                if (child.length != filterData.value) {
                    continue;
                }
                children.push(child);
            }
            return children;
        },

        type: () => {
            let children = [];
            for (let child of contents) {
                let type = 'table';
                if (type != filterData.value) {
                    continue;
                }
                children.push(child);
            }

            return children;
        },

        positions: () => {
            let children = [];
            let value = kerdx.array.each(filterData.value.split(','), v => {
                return v.trim();
            });

            for (let i = 0; i < contents.length; i++) {
                let pos = (i + 1).toString();
                if (!value.includes(pos)) {
                    continue;
                }
                children.push(contents[i]);
            }
            return children;
        },

        sum: () => {
            let children = [];
            for (let child of contents) {
                let sum = kerdx.array.sum(child);
                if (sum != filterData.value) {
                    continue;
                }
                children.push(child);
            }
            return children;
        },

        product: () => {
            let children = [];
            for (let child of contents) {
                let sum = kerdx.array.product(child);
                if (sum != filterData.value) {
                    continue;
                }
                children.push(child);
            }
            return children;
        }
    }

    let checkDuration = () => {
        let duplicate = [];
        if (kerdx.isset(duration.startDate) && duration.startDate != '') {
            start = kerdx.secondsTillDate(duration.startDate);
            if (kerdx.isset(duration.startTime) && duration.startTime != '') {
                if (kerdx.isTimeValid(duration.startTime)) {
                    start = Math.floor(start) + kerdx.isTimeValid(duration.startTime);
                }
            }
        }

        if (kerdx.isset(duration.endDate) && duration.endDate != '') {
            end = kerdx.secondsTillDate(duration.endDate);
            if (kerdx.isset(duration.endTime) && duration.endTime != '') {
                if (kerdx.isTimeValid(duration.endTime)) {
                    end = Math.floor(end) + kerdx.isTimeValid(duration.endTime);
                }
            }
        }

        if (!kerdx.isset(start) && !kerdx.isset(end)) {
            return contents;
        }

        for (let con of contents) {
            moment = kerdx.secondsTillMoment(con.timeCreated);
            if (kerdx.isset(start) && start <= moment) {
                duplicate.push(con);
            }

            if (kerdx.isset(end) && end >= moment) {
                duplicate.push(con);
            }
        }

        return duplicate;
    }

    contents = checkDuration();
    if (kerdx.isset(filters)) {
        for (let data of filters) {
            filterData = data;
            action = kerdx.textToCamelCased(filterData.options);
            contents = run[action]();
        }
    }

    return contents;
}

system.print = (element) => {
    let content = document.body.innerHTML;
    document.body.render(element);
    window.onafterprint = () => {
        document.body.innerHTML = content;
        system.reload();
    }

    window.print();
}

system.getLink = (collection, id, action) => {
    let link;
    if (collection == 'items') {
        link = `items.html?page=${action}&id=${id}`;
    }
    else if (collection == 'users') {
        link = `users.html?page=${action}&id=${id}`;
    }
    else if (collection == 'forms') {
        link = `forms.html?page=${action}&id=${id}`;
    }
    else if (collection == 'reports') {
        link = `reports.html?page=${action}&id=${id}`;
    }
    else if (collection == 'categories') {
        link = `settings.html?page=categories&action=${action}&id=${id}`;
    }
    else if (collection == 'tags') {
        link = `settings.html?page=tags&action=${action}&id=${id}`;
    }
    else if (collection == 'lists') {
        link = `settings.html?page=lists&action=${action}&id=${id}`;
    }
    else if (collection == 'customforms') {
        link = `settings.html?page=customforms&action=${action}&id=${id}`;
    }
    else if (collection == 'reportgenerators') {
        link = `settings.html?page=reportgenerators&action=${action}&id=${id}`;
    }

    return link;
}

system.getNotifications = (flag) => {
    return system.connect({ data: { action: 'getNotifications', flag } }).then(notifications => {
        if (flag == 'all') {
            let run = {};
            for (let note of notifications) {
                if (!note.delivered) {
                    run[note._id] = system.connect({ data: { action: 'sentNotification', id: note._id } })
                }
            }
            kerdx.runParallel(run, ran => {

            });
        }
        return notifications;
    });
}

document.addEventListener('DOMContentLoaded', event => {
    document.body.makeElement({
        element: 'div', attributes: { id: 'main-notifications' }, children: [
            { element: 'i', attributes: { class: 'icon fas fa-angle-double-left', id: 'close-notifications' } },
            {
                element: 'div', attributes: { id: 'main-notifications-window' }, children: [

                ]
            }
        ]
    });

    document.body.makeElement({ element: 'i', attributes: { class: 'icon fas fa-angle-double-right', id: 'open-notifications' } },
    );
    route();

    if (true) {
        kerdx.api.makeWebapp(event => {
            route();
        });
    }
    else {
        setSources((source, type, popUp) => {
            console.log(source, type);

            if (type == 'text') {
                console.log(source, type);
            }
            else {
                console.log({ note: 'Select Text Please' });
                return false;
            }
        });
    }
});
