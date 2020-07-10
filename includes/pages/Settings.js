import { customForms } from './CustomForms.js';
import { reportGenerators } from './ReportGenerators.js';
import { categories } from './Categories.js';
import { tags } from './Tags.js';
import { lists } from './Lists.js';
import { views } from './Views.js';

class Settings {
    constructor() {
        this.categories = categories;
        this.tags = tags;
        this.lists = lists;
        this.forms = customForms;
        this.reportGenerators = reportGenerators;
        this.views = views;
    }

    display() {
        let main = document.body.find('#main-window');
        let mainBody = main.find('#main-container-body');

        mainBody.render([
            {
                element: 'div', attributes: { id: 'settings-menu', gridTemplateColumns: 'repeat(6, max-content)' }, children: [
                    { element: 'a', attributes: { class: 'settings-menu-link', href: 'settings.html?page=categories' }, text: 'Categories' },
                    { element: 'a', attributes: { class: 'settings-menu-link', href: 'settings.html?page=tags' }, text: 'Tags' },
                    { element: 'a', attributes: { class: 'settings-menu-link', href: 'settings.html?page=forms' }, text: 'Forms' },
                    { element: 'a', attributes: { class: 'settings-menu-link', href: 'settings.html?page=reportGenerators' }, text: 'Reports' },
                    { element: 'a', attributes: { class: 'settings-menu-link', href: 'settings.html?page=lists' }, text: 'Lists' },
                    { element: 'a', attributes: { class: 'settings-menu-link', href: 'settings.html?page=views' }, text: 'Views' }
                ]
            },
            {
                element: 'div', attributes: { id: 'settings-main-window' }
            }
        ]);

        this.route(mainBody);
    }

    route(mainBody) {
        let { pathname } = location;
        this.url = perceptor.urlSplitter(location.href);

        if (!perceptor.isset(this.url.vars.page)) {
            this.categories(mainBody)
        }
        else if (perceptor.isset(this[this.url.vars.page])) {
            this[this.url.vars.page](mainBody);
        }
        else {
            system.display404(mainBody);
        }
    }
}

export { Settings };