import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppearanceDemo, BasicDemo, AxesDemo, GradientsDemo, InteractionDemo, Usage } from './demos';
import { I18nProvider, translations, useI18n } from './i18n';
import { ApiReference } from './reference';
import size from './size.json';
import logo from './logo.png';
import './style.css';

const sectionIds = ['overview', 'basic', 'appearance', 'gradients', 'axes', 'interaction', 'size', 'api'] as const;
const githubUrl = 'https://github.com/CrazyBucket/react-hypnogram';
const kb = (bytes: number) => new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(bytes / 1000);

function GitHubIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.54 1.04 1.54 1.04.9 1.54 2.35 1.1 2.92.84.09-.65.35-1.1.64-1.35-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.5 9.5 0 0 1 12 6.8c.85 0 1.7.11 2.5.34 1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.69-4.57 4.94.36.31.68.9.68 1.82v2.7c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>;
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return dark
    ? <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.72 5.28l-1.42 1.42M6.7 17.3l-1.42 1.42M18.72 18.72 17.3 17.3M6.7 6.7 5.28 5.28" /></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.5 14.8A8.5 8.5 0 0 1 9.2 3.5 8.5 8.5 0 1 0 20.5 14.8Z" /></svg>;
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .25s ease', transform: collapsed ? 'rotate(180deg)' : 'none' }}><path d="M10 3.5L5.5 8l4.5 4.5" /></svg>;
}

function SizeSection() {
  const { lang } = useI18n();
  const t = translations[lang].size;
  return <section className="doc-section" id="size">
    <div className="section-heading"><h2>{t.title}</h2><p>{t.desc}</p></div>
    <div className="size-grid">
      <div className="size-primary"><span>GZIP</span><strong>{kb(size.component.gzip)} <small>kB</small></strong><p>{t.transfer}</p></div>
      <div><span>MINIFIED</span><strong>{kb(size.component.minified)} <small>kB</small></strong><p>{t.minified}</p></div>
    </div>
  </section>;
}

function App() {
  const { lang, toggleLang } = useI18n();
  const t = translations[lang];
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101722' : '#ffffff');
  }, [dark]);

  return <>
    <a className="skip-link" href="#overview">{t.skipLink}</a>
    <header className="site-header">
      <a className="wordmark" href="#overview"><img src={logo} alt="" />react-hypnogram</a>
      <div className="header-actions">
        <span className="header-version">v{__APP_VERSION__}</span>
        <a className="icon-button github-link" href={githubUrl} target="_blank" rel="noreferrer" aria-label={t.githubAria}><GitHubIcon /></a>
        <button className="icon-button lang-button" type="button" aria-label={t.langToggle} onClick={toggleLang}>{t.langButtonText}</button>
        <button className="icon-button" type="button" aria-label={dark ? t.themeDark : t.themeLight} onClick={() => setDark(value => !value)}><ThemeIcon dark={dark} /></button>
      </div>
    </header>
    <div className={`doc-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-top">
          {!sidebarCollapsed && <span className="sidebar-label">{t.sidebarLabel}</span>}
          <button className="sidebar-toggle" type="button" aria-controls="docs-navigation" aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? t.sidebarExpand : t.sidebarCollapse} title={sidebarCollapsed ? t.sidebarExpand : t.sidebarCollapse} onClick={() => setSidebarCollapsed(value => !value)}><SidebarToggleIcon collapsed={sidebarCollapsed} /></button>
        </div>
        <div className="sidebar-content" id="docs-navigation">
          <a className="sidebar-product" href="#overview">Hypnogram</a>
          <p>{t.onThisPage}</p>
          <nav aria-label="文档导航">
            {sectionIds.map(id => <a key={id} href={`#${id}`}>{t.sections[id]}</a>)}
          </nav>
          <div className="sidebar-footer"><span>React + TypeScript</span><span>SVG · MIT</span></div>
        </div>
      </aside>
      <main className="doc-content">
        <section className="overview" id="overview">
          <div className="breadcrumb">Components <span>/</span> Hypnogram</div>
          <h1>Hypnogram</h1>
          <p className="lead">{t.overviewLead}</p>
          <div className="overview-meta"><span>React</span><span>TypeScript</span><span>SVG</span><a href="#size">{kb(size.component.gzip)} kB gzip ↗</a></div>
          <Usage />
        </section>
        <BasicDemo dark={dark} />
        <AppearanceDemo dark={dark} />
        <GradientsDemo dark={dark} />
        <AxesDemo dark={dark} />
        <InteractionDemo dark={dark} />
        <SizeSection />
        <ApiReference />
        <footer className="site-footer"><span>react-hypnogram · MIT</span><a href="#overview">{t.backToTop}</a></footer>
      </main>
    </div>
  </>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
);
