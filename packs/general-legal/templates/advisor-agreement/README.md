# Advisor Agreement

Agreement between a company and an individual advisor covering advisory services, an anticipated stock option grant with a vesting schedule, assignment of inventions, confidentiality, non-solicitation and termination.

## When to use

- Engaging an individual (not a firm) to advise a company in exchange for equity rather than cash.
- The advisor is an independent contractor and will not receive employee benefits.

## Assumptions

- Company is a U.S. entity; governing law and exclusive venue are Delaware.
- Compensation is a stock option grant subject to board approval; no cash fees.
- Advisor is an individual who signs on the signature page; advisor details are completed at signing, not as fields.

## Fields

| Field | Label | Type | Required | Help |
| --- | --- | --- | --- | --- |
| `companyName` | Company name | text | yes | Legal name of the company engaging the advisor. |
| `effectiveDate` | Effective date | date | yes | Date the agreement takes effect. |
| `servicesDescription` | Services | text | yes | Advisory services, e.g. 'attending quarterly strategy meetings and advising on go-to-market'. |
| `servicesDates` | Dates of services | text | yes | When the services are expected, e.g. 'an ongoing basis during the term' or specific dates. |
| `fieldOfBusiness` | Field of business (non-compete) | text | yes | Field in which the advisor will not serve competitors during the term, e.g. 'AI-assisted contract review'. |
| `optionShares` | Option shares | number | yes | Number of shares of common stock subject to the anticipated option grant. |
| `vestingYears` | Vesting period (years) | number | yes | Length of the vesting schedule in years, e.g. 2. |
| `vestingInstallments` | Monthly vesting installments | number | yes | Number of equal monthly installments, e.g. 24 for a two-year schedule. |
| `companyAddressLine1` | Company address (line 1) | text | yes | Street address for notices to the company. |
| `companyAddressLine2` | Company address (line 2) | text | no | City, state and ZIP for notices to the company. |

## Review notes

- Signature-block lines (By, Name, Title, Email, Phone) and the advisor's details are left blank for signing.
- Section references in the termination and remedies clauses assume the section numbering of the original.

## Source and license

Drafted by the attorneys at [General Legal](https://general.legal) and published in [General-Legal/legal-templates](https://github.com/General-Legal/legal-templates) (original: `docx-originals/advisor-agreement.docx`, library page: https://general.legal/library/advisor-agreement) under [CC0 1.0](https://github.com/General-Legal/legal-templates/blob/main/LICENSE). Attribution is appreciated, not required.

Converted for Stella by replacing the source placeholders (highlighted text and bracketed tokens) with `{{field}}` merge fields and adding a field manifest; the legal text is otherwise unchanged. `template.md` is the source's markdown rendering for reading; `template.docx` is the fillable document.

This template is not legal advice. Have a qualified attorney review any document before use.

## Changelog

- 1.0.0: initial conversion from the source as of 2026-05-14.
