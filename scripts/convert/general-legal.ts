#!/usr/bin/env bun
/**
 * Convert the General Legal DOCX originals into Stella-fillable templates for
 * packs/general-legal.
 *
 * Source placeholders are highlighted runs and/or square-bracket tokens
 * ("[Company]", "[DATE]", "_____"). Each mapped placeholder becomes a
 * `{{fieldName}}` merge field (same party or value = same field everywhere),
 * the highlight is removed from the inserted marker, and a Stella template
 * manifest (custom XML part, namespace urn:stella:template:v1) is written with
 * label, input type, required flag and help text per field. The legal text is
 * not otherwise modified; optional or alternative passages that the source
 * marks with highlight or brackets are left in place and listed in each
 * template README under "Review notes".
 *
 * Dependencies: this script reuses Stella's DOCX libraries (manifest writer,
 * run-splitting text replacement, template discovery) and therefore needs a
 * checkout of https://github.com/stella/stella. Run it from that checkout's
 * apps/api directory (its tsconfig path aliases and .env must resolve):
 *
 *   cd <stella>/apps/api
 *   cp -n .env.example .env
 *   GENERAL_LEGAL_SRC=<clone of General-Legal/legal-templates> \
 *   TEMPLATE_PACKS=<clone of stella/template-packs> \
 *   bun $TEMPLATE_PACKS/scripts/convert/general-legal.ts
 *
 * Outputs, per template: templates/<slug>/template.docx, README.md and
 * template.md (the source markdown with an attribution header). pack.json is
 * maintained by hand.
 */

import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { createRequire } from "node:module";

const STELLA_API = process.cwd();
if (!existsSync(join(STELLA_API, "src/lib/docx/template-manifest.ts"))) {
  console.error("run this script from the apps/api directory of a Stella checkout");
  process.exit(2);
}
// Resolve jszip and slimdom from the Stella checkout so the DOM classes match
// the ones its libraries use.
const stellaRequire = createRequire(join(STELLA_API, "package.json"));
const JSZip = stellaRequire("jszip") as typeof import("jszip");
const slimdom = stellaRequire("slimdom") as typeof import("slimdom");
const GENERAL_LEGAL_SRC = process.env["GENERAL_LEGAL_SRC"];
const TEMPLATE_PACKS = process.env["TEMPLATE_PACKS"] ?? resolve(import.meta.dir, "../..");
if (!GENERAL_LEGAL_SRC) {
  console.error("GENERAL_LEGAL_SRC must point at a clone of General-Legal/legal-templates");
  process.exit(2);
}

type FieldMeta = {
  path: string;
  label?: string;
  hint?: string;
  inputType?: "text" | "number" | "boolean" | "date" | "select";
  options?: string[];
  required?: boolean;
  dateFormat?: { locale: string; style: "long" | "medium" | "short" | "iso" };
};
type TemplateManifest = { version: number; fields: FieldMeta[] };

const manifestLib = (await import(`${STELLA_API}/src/lib/docx/template-manifest.ts`)) as {
  writeManifest: (docx: Buffer, manifest: TemplateManifest) => Promise<Buffer>;
  readManifest: (docx: Buffer) => Promise<TemplateManifest | null>;
};
const discoverLib = (await import(`${STELLA_API}/src/lib/docx/discover-template.ts`)) as {
  discoverTemplate: (docx: Buffer) => Promise<{
    placeholders: { name: string; count: number }[];
    fields: { path: string; kind: string }[];
    structureErrors: { message: string }[];
  }>;
};
const richPatch = (await import(`${STELLA_API}/src/lib/docx/rich-patch.ts`)) as {
  paragraphSpanText: (p: slimdom.Element) => string;
  replaceParagraphTextRanges: (
    p: slimdom.Element,
    ranges: readonly { start: number; end: number; value: string }[],
  ) => void;
};
const ooxml = (await import(`${STELLA_API}/src/lib/docx/ooxml.ts`)) as {
  W_NS: string;
  templateContentPartPaths: (paths: Iterable<string>) => string[];
};
const { W_NS } = ooxml;

// ── Spec types ────────────────────────────────────────────

type Replacement = {
  /** Literal text to find in the paragraph's concatenated `w:t` text. */
  find: string;
  /** Field path the match becomes (`{{field}}`). */
  field: string;
  /** Restrict to these paragraph indices of word/document.xml (0-based, all `w:p` in document order). */
  paragraphs?: number[];
  /** 1-based occurrence within each matched paragraph; default all. */
  occurrence?: number;
  /** Expected total match count across the document; default: at least one. */
  count?: number;
};

type Field = FieldMeta & { path: string; label: string };

type TemplateSpec = {
  slug: string;
  /** File stem under docx-originals/ and directory under templates/ in the source repo. */
  source: { docx: string; mdDir: string; libraryUrl: string };
  title: string;
  purpose: string;
  whenToUse: string[];
  assumptions: string[];
  reviewNotes: string[];
  fields: Field[];
  replacements: Replacement[];
};

const text = (path: string, label: string, hint: string, required = true): Field => ({
  path,
  label,
  hint,
  inputType: "text",
  required,
});
const date = (path: string, label: string, hint: string, required = true): Field => ({
  path,
  label,
  hint,
  inputType: "date",
  required,
  dateFormat: { locale: "en-US", style: "long" },
});
const number = (path: string, label: string, hint: string, required = true): Field => ({
  path,
  label,
  hint,
  inputType: "number",
  required,
});
const select = (path: string, label: string, hint: string, options: string[], required = true): Field => ({
  path,
  label,
  hint,
  inputType: "select",
  options,
  required,
});

const LIBRARY = "https://general.legal/library";

// ── Template specs ────────────────────────────────────────

const SPECS: TemplateSpec[] = [
  {
    slug: "advisor-agreement",
    source: { docx: "advisor-agreement", mdDir: "advisor-agreement", libraryUrl: `${LIBRARY}/advisor-agreement` },
    title: "Advisor Agreement",
    purpose:
      "Agreement between a company and an individual advisor covering advisory services, an anticipated stock option grant with a vesting schedule, assignment of inventions, confidentiality, non-solicitation and termination.",
    whenToUse: [
      "Engaging an individual (not a firm) to advise a company in exchange for equity rather than cash.",
      "The advisor is an independent contractor and will not receive employee benefits.",
    ],
    assumptions: [
      "Company is a U.S. entity; governing law and exclusive venue are Delaware.",
      "Compensation is a stock option grant subject to board approval; no cash fees.",
      "Advisor is an individual who signs on the signature page; advisor details are completed at signing, not as fields.",
    ],
    reviewNotes: [
      "Signature-block lines (By, Name, Title, Email, Phone) and the advisor's details are left blank for signing.",
      "Section references in the termination and remedies clauses assume the section numbering of the original.",
    ],
    fields: [
      text("companyName", "Company name", "Legal name of the company engaging the advisor."),
      date("effectiveDate", "Effective date", "Date the agreement takes effect."),
      text("servicesDescription", "Services", "Advisory services, e.g. 'attending quarterly strategy meetings and advising on go-to-market'."),
      text("servicesDates", "Dates of services", "When the services are expected, e.g. 'an ongoing basis during the term' or specific dates."),
      text("fieldOfBusiness", "Field of business (non-compete)", "Field in which the advisor will not serve competitors during the term, e.g. 'AI-assisted contract review'."),
      number("optionShares", "Option shares", "Number of shares of common stock subject to the anticipated option grant."),
      number("vestingYears", "Vesting period (years)", "Length of the vesting schedule in years, e.g. 2."),
      number("vestingInstallments", "Monthly vesting installments", "Number of equal monthly installments, e.g. 24 for a two-year schedule."),
      text("companyAddressLine1", "Company address (line 1)", "Street address for notices to the company."),
      text("companyAddressLine2", "Company address (line 2)", "City, state and ZIP for notices to the company.", false),
    ],
    replacements: [
      { find: "[Company]", field: "companyName", count: 2 },
      { find: "________________", field: "effectiveDate", paragraphs: [1], count: 1 },
      { find: "[(describe services)]", field: "servicesDescription", count: 1 },
      { find: "[(provide dates of services)]", field: "servicesDates", count: 1 },
      { find: "___________", field: "fieldOfBusiness", paragraphs: [2], count: 1 },
      { find: "[__]", field: "optionShares", count: 1 },
      { find: "_____", field: "vestingYears", paragraphs: [3], occurrence: 1, count: 1 },
      { find: "_____", field: "vestingInstallments", paragraphs: [3], occurrence: 2, count: 1 },
      { find: "[Address]", field: "companyAddressLine1", paragraphs: [48], count: 1 },
      { find: "[Address]", field: "companyAddressLine2", paragraphs: [51], count: 1 },
    ],
  },
  {
    slug: "business-associate-agreement",
    source: {
      docx: "business-associate-agreement-baa",
      mdDir: "business-associate-agreement",
      libraryUrl: `${LIBRARY}/business-associate-agreement-baa`,
    },
    title: "Business Associate Agreement (BAA)",
    purpose:
      "HIPAA business associate addendum between a software company (business associate) and its customer (covered entity or business associate) governing the processing of protected health information through designated HIPAA-eligible services.",
    whenToUse: [
      "A SaaS or cloud provider offers services that customers may configure to process protected health information.",
      "The addendum supplements an existing services agreement; it does not stand alone.",
    ],
    assumptions: [
      "Drafted from the provider's perspective (limited reporting duties, no designated record set, 30-day breach reporting).",
      "Defined terms not in Appendix A take their HIPAA or services-agreement meaning.",
    ],
    reviewNotes: [
      "Section 5(a) (customer obligations) is highlighted in the original for review; it is unchanged.",
      "Signature lines (By, Printed Name, Title) are left blank for signing.",
      "The original carries a footnote reference reading 'template1 [taylor.wessing]' and a footer disclaimer; both are left as found.",
    ],
    fields: [
      text("companyName", "Company legal name", "Legal name of the provider (business associate)."),
      text("companyState", "Company state of incorporation", "State whose law the company is organized under, e.g. Delaware."),
      text("servicesDescription", "Description of the Services", "Short description of the services governed by the services agreement, e.g. 'cloud-based software services'."),
      text("customerName", "Customer legal name", "Legal name of the customer (covered entity or business associate).", false),
      text("customerAddress", "Customer address for notices", "Postal address for notices to the customer.", false),
      text("customerEmail", "Customer notice email", "Email address copied on notices to the customer.", false),
      text("companyAddress", "Company address for notices", "Postal address for notices to the company."),
      text("companyEmail", "Company notice email", "Email address copied on notices to the company."),
    ],
    replacements: [
      { find: "[LEGAL NAME OF COMPANY]", field: "companyName", count: 1 },
      { find: "[STATE OF INCORPORATION OF COMPANY]", field: "companyState", count: 1 },
      { find: "[cloud-based software services]", field: "servicesDescription", count: 1 },
      { find: "[LEGAL NAME OF CUSTOMER]", field: "customerName", count: 1 },
      { find: "[CUSTOMER ADDRESS]", field: "customerAddress", count: 1 },
      { find: "[CUSTOMER EMAIL]", field: "customerEmail", count: 1 },
      { find: "[COMPANY ADDRESS]", field: "companyAddress", count: 1 },
      { find: "[COMPANY EMAIL]", field: "companyEmail", count: 1 },
    ],
  },
  {
    slug: "cookie-notice",
    source: { docx: "cookie-notice", mdDir: "cookie-notice", libraryUrl: `${LIBRARY}/cookie-notice` },
    title: "Cookie Notice",
    purpose:
      "Notice explaining how a company uses cookies and similar technologies (web storage, pixels, SDKs, session replay) on its websites, with a category table (advertising, analytics, essential, functionality, social) and the user's control options.",
    whenToUse: ["A website or app sets cookies or uses tracking technologies and a stand-alone cookie notice is wanted alongside the privacy policy."],
    assumptions: [
      "Published on a website; mobile-app wording is an optional bracketed alternative in the text.",
      "The cookie table lists providers and control options per category; these are free-text fields.",
    ],
    reviewNotes: [
      "Bracketed optional text ('; and our mobile app (\"App\")', 'and App', the cookie-preference-dashboard paragraphs, the session-replay opt-out sentence) is left as found; keep or delete it when publishing.",
      "The session-replay opt-out sentence names FullStory; adjust or remove it if another vendor is entered.",
      "'Privacy Policy' at the end of 'Your choices' is highlighted as a hyperlink target in the original.",
    ],
    fields: [
      text("companyName", "Company name", "Name the notice uses for the company, e.g. the trading name."),
      text("websiteUrl", "Website", "Domain or URL of the website, e.g. example.com."),
      text("advertisingCookieProviders", "Advertising cookies: who serves them", "Providers of advertising cookies, with links to their privacy policies.", false),
      text("advertisingCookieControls", "Advertising cookies: how to control them", "Opt-out links or instructions for the advertising providers.", false),
      text("analyticsCookieProviders", "Analytics cookies: who serves them", "Providers of analytics cookies, with links to their privacy policies.", false),
      text("analyticsCookieControls", "Analytics cookies: how to control them", "Opt-out links or instructions for the analytics providers.", false),
      text("essentialCookieProviders", "Essential cookies: who serves them", "Providers of essential cookies (often the company itself).", false),
      text("essentialCookieControls", "Essential cookies: how to control them", "Control options for essential cookies, e.g. browser settings.", false),
      text("functionalityCookieProviders", "Functionality cookies: who serves them", "Providers of functionality or performance cookies.", false),
      text("functionalityCookieControls", "Functionality cookies: how to control them", "Opt-out links or instructions for the functionality providers.", false),
      text("socialCookieProviders", "Social cookies: who serves them", "Social media providers whose cookies are used.", false),
      text("socialCookieControls", "Social cookies: how to control them", "Opt-out links or instructions for the social providers.", false),
      text("sessionReplayProvider", "Session-replay provider", "Vendor of session-replay technology, e.g. FullStory.", false),
      text("contactEmail", "Contact email", "Email address for questions about the notice."),
      date("lastModifiedDate", "Last modified", "Date the notice was last modified."),
    ],
    replacements: [
      { find: "[CompanyName]", field: "companyName", count: 2 },
      { find: "[website]", field: "websiteUrl", count: 1 },
      { find: "[ADD]", field: "advertisingCookieProviders", paragraphs: [14], count: 1 },
      { find: "[ADD]", field: "advertisingCookieControls", paragraphs: [16], count: 1 },
      { find: "[ADD]", field: "analyticsCookieProviders", paragraphs: [20], count: 1 },
      { find: "[ADD]", field: "analyticsCookieControls", paragraphs: [22], count: 1 },
      { find: "[ADD]", field: "essentialCookieProviders", paragraphs: [26], count: 1 },
      { find: "[ADD]", field: "essentialCookieControls", paragraphs: [28], count: 1 },
      { find: "[ADD]", field: "functionalityCookieProviders", paragraphs: [32], count: 1 },
      { find: "[ADD]", field: "functionalityCookieControls", paragraphs: [34], count: 1 },
      { find: "[ADD]", field: "socialCookieProviders", paragraphs: [38], count: 1 },
      { find: "[ADD]", field: "socialCookieControls", paragraphs: [40], count: 1 },
      { find: "[FullStory]", field: "sessionReplayProvider", count: 1 },
      { find: "[EMAIL]", field: "contactEmail", count: 1 },
      { find: "[INSERT DATE]", field: "lastModifiedDate", count: 1 },
    ],
  },
  ...dpaSpecs(),
  {
    slug: "employee-offer-letter",
    source: { docx: "employee-offer-letter", mdDir: "employee-offer-letter", libraryUrl: `${LIBRARY}/employee-offer-letter` },
    title: "Employee Offer Letter (California Exempt)",
    purpose:
      "Offer letter for a full-time exempt employee in California covering role, compensation, benefits, at-will employment, confidentiality agreement condition, outside-information restrictions, work hours and JAMS arbitration.",
    whenToUse: ["Hiring a salaried exempt employee who will work in California.", "The company uses a separate Employee Confidential Information and Inventions Assignment Agreement (Exhibit A, not included)."],
    assumptions: [
      "California employment law applies; the vacation and working-hours language is specific to exempt employees.",
      "Employment is at will; the offer is conditioned on a reference check and work authorization.",
    ],
    reviewNotes: [
      "Exhibit A (the confidentiality and inventions assignment agreement) is referenced but not part of this template.",
      "The employee's signature and date lines are left blank for signing.",
    ],
    fields: [
      text("companyName", "Company name", "Legal name of the employer."),
      date("letterDate", "Letter date", "Date of the offer letter."),
      text("employeeName", "Employee full name", "Full name of the candidate."),
      text("employeeAddressLine1", "Employee address (line 1)", "Street address of the candidate."),
      text("employeeAddressLine2", "Employee address (line 2)", "City, state and ZIP of the candidate.", false),
      text("employeeFirstName", "Employee first name", "Used in the salutation."),
      text("position", "Position", "Job title, e.g. Senior Software Engineer."),
      text("duties", "Primary responsibilities", "Short description of the role's responsibilities."),
      text("manager", "Reports to", "Name or title of the manager the employee reports to."),
      text("workLocation", "Work location", "E.g. 'the Company's office at 123 Main Street' or 'your home office (remote)'."),
      text("workCity", "Work city", "City of the work location, followed by ', California'."),
      text("annualSalary", "Annual base salary (USD)", "Amount without currency sign, e.g. 150,000."),
      select("payFrequency", "Pay frequency", "How often salary is paid.", ["once per month", "semimonthly", "every two weeks"]),
      date("acceptanceDeadline", "Acceptance deadline", "Date by which the signed letter and Exhibit A must be returned."),
      date("startDate", "Anticipated start date", "Anticipated first day of employment."),
      text("signerName", "Signatory name", "Name of the company representative signing the letter."),
      text("signerTitle", "Signatory title", "Title of the company representative, e.g. CEO."),
      text("employeeEmail", "Employee email", "Email address of the candidate.", false),
    ],
    replacements: [
      { find: "[COMPANY NAME]", field: "companyName", paragraphs: [0], count: 1 },
      { find: "[Company Name]", field: "companyName", paragraphs: [10], count: 1 },
      { find: "[Date]", field: "letterDate", paragraphs: [2], count: 1 },
      { find: "[Employee Name]", field: "employeeName", count: 2 },
      { find: "[Address]", field: "employeeAddressLine1", paragraphs: [5], count: 1 },
      { find: "[Address]", field: "employeeAddressLine2", paragraphs: [6], count: 1 },
      { find: "[First Name]", field: "employeeFirstName", count: 1 },
      { find: "[position]", field: "position", count: 1 },
      { find: "[duties]", field: "duties", count: 1 },
      { find: "[manager]", field: "manager", count: 1 },
      { find: "[the Company’s office at [location]/your home office (remote)]", field: "workLocation", count: 1 },
      { find: "[city, California]", field: "workCity", count: 1 },
      { find: "[annual salary]", field: "annualSalary", count: 1 },
      { find: "[once per month / semimonthly / every two weeks]", field: "payFrequency", count: 1 },
      { find: "_________________", field: "acceptanceDeadline", paragraphs: [23], occurrence: 1, count: 1 },
      { find: "_________________", field: "startDate", paragraphs: [23], occurrence: 2, count: 1 },
      { find: "[Name]", field: "signerName", paragraphs: [31], count: 1 },
      { find: "[Title]", field: "signerTitle", paragraphs: [31], count: 1 },
      { find: "[Email]", field: "employeeEmail", paragraphs: [54], count: 1 },
    ],
  },
  {
    slug: "master-services-agreement",
    source: {
      docx: "master-services-agreement-msa",
      mdDir: "master-services-agreement",
      libraryUrl: `${LIBRARY}/master-services-agreement-msa`,
    },
    title: "Master Services Agreement (MSA)",
    purpose:
      "Technology-oriented master services agreement for a company providing software, platform or integration services to a customer, with an Order Form (Exhibit A) and customer supplemental terms (Exhibit B).",
    whenToUse: ["A software or services company needs a standard customer agreement plus an order form for subscriptions and fees."],
    assumptions: [
      "Drafted from the provider's perspective; governing law and arbitration venue default to Delaware.",
      "Order Form terms (payment term, initial and renewal term, billing method and frequency) are pre-filled with defaults in the text and are not fields.",
    ],
    reviewNotes: [
      "The optional 'Additional User Tiers' paragraph in the Order Form (with its own [User Number] and $ blanks) is left as found; complete or delete it.",
      "Pre-filled Order Form defaults ('Payment Term: Net 60', 'Initial Term: 12 months', 'Renewal Term: 12 months', 'Billing Method: Email', 'Billing Frequency: Monthly') are highlighted in the original and unchanged.",
      "'Address:' and 'Email Address:' labels on the Order Form have no value placeholder in the original and are left blank.",
      "Signature blocks (By, Name, Title, Date) are left blank for signing.",
    ],
    fields: [
      date("effectiveDate", "Effective date", "Date the agreement is made."),
      text("companyName", "Company name", "Legal name of the service provider ('Company')."),
      text("customerName", "Customer name", "Legal name of the customer."),
      text("governingLawState", "Governing law (state)", "U.S. state whose law governs, e.g. Delaware."),
      text("companyEmail", "Company email for disputes and notices", "Email address customers use for dispute notices and legal notices to the company."),
      text("arbitrationVenue", "Arbitration venue", "County and state where arbitration is conducted, e.g. 'New Castle County, Delaware'."),
      date("orderFormValidThrough", "Order Form valid through", "Date until which the Order Form offer is valid.", false),
      text("billingCustomerName", "Billing customer name", "Name of the customer entity to be invoiced.", false),
      text("billingContactName", "Billing contact name", "Person to receive invoices.", false),
      text("billingEmail", "Billing email address", "Email address to receive invoices.", false),
      text("fees", "Fees", "Fee amount and period for the Order Form, e.g. '10,000 per year'.", false),
      text("supplementalTermsReference", "Customer supplemental terms document", "Name of the rider or document holding customer-specific terms (Exhibit B), e.g. 'Rider to Form'.", false),
    ],
    replacements: [
      { find: "[__________]", field: "effectiveDate", paragraphs: [1], count: 1 },
      { find: "[Company]", field: "companyName", count: 3 },
      { find: "[Customer]", field: "customerName", count: 2 },
      { find: "[Delaware]", field: "governingLawState", count: 1 },
      { find: "[Company Email Address]", field: "companyEmail", count: 2 },
      { find: "[New Castle County, Delaware]", field: "arbitrationVenue", count: 1 },
      { find: "_______________", field: "customerName", paragraphs: [108], occurrence: 1, count: 1 },
      { find: "_______________", field: "orderFormValidThrough", paragraphs: [108], occurrence: 2, count: 1 },
      { find: "____________________", field: "billingCustomerName", paragraphs: [116], count: 1 },
      { find: "____________________", field: "billingContactName", paragraphs: [118], count: 1 },
      { find: "____________________", field: "billingEmail", paragraphs: [120], count: 1 },
      { find: "______________", field: "fees", paragraphs: [138], count: 1 },
      { find: "________________________________", field: "customerName", paragraphs: [145], count: 1 },
      { find: "_____________________________", field: "companyName", paragraphs: [145], occurrence: 2, count: 1 },
      { find: "[Rider to Form]", field: "supplementalTermsReference", count: 1 },
    ],
  },
  {
    slug: "mutual-nda",
    source: { docx: "mutual-non-disclosure-agreement-nda", mdDir: "mutual-nda", libraryUrl: `${LIBRARY}/mutual-non-disclosure-agreement-nda` },
    title: "Mutual Non-Disclosure Agreement",
    purpose:
      "Two-way confidentiality agreement between a company and another party exchanging confidential information while evaluating or pursuing a business relationship.",
    whenToUse: ["Both sides will disclose confidential information during discussions about a potential partnership, investment or transaction."],
    assumptions: [
      "Company is a Delaware corporation; Delaware law governs.",
      "Five-year term, seven-year survival of obligations; trade secrets survive as long as protected.",
      "The other signatory is identified on the signature page, not as a field.",
    ],
    reviewNotes: ["Signature blocks and the Other Signatory's details are left blank for signing."],
    fields: [
      text("companyName", "Company name", "Legal name of the company (a Delaware corporation in the text)."),
      date("effectiveDate", "Effective date", "Date the agreement takes effect."),
      text("companyEmail", "Company email for notices", "Email address for notices to the company.", false),
      text("companyAddressLine1", "Company address (line 1)", "Street address for notices to the company."),
      text("companyAddressLine2", "Company address (line 2)", "City, state and ZIP for notices to the company.", false),
    ],
    replacements: [
      { find: "[Company]", field: "companyName", count: 2 },
      { find: "__________, 2026__", field: "effectiveDate", paragraphs: [1], count: 1 },
      { find: "[_______]", field: "companyEmail", paragraphs: [62], count: 1 },
      { find: "[Address]", field: "companyAddressLine1", paragraphs: [69], count: 1 },
      { find: "[Address]", field: "companyAddressLine2", paragraphs: [72], count: 1 },
    ],
  },
  {
    slug: "one-way-nda",
    source: { docx: "one-way-non-disclosure-agreement-nda", mdDir: "one-way-nda", libraryUrl: `${LIBRARY}/one-way-non-disclosure-agreement-nda` },
    title: "One-Way Non-Disclosure Agreement",
    purpose:
      "One-way confidentiality agreement in which the company discloses confidential information to a recipient for a defined permitted use.",
    whenToUse: ["Only the company will share confidential information, e.g. with a prospective vendor, partner or investor."],
    assumptions: [
      "Delaware law governs; five-year term with trade secrets surviving longer.",
      "The recipient is identified on the signature page, not as a field; the effective date is the last signature date.",
    ],
    reviewNotes: ["Signature blocks and the Recipient's details are left blank for signing."],
    fields: [
      text("companyName", "Company name", "Legal name of the disclosing company."),
      text(
        "permittedUse",
        "Permitted use",
        "Purpose for which the recipient may use the information; the original suggests 'enable Recipient to evaluate or pursue a business relationship with the Company'.",
      ),
    ],
    replacements: [
      { find: "[___]", field: "companyName", paragraphs: [1], count: 1 },
      { find: "[Company Name]", field: "companyName", paragraphs: [23], count: 1 },
      { find: "[enable Recipient to evaluate or pursue a business relationship with the Company]", field: "permittedUse", count: 1 },
    ],
  },
  ...privacyPolicySpecs(),
  {
    slug: "terms-of-use",
    source: { docx: "terms-of-use", mdDir: "terms-of-use", libraryUrl: `${LIBRARY}/terms-of-use` },
    title: "Terms of Use",
    purpose:
      "Website terms of use covering access and accounts, use restrictions, intellectual property, feedback, privacy and cookies, indemnification, disclaimers, limitation of liability, termination, state-specific notices, accessibility, and binding arbitration with class-action waiver.",
    whenToUse: ["Publishing terms for a website or web application operated by a U.S. company."],
    assumptions: [
      "Drafted for a California company: the consumer-rights notice, notice addresses and default governing law reference California.",
      "Two alternative arbitration clauses (Option A: JAMS; Option B: another administrator) are included; one must be kept and the other deleted before publishing.",
    ],
    reviewNotes: [
      "The arbitration section contains both Option A and Option B with a bracketed drafting note; delete the option not used.",
      "The 'Other States' paragraph is a bracketed drafting note about additional state-specific provisions; review and delete before publishing.",
      "Notice addresses in the arbitration section are written as '<street address>, California <ZIP>'; the state is literal text.",
    ],
    fields: [
      date("lastRevisedDate", "Last revised", "Date of this version of the terms."),
      text("siteDomain", "Site domain", "Domain of the website, e.g. www.example.com."),
      text("companyName", "Company name", "Legal name of the company operating the site."),
      text("privacyPolicyUrl", "Privacy policy URL", "URL where the privacy policy is published."),
      text("cookiePolicyLink", "Cookie policy reference", "Name or URL of the policy describing tracking technologies, e.g. 'Cookie Notice at https://example.com/cookies'."),
      text("companyAddress", "Company postal address", "Full postal address shown in the California consumer-rights notice."),
      text("companyEmail", "Company contact email", "Email address for complaints, Nevada requests and general contact."),
      text("contactInformation", "Contact information", "How users can contact the company (email and/or postal address)."),
      text("governingLawState", "Governing law (state)", "U.S. state whose law governs and where courts sit, e.g. California."),
      text("venueCounty", "Venue county", "County of the courts with exclusive jurisdiction, e.g. 'San Francisco County'."),
      text("accessibilityContact", "Accessibility contact", "Email address or phone number for accessibility requests."),
      number("copyrightYear", "Copyright year", "Year shown in the copyright notice, e.g. 2026."),
      text("disputesEmail", "Dispute notice email", "Email address for informal dispute notices (Option A)."),
      text("companyStreetAddress", "Company street address (arbitration notices)", "Street and city of the notice address; the text appends ', California' and the ZIP."),
      text("companyZip", "Company ZIP code", "ZIP code of the notice address."),
      text("optOutEmail", "Arbitration opt-out email", "Email address (or postal address) to which arbitration opt-out notices are sent."),
    ],
    replacements: [
      { find: "_____________, 202[_]", field: "lastRevisedDate", paragraphs: [1], count: 1 },
      { find: "[DOMAIN NAME]", field: "siteDomain", count: 1 },
      { find: "[Company]", field: "companyName", count: 2 },
      { find: "[Company Name]", field: "companyName", count: 1 },
      { find: "[INSERT PRIVACY POLICY URL — hyperlink]", field: "privacyPolicyUrl", count: 2 },
      { find: "[Cookie Policy / Privacy Policy — hyperlink]", field: "cookiePolicyLink", count: 1 },
      { find: "[Address]", field: "companyAddress", paragraphs: [27], count: 1 },
      { find: "[Email]", field: "companyEmail", count: 1 },
      { find: "[CONTACT EMAIL]", field: "companyEmail", count: 1 },
      { find: "[Contact]", field: "contactInformation", count: 1 },
      { find: "[California]", field: "governingLawState", count: 3 },
      { find: "[County]", field: "venueCounty", count: 1 },
      { find: "[ACCESSIBILITY CONTACT EMAIL / PHONE]", field: "accessibilityContact", count: 1 },
      { find: "202[_]", field: "copyrightYear", paragraphs: [40], count: 1 },
      { find: "disputes@company.com", field: "disputesEmail", count: 1 },
      { find: "[address]", field: "companyStreetAddress", paragraphs: [44], count: 1 },
      { find: "[Address]", field: "companyStreetAddress", paragraphs: [52], count: 1 },
      { find: "[ZIP]", field: "companyZip", count: 2 },
      { find: "email@email.com", field: "optOutEmail", count: 1 },
      { find: "[Insert Email or Address]", field: "optOutEmail", count: 1 },
    ],
  },
];

function dpaSpecs(): TemplateSpec[] {
  const fields = (): Field[] => [
    text("providerName", "Provider name", "Legal name of the company acting as processor ('Provider')."),
    text("customerName", "Customer name", "Legal name of the customer (controller) for the signature block.", false),
    text("agreementTitle", "Underlying agreement", "Title of the agreement this DPA forms part of, e.g. 'Master Services Agreement'."),
    date("agreementEffectiveDate", "Agreement effective date", "Date of the underlying agreement."),
    text("subprocessorSiteUrl", "Subprocessor list URL", "URL of the page listing subprocessors; leave empty and delete the '/at [WEBSITE]' alternative if the Annex is used instead.", false),
    text("providerAddress", "Provider address", "Postal address of the provider (Annex 1)."),
    text("providerDpContactRole", "Provider data protection contact (role)", "Role or name of the provider's data protection contact, e.g. 'Data Protection Officer'."),
    text("providerDpContactEmail", "Provider data protection contact (email)", "Email address of the provider's data protection contact."),
    text("providerActivities", "Provider activities", "Brief description of the provider's business and services (Annex 1)."),
    text("customerAddress", "Customer address", "Postal address of the customer (Annex 1).", false),
    text("customerDpContactRole", "Customer data protection contact (role)", "Role or name of the customer's data protection contact.", false),
    text("customerDpContactEmail", "Customer data protection contact (email)", "Email address of the customer's data protection contact.", false),
    text("subprocessorList", "Approved subprocessors", "One entry per subprocessor: name, location(s), description of processing or services performed.", false),
  ];
  const replacements = (p: { providerAddress: number; providerContact: number; customerAddress: number; customerContact: number }): Replacement[] => [
    { find: "[CompanyName]", field: "providerName", count: 3 },
    { find: "[Customer Name]", field: "customerName", count: 1 },
    { find: "[CUSTOMER AGREEMENT]", field: "agreementTitle", count: 1 },
    { find: "[Effective Date of the Agreement]", field: "agreementEffectiveDate", count: 1 },
    { find: "[WEBSITE]", field: "subprocessorSiteUrl", count: 1 },
    { find: "[INSERT]", field: "providerAddress", paragraphs: [p.providerAddress], count: 1 },
    { find: "[Role]", field: "providerDpContactRole", paragraphs: [p.providerContact], count: 1 },
    { find: "[Email]", field: "providerDpContactEmail", paragraphs: [p.providerContact], count: 1 },
    { find: "[Brief Company description]", field: "providerActivities", count: 1 },
    { find: "[INSERT]", field: "customerAddress", paragraphs: [p.customerAddress], count: 1 },
    { find: "[Role]", field: "customerDpContactRole", paragraphs: [p.customerContact], count: 1 },
    { find: "[Email]", field: "customerDpContactEmail", paragraphs: [p.customerContact], count: 1 },
    { find: "[Name of Subprocessor | Location(s) | Description of Processing / Services Performed]", field: "subprocessorList", count: 1 },
  ];
  const reviewNotes = [
    "'Annex N of this DPA/at [WEBSITE]' and 'Subprocessor List (Annex 5) / Subprocessor Site' are alternatives in the original; delete the one not used.",
    "Signature blocks (By, Name, Title, Date) are left blank for signing.",
  ];
  return [
    {
      slug: "dpa-us",
      source: { docx: "data-processing-addendum-dpa", mdDir: "dpa-us", libraryUrl: `${LIBRARY}/data-processing-addendum-dpa` },
      title: "Data Processing Addendum (U.S.)",
      purpose:
        "Processor-friendly data processing addendum for U.S. personal data, with security measures and U.S. state privacy law commitments, forming part of an existing customer agreement.",
      whenToUse: ["A U.S. service provider processes customer personal data subject to U.S. state privacy laws and no EU/UK/Swiss data is in scope."],
      assumptions: ["Drafted from the provider's perspective; the provider is the processor or service provider and the customer is the controller or business."],
      reviewNotes,
      fields: fields(),
      replacements: replacements({ providerAddress: 74, providerContact: 75, customerAddress: 80, customerContact: 81 }),
    },
    {
      slug: "dpa-global",
      source: {
        docx: "data-processing-addendum-dpa-u-s-and-european-personal-data",
        mdDir: "dpa-global",
        libraryUrl: `${LIBRARY}/data-processing-addendum-dpa-u-s-and-european-personal-data`,
      },
      title: "Data Processing Addendum (Global)",
      purpose:
        "Processor-friendly data processing addendum covering U.S., EU/EEA, UK and Swiss personal data with GDPR-aligned obligations, transfer mechanisms and subprocessor terms, forming part of an existing customer agreement.",
      whenToUse: ["A service provider processes customer personal data from the U.S. and Europe (EU/EEA, UK, Switzerland) under one addendum."],
      assumptions: ["Drafted from the provider's perspective; incorporates the EU Standard Contractual Clauses and UK Addendum by reference."],
      reviewNotes,
      fields: fields(),
      replacements: replacements({ providerAddress: 86, providerContact: 87, customerAddress: 93, customerContact: 94 }),
    },
  ];
}

function privacyPolicySpecs(): TemplateSpec[] {
  const commonFields: Field[] = [
    date("lastUpdatedDate", "Last updated", "Date shown in the 'Last Updated' line."),
    date("effectiveDate", "Effective date", "Date the policy takes effect."),
    text("companyLegalName", "Company legal name", "Full legal name of the company."),
    text("companyName", "Company short name", "Short name used throughout the policy, e.g. the trading name."),
    text("businessDescription", "Description of business", "What the company provides, completing 'provides a ...', e.g. 'legal workspace platform'."),
    text("aiProviders", "AI and chat providers", "Chatbot and generative AI providers used on the service, e.g. 'Zendesk and OpenAI'.", false),
    text("companyEmail", "Contact email", "Email address in the 'How to contact us' section."),
    text("companyAddress", "Postal address", "Mailing address in the 'How to contact us' section."),
    text("companyPhone", "Phone number", "Phone number in the 'How to contact us' section.", false),
    text("identityVerificationProcess", "Identity verification process", "How the company verifies the identity of a person making a privacy request."),
    text("optOutLink", "Sale/sharing opt-out link", "URL of the page to opt out of sale or sharing of personal information.", false),
    text("privacyRequestEmail", "Privacy request email", "Email address for privacy rights requests (opt-out, access, Shine the Light, Nevada, European rights)."),
    text("privacyRequestPhone", "Privacy request phone", "Toll-free number for privacy rights requests.", false),
    text("privacyRequestWebformUrl", "Privacy request web form", "URL of the web form for privacy rights requests.", false),
  ];
  const commonReplacements: Replacement[] = [
    { find: "[DATE]", field: "lastUpdatedDate", paragraphs: [0], count: 1 },
    { find: "[DATE]", field: "effectiveDate", paragraphs: [5], count: 1 },
    { find: "[Full Company Name]", field: "companyLegalName", count: 1 },
    { find: "[DESCRIPTION OF BUSINESS]", field: "businessDescription", count: 1 },
    { find: "[INSERT Chatbot provider – e.g., Zendesk – and/or generative AI platform provider – e.g., OpenAI]", field: "aiProviders", count: 1 },
    { find: "[INSERT provider(s) referenced previously]", field: "aiProviders", count: 1 },
    { find: "[Company E-mail]", field: "companyEmail", count: 1 },
    { find: "[Company Address]", field: "companyAddress", count: 1 },
    { find: "[Phone Number]", field: "companyPhone", count: 1 },
    { find: "[INSERT DESCRIPTION OF BUSINESS’S AUTHENTICATION PROCESS]", field: "identityVerificationProcess", count: 1 },
    { find: "[LINK]", field: "optOutLink", count: 1 },
    { find: "[NUMBER]", field: "privacyRequestPhone", count: 1 },
    { find: "[1-XXX-XXX-XXXX]", field: "privacyRequestPhone", count: 1 },
    { find: "[link to webform]", field: "privacyRequestWebformUrl", count: 1 },
    { find: "[email for data requests]", field: "privacyRequestEmail", count: 1 },
  ];
  const commonReviewNotes = [
    "The CCPA category table (five rows of [INSERT] cells) is left for manual completion.",
    "Bracketed optional and alternative passages (AI/chat provider sentences, payment processors, training-data opt-out, sale/sharing and sensitive-information alternatives, Nevada and Texas paragraphs, '[INSERT ADDITIONAL RELEVANT OPT-OUT PREFERENCE SIGNAL DETAILS]', '[ADD]', '[INSERT DESCRIPTION]') are left as found; keep, complete or delete them.",
    "The page header reads 'Privileged & Confidential' and 'Draft' in the original and is unchanged; remove it before publishing.",
  ];
  return [
    {
      slug: "privacy-policy-us",
      source: { docx: "privacy-policy-u-s-only", mdDir: "privacy-policy-us", libraryUrl: `${LIBRARY}/privacy-policy-u-s-only` },
      title: "Privacy Policy (U.S. Only)",
      purpose:
        "Privacy policy for a U.S. company covering the personal information collected, tracking technologies, uses, sharing, user choices, security, children, changes, contact details and a state privacy rights notice (CCPA/CPRA and similar state laws).",
      whenToUse: ["A U.S.-based service collects personal information from users and does not need GDPR/UK GDPR disclosures."],
      assumptions: ["Obligations are driven by U.S. federal and state privacy laws only."],
      reviewNotes: commonReviewNotes,
      fields: commonFields,
      replacements: [
        ...commonReplacements,
        { find: "[CompanyName]", field: "companyName", count: 5 },
        { find: "[EMAIL]", field: "privacyRequestEmail", count: 3 },
      ],
    },
    {
      slug: "privacy-policy-gdpr",
      source: { docx: "privacy-policy-gdpr-enhanced", mdDir: "privacy-policy-gdpr", libraryUrl: `${LIBRARY}/privacy-policy-gdpr-enhanced` },
      title: "Privacy Policy (GDPR Enhanced)",
      purpose:
        "Multi-jurisdictional privacy policy covering U.S. state privacy laws and GDPR/UK GDPR, with a Notice to European Users (controller identity, representatives, legal bases table, retention, rights, complaints and international transfers).",
      whenToUse: ["A U.S.-based service collects personal information from users in the United States and in the EEA or United Kingdom."],
      assumptions: ["The company is U.S.-based and transfers European personal data to the U.S.; the Notice to European Users section is highlighted in the original as the GDPR add-on."],
      reviewNotes: [
        ...commonReviewNotes,
        "The Data Protection Officer paragraph is bracketed as optional in the original; delete it (and leave the DPO email empty) if no DPO is appointed.",
        "The UK ICO contact details and the EEA regulator link are fixed text in the original.",
      ],
      fields: [
        ...commonFields,
        text("euRepresentativeName", "EU representative", "Name of the representative appointed under the EU GDPR (Article 27).", false),
        text("euRepresentativeEmail", "EU representative email", "Email address of the EU representative.", false),
        text("euRepresentativeAddress", "EU representative postal address", "Postal address of the EU representative.", false),
        text("ukRepresentativeName", "UK representative", "Name of the representative appointed under the UK GDPR.", false),
        text("ukRepresentativeEmail", "UK representative email", "Email address of the UK representative.", false),
        text("ukRepresentativeAddress", "UK representative postal address", "Postal address of the UK representative.", false),
        text("dpoEmail", "Data Protection Officer email", "Email address of the DPO, if one is appointed.", false),
      ],
      replacements: [
        ...commonReplacements,
        { find: "[CompanyName]", field: "companyName", count: 6 },
        { find: "[EMAIL]", field: "privacyRequestEmail", count: 5 },
        { find: "[insert]", field: "euRepresentativeName", paragraphs: [221], count: 1 },
        { find: "[insert]", field: "euRepresentativeEmail", paragraphs: [222], count: 1 },
        { find: "[insert]", field: "euRepresentativeAddress", paragraphs: [223], count: 1 },
        { find: "[insert]", field: "ukRepresentativeName", paragraphs: [224], count: 1 },
        { find: "[insert]", field: "ukRepresentativeEmail", paragraphs: [225], count: 1 },
        { find: "[insert]", field: "ukRepresentativeAddress", paragraphs: [226], count: 1 },
        { find: "[insert]", field: "dpoEmail", paragraphs: [227], count: 1 },
      ],
    },
  ];
}

// ── Conversion ────────────────────────────────────────────

type Range = { start: number; end: number; value: string };

const findAll = (haystack: string, needle: string): number[] => {
  const hits: number[] = [];
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at < 0) {
      return hits;
    }
    hits.push(at);
    from = at + needle.length;
  }
};

const runText = (run: slimdom.Element): string =>
  [...run.getElementsByTagNameNS(W_NS, "t")].map((n) => n.textContent ?? "").join("");

const isHighlighted = (run: slimdom.Element): boolean => {
  const rPr = [...run.getElementsByTagNameNS(W_NS, "rPr")][0];
  if (!rPr) {
    return false;
  }
  const highlight = [...rPr.getElementsByTagNameNS(W_NS, "highlight")][0]?.getAttributeNS(W_NS, "val");
  const shd = [...rPr.getElementsByTagNameNS(W_NS, "shd")][0]?.getAttributeNS(W_NS, "fill");
  return (!!highlight && highlight !== "none") || (!!shd && shd !== "auto");
};

const removeHighlight = (run: slimdom.Element): void => {
  const rPr = [...run.getElementsByTagNameNS(W_NS, "rPr")][0];
  if (!rPr) {
    return;
  }
  for (const name of ["highlight", "shd"]) {
    for (const el of [...rPr.getElementsByTagNameNS(W_NS, name)]) {
      el.remove();
    }
  }
};

/** A paragraph whose every text run is highlighted is a block highlight (an
 *  optional or added section), not an over-long placeholder highlight. */
const isBlockHighlighted = (paragraph: slimdom.Element): boolean => {
  const runs = [...paragraph.getElementsByTagNameNS(W_NS, "r")].filter((r) => runText(r).trim() !== "");
  const text = runs.map(runText).join("");
  return text.length > 100 && runs.every(isHighlighted);
};

const MAX_REMNANT_LENGTH = 40;

/** Runs whose only children are `rPr` and empty `w:t` (left behind by the
 *  run split) carry nothing; drop them so a marker's neighbours are its real
 *  text neighbours. */
const removeEmptyRuns = (paragraph: slimdom.Element): void => {
  for (const run of [...paragraph.getElementsByTagNameNS(W_NS, "r")]) {
    const children = [...run.childNodes].filter((c): c is slimdom.Element => c.nodeType === 1);
    const carriesNothing = children.every(
      (c) => c.localName === "rPr" || (c.localName === "t" && (c.textContent ?? "") === ""),
    );
    if (carriesNothing) {
      run.remove();
    }
  }
};

const siblingRun = (run: slimdom.Element, direction: "previous" | "next"): slimdom.Element | null => {
  let node = direction === "previous" ? run.previousSibling : run.nextSibling;
  while (node) {
    if (node.nodeType === 1 && (node as slimdom.Element).localName === "r") {
      return node as slimdom.Element;
    }
    node = direction === "previous" ? node.previousSibling : node.nextSibling;
  }
  return null;
};

/**
 * Remove the source highlight from every inserted `{{marker}}` run. Source
 * highlights often overrun the placeholder ("Last Updated: [DATE]", "[annual
 * salary], subject to applicable"); the short remnants left on either side of a
 * marker are de-highlighted too, unless the whole paragraph is a block
 * highlight (an optional section), which is left as found.
 */
const stripHighlightAroundMarkers = (paragraph: slimdom.Element, blockHighlighted: boolean): void => {
  for (const run of [...paragraph.getElementsByTagNameNS(W_NS, "r")]) {
    if (!/^\{\{[^{}]+\}\}$/u.test(runText(run))) {
      continue;
    }
    removeHighlight(run);
    if (blockHighlighted) {
      continue;
    }
    for (const direction of ["previous", "next"] as const) {
      // Labels are often split across several runs ("Billing Email Address" + ": ");
      // walk outwards while the runs stay highlighted and short in total.
      let budget = MAX_REMNANT_LENGTH;
      let neighbour = siblingRun(run, direction);
      while (neighbour && isHighlighted(neighbour)) {
        budget -= runText(neighbour).length;
        if (budget < 0) {
          break;
        }
        removeHighlight(neighbour);
        neighbour = siblingRun(neighbour, direction);
      }
    }
  }
};

type PartResult = { xml: string; matches: Map<Replacement, number> };

const convertPart = (xml: string, spec: TemplateSpec, isMainDocument: boolean): PartResult => {
  const doc = slimdom.parseXmlDocument(xml);
  const paragraphs = [...doc.getElementsByTagNameNS(W_NS, "p")];
  const matches = new Map<Replacement, number>();
  const byParagraph = new Map<number, Range[]>();

  spec.replacements.forEach((replacement) => {
    matches.set(replacement, matches.get(replacement) ?? 0);
    if (replacement.paragraphs && !isMainDocument) {
      return;
    }
    const scope = replacement.paragraphs ?? paragraphs.map((_, i) => i);
    for (const index of scope) {
      const paragraph = paragraphs[index];
      if (!paragraph) {
        throw new Error(`${spec.slug}: paragraph ${index} does not exist`);
      }
      const spanText = richPatch.paragraphSpanText(paragraph);
      let hits = findAll(spanText, replacement.find);
      if (replacement.occurrence !== undefined) {
        const hit = hits[replacement.occurrence - 1];
        hits = hit === undefined ? [] : [hit];
      }
      for (const start of hits) {
        const ranges = byParagraph.get(index) ?? [];
        const range: Range = { start, end: start + replacement.find.length, value: `{{${replacement.field}}}` };
        const overlap = ranges.find((r) => r.start < range.end && range.start < r.end);
        if (overlap) {
          throw new Error(
            `${spec.slug}: overlapping replacements in paragraph ${index}: "${replacement.find}" vs "${overlap.value}"`,
          );
        }
        ranges.push(range);
        byParagraph.set(index, ranges);
        matches.set(replacement, (matches.get(replacement) ?? 0) + 1);
      }
    }
  });

  for (const [index, ranges] of byParagraph) {
    const paragraph = paragraphs[index]!;
    const blockHighlighted = isBlockHighlighted(paragraph);
    richPatch.replaceParagraphTextRanges(paragraph, ranges);
    removeEmptyRuns(paragraph);
    stripHighlightAroundMarkers(paragraph, blockHighlighted);
  }

  return { xml: slimdom.serializeToWellFormedString(doc), matches };
};

/** Highlighted or bracketed short tokens still present after conversion (for the report). */
const leftoverTokens = (xml: string): string[] => {
  const doc = slimdom.parseXmlDocument(xml);
  const tokens = new Set<string>();
  for (const paragraph of doc.getElementsByTagNameNS(W_NS, "p")) {
    const t = richPatch.paragraphSpanText(paragraph);
    for (const match of t.matchAll(/\[[^\]\n]{1,60}\]|_{3,}/gu)) {
      tokens.add(match[0]);
    }
  }
  return [...tokens].sort();
};

const recompress = async (docx: Buffer): Promise<Buffer> => {
  const zip = await JSZip.loadAsync(docx);
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } }));
};

const convertTemplate = async (spec: TemplateSpec): Promise<{ fieldCount: number; leftovers: string[] }> => {
  const sourcePath = join(GENERAL_LEGAL_SRC, "docx-originals", `${spec.source.docx}.docx`);
  const original = await readFile(sourcePath);
  const zip = await JSZip.loadAsync(original);

  const totals = new Map<Replacement, number>();
  const leftovers = new Set<string>();
  for (const path of ooxml.templateContentPartPaths(Object.keys(zip.files))) {
    const xml = await zip.file(path)!.async("string");
    const { xml: converted, matches } = convertPart(xml, spec, path === "word/document.xml");
    for (const [replacement, n] of matches) {
      totals.set(replacement, (totals.get(replacement) ?? 0) + n);
    }
    zip.file(path, converted);
    for (const token of leftoverTokens(converted)) {
      leftovers.add(token);
    }
  }

  const problems: string[] = [];
  for (const replacement of spec.replacements) {
    const n = totals.get(replacement) ?? 0;
    const expected = replacement.count;
    if (n === 0 || (expected !== undefined && n !== expected)) {
      problems.push(`"${replacement.find}" -> ${replacement.field}: matched ${n}, expected ${expected ?? ">=1"}`);
    }
  }
  const declared = new Set(spec.fields.map((f) => f.path));
  for (const replacement of spec.replacements) {
    if (!declared.has(replacement.field)) {
      problems.push(`replacement targets undeclared field ${replacement.field}`);
    }
  }
  const used = new Set(spec.replacements.map((r) => r.field));
  for (const field of spec.fields) {
    if (!used.has(field.path)) {
      problems.push(`field ${field.path} has no replacement`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`${spec.slug}:\n  ${problems.join("\n  ")}`);
  }

  const withMarkers = Buffer.from(await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  const manifest: TemplateManifest = { version: 1, fields: spec.fields };
  // writeManifest stores entries uncompressed; repack with DEFLATE for a small file.
  const docx = await recompress(await manifestLib.writeManifest(withMarkers, manifest));

  // Round-trip: discovery must see exactly the manifest fields, no structure errors.
  const discovered = await discoverLib.discoverTemplate(docx);
  const discoveredPaths = discovered.fields.map((f) => f.path).sort();
  const manifestPaths = spec.fields.map((f) => f.path).sort();
  if (JSON.stringify(discoveredPaths) !== JSON.stringify(manifestPaths)) {
    throw new Error(
      `${spec.slug}: discovery mismatch\n  discovered: ${discoveredPaths.join(", ")}\n  manifest:   ${manifestPaths.join(", ")}`,
    );
  }
  if (discovered.structureErrors.length > 0) {
    throw new Error(`${spec.slug}: structure errors: ${discovered.structureErrors.map((e) => e.message).join("; ")}`);
  }
  const readBack = await manifestLib.readManifest(docx);
  if (!readBack || readBack.fields.length !== spec.fields.length) {
    throw new Error(`${spec.slug}: manifest did not round-trip`);
  }

  const outDir = join(TEMPLATE_PACKS, "packs/general-legal/templates", spec.slug);
  mkdirSync(outDir, { recursive: true });
  await writeFile(join(outDir, "template.docx"), docx);
  await writeFile(join(outDir, "README.md"), renderReadme(spec));
  await writeFile(join(outDir, "template.md"), await renderTemplateMd(spec));

  return { fieldCount: spec.fields.length, leftovers: [...leftovers].sort() };
};

// ── Docs ──────────────────────────────────────────────────

const SOURCE_REPO = "https://github.com/General-Legal/legal-templates";

const inputTypeLabel = (field: Field): string => {
  if (field.inputType === "select" && field.options) {
    return `select (${field.options.join(" / ")})`;
  }
  return field.inputType ?? "text";
};

const renderReadme = (spec: TemplateSpec): string => {
  const lines: string[] = [];
  lines.push(`# ${spec.title}`, "");
  lines.push(spec.purpose, "");
  lines.push("## When to use", "");
  for (const item of spec.whenToUse) {
    lines.push(`- ${item}`);
  }
  lines.push("", "## Assumptions", "");
  for (const item of spec.assumptions) {
    lines.push(`- ${item}`);
  }
  lines.push("", "## Fields", "");
  lines.push("| Field | Label | Type | Required | Help |", "| --- | --- | --- | --- | --- |");
  for (const field of spec.fields) {
    lines.push(
      `| \`${field.path}\` | ${field.label} | ${inputTypeLabel(field)} | ${field.required ? "yes" : "no"} | ${field.hint ?? ""} |`,
    );
  }
  lines.push("", "## Review notes", "");
  for (const item of spec.reviewNotes) {
    lines.push(`- ${item}`);
  }
  lines.push(
    "",
    "## Source and license",
    "",
    `Drafted by the attorneys at [General Legal](https://general.legal) and published in [General-Legal/legal-templates](${SOURCE_REPO}) (original: \`docx-originals/${spec.source.docx}.docx\`, library page: ${spec.source.libraryUrl}) under [CC0 1.0](${SOURCE_REPO}/blob/main/LICENSE). Attribution is appreciated, not required.`,
    "",
    "Converted for Stella by replacing the source placeholders (highlighted text and bracketed tokens) with `{{field}}` merge fields and adding a field manifest; the legal text is otherwise unchanged. `template.md` is the source's markdown rendering for reading; `template.docx` is the fillable document.",
    "",
    "This template is not legal advice. Have a qualified attorney review any document before use.",
    "",
    "## Changelog",
    "",
    "- 1.0.0: initial conversion from the source as of 2026-05-14.",
    "",
  );
  return lines.join("\n");
};

const renderTemplateMd = async (spec: TemplateSpec): Promise<string> => {
  const source = await readFile(join(GENERAL_LEGAL_SRC, "templates", spec.source.mdDir, "template.md"), "utf8");
  const header = [
    "<!--",
    `  Source: ${SOURCE_REPO}/blob/main/templates/${spec.source.mdDir}/template.md`,
    "  Author: General Legal (https://general.legal), CC0 1.0.",
    "  Readable rendering of the template; <mark> marks the source's fill-in spots.",
    "  The fillable version with {{field}} merge fields is template.docx.",
    "-->",
    "",
  ];
  return header.join("\n") + source;
};

// ── Main ──────────────────────────────────────────────────

const only = process.argv.slice(2);
const selected = only.length > 0 ? SPECS.filter((s) => only.includes(s.slug)) : SPECS;
const rows: string[] = [];
let failed = false;
for (const spec of selected) {
  try {
    const { fieldCount, leftovers } = await convertTemplate(spec);
    rows.push(`${spec.slug.padEnd(30)} ${String(fieldCount).padStart(3)} fields  leftovers: ${leftovers.join(" ")}`);
  } catch (error) {
    failed = true;
    rows.push(`${spec.slug.padEnd(30)} FAILED\n${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(rows.join("\n"));
if (failed) {
  process.exit(1);
}
