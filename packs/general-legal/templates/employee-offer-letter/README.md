# Employee Offer Letter (California Exempt)

Offer letter for a full-time exempt employee in California covering role, compensation, benefits, at-will employment, confidentiality agreement condition, outside-information restrictions, work hours and JAMS arbitration.

## When to use

- Hiring a salaried exempt employee who will work in California.
- The company uses a separate Employee Confidential Information and Inventions Assignment Agreement (Exhibit A, not included).

## Assumptions

- California employment law applies; the vacation and working-hours language is specific to exempt employees.
- Employment is at will; the offer is conditioned on a reference check and work authorization.

## Fields

| Field | Label | Type | Required | Help |
| --- | --- | --- | --- | --- |
| `companyName` | Company name | text | yes | Legal name of the employer. |
| `letterDate` | Letter date | date | yes | Date of the offer letter. |
| `employeeName` | Employee full name | text | yes | Full name of the candidate. |
| `employeeAddressLine1` | Employee address (line 1) | text | yes | Street address of the candidate. |
| `employeeAddressLine2` | Employee address (line 2) | text | no | City, state and ZIP of the candidate. |
| `employeeFirstName` | Employee first name | text | yes | Used in the salutation. |
| `position` | Position | text | yes | Job title, e.g. Senior Software Engineer. |
| `duties` | Primary responsibilities | text | yes | Short description of the role's responsibilities. |
| `manager` | Reports to | text | yes | Name or title of the manager the employee reports to. |
| `workLocation` | Work location | text | yes | E.g. 'the Company's office at 123 Main Street' or 'your home office (remote)'. |
| `workCity` | Work city | text | yes | City of the work location, followed by ', California'. |
| `annualSalary` | Annual base salary (USD) | text | yes | Amount without currency sign, e.g. 150,000. |
| `payFrequency` | Pay frequency | select (once per month / semimonthly / every two weeks) | yes | How often salary is paid. |
| `acceptanceDeadline` | Acceptance deadline | date | yes | Date by which the signed letter and Exhibit A must be returned. |
| `startDate` | Anticipated start date | date | yes | Anticipated first day of employment. |
| `signerName` | Signatory name | text | yes | Name of the company representative signing the letter. |
| `signerTitle` | Signatory title | text | yes | Title of the company representative, e.g. CEO. |
| `employeeEmail` | Employee email | text | no | Email address of the candidate. |

## Review notes

- Exhibit A (the confidentiality and inventions assignment agreement) is referenced but not part of this template.
- The employee's signature and date lines are left blank for signing.

## Source and license

Drafted by the attorneys at [General Legal](https://general.legal) and published in [General-Legal/legal-templates](https://github.com/General-Legal/legal-templates) (original: `docx-originals/employee-offer-letter.docx`, library page: https://general.legal/library/employee-offer-letter) under [CC0 1.0](https://github.com/General-Legal/legal-templates/blob/main/LICENSE). Attribution is appreciated, not required.

Converted for Stella by replacing the source placeholders (highlighted text and bracketed tokens) with `{{field}}` merge fields and adding a field manifest; the legal text is otherwise unchanged. `template.md` is the source's markdown rendering for reading; `template.docx` is the fillable document.

This template is not legal advice. Have a qualified attorney review any document before use.

## Changelog

- 1.0.0: initial conversion from the source as of 2026-05-14.
