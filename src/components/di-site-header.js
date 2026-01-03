import { html, css, LitElement } from 'https://cdn.jsdelivr.net/npm/lit@3.3.2/+esm';


export class DiSiteHeader extends LitElement {
    static styles = [
        css`
            :host {
                display: block;
            }
        `
    ];

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <header class="bg-gradient-to-r from-dharma-brown to-dharma-light text-white py-10 px-4 shadow-lg">
                <h1 class="text-4xl md:text-5xl font-light tracking-widest text-center mb-2"><i class="bi bi-flower1"></i>法洲</h1>
                <p class="text-center text-sm md:text-base opacity-95">真理是最上之甘味</p>
            </header>
        `;
    }
}
customElements.define('di-site-header', DiSiteHeader);

