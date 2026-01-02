import { html, css, LitElement } from 'https://cdn.jsdelivr.net/npm/lit@3.3.2/+esm';

class DiSiteFooter extends LitElement {
  static properties = {
    isDark: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.isDark = document.body.classList.contains('dark-theme');
  }

  connectedCallback() {
    super.connectedCallback();
    
    // 监听body的class变化
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          this.isDark = document.body.classList.contains('dark-theme');
        }
      });
    });
    
    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  static styles = css`
    :host {
      display: block;
    }

    footer {
      background-color: white;
      border-top: 1px solid #e5e7eb;
      padding: 2rem 0;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 3rem;
      transition: all 0.3s ease;
    }

    :host([dark]) footer {
      background-color: #1f1f1f;
      border-top-color: #333;
      color: #a0a0a0;
    }

    .footer-container {
      max-width: 80rem;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .footer-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .copyright {
      color: #8d5a2a;
      font-weight: 500;
    }

    :host([dark]) .copyright {
      color: #d4a574;
    }

    .email-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      transition: color 0.2s;
    }

    :host([dark]) .email-link {
      color: #a0a0a0;
    }

    .email-link:hover {
      color: #8d5a2a;
    }

    :host([dark]) .email-link:hover {
      color: #d4a574;
    }

    .email-link a {
      color: inherit;
      text-decoration: none;
    }

    .email-link a:hover {
      text-decoration: underline;
    }

    .about-link-wrapper {
      margin-top: 0.5rem;
    }

    .about-link {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      justify-content: center;
      color: #9ca3af;
      font-size: 0.75rem;
      text-decoration: none;
      transition: color 0.2s;
    }

    :host([dark]) .about-link {
      color: #666;
    }

    .about-link:hover {
      color: #8d5a2a;
    }

    :host([dark]) .about-link:hover {
      color: #d4a574;
    }
  `;

  updated(changedProperties) {
    if (changedProperties.has('isDark')) {
      // 更新host属性以触发CSS变化
      if (this.isDark) {
        this.setAttribute('dark', '');
      } else {
        this.removeAttribute('dark');
      }
    }
  }

  render() {
    return html`
      <footer>
        <div class="footer-container">
          <div class="footer-content">
            <p class="copyright">&copy; 2025 法洲 | 愿正法久住</p>
            <div class="email-link">
              <i class="bi bi-envelope-fill"></i>
              <a href="mailto:paccakkha@yahoo.com">paccakkha@yahoo.com</a>
            </div>
            <div class="about-link-wrapper">
              <a href="about.html" class="about-link">
                <i class="bi bi-info-circle"></i>
                <span>关于"我"</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define('di-site-footer', DiSiteFooter);
