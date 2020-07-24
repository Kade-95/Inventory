
class Users {
    constructor() {

    }

    display() {
        let main = document.body.find('#main-window');
        let mainBody = main.find('#main-container-body');

        mainBody.render([
            {
                element: 'div', attributes: { id: 'main-container-body-main-actions' }, children: [
                    { element: 'a', attributes: { class: 'fas fa-plus', id: 'new-icon', title: 'Create User', href: 'users.html?page=create' } },
                    { element: 'span', attributes: { id: 'more-user-controls' } }
                ]
            },
            {
                element: 'div', attributes: { id: 'users-main-window' }
            }
        ]);

        let url = perceptor.urlSplitter(location.href);
        let page = url.vars.page;
        if (!Object.values(url.vars).length) {
            this.view(mainBody.find('#users-main-window'));
        }
        else if (perceptor.isset(this[page])) {
            this[page](mainBody.find('#users-main-window'));
        }
        else {
            system.display404(mainBody.find('#users-main-window'));
        }
    }

    create(container) {
        let createForm = perceptor.createForm({
            title: 'Create User', attributes: { enctype: 'multipart/form-data', id: 'create-user-form', class: 'form', style: { border: '1px solid var(--secondary-color)' } },
            contents: {
                userName: { element: 'input', attributes: { id: 'user-name', name: 'userName' } },
                email: { element: 'input', attributes: { id: 'email', name: 'email' } },
                password: {
                    element: 'input', attributes: { id: 'current-password', name: 'currentPassword', type: 'password', autoComplete: true }, note: 'Password must not be less than 8 characters, Should have atleast 1 uppercase, 1 lowercase, 1 number and 1 symbol'
                },
                userType: { element: 'select', attributes: { id: 'user-type', name: 'userType' }, options: ['Null', 'Staff', 'Admin'] },
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create', state: { name: 'submit', owner: '#create-user-form' } },
            }
        });

        container.render(createForm);

        this.makeUser(createForm);
    }

    makeUser(form) {
        let loading = perceptor.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });

        form.getState({ name: 'submit' }).addEventListener('click', event => {
            event.preventDefault();
            form.getState({ name: 'submit' }).replaceWith(loading);
            form.setState({ name: 'error', attributes: { style: { display: 'none' } }, text: '' });

            let formValidation = perceptor.validateForm(form);

            if (!formValidation.flag) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            loading.replaceWith(form.getState({ name: 'submit' }));
            let data = perceptor.jsonForm(form);
            data.action = 'createUser';
            system.connect({ data }).then(result => {
                if (result == true) {
                    window.history.go(-1);
                }
                else if (perceptor.isset(result.found)) {
                    form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `${perceptor.camelCasedToText(result.found).toUpperCase()} is already in use` });
                }
                else {
                    form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Error Unknown` });
                }
            });
        });
    }

    view(container) {
        let moreControls = document.body.find('#more-user-controls');

        system.get({ collection: 'users', query: {}, projection: { userType: 1, userName: 1, email: '1' }, many: true }).then(result => {
            for (let i in result) {
                result[i].status = 'Offline';
            }
            let usersTable = perceptor.createTable({ title: 'Users Table', contents: result, search: true, sort: true, filter: ['All', 'Online', 'Offline', 'Admin', 'Staff'], projection: {email: -1}});
            container.render(usersTable);

            let usersStatus = {};
            let users = usersTable.findAll('tbody tr');

            for (let i = 0; i < users.length; i++) {
                usersStatus[users[i].find('td[data-name=table-data-_id]').textContent] = system.connect({ data: { action: 'isUserActive', user: users[i].find('td[data-name=table-data-_id]').textContent } });
            }

            perceptor.runParallel(usersStatus, statusResult => {
                for (let i = 0; i < users.length; i++) {
                    users[i].find('td[data-name=table-data-status]').textContent = statusResult[users[i].find('td[data-name=table-data-_id]').textContent] ? 'Online' : 'Offline';
                }
            });

            perceptor.listenTable({ options: ['view', 'clone', 'delete'], table: usersTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.perceptor-table-column-cell').dataset;
                    let table = target.getParents('.perceptor-table');
                    let id = table.find(`.perceptor-table-column[data-name="_id"]`).find(`.perceptor-table-column-cell[data-row="${row}"]`).dataset.value;

                    if (target.id == 'perceptor-table-option-view') {
                        system.redirect('users.html?page=showUser&id=' + id);
                    }
                    else if (target.id == 'perceptor-table-option-clone') {
                        system.redirect('users.html?page=cloneUser&id=' + id);
                    }
                    else if (target.id == 'perceptor-table-option-delete') {
                        system.redirect('users.html?page=deleteUser&id=' + id);
                    }
                },
                filter: (sortValue, row) => {
                    let hide = false;

                    if (sortValue == 'Online') {
                        hide = perceptor.array.find(row, value => {
                            return value.dataset.name == 'status';
                        }).textContent != 'Online';
                    }
                    else if (sortValue == 'Offline') {
                        hide = perceptor.array.find(row, value => {
                            return value.dataset.name == 'status';
                        }).textContent != 'Offline';
                    }
                    else if (sortValue == 'Admin') {
                        hide = perceptor.array.find(row, value => {
                            return value.dataset.name == 'userType';
                        }).textContent != 'Admin';
                    }
                    else if (sortValue == 'Staff') {
                        hide = perceptor.array.find(row, value => {
                            return value.dataset.name == 'userType';
                        }).textContent != 'Staff';
                    }
                    return hide;
                }
            });

            let deleteUsers = moreControls.makeElement({ element: 'a', attributes: { class: 'btn btn-small' }, text: 'Delete Users' });

            deleteUsers.addEventListener('click', event => {
                let selected = usersTable.findAll('.perceptor-table-selected-row td[data-name=table-data-_id]');
                let users = [];
                for (let i = 0; i < selected.length; i++) {
                    users.push(selected[i].textContent);
                }
                this.deleteUsers(users);
            });
        });

    }

    showUser(container) {
        let user = perceptor.urlSplitter(location.href).vars.id;
        let moreControls = document.body.find('#more-user-controls');
        system.get({ collection: 'users', query: { _id: user }, changeQuery: { _id: 'objectid' } }).then(result => {
            let birthday = result.birthday;
            let userImage = result.userImage;
            if(userImage == undefined || userImage == 'null'){
                userImage = 'images/logo.png';
            }            
            let age;
            if (perceptor.notNull(birthday)) {
                age = (perceptor.dateWithToday(result.birthday).diff / 365.25).toString().slice(1, 3)
            }

            container.makeElement({
                element: 'div', attributes: { id: 'show-user' }, children: [
                    {
                        element: 'div', attributes: { id: 'show-user-bio' }, children: [
                            {
                                element: 'span', attributes: { id: 'show-user-image-container' }, children: [
                                    { element: 'img', attributes: { id: 'show-user-image', src: userImage } },
                                ]
                            },
                            {
                                element: 'span', attributes: { id: 'show-user-names' }, text: result.fullName || 'No Name', children: [
                                    { element: 'a', attributes: { id: 'edit-user', class: 'fas fa-pen icon' } }
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
                                            { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: '$' + perceptor.addCommaToMoney(result.salary||0) }
                                        ]
                                    },
                                ]
                            }
                        ]
                    }
                ]
            });

            if (result.userType == 'Staff') {
                moreControls.makeElement({ element: 'a', attributes: { class: 'btn btn-small', href: '/users.html?page=makeAdmin&id=' + user }, text: 'Make Admin' });
            }
            else {
                moreControls.makeElement({ element: 'a', attributes: { class: 'btn btn-small', href: '/users.html?page=makeStaff&id=' + user }, text: 'Make Staff' });
            }

            container.find('#edit-user').addEventListener('click', event => {
                let editForm = perceptor.createForm({
                    title: 'Edit Profile', attributes: { enctype: 'multipart/form-data', id: 'edit-user-form', class: 'form', style: { border: '1px solid var(--secondary-color)' } },
                    contents: {
                        userType: { element: 'select', attributes: { id: 'user-type', name: 'userType' }, options: ['Admin', 'Staff'], selected: result.userType },
                        department: { element: 'select', attributes: { id: 'department', name: 'department' }, options: ['Null', 'IT', 'Finance', 'Marketting', 'Advertizing'], selected: result.department },
                        hireDate: { element: 'input', attributes: { id: 'hire-date', name: 'hireDate', value: result.hireDate || '', type: 'date' } },
                        salary: { element: 'input', attributes: { id: 'salary', name: 'salary', value: result.salary || '', type: 'number' } },
                    },
                    buttons: {
                        submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit', state: { name: 'submit', owner: '#edit-user-form' } },
                    },
                    columns: 2,
                });

                let popUp = perceptor.popUp(editForm);
                popUp.find('#toggle-window').click();

                editForm.addEventListener('submit', event => {
                    event.preventDefault();

                    let data = perceptor.jsonForm(editForm);
                    data.action = 'editUser';
                    data._id = result._id;
                    system.connect({ data }).then(result => {
                        if (result == true) {
                            system.notify({ note: 'User Updated Successfully' });
                            system.redirect(location.href);
                        }
                        else {
                            system.notify({ note: 'Could not update User' });
                        }
                    });

                });
            });
        });
    }

    cloneUser(container) {
        let user = perceptor.urlSplitter(location.href).vars.id;

        system.get({ collection: 'users', query: { _id: user }, changeQuery: { _id: 'objectid' } }).then(result => {
            let formContent = {};
            delete result._id;
            for (let i in result) {
                formContent[i] = { element: 'input', attributes: { name: i } };
            }

            let cloneForm = perceptor.createForm({
                title: 'Clone User', attributes: { id: 'clone-user-form', class: 'form', style: { border: '1px solid var(--secondary-color)' } },
                contents: {
                    userName: { element: 'input', attributes: { id: 'user-name', name: 'userName', value: result.userName } },
                    email: { element: 'input', attributes: { id: 'email', name: 'email', value: result.email } },
                    password: {
                        element: 'input', attributes: { id: 'current-password', name: 'currentPassword', type: 'password', autoComplete: true }, note: 'Password must not be less than 8 characters, Should have atleast 1 uppercase, 1 lowercase, 1 number and 1 symbol'
                    },
                    userType: { element: 'select', attributes: { id: 'user-type', name: 'userType' }, options: ['Null', 'Staff', 'Admin'], selected: result.userType },
                },
                buttons: {
                    submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone', state: { name: 'submit', owner: '#clone-user-form' } },
                }
            });

            container.render(cloneForm);

            this.makeUser(cloneForm);
        });
    }

    deleteUser(container) {
        let user = perceptor.urlSplitter(location.href).vars.id;
        if (confirm('Do you want to continue with this action?')) {
            system.connect({ data: { action: 'deleteUser', user } }).then(result => {
                result = JSON.parse(result);
                if (result != true) {
                    system.notify({ note: 'User was not deleted' });
                } else {
                    system.notify({ note: 'User was deleted' });
                }
                window.history.go(-1);
            });
        }
        else {
            window.history.go(-1);
        }
    }

    deleteUsers(users) {
        if (users.length == 0) {
            system.notify({ note: 'No selected user' });

        }
        else if (confirm('Do you want to continue with this action?')) {
            let promises = {};
            for (let user of users) {
                promises[user] = system.connect({ data: { action: 'deleteUser', user } });
            }
            perceptor.runParallel(promises, result => {
                let note = 'Selected users deleted';
                for (let value of Object.values(result)) {
                    if (value != 'true') {
                        note = 'Some selected users were not deleted';

                    }
                }
                system.notify({ note });
                system.redirect(location.href);
            });
        }
    }

    makeAdmin() {
        let user = perceptor.urlSplitter(location.href).vars.id;

        system.connect({ data: { action: 'makeAdmin', user } }).then(result => {
            if (result == true) {
                system.notify({ note: 'This user is now an Admin' });
            }
            else {
                system.notify({ note: 'Was unable to make this user an Admin' });
            }
            window.history.go(-1);
        });
    }

    makeStaff() {
        let user = perceptor.urlSplitter(location.href).vars.id;

        system.connect({ data: { action: 'makeStaff', user } }).then(result => {
            if (result == true) {
                system.notify({ note: 'This user is now an Staff' });
            }
            else {
                system.notify({ note: 'Was unable to make this user an Staff' });
            }
            window.history.go(-1);
        });
    }
}
export { Users };