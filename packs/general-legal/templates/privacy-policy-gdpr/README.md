# Privacy Policy (GDPR Enhanced)

Multi-jurisdictional privacy policy covering U.S. state privacy laws and GDPR/UK GDPR, with a Notice to European Users (controller identity, representatives, legal bases table, retention, rights, complaints and international transfers).

## When to use

- A U.S.-based service collects personal information from users in the United States and in the EEA or United Kingdom.

## Assumptions

- The company is U.S.-based and transfers European personal data to the U.S.; the Notice to European Users section is highlighted in the original as the GDPR add-on.

## Fields

| Field | Label | Type | Required | Help |
| --- | --- | --- | --- | --- |
| `lastUpdatedDate` | Last updated | date | yes | Date shown in the 'Last Updated' line. |
| `effectiveDate` | Effective date | date | yes | Date the policy takes effect. |
| `companyLegalName` | Company legal name | text | yes | Full legal name of the company. |
| `companyName` | Company short name | text | yes | Short name used throughout the policy, e.g. the trading name. |
| `businessDescription` | Description of business | text | yes | What the company provides, completing 'provides a ...', e.g. 'legal workspace platform'. |
| `aiProviders` | AI and chat providers | text | no | Chatbot and generative AI providers used on the service, e.g. 'Zendesk and OpenAI'. |
| `companyEmail` | Contact email | text | yes | Email address in the 'How to contact us' section. |
| `companyAddress` | Postal address | text | yes | Mailing address in the 'How to contact us' section. |
| `companyPhone` | Phone number | text | no | Phone number in the 'How to contact us' section. |
| `identityVerificationProcess` | Identity verification process | text | yes | How the company verifies the identity of a person making a privacy request. |
| `optOutLink` | Sale/sharing opt-out link | text | no | URL of the page to opt out of sale or sharing of personal information. |
| `privacyRequestEmail` | Privacy request email | text | yes | Email address for privacy rights requests (opt-out, access, Shine the Light, Nevada, European rights). |
| `privacyRequestPhone` | Privacy request phone | text | no | Toll-free number for privacy rights requests. |
| `privacyRequestWebformUrl` | Privacy request web form | text | no | URL of the web form for privacy rights requests. |
| `euRepresentativeName` | EU representative | text | no | Name of the representative appointed under the EU GDPR (Article 27). |
| `euRepresentativeEmail` | EU representative email | text | no | Email address of the EU representative. |
| `euRepresentativeAddress` | EU representative postal address | text | no | Postal address of the EU representative. |
| `ukRepresentativeName` | UK representative | text | no | Name of the representative appointed under the UK GDPR. |
| `ukRepresentativeEmail` | UK representative email | text | no | Email address of the UK representative. |
| `ukRepresentativeAddress` | UK representative postal address | text | no | Postal address of the UK representative. |
| `dpoEmail` | Data Protection Officer email | text | no | Email address of the DPO, if one is appointed. |

## Review notes

- The CCPA category table (five rows of [INSERT] cells) is left for manual completion.
- Bracketed optional and alternative passages (AI/chat provider sentences, payment processors, training-data opt-out, sale/sharing and sensitive-information alternatives, Nevada and Texas paragraphs, '[INSERT ADDITIONAL RELEVANT OPT-OUT PREFERENCE SIGNAL DETAILS]', '[ADD]', '[INSERT DESCRIPTION]') are left as found; keep, complete or delete them.
- The page header reads 'Privileged & Confidential' and 'Draft' in the original and is unchanged; remove it before publishing.
- The Data Protection Officer paragraph is bracketed as optional in the original; delete it (and leave the DPO email empty) if no DPO is appointed.
- The UK ICO contact details and the EEA regulator link are fixed text in the original.

## Source and license

Drafted by the attorneys at [General Legal](https://general.legal) and published in [General-Legal/legal-templates](https://github.com/General-Legal/legal-templates) (original: `docx-originals/privacy-policy-gdpr-enhanced.docx`, library page: https://general.legal/library/privacy-policy-gdpr-enhanced) under [CC0 1.0](https://github.com/General-Legal/legal-templates/blob/main/LICENSE). Attribution is appreciated, not required.

Converted for Stella by replacing the source placeholders (highlighted text and bracketed tokens) with `{{field}}` merge fields and adding a field manifest; the legal text is otherwise unchanged. `template.md` is the source's markdown rendering for reading; `template.docx` is the fillable document.

This template is not legal advice. Have a qualified attorney review any document before use.

## Changelog

- 1.0.0: initial conversion from the source as of 2026-05-14.
