export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary: oklch(0.62 0.21 252);
    --primary-glow: oklch(0.72 0.18 230);
    --success: oklch(0.72 0.18 155);
    --warning: oklch(0.78 0.16 70);
    --danger: oklch(0.66 0.23 25);
    --neutral: oklch(0.6 0.02 260);
    --radius: 0.875rem;
  }

  [data-theme="dark"] {
    --bg: oklch(0.13 0.025 260);
    --surface: oklch(0.16 0.028 260 / 0.7);
    --surface-el: oklch(0.21 0.035 260);
    --border: oklch(0.28 0.03 260 / 0.6);
    --fg: oklch(1 0 0);
    --fg2: oklch(0.78 0.02 260);
    --bg-grad1: oklch(0.18 0.08 252);
    --bg-grad3: oklch(0.42 0.14 230);
  }
  [data-theme="light"] {
    --bg: oklch(0.985 0.005 260);
    --surface: oklch(1 0 0 / 0.85);
    --surface-el: oklch(1 0 0);
    --border: oklch(0.88 0.01 260);
    --fg: oklch(0.12 0.025 260);
    --fg2: oklch(0.45 0.02 260);
    --bg-grad1: oklch(0.92 0.06 240);
    --bg-grad3: oklch(0.85 0.09 220);
  }

  body {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background:
      radial-gradient(ellipse 80% 60% at 100% 50%, var(--bg-grad3) 0%, transparent 55%),
      radial-gradient(ellipse 70% 70% at 0% 0%, var(--bg-grad1) 0%, transparent 60%),
      var(--bg);
    background-attachment: fixed;
    min-height: 100vh;
    color: var(--fg);
    -webkit-font-smoothing: antialiased;
  }

  .glass {
    background: color-mix(in oklab, var(--surface) 60%, transparent);
    backdrop-filter: blur(20px) saturate(140%);
    border: 1px solid var(--border);
  }
  .glass-strong {
    background: color-mix(in oklab, var(--surface-el) 75%, transparent);
    backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid var(--border);
  }

  .textarea-base {
    width: 100%; background: transparent;
    border: 1px solid var(--border); border-radius: 12px;
    padding: 14px 16px; color: var(--fg);
    font-size: 0.9rem; line-height: 1.55; resize: vertical;
    outline: none; font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .textarea-base::placeholder { color: var(--fg2); opacity: 0.6; }
  .textarea-base:focus {
    border-color: var(--primary);
    background: color-mix(in oklab, var(--primary) 4%, transparent);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 18%, transparent);
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-glow));
    color: white; border: none; cursor: pointer; font-family: inherit;
    font-weight: 600; display: inline-flex; align-items: center; gap: 6px;
    box-shadow: 0 8px 24px -8px color-mix(in oklab, var(--primary) 60%, transparent);
    transition: transform 0.15s, filter 0.15s;
  }
  .btn-primary:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.6; cursor: wait; }

  .btn-ghost {
    background: color-mix(in oklab, var(--surface) 60%, transparent);
    border: 1px solid var(--border); color: var(--fg2); cursor: pointer;
    font-family: inherit; font-weight: 500;
    display: inline-flex; align-items: center; gap: 6px;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .btn-ghost:hover { background: var(--surface-el); border-color: color-mix(in oklab, var(--primary) 40%, transparent); color: var(--fg); }

  .toolbar-btn {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 8px; border: 1px solid color-mix(in oklab, var(--border) 100%, transparent);
    background: color-mix(in oklab, var(--surface) 60%, transparent);
    color: var(--fg2); cursor: pointer; padding: 6px 12px;
    font-size: 0.75rem; font-weight: 500; font-family: inherit;
    transition: all 0.15s;
  }
  .toolbar-btn:hover { border-color: color-mix(in oklab, var(--primary) 40%, transparent); background: color-mix(in oklab, var(--primary) 5%, transparent); color: var(--fg); }
  .toolbar-btn.active { border-color: color-mix(in oklab, var(--primary) 50%, transparent); background: color-mix(in oklab, var(--primary) 10%, transparent); color: var(--primary); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fadeUp 0.35s ease both; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; display: inline-block; }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
`