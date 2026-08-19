# Business Associate Agreement (BAA)

HIPAA business associate addendum between a software company (business associate) and its customer (covered entity or business associate) governing the processing of protected health information through designated HIPAA-eligible services.

## When to use

- A SaaS or cloud provider offers services that customers may configure to process protected health information.
- The addendum supplements an existing services agreement; it does not stand alone.

## Assumptions

- Drafted from the provider's perspective (limited reporting duties, no designated record set, 30-day breach reporting).
- Defined terms not in Appendix A take their HIPAA or services-agreement meaning.

## Fields

| Field | Label | Type | Required | Help |
| --- | --- | --- | --- | --- |
| `companyName` | Company legal name | text | yes | Legal name of the provider (business associate). |
| `companyState` | Company state of incorporation | text | yes | State whose law the company is organized under, e.g. Delaware. |
| `servicesDescription` | Description of the Services | text | yes | Short description of the services governed by the services agreement, e.g. 'cloud-based software services'. |
| `customerName` | Customer legal name | text | no | Legal name of the customer (covered entity or business associate). |
| `customerAddress` | Customer address for notices | text | no | Postal address for notices to the customer. |
| `customerEmail` | Customer notice email | text | no | Email address copied on notices to the customer. |
| `companyAddress` | Company address for notices | text | yes | Postal address for notices to the company. |
| `companyEmail` | Company notice email | text | yes | Email address copied on notices to the company. |

## Review notes

- Section 5(a) (customer obligations) is highlighted in the original for review; it is unchanged.
- Signature lines (By, Printed Name, Title) are left blank for signing.
- The original carries a footnote reference reading 'template1 [taylor.wessing]' and a footer disclaimer; both are left as found.

## Source and license

Drafted by the attorneys at [General Legal](https://general.legal) and published in [General-Legal/legal-templates](https://github.com/General-Legal/legal-templates) (original: `docx-originals/business-associate-agreement-baa.docx`, library page: https://general.legal/library/business-associate-agreement-baa) under [CC0 1.0](https://github.com/General-Legal/legal-templates/blob/main/LICENSE). Attribution is appreciated, not required.

Converted for Stella by replacing the source placeholders (highlighted text and bracketed tokens) with `{{field}}` merge fields and adding a field manifest; the legal text is otherwise unchanged. `template.md` is the source's markdown rendering for reading; `template.docx` is the fillable document.

This template is not legal advice. Have a qualified attorney review any document before use.

## Changelog

- 1.0.0: initial conversion from the source as of 2026-05-14.
