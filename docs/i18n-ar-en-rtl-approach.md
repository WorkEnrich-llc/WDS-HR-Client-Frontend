# Arabic & English i18n, RTL, and Accessibility — Implementation Approach

This document describes how to evolve **Talent.HR** (Angular, standalone components, **ngx-translate**) into a fully bilingual **English / Arabic** product with **correct RTL layout**, **translated UI including placeholders**, and **accessibility that follows the active language and direction**.

It aligns with the current codebase: `TranslateModule` in `main.ts`, `LanguageService` / `AppComponent` setting `document.documentElement.lang` and `dir`, and swapping `assets/ltr.css` vs `assets/rtl.css`.

---

## 1. Goals

| Area | Requirement |
|------|-------------|
| **Copy** | All user-visible strings (labels, buttons, empty states, errors, toasts, route titles) come from translation files — no hard-coded English in templates for production UI. |
| **Structure** | Per-locale folders (`en/`, `ar/`) with **one JSON file per functional module** (not one giant `en.json`). |
| **Direction** | Arabic: `dir="rtl"` on the document (or root host); English: `dir="ltr"`. Layout, spacing, and overlays must mirror correctly. |
| **Forms** | Placeholders, validation messages, and `aria-*` text use the same translation keys as visible labels where applicable. |
| **Accessibility** | `lang` and `dir` stay in sync with the chosen locale; navigation and focus order feel natural in RTL; screen readers get correct language hints. |
| **Data** | Dates, numbers, and currency formatted per locale (see §7). |

---

## 2. Translation file layout

### 2.1 Recommended directory structure

Place files under `src/assets/i18n/`:

```text
assets/i18n/
  en/
    common.json           # shared: buttons, validation, table chrome, errors
    layout.json           # shell: sidebar, header, menus
    auth.json
    activate-account.json
    dashboard.json
    od.json               # org design: departments, branches, jobs, org chart, goals, dept-check
    personnel.json        # employees, workflow, requests, onboarding, delegation, custom-fields, personnel calendar
    attendance.json       # attendance, rules, restricted days, schedule, leave, permissions, summary
    recruitment.json      # job openings, assignments, archived, job board setup, recruitment calendar
    payroll.json          # components, bonus/deductions, runs, salary portions, taxes
    system-cloud.json
    admin-settings.json   # roles, users, integrations, announcements, policy, documents, email settings
    user-settings.json    # profile, app, notifications, password
    public.json           # interview/offer flows, assignment, download-app
    validation.json       # optional split if common.json grows too large
  ar/
    (same file names and key structure as en/)
```

**Rules:**

- **Same keys** in `en/` and `ar/` for every file. Missing keys in `ar` should fall back to `en` via ngx-translate’s `fallbackLang` (set `en` as default and fallback).
- Use **nested objects** for readability, e.g. `od.branches.list.title`, not flat `BRANCHES_LIST_TITLE`, unless the team prefers flat keys — pick one convention and document it in `CONTRIBUTING` or team notes.
- Keep **shared** strings in `common.json` (Save, Cancel, Search, Loading, No data, etc.) to avoid duplication across module files.

### 2.2 ngx-translate: loading multiple JSON files per language

`TranslateHttpLoader` loads **a single file** per language. To load **many module files** and merge them:

1. Implement a **custom `TranslateLoader`** that, for language `lang`, uses `HttpClient` to request each JSON under `assets/i18n/${lang}/*.json` (you can maintain an explicit list of filenames, or use a small manifest JSON).
2. Use **`forkJoin`** (or sequential requests if you prefer) and **`reduce`** the responses into one object (shallow or deep merge — **shallow merge of top-level namespaces** is often enough if each file owns distinct root keys like `{ "od": { ... } }` per file).

**Alternative (simpler operationally):** a build step merges `en/*.json` → `en.json` for production. That keeps runtime simple but adds tooling; the in-app custom loader avoids a build merge and matches your “folders per locale” requirement directly.

### 2.3 Key namespaces

To prevent key collisions when merging files, prefix each module file’s root key:

```json
{
  "od": {
    "branches": {
      "title": "Branches",
      "create": "Create branch"
    }
  }
}
```

Template usage: `{{ 'od.branches.title' | translate }}` or `[translate]="'od.branches.title'"`.

---

## 3. Wiring language, direction, and global styles

### 3.1 Single source of truth

Centralize in `LanguageService` (already partially there):

- `translate.use(lang)`
- `document.documentElement.lang = lang` (use BCP 47: `en`, `ar`)
- `document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'`
- Swap global styles (you already use `assets/ltr.css` / `assets/rtl.css` in `AppComponent.updateStyles`)

Call the same routine from:

- App bootstrap (after reading `localStorage`)
- Language switcher UI
- Any future “first visit” language detection

### 3.2 Bootstrap and component libraries

- For Arabic, ensure **Bootstrap RTL** is active (your `rtl.css` already imports `bootstrap/bootstrap.rtl.min.css`). Keep **one** of LTR/RTL Bootstrap loaded at a time to avoid conflicting utilities.
- Audit **third-party** widgets (date pickers, maps, charts, toastr). Some need explicit RTL options or CSS overrides; track them in a checklist per component.

### 3.3 CSS: logical properties and “end” alignment

RTL breaks when templates use **physical** `left` / `right` / `margin-left` / `padding-right` for layout. Prefer:

- **Logical properties:** `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-end`, etc.
- **Bootstrap 5 logical utilities** where available (`start` / `end` instead of `left` / `right` — you already use `end-0` in some auth screens; extend this pattern).

**Audit:** the codebase has many inline `style="... right: 12px ..."` and similar patterns. These should become:

- `position-absolute top-50 translate-middle-y end-0` (Bootstrap), or
- CSS classes using logical properties.

Icons that imply direction (chevrons, “back” arrows) may need **`transform: scaleX(-1)`** in RTL or swapping to a mirrored icon — use a small utility class toggled with `[class.rtl-mirror]="isRtl"` or `:dir(rtl) .icon-chevron { transform: scaleX(-1); }` when the icon must point the correct way.

---

## 4. Templates: pipes, attributes, and TS strings

### 4.1 Template text

- Replace static text with `translate` pipe or `*translate` directive (if you add `@ngx-translate/http-loader` patterns are fine; pipe is most common).
- For **attributes**: `placeholder`, `title`, `aria-label`, `aria-placeholder` (where used), `mat-label` (if Material), etc.:

  ```html
  <input
    [placeholder]="'auth.login.emailPlaceholder' | translate"
    [attr.aria-label]="'auth.login.emailLabel' | translate"
  />
  ```

### 4.2 TypeScript-only strings

Service code, interceptors, and `Toastr` calls often pass raw English. Options:

- Inject `TranslateService` and use `instant()` or `get()` when showing the message (note: `instant` only works if translations are already loaded).
- Or map **error codes** from the API to translation keys in a thin error-mapping service.

### 4.3 Route titles

`app.routes.ts` uses static `title: '...'`. For translated titles:

- Use Angular’s **`Title`** strategy with **`TranslateService`**: on navigation end, set `Title` from `translate.instant('route.dashboard')` (after ensuring the active lang is loaded), or use a custom **`TitleStrategy`** that resolves keys from `route.data['titleKey']`.

---

## 5. RTL “perfection” checklist

Use this as a gate before marking a screen done in Arabic.

| Check | Detail |
|-------|--------|
| Document `dir` | `html` has `dir="rtl"` when `lang` is `ar`. |
| Scrollbars & overflow | Long tables and modals scroll naturally; sticky columns align to the “start” side. |
| Forms | Labels align to the correct side; required markers; error text under fields aligns. |
| Input caret | Mixed Arabic/Latin input: consider `dir="auto"` on specific inputs if users type both (optional UX refinement). |
| Dropdowns / popovers | Open in the correct direction; overlay positioning (CDK overlay) respects RTL when using `dir` on document or `Directionality` from `@angular/cdk/bidi`. |
| Tables | Column order and “actions” column at the logical end; sort icons flipped if needed. |
| Icons | Directional icons mirrored or swapped in RTL. |
| Maps / charts | Legend and controls don’t assume LTR only. |

**Angular CDK:** `import { Dir } from '@angular/cdk/bidi'` or provide `Directionality` so overlay-based components flip correctly when you migrate or add CDK-based UI.

---

## 6. Accessibility tied to language

| Concern | Approach |
|---------|----------|
| **Language** | Keep `document.documentElement.lang` in sync (`en` / `ar`). |
| **Direction** | Keep `dir` in sync; do not rely only on CSS float hacks. |
| **Labels** | Every interactive control has visible label or `aria-label` / `aria-labelledby` from translations. |
| **Live regions** | Toasts and inline alerts: if they read critical info, ensure language matches (translated strings + correct `lang` on container if you embed mixed-language content). |
| **Skip link / landmarks** | Translate “Skip to main content” and landmark labels. |
| **Focus order** | In RTL, tab order should follow visual order; fix any `tabindex` hacks that assumed LTR. |

Optional: expose a **`data-theme-dir="rtl|ltr"`** on `body` for debugging and E2E tests.

---

## 7. Dates, numbers, and currency

- Register **`LOCALE_ID`** (or switch it dynamically with a factory if you support runtime locale change — advanced) and use **`DatePipe`**, **`DecimalPipe`**, **`CurrencyPipe`** with appropriate locale, **or** use **`Intl.DateTimeFormat` / `Intl.NumberFormat`** in a small formatting service keyed by `en` vs `ar`.
- **Hijri / regional calendars:** if required by stakeholders, plan a dedicated library and UX; not covered by simple `LOCALE_ID` alone.

---

## 8. Module rollout order (suggested)

1. **Infrastructure:** custom `TranslateLoader`, `fallbackLang`, `LanguageService` hardening, `Title` strategy, Toastr wrapper.
2. **`common.json` + `layout.json`** — shell used on every page.
3. **`auth.json` + `activate-account.json` + `public.json`** — high visibility, often first impression.
4. **`dashboard.json`**
5. Domain modules in order of business priority: **OD → Personnel → Attendance → Recruitment → Payroll → Admin settings → System cloud → User settings**.

Within each module, migrate **list → detail → forms → edge cases (empty/error)**.

---

## 9. Quality assurance

- **Visual:** Arabic screenshot pass per major route; compare with English for broken alignment.
- **Functional:** Language switch preserves route; reload preserves `lang` from `localStorage`; no flash of wrong `dir` before `AppComponent` runs (consider default `dir` in `index.html` from a tiny inline script if needed).
- **i18n:** Script or test that **`en` and `ar` JSON trees have the same keys** (allow listed exceptions for locale-only strings).
- **E2E:** One smoke test per language for login + one inner page.

---

## 10. Summary

| Topic | Recommendation |
|-------|----------------|
| **Files** | `assets/i18n/en/*.json` and `assets/i18n/ar/*.json`, one file per module + `common` + `layout`. |
| **Loader** | Custom `TranslateLoader` merging module files (or build-time merge). |
| **Direction** | `documentElement.dir` + Bootstrap RTL + logical CSS + remove physical left/right layout hacks. |
| **Forms** | All placeholders and ARIA from translation keys. |
| **A11y** | `lang` + `dir` + translated labels and announcements. |
| **Formatting** | Locale-aware dates/numbers via Angular pipes or `Intl`. |

This approach builds on what you already have (`ngx-translate`, `LanguageService`, LTR/RTL stylesheets) and scales with the size of `app.routes.ts` and the many feature areas in the app.
