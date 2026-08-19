# Terms of Use

Website terms of use covering access and accounts, use restrictions, intellectual property, feedback, privacy and cookies, indemnification, disclaimers, limitation of liability, termination, state-specific notices, accessibility, and binding arbitration with class-action waiver.

## When to use

- Publishing terms for a website or web application operated by a U.S. company.

## Assumptions

- Drafted for a California company: the consumer-rights notice, notice addresses and default governing law reference California.
- Two alternative arbitration clauses (Option A: JAMS; Option B: another administrator) are included; one must be kept and the other deleted before publishing.

## Fields

| Field | Label | Type | Required | Help |
| --- | --- | --- | --- | --- |
| `lastRevisedDate` | Last revised | date | yes | Date of this version of the terms. |
| `siteDomain` | Site domain | text | yes | Domain of the website, e.g. www.example.com. |
| `companyName` | Company name | text | yes | Legal name of the company operating the site. |
| `privacyPolicyUrl` | Privacy policy URL | text | yes | URL where the privacy policy is published. |
| `cookiePolicyLink` | Cookie policy reference | text | yes | Name or URL of the policy describing tracking technologies, e.g. 'Cookie Notice at https://example.com/cookies'. |
| `companyAddress` | Company postal address | text | yes | Full postal address shown in the California consumer-rights notice. |
| `companyEmail` | Company contact email | text | yes | Email address for complaints, Nevada requests and general contact. |
| `contactInformation` | Contact information | text | yes | How users can contact the company (email and/or postal address). |
| `governingLawState` | Governing law (state) | text | yes | U.S. state whose law governs and where courts sit, e.g. California. |
| `venueCounty` | Venue county | text | yes | County of the courts with exclusive jurisdiction, e.g. 'San Francisco County'. |
| `accessibilityContact` | Accessibility contact | text | yes | Email address or phone number for accessibility requests. |
| `copyrightYear` | Copyright year | number | yes | Year shown in the copyright notice, e.g. 2026. |
| `disputesEmail` | Dispute notice email | text | yes | Email address for informal dispute notices (Option A). |
| `companyStreetAddress` | Company street address (arbitration notices) | text | yes | Street and city of the notice address; the text appends ', California' and the ZIP. |
| `companyZip` | Company ZIP code | text | yes | ZIP code of the notice address. |
| `optOutEmail` | Arbitration opt-out email | text | yes | Email address (or postal address) to which arbitration opt-out notices are sent. |

## Review notes

- The arbitration section contains both Option A and Option B with a bracketed drafting note; delete the option not used.
- The 'Other States' paragraph is a bracketed drafting note about additional state-specific provisions; review and delete before publishing.
- Notice addresses in the arbitration section are written as '<street address>, California <ZIP>'; the state is literal text.

## Source and license

Drafted by the attorneys at [General Legal](https://general.legal) and published in [General-Legal/legal-templates](https://github.com/General-Legal/legal-templates) (original: `docx-originals/terms-of-use.docx`, library page: https://general.legal/library/terms-of-use) under [CC0 1.0](https://github.com/General-Legal/legal-templates/blob/main/LICENSE). Attribution is appreciated, not required.

Converted for Stella by replacing the source placeholders (highlighted text and bracketed tokens) with `{{field}}` merge fields and adding a field manifest; the legal text is otherwise unchanged. `template.md` is the source's markdown rendering for reading; `template.docx` is the fillable document.

This template is not legal advice. Have a qualified attorney review any document before use.

## Changelog

- 1.0.0: initial conversion from the source as of 2026-05-14.
