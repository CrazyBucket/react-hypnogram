import { useState } from 'react';
import type { ReactNode } from 'react';
import { translations, useI18n } from './i18n';

export function CodeBlock({ code, label = 'TSX' }: { code: string; label?: string }) {
  const { lang } = useI18n();
  const t = translations[lang].ui;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return <div className="code-block"><div className="code-bar"><span>{label}</span><button onClick={async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setError(false); setTimeout(() => setCopied(false), 1500); }
    catch { setError(true); }
  }}>{error ? t.copyError : copied ? t.copied : t.copy}</button></div><pre><code>{code}</code></pre></div>;
}

export function Demo({ id, title, description, code, children, controls, footer }: {
  id: string; title: string; description: string; code: string; children: ReactNode; controls?: ReactNode; footer?: ReactNode;
}) {
  const { lang } = useI18n();
  const t = translations[lang].ui;
  const [view, setView] = useState<'preview' | 'code'>('preview');
  return <section className="doc-section example-section" id={id}>
    <div className="section-heading"><h2><a href={`#${id}`}>{title}</a></h2><p>{description}</p></div>
    <div className="example-card">
      <div className="example-toolbar"><div className="view-tabs" role="group" aria-label={t.viewAria(title)}>
        <button aria-pressed={view === 'preview'} onClick={() => setView('preview')}>{t.preview}</button>
        <button aria-pressed={view === 'code'} onClick={() => setView('code')}>{t.code}</button>
      </div><span className="example-tag">React · SVG</span></div>
      <div hidden={view !== 'preview'}><div className="example-canvas">{children}</div>{footer && <div className="example-footer">{footer}</div>}</div>
      {view === 'code' && <CodeBlock code={code} />}
      {controls && <div className="example-controls">{controls}</div>}
    </div>
  </section>;
}
export function Range({ label, value, min, max, onChange, disabled = false, unit = 'px' }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean; unit?: string }) {
  return <label className={`range-control${disabled ? ' disabled' : ''}`}><span>{label}<span className="number-input"><input aria-label={`${label}数值`} type="number" min={min} value={value} disabled={disabled} onChange={e => {
    if (e.target.value !== '' && Number.isFinite(e.target.valueAsNumber)) onChange(Math.max(min, e.target.valueAsNumber));
  }} /><small>{unit}</small></span></span><input aria-label={label} type="range" min={min} max={max} value={Math.min(value, max)} disabled={disabled} onChange={e => onChange(Number(e.target.value))} /></label>;
}
export function Toggle({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return <label className={`toggle${disabled ? ' disabled' : ''}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} /><span>{label}</span></label>;
}
