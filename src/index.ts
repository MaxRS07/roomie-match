function greet(name: string): string {
    return `Hello, ${name}!`;
}

const app = document.getElementById('app');
if (app) {
    app.innerHTML = `<h1>${greet("Roomie Match!")}</h1>`;
}