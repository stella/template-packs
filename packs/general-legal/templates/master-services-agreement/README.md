# Master Services Agreement (MSA)

Technology-oriented master services agreement for a company providing software, platform or integration services to a customer, with an Order Form (Exhibit A) and customer supplemental terms (Exhibit B).

## When to use

- A software or services company needs a standard customer agreement plus an order form for subscriptions and fees.

## Assumptions

- Drafted from the provider's perspective; governing law and arbitration venue default to Delaware.
- Order Form terms (payment term, initial and renewal term, billing method and frequency) are pre-filled with defaults in the text and are not fields.

## Fields

| Field | Label | Type | Required | Help |
| --- | --- | --- | --- | --- |
| `effectiveDate` | Effective date | date | yes | Date the agreement is made. |
| `companyName` | Company name | text | yes | Legal name of the service provider ('Company'). |
| `customerName` | Customer name | text | yes | Legal name of the customer. |
| `governingLawState` | Governing law (state) | text | yes | U.S. state whose law governs, e.g. Delaware. |
| `companyEmail` | Company email for disputes and notices | text | yes | Email address customers use for dispute notices and legal notices to the company. |
| `arbitrationVenue` | Arbitration venue | text | yes | County and state where arbitration is conducted, e.g. 'New Castle County, Delaware'. |
| `orderFormValidThrough` | Order Form valid through | date | no | Date until which the Order Form offer is valid. |
| `billingCustomerName` | Billing customer name | text | no | Name of the customer entity to be invoiced. |
| `billingContactName` | Billing contact name | text | no | Person to receive invoices. |
| `billingEmail` | Billing email address | text | no | Email address to receive invoices. |
| `fees` | Fees | text | no | Fee amount and period for the Order Form, e.g. '10,000 per year'. |
| `supplementalTermsReference` | Customer supplemental terms document | text | no | Name of the rider or document holding customer-specific terms (Exhibit B), e.g. 'Rider to Form'. |

## Review notes

- The optional 'Additional User Tiers' paragraph in the Order Form (with its own [User Number] and $ blanks) is left as found; complete or delete it.
- Pre-filled Order Form defaults ('Payment Term: Net 60', 'Initial Term: 12 months', 'Renewal Term: 12 months', 'Billing Method: Email', 'Billing Frequency: Monthly') are highlighted in the original and unchanged.
- 'Address:' and 'Email Address:' labels on the Order Form have no value placeholder in the original and are left blank.
- Signature blocks (By, Name, Title, Date) are left blank for signing.

## Source and license

Drafted by the attorneys at [General Legal](https://general.legal) and published in [General-Legal/legal-templates](https://github.com/General-Legal/legal-templates) (original: `docx-originals/master-services-agreement-msa.docx`, library page: https://general.legal/library/master-services-agreement-msa) under [CC0 1.0](https://github.com/General-Legal/legal-templates/blob/main/LICENSE). Attribution is appreciated, not required.

Converted for Stella by replacing the source placeholders (highlighted text and bracketed tokens) with `{{field}}` merge fields and adding a field manifest; the legal text is otherwise unchanged. `template.md` is the source's markdown rendering for reading; `template.docx` is the fillable document.

This template is not legal advice. Have a qualified attorney review any document before use.

## Changelog

- 1.0.0: initial conversion from the source as of 2026-05-14.
