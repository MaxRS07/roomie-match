export type PageName = 'login' | 'dashboard' | 'listings' | 'profile';

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

        const page = this.pages.get(name);
        if (!page) {
            console.error(`Page ${name} not found`);
            return;
        }

        this.currentPage = name;
        page.render();

        // Update browser history
        window.history.pushState({ page: name }, '', `/${name}`);
    }
}

export const router = new Router();