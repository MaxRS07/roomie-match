export type PageName = 'login' | 'dashboard' | 'matches' | 'profile' | 'notfound';

interface Page {
    name: PageName;
    render: () => void;
    cleanup?: () => void;
}

class Router {
    private pages: Map<PageName, Page> = new Map();
    private currentPage: PageName | null = null;

    register(page: Page) {
        this.pages.set(page.name, page);
    }

    async navigate(name: PageName) {
        if (this.currentPage === name) return;

        const currentPageObj = this.currentPage ? this.pages.get(this.currentPage) : null;
        currentPageObj?.cleanup?.();

        let page = this.pages.get(name);
        let pageName = name;

        if (!page) {
            console.error(`Page ${name} not found, showing 404`);
            pageName = 'notfound';
            page = this.pages.get(pageName);
        }

        if (!page) {
            console.error(`Notfound page not registered`);
            return;
        }

        this.currentPage = pageName;
        page.render();

        // Update browser history
        window.history.pushState({ page: pageName }, '', `/${pageName}`);
    }
}

export const router = new Router();