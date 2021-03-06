let categories = (mainBody) => {
    let settingsMainWindow = mainBody.find('#settings-main-window');
    let loading = kerdx.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });
    let urlVars = kerdx.urlSplitter(location.href);

    let show = () => {
        let id = urlVars.vars.id;
        system.get({ collection: 'categories', query: {}, many: true }).then(categories => {
            let category = kerdx.array.getObject(categories, '_id', id);

            settingsMainWindow.makeElement([
                {
                    element: 'div', attributes: { id: 'category-details' }, children: [
                        {
                            element: 'span', attributes: { id: 'category-name' }, children: [
                                { element: 'h2', attributes: { id: 'category-name-text' }, text: category.name },
                                {
                                    element: 'span', attributes: { id: 'category-controls' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-pen', id: 'edit-category' } },
                                        { element: 'i', attributes: { class: 'icon fas fa-clone', id: 'clone-category' } },
                                        { element: 'a', attributes: { class: 'icon fas fa-trash-alt', href: 'settings.html?page=categories&action=delete&id=' + category._id } },
                                    ]
                                }
                            ]
                        },
                        {
                            element: 'span', attributes: { id: 'category-other-details' }, children: [
                                system.editableImage('category-image', category.image),
                                {
                                    element: 'span', attributes: { id: 'category-related' }, children: [
                                        {
                                            element: 'span', attributes: { id: 'category-parents' }, children: [
                                                { element: 'h2', attributes: { class: 'category-title' }, text: 'Parent Categories' },
                                                { element: 'span', attributes: { class: 'category-list' } }
                                            ]
                                        },
                                        {
                                            element: 'span', attributes: { id: 'category-children' }, children: [
                                                { element: 'h2', attributes: { class: 'category-title' }, text: 'Sub Categories' },
                                                { element: 'span', attributes: { class: 'category-list' } }
                                            ]
                                        },
                                    ]
                                }
                            ]
                        }
                    ]
                },
                { element: 'div', attributes: { id: 'category-items' } }
            ]);

            let getParents = (parents) => {
                parents = parents.split(',');
                let categoryParents = [];

                for (let parent of parents) {
                    let p = kerdx.array.getObject(categories, '_id', parent.trim());
                    if (kerdx.isset(p)) {
                        categoryParents.push(p);
                    }
                }
                return categoryParents;
            }

            let getChildren = (id) => {
                let categoryChildren = [];
                for (let cat of categories) {
                    let catParents = cat.parents;
                    if (catParents.includes(id)) {
                        categoryChildren.push(cat);
                    }
                }
                return categoryChildren;
            }

            let getAllChildren = (id) => {
                let allChildren = [];
                let directChildren = getChildren(id);
                for (let directChild of directChildren) {
                    for (let child of getChildren(directChild._id)) {
                        if (!allChildren.includes(child)) {
                            allChildren.push(child);
                        }
                    }
                    if (!allChildren.includes(directChild)) {
                        allChildren.push(directChild);
                    }
                }

                return allChildren;
            }

            settingsMainWindow.find('#clone-category').addEventListener('click', event => {
                clone(id);
            });

            settingsMainWindow.find('#edit-category-image').addEventListener('click', event => {
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
                    data.action = 'changeCategoryImage';
                    data.id = id;

                    system.connect({ data }).then(result => {
                        if (result == true) {
                            system.notify({ note: 'Image was successfully uploaded' });
                            settingsMainWindow.find('#editable-image').src = uploadImageForm.find('#preview-image').src;
                            popUp.remove();
                        }
                        else {
                            system.notify({ note: 'Could not upload Image' });
                        }
                    });
                });
            });

            settingsMainWindow.find('#delete-category-image').addEventListener('click', event => {
                let data = { action: 'deleteCategoryImage', id };
                system.connect({ data }).then(result => {
                    if (result == true) {
                        system.notify({ note: 'Image was successfully deleted' });
                        settingsMainWindow.find('#editable-image').src = '';
                    }
                    else {
                        system.notify({ note: 'Could not delete Image' });
                    }
                });
            });

            settingsMainWindow.find('#edit-category').addEventListener('click', event => {
                edit(category, categories, getAllChildren(category._id));
            });

            for (let parent of getParents(category.parents)) {
                settingsMainWindow.find('#category-parents .category-list').makeElement({
                    element: 'span', attributes: { class: 'category-list-single' }, children: [
                        { element: 'i', attributes: { class: 'icon fas fa-angle-double-right' } },
                        { element: 'a', attributes: { class: 'category-list-single-text', href: 'settings.html?page=categories&action=show&id=' + parent._id }, text: parent.name }
                    ]
                })
            }

            for (let child of getChildren(category._id)) {
                settingsMainWindow.find('#category-children .category-list').makeElement({
                    element: 'span', attributes: { class: 'category-list-single' }, children: [
                        { element: 'i', attributes: { class: 'icon fas fa-angle-double-right' } },
                        { element: 'a', attributes: { class: 'category-list-single-text', href: 'settings.html?page=categories&action=show&id=' + child._id }, text: child.name }
                    ]
                })
            }

        });
    }

    let clone = (id) => {
        system.get({ collection: 'categories', query: {}, projection: { image: 0 }, many: true }).then(categories => {
            let category = kerdx.array.getObject(categories, '_id', id);
            let categoryNames = kerdx.object.objectOfObjectArray(categories, '_id', 'name');

            let cloneForm = kerdx.createForm({
                title: 'Clone Category', attributes: { enctype: 'multipart/form-data', id: 'clone-category-form', class: 'form' },
                contents: {
                    name: { element: 'input', attributes: { id: 'name', name: 'name', value: category.name } },
                    image: { element: 'input', attributes: { id: 'image', name: 'image', type: 'file', ignore: true } },
                    parents: { perceptorElement: 'createSelect', params: { contents: categoryNames, multiple: 'single', external: true, attributes: { id: 'parents', name: 'parents', value: category.parents } } }
                },
                buttons: {
                    submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone', state: { name: 'submit', owner: '#clone-category-form' } },
                }
            });

            make(cloneForm, categoryNames);
        });
    }

    let create = (categoryNames) => {
        let createForm = kerdx.createForm({
            title: 'Create Category', attributes: { enctype: 'multipart/form-data', id: 'create-category-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name' } },
                image: { element: 'input', attributes: { id: 'image', name: 'image', type: 'file', ignore: true } },
                parents: { perceptorElement: 'createSelect', params: { contents: categoryNames, multiple: 'single', external: true, attributes: { id: 'parents', name: 'parents' } } }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create', state: { name: 'submit', owner: '#create-category-form' } },
            }
        });

        make(createForm, categoryNames);
    }

    let edit = (category, categories, children) => {
        let categoryNames = kerdx.object.objectOfObjectArray(categories, '_id', 'name');
        delete categoryNames[category._id];

        for (let child of children) {
            delete categoryNames[child._id];
        }

        let editForm = kerdx.createForm({
            title: 'Edit Category', attributes: { enctype: 'multipart/form-data', id: 'edit-category-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: category.name } },
                parents: { perceptorElement: 'createSelect', params: { contents: categoryNames, multiple: 'single', external: true, attributes: { id: 'parents', name: 'parents', value: category.parents } } }
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit', state: { name: 'submit', owner: '#edit-category-form' } },
            }
        });

        let popUp = kerdx.popUp(editForm);

        editForm.addEventListener('submit', event => {
            event.preventDefault();
            let data = kerdx.jsonForm(editForm);
            data.action = 'editCategory';
            let parents = editForm.find('#parents').value;
            data.id = category._id;
            data.newCats = [];
            data.parents = [];

            let formValidation = kerdx.validateForm(editForm);

            if (!formValidation.flag) {
                loading.replaceWith(editForm.getState({ name: 'submit' }));
                editForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            for (let i of parents) {
                i = i.trim();
                if (i != '') {
                    if (Object.keys(categoryNames).includes(i)) {
                        data.parents.push(i)
                    }
                    else {
                        data.newCats.push(i);
                    }
                }
            }

            system.connect({ data }).then(result => {
                if (result == 1) {
                    system.notify({ note: 'Category Editted' });
                    system.reload();
                }
                else if (result.found == 'name') {
                    system.notify({ note: 'Category already in exists' });
                }
                else {
                    system.notify({ note: 'Category was not editted' });
                }
            });
        });

    }

    let _delete = () => {
        let id = urlVars.vars.id;
        system.connect({ data: { action: 'deleteCategory', id } }).then(result => {
            system.redirect(location + '/settings.html?page=categories');
        });
    }

    let make = (form, list) => {
        let popUp = kerdx.popUp(form);
        popUp.find('#toggle-window').click();

        form.addEventListener('submit', event => {
            event.preventDefault();
            let data = kerdx.jsonForm(form);
            data.action = 'createCategory';
            let parents = form.find('#parents').value;
            data.newCats = [];
            data.parents = [];

            let formValidation = kerdx.validateForm(form);

            if (!formValidation.flag) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            for (let i of parents) {
                i = i.trim();
                if (i != '') {
                    if (Object.keys(list).includes(i)) {
                        data.parents.push(i)
                    }
                    else {
                        data.newCats.push(i);
                    }
                }
            }

            system.connect({ data }).then(result => {
                if (result == 1) {
                    system.notify({ note: 'Category Created' });
                    system.reload();
                }
                else if (result.found == 'name') {
                    system.notify({ note: 'Category already in exists' });
                }
                else {
                    system.notify({ note: 'Category was not Created' });
                }
            });
        });

    }

    if (!kerdx.isset(urlVars.vars.action) || urlVars.vars.action == 'view') {
        settingsMainWindow.makeElement([
            {
                element: 'div', attributes: { class: 'settings-sub-menu' }, children: [
                    { element: 'i', attributes: { class: 'fas fa-plus', id: 'new-icon' } }
                ]
            },
            {
                element: 'div', attributes: { class: 'settings-content-window' }
            }
        ]);
        let mainContentWindow = settingsMainWindow.find('.settings-content-window');

        system.get({ collection: 'categories', query: {}, projection: { name: 1, recycled: 1 }, many: true }).then(categories => {
            let categoryNames = kerdx.object.objectOfObjectArray(categories, '_id', 'name');
            let recycled = kerdx.array.findAll(categories, cat=>{
                return cat.recycled == true;
            });
            categories = kerdx.array.findAll(categories, cat=>{
                return cat.recycled == undefined || cat.recycled == false;
            });

            let categoriesTable = kerdx.createTable({
                title: 'All Categories', contents: categories, search: true, sort: true
            });

            mainContentWindow.render(categoriesTable);
            kerdx.listenTable({ options: ['view', 'clone', 'delete'], table: categoriesTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.kerdx-table-column-cell').dataset;
                    let table = target.getParents('.kerdx-table');
                    let id = table.find(`.kerdx-table-column[data-name="_id"]`).find(`.kerdx-table-column-cell[data-row="${row}"]`).dataset.value;

                    if (target.id == 'kerdx-table-option-view') {
                        system.redirect('settings.html?page=categories&action=show&id=' + id);
                    }
                    else if (target.id == 'kerdx-table-option-clone') {
                        clone(id);
                    }
                    else if (target.id == 'kerdx-table-option-delete') {
                        system.redirect('settings.html?page=categories&action=delete&id=' + id);
                    }
                }
            });

            settingsMainWindow.find('#new-icon').addEventListener('click', event => {
                create(categoryNames);
            });
        });
    }
    else if (urlVars.vars.action == 'show') {
        show();
    }
    else if (urlVars.vars.action == 'clone') {
        clone();
    }
    else if (urlVars.vars.action == 'delete') {
        _delete();
    }
}

export { categories };