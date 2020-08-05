let views = (mainBody) => {
    let settingsMainWindow = mainBody.find('#settings-main-window');
    let loading = kerdx.createElement({ element: 'i', attributes: { class: 'fas fa-redo fa-spin' } });
    let urlVars = kerdx.urlSplitter(location.href);
    let myView, monitorView;
    let user = document.body.dataset.user;
    let viewsContainer = settingsMainWindow.makeElement({
        element: 'div', attributes: { id: 'views-container' }, children: [
            {
                element: 'nav', attributes: { id: 'views-menu' }, children: [
                    { element: 'span', attributes: { class: 'views-menu-item', id: 'views-colors' }, text: 'Colors' },
                    { element: 'span', attributes: { class: 'views-menu-item', id: 'views-theme' }, text: 'Theme' }
                ]
            },
            {
                element: 'div', attributes: { id: 'views-content' }
            }
        ]
    });

    let aColor = (text, name, value) => {
        return kerdx.createElement({
            element: 'span', attributes: { class: 'views-single-color' }, children: [
                { element: 'i', attributes: { class: 'icon fas fa-brush' } },
                { element: 'a', attributes: { class: 'views-color-name' }, text },
                { element: 'input', attributes: { value: kerdx.colorHandler.rgbToHex(value), class: 'view-color-value', type: 'color', id: name } }
            ]
        });
    }

    let aTheme = (text, name) => {
        return kerdx.createElement({
            element: 'span', attributes: { class: 'views-single-theme' }, children: [
                { element: 'i', attributes: { class: 'icon fas fa-palette' } },
                { element: 'a', attributes: { class: 'views-theme-name' }, text },
                { element: 'button', attributes: { class: 'btn btn-small views-theme-select', id: name }, text: 'Select' }
            ]
        });
    }

    let availableThemes = {
        dark: { primaryColor: 'rgb(0, 0, 0)', secondaryColor: 'rgb(255, 255, 255)', accientColor: 'rgb(68, 40, 223)' },
        white: { primaryColor: 'rgb(255, 255, 255)', secondaryColor: 'rgb(0, 0, 0)', accientColor: 'rgb(68, 40, 223)' },
        colorful: { primaryColor: 'rgb(42, 90, 22)', secondaryColor: 'rgb(90, 199, 220)', accientColor: 'rgb(68, 40, 223)' },
    }

    let colors = () => {
        viewsContainer.find('#views-content').innerHTML = '';
        let colorView = viewsContainer.find('#views-content').makeElement({
            element: 'div', attributes: { id: 'views-colors-view' }, children: [
                aColor('Set Primary Color', 'primary-color', myView.view.primaryColor),
                aColor('Set Secondary Color', 'secondary-color', myView.view.secondaryColor),
                aColor('Set Accient Color', 'accient-color', myView.view.accientColor)
            ]
        });

        colorView.find('#primary-color').onChanged(value => {
            monitorView.view.primaryColor = kerdx.colorHandler.hexToRGB(value);
        });

        colorView.find('#secondary-color').onChanged(value => {
            monitorView.view.secondaryColor = kerdx.colorHandler.hexToRGB(value);
        });

        colorView.find('#accient-color').onChanged(value => {
            monitorView.view.accientColor = kerdx.colorHandler.hexToRGB(value);
        });
    }

    let themes = () => {
        viewsContainer.find('#views-content').innerHTML = '';
        let themeView = viewsContainer.find('#views-content').makeElement({
            element: 'div', attributes: { id: 'views-themes-view' }
        });

        for (let name in availableThemes) {
            themeView.append(aTheme(`${name} Theme`, name));
        }

        themeView.addEventListener('click', event => {
            let target = event.target;
            if (target.classList.contains('views-theme-select')) {
                let theme = availableThemes[target.id];
                kerdx.object.copy(theme, monitorView.view);
            }
        });
    }

    system.get({ collection: 'views', query: { owner: user } }).then(view => {
        myView = view || {};
        monitorView = kerdx.object.onChanged(myView, (target) => {
            let t = setTimeout(() => {
                system.connect({ data: { action: 'saveView', view: JSON.stringify(myView.view) } }).then(result => {
                    system.loadView(myView.view);
                    clearTimeout(t);
                });
            }, 1000);
        });

        colors();

        viewsContainer.addEventListener('click', event => {
            let target = event.target;
            if (target.id == 'views-theme') {
                themes();
            }
            else if (target.id == 'views-colors') {
                colors();
            }
        });
    });
}

export { views };