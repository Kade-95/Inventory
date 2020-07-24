let tags = (mainBody) => {
    let settingsMainWindow = mainBody.find('#settings-main-window');
    let loading = perceptor.createElement({ element: 'span', attributes: { class: 'loading loading-medium' } });
    let urlVars = perceptor.urlSplitter(location.href);

    let show = () => {
        let id = urlVars.vars.id;
        system.get({ collection: 'tags', query: { _id: id }, changeQuery: { _id: 'objectid' } }).then(tag => {
            settingsMainWindow.makeElement([
                {
                    element: 'div', attributes: { id: 'tag-details' }, children: [
                        {
                            element: 'span', attributes: { id: 'tag-name' }, children: [
                                { element: 'h2', attributes: { id: 'tag-name-text' }, text: tag.name },
                                {
                                    element: 'span', attributes: { id: 'tag-controls' }, children: [
                                        { element: 'i', attributes: { class: 'icon fas fa-pen', id: 'edit-tag', title: 'Edit' } },
                                        { element: 'i', attributes: { class: 'icon fas fa-clone', id: 'clone-tag', title: 'Clone' } },
                                        { element: 'a', attributes: { class: 'icon fas fa-trash-alt', title: 'Delete', href: 'settings.html?page=tags&action=delete&id=' + tag._id } },
                                    ]
                                }
                            ]
                        },
                        {
                            element: 'span', attributes: { id: 'tag-other-details' }, children: [
                                system.editableImage('tag-image', tag.image)
                            ]
                        }
                    ]
                },
                { element: 'div', attributes: { id: 'tag-items' } }
            ]);

            settingsMainWindow.find('#clone-tag').addEventListener('click', event => {
                clone(id);
            });

            settingsMainWindow.find('#edit-tag-image').addEventListener('click', event => {
                let uploadImageForm = perceptor.createElement({
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

                let popUp = perceptor.popUp(uploadImageForm);

                uploadImageForm.find('#new-image').onChanged(value => {
                    uploadImageForm.find('#preview-image').src = value.src;
                });

                uploadImageForm.find('#upload').addEventListener('click', event => {
                    event.preventDefault();
                    let data = perceptor.jsonForm(uploadImageForm);
                    data.action = 'changeTagImage';
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

            settingsMainWindow.find('#delete-tag-image').addEventListener('click', event => {
                let data = { action: 'deleteTagImage', id };
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

            settingsMainWindow.find('#edit-tag').addEventListener('click', event => {
                edit(tag);
            });
        });
    }

    let clone = (id) => {
        system.get({ collection: 'tags', query: { _id: id }, projection: { image: 0 }, changeQuery: { _id: 'objectid' } }).then(tag => {
            let cloneForm = perceptor.createForm({
                title: 'Clone Tag', attributes: { enctype: 'multipart/form-data', id: 'clone-tag-form', class: 'form' },
                contents: {
                    name: { element: 'input', attributes: { id: 'name', name: 'name', value: tag.name } },
                    image: { element: 'input', attributes: { id: 'image', name: 'image', type: 'file', ignore: true } },
                },
                buttons: {
                    submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Clone', state: { name: 'submit', owner: '#clone-tag-form' } },
                }
            });

            let popUp = perceptor.popUp(cloneForm);

            make(cloneForm);
        });
    }

    let edit = (tag) => {
        let editForm = perceptor.createForm({
            title: 'Edit Tag', attributes: { enctype: 'multipart/form-data', id: 'edit-tag-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name', value: tag.name, ignore: true } },
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Edit', state: { name: 'submit', owner: '#edit-tag-form' } },
            }
        });

        let popUp = perceptor.popUp(editForm);

        editForm.addEventListener('submit', event => {
            event.preventDefault();
            let data = perceptor.jsonForm(editForm);
            data.action = 'editTag';
            data.id = tag._id;

            let formValidation = perceptor.validateForm(editForm);

            if (!formValidation.flag) {
                loading.replaceWith(editForm.getState({ name: 'submit' }));
                editForm.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            system.connect({ data }).then(result => {
                if (result == 1) {
                    system.notify({ note: 'Tag Editted' });
                    system.reload();
                }
                else if (result.found == 'name') {
                    system.notify({ note: 'Tag already in exists' });
                }
                else {
                    system.notify({ note: 'Tag was not editted' });
                }
            });
        });

    }

    let create = () => {
        let createForm = perceptor.createForm({
            title: 'Create Tag', attributes: { enctype: 'multipart/form-data', id: 'create-tag-form', class: 'form' },
            contents: {
                name: { element: 'input', attributes: { id: 'name', name: 'name' } },
                image: { element: 'input', attributes: { id: 'image', name: 'image', type: 'file', ignore: true } },
            },
            buttons: {
                submit: { element: 'button', attributes: { id: 'submit', class: 'btn btn-small' }, text: 'Create', state: { name: 'submit', owner: '#create-tag-form' } },
            }
        });

        let popUp = perceptor.popUp(createForm);

        make(createForm);
    }

    let _delete = () => {
        let id = urlVars.vars.id;
        system.connect({ data: { action: 'deleteTag', id } }).then(result => {
            system.redirect(location + '/settings.html?page=tags');
        });
    }

    let make = (form) => {
        form.addEventListener('submit', event => {
            event.preventDefault();
            let data = perceptor.jsonForm(form);
            data.action = 'createTag';

            let formValidation = perceptor.validateForm(form);

            if (!formValidation.flag) {
                loading.replaceWith(form.getState({ name: 'submit' }));
                form.setState({ name: 'error', attributes: { style: { display: 'unset' } }, text: `Form ${formValidation.elementName} is faulty` });
                return;
            }

            system.connect({ data }).then(result => {
                if (result == 1) {
                    system.notify({ note: 'Tag Created' });
                    system.reload();
                }
                else if (result.found == 'name') {
                    system.notify({ note: 'Tag already in exists' });
                }
                else {
                    system.notify({ note: 'Tag was not Created' });
                }
            });
        });

    }

    if (!perceptor.isset(urlVars.vars.action) || urlVars.vars.action == 'view') {
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

        system.get({ collection: 'tags', query: {}, projection: { name: 1 }, many: true }).then(tags => {

            let tagsTable = perceptor.createTable({
                title: 'All Tags', contents: tags, search: true, sort: true
            });

            mainContentWindow.render(tagsTable);
            perceptor.listenTable({ options: ['view', 'clone', 'delete'], table: tagsTable }, {
                click: event => {
                    let target = event.target;
                    let { row } = target.getParents('.perceptor-table-column-cell').dataset;
                    let table = target.getParents('.perceptor-table');
                    let id = table.find(`.perceptor-table-column[data-name="_id"]`).find(`.perceptor-table-column-cell[data-row="${row}"]`).dataset.value;

                    if (target.id == 'perceptor-table-option-view') {
                        system.redirect('settings.html?page=tags&action=show&id=' + id);
                    }
                    else if (target.id == 'perceptor-table-option-clone') {
                        clone(id);
                    }
                    else if (target.id == 'perceptor-table-option-delete') {
                        system.redirect('settings.html?page=tags&action=delete&id=' + id);
                    }
                }
            });

            settingsMainWindow.find('#new-icon').addEventListener('click', event => {
                create();
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

export { tags };