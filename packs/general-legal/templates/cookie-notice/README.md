# Cookie Notice

Notice explaining how a company uses cookies and similar technologies (web storage, pixels, SDKs, session replay) on its websites, with a category table (advertising, analytics, essential, functionality, social) and the user's control options.

## When to use

- A website or app sets cookies or uses tracking technologies and a stand-alone cookie notice is wanted alongside the privacy policy.

## Assumptions

- Published on a website; mobile-app wording is an optional bracketed alternative in the text.
- The cookie table lists providers and control options per category; these are free-text fields.

## Fields

| Field | Label | Type | Required | Help |
| --- | --- | --- | --- | --- |
| `companyName` | Company name | text | yes | Name the notice uses for the company, e.g. the trading name. |
| `websiteUrl` | Website | text | yes | Domain or URL of the website, e.g. example.com. |
| `advertisingCookieProviders` | Advertising cookies: who serves them | text | no | Providers of advertising cookies, with links to their privacy policies. |
| `advertisingCookieControls` | Advertising cookies: how to control them | text | no | Opt-out links or instructions for the advertising providers. |
| `analyticsCookieProviders` | Analytics cookies: who serves them | text | no | Providers of analytics cookies, with links to their privacy policies. |
| `analyticsCookieControls` | Analytics cookies: how to control them | text | no | Opt-out links or instructions for the analytics providers. |
| `essentialCookieProviders` | Essential cookies: who serves them | text | no | Providers of essential cookies (often the company itself). |
| `essentialCookieControls` | Essential cookies: how to control them | text | no | Control options for essential cookies, e.g. browser settings. |
| `functionalityCookieProviders` | Functionality cookies: who serves them | text | no | Providers of functionality or performance cookies. |
| `functionalityCookieControls` | Functionality cookies: how to control them | text | no | Opt-out links or instructions for the functionality providers. |
| `socialCookieProviders` | Social cookies: who serves them | text | no | Social media providers whose cookies are used. |
| `socialCookieControls` | Social cookies: how to control them | text | no | Opt-out links or instructions for the social providers. |
| `sessionReplayProvider` | Session-replay provider | text | no | Vendor of session-replay technology, e.g. FullStory. |
| `contactEmail` | Contact email | text | yes | Email address for questions about the notice. |
| `lastModifiedDate` | Last modified | date | yes | Date the notice was last modified. |

## Review notes

- Bracketed optional text ('; and our mobile app ("App")', 'and App', the cookie-preference-dashboard paragraphs, the session-replay opt-out sentence) is left as found; keep or delete it when publishing.
- The session-replay opt-out sentence names FullStory; adjust or remove it if another vendor is entered.
- 'Privacy Policy' at the end of 'Your choices' is highlighted as a hyperlink target in the original.

## Source and license

Drafted by the attorneys at [General Legal](https://general.legal) and published in [General-Legal/legal-templates](https://github.com/General-Legal/legal-templates) (original: `docx-originals/cookie-notice.docx`, library page: https://general.legal/library/cookie-notice) under [CC0 1.0](https://github.com/General-Legal/legal-templates/blob/main/LICENSE). Attribution is appreciated, not required.

Converted for Stella by replacing the source placeholders (highlighted text and bracketed tokens) with `{{field}}` merge fields and adding a field manifest; the legal text is otherwise unchanged. `template.md` is the source's markdown rendering for reading; `template.docx` is the fillable document.

This template is not legal advice. Have a qualified attorney review any document before use.

## Changelog

- 1.0.0: initial conversion from the source as of 2026-05-14.
