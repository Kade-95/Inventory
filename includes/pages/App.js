import { Dashboard } from './Dashboard.js';
import { Users } from './Users.js';
import { Items } from './Items.js';
import { Settings } from './Settings.js';
import { Forms } from './Forms.js';
import { Reports } from './Reports.js';
import { History } from './History.js';
import { Notifications } from './Notifications.js';

const dashboard = new Dashboard();
const users = new Users();
const items = new Items();
const forms = new Forms();
const reports = new Reports();
const _history = new History();
const notifications = new Notifications();
const settings = new Settings();
class App {
    constructor() {
        this.currentPage = 'dashboard.html';
        system.notificationsWindow = notifications;
    }

    init() {
        document.body.css({ gridTemplateRows: '1fr' });
        let header = document.body.find('#main-header');
        header.css({ display: 'none' });

        let main = document.body.find('#main-window');

        let panelLink = (name, mClass) => {
            let profileLink = kerdx.createElement({
                element: 'a', attributes: { class: `panel-link ${name}`, href: name + '.html', title: name }, children: [
                    { element: 'i', attributes: { class: `panel-image ${mClass}` } },
                    { element: 'a', attributes: { class: 'panel-text' }, text: name }
                ]
            });

            if (name == 'profile') {
                profileLink.render({ element: 'img', attributes: { class: `panel-image`, src: mClass } });
            }

            return profileLink;
        }
        let userImage = document.body.dataset.userImage;
        if (userImage == 'null') {
            userImage = 'images/logo.png';
        }

        let panel = kerdx.createElement({
            element: 'span', attributes: { id: 'panel' }, children: [
                panelLink('profile', userImage),
                panelLink('dashboard', 'fas fa-vector-square'),
                panelLink('items', 'fas fa-store'),
                panelLink('forms', 'fab fa-wpforms'),
                panelLink('reports', 'fas fa-newspaper'),
                panelLink('users', 'fas fa-users'),
                panelLink('history', 'fas fa-history'),
                panelLink('notifications', 'fas fa-bell'),
                panelLink('settings', 'fas fa-cogs'),
                panelLink('logout', 'fas fa-sign-out-alt')
            ]
        });

        main.makeElement({
            element: 'section', attributes: { id: 'landed' }, children: [
                {
                    element: 'div', attributes: { id: 'side-bar', class: 'slim-side-bar side-bar' }, children: [
                        {
                            element: 'span', attributes: { id: 'side-bar-profile' }, children: [
                                {
                                    element: 'a', attributes: { class: 'side-bar-profile-image-container', href: 'profile.html' }, children: [
                                        { element: 'img', attributes: { id: 'side-bar-profile-image', src: userImage } },
                                    ]
                                },
                                { element: 'h5', attributes: { id: 'side-bar-profile-name' }, text: document.body.dataset.fullName },
                                {
                                    element: 'span', attributes: { id: 'side-bar-profile-controls' }, children: [
                                        { element: 'a', attributes: { href: 'logout.html', class: 'icon fas fa-sign-out-alt' } }
                                    ]
                                }
                            ]
                        },
                        panel.cloneNode(true)
                    ]
                },
                {
                    element: 'div', attributes: { id: 'mobile-side-bar', class: 'hide-mobile-side-bar side-bar' }, children: [
                        {
                            element: 'span', attributes: { id: 'side-bar-profile' }, children: [
                                { element: 'i', attributes: { id: 'close-side-bar', class: 'icon fas fa-angle-double-left' } },
                                {
                                    element: 'a', attributes: { class: 'side-bar-profile-image-container', href: 'profile.html' }, children: [
                                        { element: 'img', attributes: { id: 'side-bar-profile-image', src: userImage } },
                                    ]
                                },
                                { element: 'h5', attributes: { id: 'side-bar-profile-name' }, text: document.body.dataset.fullName },
                                {
                                    element: 'span', attributes: { id: 'side-bar-profile-controls' }, children: [
                                        { element: 'a', attributes: { href: 'logout.html', class: 'icon fas fa-sign-out-alt' } }
                                    ]
                                }
                            ]
                        },
                        panel.cloneNode(true)
                    ]
                },
                {
                    element: 'div', attributes: { id: 'main-container' }, children: [
                        {
                            element: 'div', attributes: { id: 'main-container-header' }, children: [
                                {
                                    element: 'span', attributes: { id: 'main-container-header-nav' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-angle-double-right', id: 'open-side-bar' } },
                                        { element: 'i', attributes: { class: 'icon fas fa-redo', id: 'reload-page' } },
                                        { element: 'i', attributes: { class: 'icon fas fa-search', id: 'open-search' } }
                                    ]
                                },
                                { element: 'h5', attributes: { id: 'current-page-name' }, text: location.pathname.slice(1, location.pathname.indexOf('.html')) },
                            ]
                        },
                        {
                            element: 'div', attributes: { id: 'main-container-body' }
                        }
                    ]
                }
            ]
        });

        this.listen();
        this.route();
    }

    listen() {
        this.checkNotifications();
        let main = document.body.find('#main-window');

        main.find('#close-side-bar').addEventListener('click', event => {
            main.find('#mobile-side-bar').classList.remove('show-mobile-side-bar');
            main.find('#mobile-side-bar').classList.add('hide-mobile-side-bar');
            main.find('#side-bar').classList.add('slim-side-bar');
            main.find('#open-side-bar').classList.toggle('fa-angle-double-right');
            main.find('#open-side-bar').classList.toggle('fa-angle-double-left');
        });

        main.find('#main-container').addEventListener('click', event => {
            if (event.target.id == 'open-side-bar') {
                event.target.classList.toggle('fa-angle-double-right');
                event.target.classList.toggle('fa-angle-double-left');
                main.find('#mobile-side-bar').classList.toggle('show-mobile-side-bar');
                main.find('#mobile-side-bar').classList.toggle('hide-mobile-side-bar');
                main.find('#side-bar').classList.toggle('slim-side-bar');
            }
            else {
                main.find('#open-side-bar').classList.add('fa-angle-double-right');
                main.find('#open-side-bar').classList.remove('fa-angle-double-left');
                main.find('#mobile-side-bar').classList.remove('show-mobile-side-bar');
                main.find('#mobile-side-bar').classList.add('hide-mobile-side-bar');
                main.find('#side-bar').classList.add('slim-side-bar');
            }

            if (event.target.id == 'reload-page') {
                this.route();
            }
        });

        main.find('#open-search').addEventListener('click', event => {
            this.search();
        });
    }

    route() {
        let { pathname } = location;

        if (pathname == '/dashboard.html') {
            dashboard.display();
        }
        else if (pathname == '/users.html') {
            users.display();
        }
        else if (pathname == '/settings.html') {
            settings.display();
        }
        else if (pathname == '/items.html') {
            items.display();
        }
        else if (pathname == '/forms.html') {
            forms.display();
        }
        else if (pathname == '/reports.html') {
            reports.display();
        }
        else if (pathname == '/history.html') {
            _history.display();
        }
        else if (pathname == '/notifications.html') {
            notifications.display();
        }
        else if (pathname == '/profile.html') {
            this.profile();
        }
        else if (pathname == '/changePassword.html') {
            this.changePassword();
        }
        else if (pathname == '/logout.html') {
            this.logout();
        }
        else {
            let mainBody = document.body.find('#main-container-body');
            system.display404(mainBody);
        }

        if (location.pathname != '/logout.html') {
            this.currentPage = location.pathname.replace('/', '');
        }
    }

    profile() {
        let user = document.body.dataset.user;
        let bodyContainer = document.body.find('#main-container-body');
        system.get({ collection: 'users', query: { _id: user }, changeQuery: { _id: 'objectid' } }).then(result => {
            let birthday = result.birthday;
            let age;
            if (kerdx.notNull(birthday)) {
                age = (kerdx.dateWithToday(result.birthday).diff / 365.25).toString().slice(1, 3)
            }
            bodyContainer.makeElement(
                [
                    {
                        element: 'div'
                    },
                    {
                        element: 'div', attributes: { id: 'users-main-window' }, children: [
                            {
                                element: 'div', attributes: { id: 'show-user' }, children: [
                                    {
                                        element: 'div', attributes: { id: 'show-user-bio' }, children: [
                                            { element: 'a', attributes: { href: '/changePassword.html', class: 'btn btn-small' }, text: 'Change Password' },
                                            system.editableImage('profile-picture', result.userImage),
                                            {
                                                element: 'span', attributes: { id: 'show-user-names' }, text: result.fullName || 'No Name', children: [
                                                    { element: 'a', attributes: { id: 'edit-profile', class: 'fas fa-pen icon' } }
                                                ]
                                            },
                                            {
                                                element: 'span', attributes: { id: 'show-user-origin' }, children: [
                                                    { element: 'p', attributes: { class: 'show-user-bio-detail' }, text: `${age || ''} years` },
                                                    { element: 'p', attributes: { class: 'show-user-bio-detail' }, text: `Was born on ${result.birthday || ''}` },
                                                    { element: 'p', attributes: { class: 'show-user-bio-detail' }, text: `From ${result.origin || ''}, ${result.nationality || ''}` },
                                                    { element: 'p', attributes: { class: 'show-user-bio-detail' }, text: `Gender is ${result.gender || ''}` },
                                                    { element: 'p', attributes: { class: 'show-user-bio-detail' }, text: `Marital Status is ${result.maritalStatus || ''}` },
                                                ]
                                            },
                                        ]
                                    },
                                    {
                                        element: 'div', attributes: { id: 'show-user-details' }, children: [
                                            {
                                                element: 'span', attributes: { id: 'show-user-work-details' }, children: [
                                                    {
                                                        element: 'span', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                            { element: 'i', attributes: { class: 'icon fas fa-user' } },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Username' },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: result.userName }
                                                        ]
                                                    },
                                                    {
                                                        element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                            { element: 'i', attributes: { class: 'icon fas fa-envelope' } },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Email' },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: result.email }
                                                        ]
                                                    },
                                                    {
                                                        element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                            { element: 'i', attributes: { class: 'icon fas fa-phone' } },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Phone' },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: result.phone }
                                                        ]
                                                    },
                                                    {
                                                        element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                            { element: 'i', attributes: { class: 'icon fas fa-building' } },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Department' },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: result.department }
                                                        ]
                                                    },
                                                    {
                                                        element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                            { element: 'i', attributes: { class: 'icon fas fa-users' } },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'User Type' },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: result.userType }
                                                        ]
                                                    },
                                                    {
                                                        element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                            { element: 'i', attributes: { class: 'icon fas fa-calendar' } },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Hire Date' },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: result.hireDate }
                                                        ]
                                                    },
                                                    {
                                                        element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                                            { element: 'i', attributes: { class: 'icon fas fa-money-bill' } },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Salary' },
                                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: '$' + kerdx.addCommaToMoney(result.salary || 0) }
                                                        ]
                                                    },
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            );

            bodyContainer.find('#edit-profile-picture').addEventListener('click', event => {
                let uploadImageForm = kerdx.createElement({
                    element: 'form', attributes: { class: 'single-upload-form' }, children: [
                        {
                            element: 'span', attributes: { class: 'single-upload-form-controls' }, children: [
                                { element: 'input', attributes: { type: 'file', name: 'newImage', id: 'new-image' } },
                                { element: 'button', attributes: { id: 'upload', class: 'btn btn-small' }, text: 'upload' }
                            ]
                        },
                        {
                            element: 'img', attributes: { id: 'preview-image' }
                        }
                    ]
                });

                let popUp = kerdx.popUp(uploadImageForm);

                uploadImageForm.find('#new-image').onChanged(value => {
                    uploadImageForm.find('#preview-image').src = value.src;
                });

                uploadImageForm.find('#upload').addEventListener('click', event => {
                    event.preventDefault();
                    let data = kerdx.jsonForm(uploadImageForm);
                    data.action = 'changeDp';

                    system.connect({ data }).then(result => {
                        if (result == true) {
                            system.notify({ note: 'Image was successfully uploaded' });
                            bodyContainer.find('#editable-image').src = uploadImageForm.find('#preview-image').src;
                            popUp.remove();
                        }
                        else {
                            system.notify({ note: 'Could not upload Image' });
                        }
                    });
                });
            });

            bodyContainer.find('#delete-profile-picture').addEventListener('click', event => {
                let data = { action: 'deleteDp' }
                system.connect({ data }).then(result => {
                    if (result == true) {
                        system.notify({ note: 'Image was successfully deleted' });
                        bodyContainer.find('#show-user-image').src = '';
                    }
                    else {
                        system.notify({ note: 'Could not delete Image' });
                    }
                });
            });

            bodyContainer.find('#edit-profile').addEventListener('click', event => {
                let editForm = kerdx.createForm({
                    title: 'Edit Profile', attributes: { enctype: 'multipart/form-data', id: 'edit-profile-form', class: 'form', style: { border: '1px solid var(--secondary-color)' } },
                    contents: {
                        userName: { element: 'input', attributes: { id: 'user-name', name: 'userName', value: result.userName } },
                        email: { element: 'input', attributes: { id: 'email', name: 'email', type: 'email', value: result.email } },
                        fullName: { element: 'input', attributes: { id: 'full-name', name: 'fullName', value: result.fullName || '' } },
                        birthday: { element: 'input', attributes: { id: 'birthday', name: 'birthday', value: result.birthday || '', type: 'date' } },
                        nationality: { element: 'input', attributes: { id: 'nationality', name: 'nationality', value: result.nationality || '' } },
                        origin: { element: 'input', attributes: { id: 'origin', name: 'origin', value: result.origin || '' }, note: 'Your State in country' },
                        phone: { element: 'input', attributes: { id: 'phone', name: 'phone', value: result.phone || '' } },
                        gender: { element: 'select', attributes: { id: 'gender', name: 'gender' }, options: ['Null', 'Male', 'Female'], selected: result.gender },
                        maritalStatus: { element: 'select', attributes: { id: 'marital-status', name: 'maritalStatus' }, options: ['Null', 'Married', 'Single', 'Divorced', 'Widowed'], selected: result.maritalStatus }
                    },
                    buttons: {
                        submit: { element: 'button', attributes: { id: 'submit' }, text: 'Edit', state: { name: 'submit', owner: '#edit-profile-form' } },
                    },
                    columns: 2
                });

                let popUp = kerdx.popUp(editForm);
                popUp.find('#toggle-window').click();

                editForm.addEventListener('submit', event => {
                    event.preventDefault();
                    let formValidation = kerdx.validateForm(editForm, { names: ['userName', 'email'] });

                    if (!formValidation.flag) {
                        editForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                        return;
                    }
                    let data = kerdx.jsonForm(editForm);
                    data.action = 'editProfile';
                    system.connect({ data }).then(result => {
                        if (result == true) {
                            system.notify({ note: 'Profile Updated Successfully' });
                            system.redirect(location.href);
                        }
                        else {
                            system.notify({ note: 'Could not update Profile' });
                        }
                    });

                });
            });

            bodyContainer.find('#editable-image-container').addEventListener('mouseenter', event => {
                bodyContainer.find('#editable-image-container').find('#editable-image-controls').css({ visibility: 'visible' });
            });

            bodyContainer.find('#editable-image-container').addEventListener('mouseleave', event => {
                bodyContainer.find('#editable-image-container').find('#editable-image-controls').css({ visibility: 'hidden' });
            });
        });
    }

    changePassword() {
        let user = document.body.dataset.user;
        let bodyContainer = document.body.find('#main-container-body');
        let loading = kerdx.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });

        let passwordForm = kerdx.createForm({
            title: 'Change Password', attributes: { enctype: 'multipart/form-data', id: 'change-password-form', class: 'form' },
            contents: {
                currentPassword: { element: 'input', attributes: { id: 'current-password', name: 'currentPassword', type: 'password' }, label: kerdx.createElement({ element: 'a', text: 'Current Password', children: [{ element: 'i', attributes: { class: 'icon fas fa-eye' } }] }).innerHTML },
                newPassword: { element: 'input', attributes: { id: 'new-password', name: 'newPassword', type: 'password' }, note: 'Password must not be less than 8 characters, Should have atleast 1 uppercase, 1 lowercase, 1 number and 1 symbol', label: kerdx.createElement({ element: 'a', text: 'New Password', children: [{ element: 'i', attributes: { class: 'icon fas fa-eye' } }] }).innerHTML },
                verifyPassword: { element: 'input', attributes: { id: 'verify-password', name: 'verifyPassword', type: 'password' }, label: kerdx.createElement({ element: 'a', text: 'Verify Password', children: [{ element: 'i', attributes: { class: 'icon fas fa-eye' } }] }).innerHTML },
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit' }, text: 'Change', state: { name: 'submit', owner: '#change-password-form' } },
            },
            required: ['currentPassword', 'newPassword', 'verifyPassword']
        });

        bodyContainer.render(passwordForm);

        passwordForm.addEventListener('click', event => {
            let target = event.target;
            if (target.classList.contains('icon')) {
                let input = target.parentNode.nextSibling;
                target.classList.toggle('fa-eye-slash');
                target.classList.toggle('fa-eye');
                if (target.classList.contains('fa-eye-slash')) {
                    input.type = 'text';
                }
                else {
                    input.type = 'password';
                }
            }
        });

        let newPassword = passwordForm.find('#new-password');
        let verifyPassword = passwordForm.find('#verify-password');
        let trials = 0;
        passwordForm.addEventListener('submit', event => {
            event.preventDefault();
            passwordForm.setState({ name: 'error', attributes: { style: { display: 'none' } }, text: '' });

            if (kerdx.isPasswordValid(newPassword.value)) {
                if (newPassword.value == verifyPassword.value) {
                    passwordForm.getState({ name: 'submit' }).replaceWith(loading);
                    let data = kerdx.jsonForm(passwordForm);
                    data.action = 'changePassword';
                    delete data.verifyPassword;

                    system.connect({ data }).then(result => {
                        loading.replaceWith(passwordForm.getState({ name: 'submit' }));
                        trials++;
                        if (result == true) {
                            window.history.go(-1);
                            system.notify({ note: 'Password has changed' });
                        }
                        else {
                            system.notify({ note: 'Password was not changed' });
                            if (trials == 3) {
                                system.notify({ note: 'You have been logout for security reasons' });
                                this.logout();
                            }
                        }
                    });
                }
                else {
                    passwordForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: 'Passwords does not match' });
                }
            }
            else {
                passwordForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: 'Password does not meet the requirements' });
            }
        });
    }

    logout() {
        let user = document.body.dataset.user;

        system.connect({ data: { action: 'logout', user } }).then(result => {
            let note = 'Goodbye, See you soon';
            if (result == true) {
                delete document.body.dataset.user;
                delete document.body.dataset.userType;
                delete document.body.dataset._id;
                system.redirect('index.html');
            }
            else {
                note = 'Error login out';
            }
            system.notify({ note });
        });
    }

    search() {
        if (!kerdx.isset(system.searchWindow)) {
            system.searchWindow = kerdx.createElement({
                element: 'div', attributes: { id: 'search-window' }, children: [
                    {
                        element: 'span', attributes: { id: 'search' }, children: [
                            { element: 'input', attributes: { id: 'search-box', placeHolder: 'Search me...' } },
                            { element: 'i', attributes: { class: 'icon fas fa-search', id: 'search-button' } }
                        ]
                    },
                    {
                        element: 'div', attributes: { id: 'found' }, children: [
                            {
                                element: 'menu', attributes: { id: 'found-menu' }, children: [
                                    { element: 'a', attributes: { class: 'found-menu-item active', id: 'found-all' }, text: 'All' },
                                    { element: 'a', attributes: { class: 'found-menu-item', id: 'found-items' }, text: 'Items' },
                                    { element: 'a', attributes: { class: 'found-menu-item', id: 'found-users' }, text: 'Users' },
                                    { element: 'a', attributes: { class: 'found-menu-item', id: 'found-categories' }, text: 'Categories' },
                                    { element: 'a', attributes: { class: 'found-menu-item', id: 'found-tags' }, text: 'Tags' },
                                    { element: 'a', attributes: { class: 'found-menu-item', id: 'found-lists' }, text: 'Lists' }
                                ]
                            },
                            {
                                element: 'section', attributes: { id: 'found-window' }, children: [
                                    { element: 'div', attributes: { class: 'found-window-item active', id: 'found-all' }, text: 'All' },
                                    { element: 'div', attributes: { class: 'found-window-item', id: 'found-items' }, text: 'Items' },
                                    { element: 'div', attributes: { class: 'found-window-item', id: 'found-users' }, text: 'Users' },
                                    { element: 'div', attributes: { class: 'found-window-item', id: 'found-categories' }, text: 'Categories' },
                                    { element: 'div', attributes: { class: 'found-window-item', id: 'found-tags' }, text: 'Tags' },
                                    { element: 'div', attributes: { class: 'found-window-item', id: 'found-lists' }, text: 'Lists' }
                                ]
                            }
                        ]
                    }
                ]
            });
        }
        let popUp = kerdx.popUp(system.searchWindow, { title: 'Search Window', attributes: { style: { width: '100%', height: '100%' } } });
        let itemUnit = new kerdx.Shadow(kerdx.createElement({
            element: 'a', attributes: { class: 'found-item' }, children: [
                { element: 'img', attributes: { class: 'found-item-image' } },
                { element: 'p', attributes: { class: 'found-item-name' } }
            ]
        }));

        let target, id, query, image, name, link;
        system.searchWindow.addEventListener('click', event => {
            target = event.target;
            id = target.id;
            if (target.id == 'search-button') {
                query = system.searchWindow.find('#search-box').value;
                if (query != '') {
                    system.connect({ data: { action: 'search', query } }).then(result => {
                        system.searchWindow.find(`#found-window #found-all`).innerHTML = '';
                        for (let collection in result) {
                            system.searchWindow.find(`#found-window #found-${collection}`).innerHTML = '';

                            for (let item of result[collection]) {
                                image = item.image;
                                name = item.name;
                                if (!kerdx.isset(image) || image == '') {
                                    image = 'images/logo.png';
                                }
                                let foundItem = itemUnit.createElement({
                                    details: { attributes: { href: system.getLink(collection, item._id, 'show') } },
                                    childDetails: {
                                        attributes: {
                                            '.found-item-image': [
                                                { attributes: { src: image } }
                                            ],
                                        },
                                        properties: {
                                            '.found-item-name': [
                                                { properties: { textContent: name } }
                                            ],
                                        }
                                    }
                                });

                                system.searchWindow.find(`#found-window #found-${collection}`).append(foundItem);

                                system.searchWindow.find(`#found-window #found-all`).append(foundItem.unitClone());
                            }
                        }
                    });
                }
            }
            else if (target.classList.contains('found-menu-item')) {
                system.searchWindow.find('.found-menu-item.active').classList.remove('active');
                system.searchWindow.find('.found-window-item.active').classList.remove('active');

                target.classList.add('active');
                system.searchWindow.find(`#found-window #${id}`).classList.add('active');
            }
        });
    }

    checkNotifications = () => {
        let notificationsButtons = document.body.findAll('.panel-link.notifications');
        if (!this.checkedNotifications) {
            system.getNotifications('unread').then(notifications => {
                if (notifications.length > 0) {
                    system.notify({ note: 'You have some unread notifications', link: 'notifications.html' });
                }
                this.checkedNotifications = true;
            });
        }

        setInterval(() => {
            system.getNotifications('unsent').then(notifications => {
                if (notifications.length > 0) {
                    for (let i = 0; i < notificationsButtons.length; i++) {
                        notificationsButtons[i].css({ color: 'var(--accient-color)' });
                        notificationsButtons[i].find('i').addClass('fa-spin');
                    }
                }
                else {
                    for (let i = 0; i < notificationsButtons.length; i++) {
                        notificationsButtons[i].cssRemove(['color']);
                        notificationsButtons[i].find('i').removeClass('fa-spin');
                    }
                }
            })
        }, 1000 * 30);
    }
}

export { App };
