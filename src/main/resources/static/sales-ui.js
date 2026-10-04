/* AI Pulse brand theme */

:root {
    --navy: #071b4d;
    --navy-secondary: #08245c;
    --azure: #0877f9;
    --cyan: #13c7f3;
    --ice: #eaf6ff;
    --ice-light: #f1f9ff;
    --white: #ffffff;

    --ink: var(--navy);
    --muted: #526784;
    --border: #cfe5f7;
    --accent: var(--azure);
    --paper: var(--ice-light);
}

body {
    color: var(--ink);
    background: var(--paper);
    font-family: Inter, "Helvetica Neue", system-ui, sans-serif;
}

/* Navy buttons maintain readable white labels. */
button {
    background: var(--navy-secondary);
    color: var(--white);
}

button:hover {
    filter: brightness(1.12);
}

button:focus-visible,
textarea:focus-visible,
select:focus-visible {
    outline-color: var(--azure);
}

/* Bright sidebar */

.sidebar {
    background: linear-gradient(
        180deg,
        var(--white) 0%,
        var(--ice) 100%
    );
    color: var(--navy);
    border-right: 1px solid var(--border);
}

.brand {
    color: var(--navy);
}

.brand-mark {
    color: var(--navy);
    background: var(--ice);
    border: 1px solid #b7dcff;
}

.brand div > span {
    color: var(--muted);
}

.sidebar .eyebrow {
    color: var(--navy-secondary);
}

.sidebar h2 {
    color: var(--navy);
}

.sidebar p:not(.eyebrow) {
    color: var(--muted);
}

.dataset {
    background: var(--white);
    border-color: var(--border);
    color: var(--navy);
}

.dataset > span:last-child {
    color: var(--muted);
}

.dot {
    background: var(--cyan);
}

.suggestions button {
    background: var(--white);
    color: var(--navy-secondary);
    border-color: var(--border);
}

.suggestions button:hover {
    background: var(--ice);
    border-color: var(--azure);
    filter: none;
}

.suggestions button > span {
    color: var(--azure);
}

.sidebar-note {
    border-top-color: var(--border);
}

/* Header and AI Pulse signature */

.topbar {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    align-items: center;
    gap: 24px;
}

.workspace-heading {
    min-width: 0;
}

.workspace-heading .secondary {
    margin-top: 12px;
}

.secondary {
    background: var(--white);
    border-color: var(--border);
    color: var(--navy-secondary);
}

.secondary:hover {
    background: var(--ice-light);
    border-color: var(--azure);
    filter: none;
}

.ai-pulse-brand {
    flex-shrink: 0;
    text-align: right;
}

.ai-pulse-name {
    color: var(--navy);
    font-size: 28px;
    line-height: 1.15;
    font-weight: 800;
    letter-spacing: -1px;
}

.ai-pulse-name > span {
    color: var(--azure);
}

.ai-pulse-edition {
    margin-top: 5px;
    color: var(--navy-secondary);
    font-size: 9px;
    font-weight: 750;
    letter-spacing: 2px;
}

.ai-pulse-author {
    margin-top: 2px;
    color: var(--muted);
    font-size: 11px;
}

.ai-pulse-tagline {
    margin: 10px 0 0;
    padding-top: 8px;
    border-top: 2px solid var(--cyan);
    color: var(--navy-secondary);
    font-size: 11px;
    white-space: nowrap;
}

.ai-pulse-tagline > span {
    margin: 0 3px;
    color: var(--azure);
}

.ai-pulse-tagline > strong {
    color: var(--navy);
}

/* Welcome and conversation */

.welcome-mark {
    color: var(--azure);
    background: var(--ice);
    border-color: var(--border);
}

.welcome .eyebrow {
    color: var(--navy-secondary);
}

.question-text {
    background: var(--ice);
    color: var(--navy);
    border: 1px solid var(--border);
}

.answer-card {
    background: var(--white);
    border-color: var(--border);
    box-shadow: 0 3px 14px rgb(7 27 77 / 4%);
}

.answer-content h2,
.answer-content h3,
.answer-content h4 {
    color: var(--navy);
}

.answer-content blockquote {
    background: var(--ice-light);
    border-left-color: var(--cyan);
    color: var(--navy-secondary);
}

.answer-content pre {
    background: var(--ice-light);
    border: 1px solid var(--border);
}

.copy-button {
    background: transparent;
    color: var(--navy-secondary);
}

.copy-button:hover {
    background: var(--ice-light);
    filter: none;
}

/* Tables and chart controls */

.table-scroll {
    border-color: var(--border);
}

caption {
    color: var(--navy);
    background: var(--ice-light);
}

th {
    color: var(--navy);
    background: var(--ice);
}

th,
td {
    border-bottom-color: #deedf9;
}

tbody tr:nth-child(even) {
    background: #f7fbff;
}

tfoot {
    color: var(--navy);
    background: var(--ice);
    border-top-color: var(--border);
}

.chart-panel {
    border-top-color: var(--border);
}

.chart-controls select {
    background: var(--white);
    color: var(--navy);
    border-color: var(--border);
}

/* Composer and status */

.status {
    color: var(--navy-secondary);
}

.composer {
    background: var(--white);
    border-color: #b7d7f3;
    box-shadow: 0 5px 24px rgb(7 27 77 / 5%);
}

.composer:focus-within {
    outline-color: var(--azure);
}

textarea {
    color: var(--navy);
}

textarea::placeholder {
    color: var(--muted);
    opacity: 1;
}

#send-button {
    background: var(--navy-secondary);
    border: 1px solid var(--navy-secondary);
}

#send-button:hover {
    background: #0b397c;
    filter: none;
}

/* Orange is reserved for attention and errors. */
.error-card {
    background: #fff8eb;
    border-color: #ffd796;
    color: #704300;
}

.error-card .secondary {
    background: var(--white);
    color: var(--navy);
}

/* Keep branding readable on smaller screens. */
@media (max-width: 680px) {
    .topbar {
        padding: 16px;
        gap: 12px;
        align-items: flex-start;
    }

    .workspace-heading h1 {
        font-size: 17px;
    }

    .ai-pulse-name {
        font-size: 24px;
    }

    .ai-pulse-edition {
        font-size: 8px;
        letter-spacing: 1.4px;
    }

    .ai-pulse-author {
        font-size: 10px;
    }

    .ai-pulse-tagline {
        font-size: 9px;
        white-space: normal;
        max-width: 165px;
    }

    .ai-pulse-tagline > span {
        margin: 0 1px;
    }
}

@media (max-width: 380px) {
    .topbar {
        flex-wrap: wrap;
    }

    .ai-pulse-brand {
        margin-left: auto;
    }
}