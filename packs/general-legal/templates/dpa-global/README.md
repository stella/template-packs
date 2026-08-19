# Data Processing Addendum (Global)

Processor-friendly data processing addendum covering U.S., EU/EEA, UK and Swiss personal data with GDPR-aligned obligations, transfer mechanisms and subprocessor terms, forming part of an existing customer agreement.

## When to use

- A service provider processes customer personal data from the U.S. and Europe (EU/EEA, UK, Switzerland) under one addendum.

## Assumptions

- Drafted from the provider's perspective; incorporates the EU Standard Contractual Clauses and UK Addendum by reference.

## Fields

| Field | Label | Type | Required | Help |
| --- | --- | --- | --- | --- |
| `providerName` | Provider name | text | yes | Legal name of the company acting as processor ('Provider'). |
| `customerName` | Customer name | text | no | Legal name of the customer (controller) for the signature block. |
| `agreementTitle` | Underlying agreement | text | yes | Title of the agreement this DPA forms part of, e.g. 'Master Services Agreement'. |
| `agreementEffectiveDate` | Agreement effective date | date | yes | Date of the underlying agreement. |
| `subprocessorSiteUrl` | Subprocessor list URL | text | no | URL of the page listing subprocessors; leave empty and delete the '/at [WEBSITE]' alternative if the Annex is used instead. |
| `providerAddress` | Provider address | text | yes | Postal address of the provider (Annex 1). |
| `providerDpContactRole` | Provider data protection contact (role) | text | yes | Role or name of the provider's data protection contact, e.g. 'Data Protection Officer'. |
| `providerDpContactEmail` | Provider data protection contact (email) | text | yes | Email address of the provider's data protection contact. |
| `providerActivities` | Provider activities | text | yes | Brief description of the provider's business and services (Annex 1). |
| `customerAddress` | Customer address | text | no | Postal address of the customer (Annex 1). |
| `customerDpContactRole` | Customer data protection contact (role) | text | no | Role or name of the customer's data protection contact. |
| `customerDpContactEmail` | Customer data protection contact (email) | text | no | Email address of the customer's data protection contact. |
| `subprocessorList` | Approved subprocessors | text | no | One entry per subprocessor: name, location(s), description of processing or services performed. |

## Review notes

- 'Annex N of this DPA/at [WEBSITE]' and 'Subprocessor List (Annex 5) / Subprocessor Site' are alternatives in the original; delete the one not used.
- Signature blocks (By, Name, Title, Date) are left blank for signing.

## Source and license

Drafted by the attorneys at [General Legal](https://general.legal) and published in [General-Legal/legal-templates](https://github.com/General-Legal/legal-templates) (original: `docx-originals/data-processing-addendum-dpa-u-s-and-european-personal-data.docx`, library page: https://general.legal/library/data-processing-addendum-dpa-u-s-and-european-personal-data) under [CC0 1.0](https://github.com/General-Legal/legal-templates/blob/main/LICENSE). Attribution is appreciated, not required.

Converted for Stella by replacing the source placeholders (highlighted text and bracketed tokens) with `{{field}}` merge fields and adding a field manifest; the legal text is otherwise unchanged. `template.md` is the source's markdown rendering for reading; `template.docx` is the fillable document.

This template is not legal advice. Have a qualified attorney review any document before use.

## Changelog

- 1.0.0: initial conversion from the source as of 2026-05-14.
