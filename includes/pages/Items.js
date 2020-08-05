class Items {
    constructor() {
        this.url;
    }

    display() {
        let main = document.body.find('#main-window');
        let mainBody = main.find('#main-container-body');

        mainBody.render([
            {
                element: 'div', attributes: { id: 'main-container-body-main-actions' }, children: [
                    { element: 'a', attributes: { class: 'icon fas fa-plus', id: 'new-icon', title: 'Create Item', href: 'items.html?page=create' } },
                    { element: 'span', attributes: { id: 'more-items-controls' } }
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
        system.get({ collection: 'items', query: {}, projection: { code: 1, name: 1, min: '1', max: 1, count: 1, unit: 1, recycled: 1 }, many: true }).then(result => {
            result = kerdx.array.findAll(result, item => {
                return item.recycled == undefined || item.recycled == false;
            });

            for (let i in result) {
                if (result[i].count <= result[i].min) {
                    result[i].range = 'Low';
                }
                else if (result[i].count > result[i].max) {
                    result[i].range = 'Excess';
                }
                else {
                    result[i].range = 'Enough';
                }
                delete result[i].min;
                delete result[i].max;
            }
            let itemsTable = kerdx.createTable({ title: 'Items Table', contents: result, search: true, sort: true, filter: ['All', 'Enough', 'Excess', 'Low'] });
            container.render(itemsTable);
            kerdx.listenTable({ options: ['view', 'clone', 'delete'], table: itemsTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.kerdx-table-column-cell').dataset;
                    let table = target.getParents('.kerdx-table');
                    let id = table.find(`.kerdx-table-column[data-name="_id"]`).find(`.kerdx-table-column-cell[data-row="${row}"]`).dataset.value;

                    if (target.id == 'kerdx-table-option-view') {
                        system.redirect('items.html?page=show&id=' + id);
                    }
                    else if (target.id == 'kerdx-table-option-clone') {
                        system.redirect('items.html?page=clone&id=' + id);
                    }
                    else if (target.id == 'kerdx-table-option-delete') {
                        system.redirect('items.html?page=delete&id=' + id);
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

    show(container) {
        let id = this.url.vars.id;
        system.get({ collection: 'items', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(item => {
            container.makeElement([
                {
                    element: 'span', attributes: { id: 'item-name', class: 'main-window-show-name' }, children: [
                        { element: 'h2', attributes: { id: 'item-name-text', class: 'main-window-show-name-text' }, text: item.name },
                        {
                            element: 'span', attributes: { id: 'item-controls' }, children: [
                                { element: 'i', attributes: { class: 'icon fas fa-pen', href: 'items.html?page=edit&id=' + item._id } },
                                { element: 'i', attributes: { class: 'icon fas fa-clone', href: 'items.html?page=clone&id=' + item._id } },
                                { element: 'a', attributes: { class: 'icon fas fa-trash-alt', href: 'items.html?page=delete&id=' + item._id } },
                            ]
                        }
                    ]
                },
                {
                    element: 'div', attributes: { id: 'item-details' }, children: [
                        system.editableImage('item-image', item.image),
                        {
                            element: 'span', attributes: { id: 'show-user-work-details' }, children: [
                                {
                                    element: 'span', attributes: { class: 'show-user-work-detail-single' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-user' } },
                                        { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Price' },
                                        { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: item.price }
                                    ]
                                },
                                {
                                    element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-envelope' } },
                                        { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Unit' },
                                        { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: item.unit }
                                    ]
                                },
                                {
                                    element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-phone' } },
                                        { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Count' },
                                        { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: item.count }
                                    ]
                                },
                                {
                                    element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-building' } },
                                        { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Minimium' },
                                        { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: item.min }
                                    ]
                                },
                                {
                                    element: 'p', attributes: { class: 'show-user-work-detail-single' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-users' } },
                                        { element: 'p', attributes: { class: 'show-user-work-detail-single-name' }, text: 'Maximium' },
                                        { element: 'p', attributes: { class: 'show-user-work-detail-single-value' }, text: item.max }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                { element: 'div', attributes: { id: 'item-items' } }
            ]);

            container.find('#edit-item-image').addEventListener('click', event => {
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
                    data.action = 'changeItemImage';
                    data.id = id;

                    system.connect({ data }).then(result => {
                        if (result == true) {
                            system.notify({ note: 'Image was successfully uploaded' });
                            container.find('#editable-image').src = uploadImageForm.find('#preview-image').src;
                            popUp.remove();
                        }
                        else {
                            system.notify({ note: 'Could not upload Image' });
                        }
                    });
                });
            });

            container.find('#delete-item-image').addEventListener('click', event => {
                let data = { action: 'deleteItemImage', id };
                system.connect({ data }).then(result => {
                    if (result == true) {
                        system.notify({ note: 'Image was successfully deleted' });
                        container.find('#editable-image').src = '';
                    }
                    else {
                        system.notify({ note: 'Could not delete Image' });
                    }
                });
            });
        });
    }

    makeItem(form, categoryNames, tagNames) {
        let loading = kerdx.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });

        form.getState({ name: 'submit' }).addEventListener('click', event => {
            event.preventDefault();
            form.getState({ name: 'submit' }).replaceWith(loading);
            form.setState({ name: 'error', attributes: { style: { display: 'none' } }, text: '' });

            let formValidation = kerdx.validateForm(form, { nodeNames: ['INPUT', 'select-element'] });

            if (!formValidation.flag) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                editForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            if (Math.floor(form.find('#min').value) >= Math.floor(form.find('#max').value)) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: 'Max value can not be less than Min value' });
                return;
            }

            let data = kerdx.jsonForm(form);
            data.action = 'createItem';

            let categories = form.find('#categories').value;
            data.newCats = [];
            data.categories = [];

            let tags = form.find('#tags').value;
            data.newTags = [];
            data.tags = [];

            for (let i of categories) {
                i = i.trim();
                if (i != '') {
                    if (Object.keys(categoryNames).includes(i)) {
                        data.categories.push(i)
                    }
                    else {
                        data.newCats.push(i);
                    }
                }
            }

            for (let i of tags) {
                i = i.trim();
                if (i != '') {
                    if (Object.keys(tagNames).includes(i)) {
                        data.tags.push(i)
                    }
                    else {
                        data.newTags.push(i);
                    }
                }
            }
            loading.replaceWith(form.getState({ name: 'submit' }));

            system.connect({ data }).then(result => {
                console.log(result);

                if (result == true) {
                    system.notify({ note: 'Item Created' });
                    window.history.go(-1);
                }
                else if (kerdx.isset(result.found)) {
                    form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `${kerdx.camelCasedToText(result.found).toUpperCase()} is already in use` });
                }
                else {
                    form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Error Unknown` });
                }
            });
        });
    }

    edit(container) {
        let run = {};
        let id = this.url.vars.id;

        run.categories = system.get({ collection: 'categories', query: {}, projection: { name: 1 }, many: true });
        run.tags = system.get({ collection: 'tags', query: {}, projection: { name: 1 }, many: true });
        run.item = system.get({ collection: 'items', query: { _id: id }, changeQuery: { _id: 'objectid' } });

        kerdx.runParallel(run, result => {
            let categoryNames = kerdx.object.objectOfObjectArray(result.categories, '_id', 'name');
            let tagNames = kerdx.object.objectOfObjectArray(result.tags, '_id', 'name');

            let editForm = kerdx.createForm({
                title: 'Edit Item', attributes: { enctype: 'multipart/form-data', id: 'edit-item-form', class: 'form', style: { border: '1px solid var(--secondary-color)', maxWidth: '100%' } },
                contents: {
                    name: { element: 'input', attributes: { id: 'name', name: 'name', value: result.item.name } },
                    code: { element: 'input', attributes: { id: 'code', name: 'code', value: result.item.code } },
                    price: { element: 'input', attributes: { id: 'price', name: 'price', type: 'number', min: 0, value: result.item.price } },
                    unit: { element: 'input', attributes: { id: 'unit', name: 'unit', value: result.item.unit } },
                    count: { element: 'input', attributes: { id: 'count', name: 'count', type: 'number', min: 0, value: result.item.count } },
                    min: { element: 'input', attributes: { id: 'min', name: 'min', type: 'number', min: 0, value: result.item.min } },
                    max: { element: 'input', attributes: { id: 'max', name: 'max', type: 'number', min: 0, value: result.item.max } },
                    categories: { perceptorElement: 'createSelect', params: { contents: categoryNames, multiple: 'single', external: true, attributes: { id: 'categories', name: 'categories', value: result.item.categories, } } },

                    tags: { perceptorElement: 'createSelect', params: { contents: tagNames, multiple: 'single', external: true, attributes: { id: 'tags', name: 'tags', value: result.item.tags } } }
                },
                buttons: {
                    submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit', state: { name: 'submit', owner: '#edit-item-form' } },
                },
                columns: 2
            });

            container.makeElement(editForm);

            let loading = kerdx.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });

            editForm.addEventListener('submit', event => {
                event.preventDefault();
                editForm.getState({ name: 'submit' }).replaceWith(loading);
                editForm.setState({ name: 'error', attributes: { style: { display: 'none' } }, text: '' });
                let formValidation = kerdx.validateForm(editForm, { nodeNames: ['INPUT', 'select-element'] });

                if (!formValidation.flag) {
                    loading.replaceWith(editForm.getState({ name: 'submit' }));
                    editForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                    return;
                }

                if (Math.floor(editForm.find('#min').value) >= Math.floor(editForm.find('#max').value)) {
                    loading.replaceWith(editForm.getState({ name: 'submit' }));
                    editForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: 'Max value can not be less than Min value' });
                    return;
                }

                let data = kerdx.jsonForm(editForm);
                data.action = 'editItem';
                data.id = id;

                let categories = editForm.find('#categories').value;
                data.newCats = [];
                data.categories = [];

                for (let i of categories) {
                    i = i.trim();
                    if (i != '') {
                        if (Object.keys(categoryNames).includes(i)) {
                            data.categories.push(i)
                        }
                        else {
                            data.newCats.push(i);
                        }
                    }
                }

                let tags = editForm.find('#tags').value;
                data.newTags = [];
                data.tags = [];

                for (let i of tags) {
                    i = i.trim();
                    if (i != '') {
                        if (Object.keys(tagNames).includes(i)) {
                            data.tags.push(i)
                        }
                        else {
                            data.newtags.push(i);
                        }
                    }
                }
                loading.replaceWith(editForm.getState({ name: 'submit' }));

                system.connect({ data }).then(result => {
                    if (result == true) {
                        system.notify({ note: 'Item Updated' });
                        window.history.go(-1);
                    }
                    else if (kerdx.isset(result.found)) {
                        editForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `${kerdx.camelCasedToText(result.found).toUpperCase()} is already in use` });
                    }
                    else {
                        editForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Error Unknown` });
                    }
                });
            });
        });
    }

    clone(container) {
        let run = {};
        let id = this.url.vars.id;

        run.categories = system.get({ collection: 'categories', query: {}, projection: { name: 1 }, many: true });
        run.tags = system.get({ collection: 'tags', query: {}, projection: { name: 1 }, many: true });
        run.item = system.get({ collection: 'items', query: { _id: id }, changeQuery: { _id: 'objectid' } });

        kerdx.runParallel(run, result => {
            let categoryNames = kerdx.object.objectOfObjectArray(result.categories, '_id', 'name');
            let tagNames = kerdx.object.objectOfObjectArray(result.tags, '_id', 'name');

            let cloneForm = kerdx.createForm({
                title: 'Clone Item', attributes: { enctype: 'multipart/form-data', id: 'clone-item-form', class: 'form', style: { border: '1px solid var(--secondary-color)', maxWidth: '100%' } },
                contents: {
                    name: { element: 'input', attributes: { id: 'name', name: 'name', value: result.item.name } },
                    code: { element: 'input', attributes: { id: 'code', name: 'code', value: result.item.code } },
                    price: { element: 'input', attributes: { id: 'price', name: 'price', type: 'number', min: 0, value: result.item.price } },
                    unit: { element: 'input', attributes: { id: 'unit', name: 'unit', value: result.item.unit } },
                    count: { element: 'input', attributes: { id: 'count', name: 'count', type: 'number', min: 0, value: result.item.count } },
                    min: { element: 'input', attributes: { id: 'min', name: 'min', type: 'number', min: 0, value: result.item.min } },
                    max: { element: 'input', attributes: { id: 'max', name: 'max', type: 'number', min: 0, value: result.item.max } },
                    image: { element: 'input', attributes: { id: 'image', name: 'image', type: 'file' } },
                    categories: { perceptorElement: 'createSelect', params: { contents: categoryNames, multiple: 'single', external: true, attributes: { id: 'categories', name: 'categories', value: result.item.categories, } } },

                    tags: { perceptorElement: 'createSelect', params: { contents: tagNames, multiple: 'single', external: true, attributes: { id: 'tags', name: 'tags', value: result.item.tags } } }
                },
                buttons: {
                    submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone', state: { name: 'submit', owner: '#clone-item-form' } },
                },
                columns: 2
            });

            container.makeElement(cloneForm);

            this.makeItem(cloneForm, categoryNames, tagNames);
        });
    }

    create(container) {
        let run = {};
        run.categories = system.get({ collection: 'categories', query: {}, projection: { name: 1 }, many: true });
        run.tags = system.get({ collection: 'tags', query: {}, projection: { name: 1 }, many: true });

        kerdx.runParallel(run, result => {
            let categoryNames = kerdx.object.objectOfObjectArray(result.categories, '_id', 'name');
            let tagNames = kerdx.object.objectOfObjectArray(result.tags, '_id', 'name');

            let createForm = kerdx.createForm({
                title: 'Create Item', attributes: { enctype: 'multipart/form-data', id: 'create-item-form', class: 'form', style: { border: '1px solid var(--secondary-color)', maxWidth: '100%' } },
                contents: {
                    name: { element: 'input', attributes: { id: 'name', name: 'name' } },

                    code: { element: 'input', attributes: { id: 'code', name: 'code' } },

                    price: { element: 'input', attributes: { id: 'price', name: 'price', type: 'number', min: 0 } },

                    unit: { element: 'input', attributes: { id: 'unit', name: 'unit' } },

                    count: { element: 'input', attributes: { id: 'count', name: 'count', type: 'number', min: 0 } },

                    min: { element: 'input', attributes: { id: 'min', name: 'min', type: 'number', min: 0 } },

                    max: { element: 'input', attributes: { id: 'max', name: 'max', type: 'number', min: 0 } },

                    image: { element: 'input', attributes: { id: 'image', name: 'image', type: 'file', ignore: true } },

                    categories: { perceptorElement: 'createSelect', params: { contents: categoryNames, multiple: 'single', external: true, attributes: { id: 'categories', name: 'categories', } } },

                    tags: { perceptorElement: 'createSelect', params: { contents: tagNames, multiple: 'single', external: true, attributes: { id: 'tags', name: 'tags' } } }
                },
                buttons: {
                    submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create', state: { name: 'submit', owner: '#create-item-form' } },
                },
                columns: 2
            });

            container.render(createForm);

            this.makeItem(createForm, categoryNames, tagNames);
        });
    }

    delete() {
        let id = this.url.vars.id;
        system.connect({ data: { action: 'deleteItem', id } }).then(result => {
            system.redirect(location + '/items.html?page=view');
        });
    }
}

export { Items };