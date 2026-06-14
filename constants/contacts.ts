import type { BankSlug } from './banks';

export type ContactSpecialization =
  | 'savings'
  | 'fixed-deposit'
  | 'home-loan'
  | 'credit-card'
  | 'investments'
  | 'general';

/**
 * Real, officially-published contact channels for each bank's retail / wealth desks.
 *
 * Banks do not publish named individual relationship managers with direct lines, so
 * these are the genuine points of contact a customer would actually use: customer-service
 * hotlines, priority/wealth banking desks, and mortgage lines — plus the official
 * "contact us / request a callback" page where a dedicated specialist follows up.
 *
 * Sources: each bank's official Contact Us pages (verified Jun 2026). Hotlines and
 * promotions change; the `url` is the canonical page to confirm before relying on a number.
 */
export interface BankContact {
  id: string;
  bank: BankSlug;
  /** Desk / channel name, e.g. "DBS Treasures Priority Banking". */
  name: string;
  /** Short descriptor of the desk. */
  role: string;
  specializations: ContactSpecialization[];
  /** Primary local hotline (or null when the desk is callback/web only). */
  phone: string | null;
  /** Number to dial from overseas, when published. */
  phoneOverseas?: string;
  /** Official email, when the bank publishes one for this desk. */
  email?: string;
  /** Operating hours, when published. */
  hours?: string;
  /** Official contact / request-a-callback page. */
  url: string;
  /** What this desk handles. */
  description: string;
}

export const BANK_CONTACTS: BankContact[] = [
  // ── DBS / POSB ─────────────────────────────────────────────────────────────
  {
    id: 'dbs-customer-service',
    bank: 'dbs',
    name: 'DBS Customer Service',
    role: 'General banking hotline',
    specializations: ['general', 'savings', 'credit-card'],
    phone: '1800 111 1111',
    phoneOverseas: '+65 6327 2265',
    email: 'customerservice@dbs.com',
    hours: '24 hours daily',
    url: 'https://www.dbs.com.sg/personal/contact-us.page',
    description:
      'Round-the-clock line for DBS/POSB accounts, the DBS Multiplier savings account, cards and PayLah!, and general enquiries.',
  },
  {
    id: 'dbs-treasures',
    bank: 'dbs',
    name: 'DBS Treasures',
    role: 'Priority & wealth banking',
    specializations: ['investments', 'fixed-deposit', 'general'],
    phone: '1800 221 1111',
    phoneOverseas: '+65 6221 1111',
    hours: 'Mon–Fri 9am–9pm, Sat 9am–1pm',
    url: 'https://www.dbs.com.sg/treasures/contact-me.page',
    description:
      'Wealth desk for fixed deposit placements, structured deposits and DBS digiPortfolio. Request a relationship manager callback via the form.',
  },
  {
    id: 'dbs-home-loan',
    bank: 'dbs',
    name: 'DBS Home Loan Specialists',
    role: 'Mortgage advisory (callback)',
    specializations: ['home-loan'],
    phone: null,
    url: 'https://www.dbs.com.sg/Contact/dbs/homeloans/contact-me/default.page',
    description:
      'Submit the home-loan enquiry form and a DBS mortgage specialist calls you back to structure HDB, private or Green Home Loan packages.',
  },

  // ── OCBC ───────────────────────────────────────────────────────────────────
  {
    id: 'ocbc-customer-service',
    bank: 'ocbc',
    name: 'OCBC Personal Banking',
    role: '24-hour customer service',
    specializations: ['general', 'savings', 'fixed-deposit'],
    phone: '1800 363 3333',
    phoneOverseas: '+65 6363 3333',
    email: 'contactus@ocbc.com',
    hours: '24 hours daily',
    url: 'https://www.ocbc.com/personal-banking/contact-us',
    description:
      'Main line for the OCBC 360 account, fixed deposits, cards and general banking. Bonus-tier and placement enquiries handled here.',
  },
  {
    id: 'ocbc-premier',
    bank: 'ocbc',
    name: 'OCBC Premier Banking',
    role: 'Premier & wealth banking',
    specializations: ['investments', 'general'],
    phone: '1800 773 6437',
    phoneOverseas: '+65 6530 5930',
    hours: 'Mon–Fri 9am–6pm',
    url: 'https://www.ocbc.com/personal-banking/premier-banking/services.page',
    description:
      'Dedicated Premier desk (1800 PREMIER) for RoboInvest, Blue Chip Investment Plan, unit trusts and wealth advisory.',
  },
  {
    id: 'ocbc-home-loan',
    bank: 'ocbc',
    name: 'OCBC Home Loan Specialists',
    role: 'Mortgage advisory',
    specializations: ['home-loan'],
    phone: '6319 9756',
    hours: 'Mon–Fri 9am–6pm',
    url: 'https://www.ocbc.com/personal-banking/loans/home-loans',
    description:
      'Speak to a home-loan specialist about SORA-linked and fixed-rate packages for HDB and private property, plus refinancing.',
  },

  // ── UOB ────────────────────────────────────────────────────────────────────
  {
    id: 'uob-customer-service',
    bank: 'uob',
    name: 'UOB Customer Service',
    role: 'General banking hotline',
    specializations: ['general', 'savings', 'credit-card'],
    phone: '1800 222 2121',
    phoneOverseas: '+65 6222 2121',
    email: 'Customer.Service@UOBgroup.com',
    hours: '24 hours daily',
    url: 'https://www.uobgroup.com/uobgroup/contact-us/index.page',
    description:
      'Main line for the UOB One account, fixed deposits, UOB cards and CashPlus, and general enquiries.',
  },
  {
    id: 'uob-privilege',
    bank: 'uob',
    name: 'UOB Privilege Banking',
    role: 'Priority & wealth banking',
    specializations: ['investments', 'fixed-deposit', 'general'],
    phone: '1800 222 9889',
    phoneOverseas: '+65 6222 9889',
    hours: 'Mon–Fri 9am–6pm',
    url: 'https://www.uob.com.sg/privilegebanking/index.page',
    description:
      'Priority banking desk for wealth-on-TMRW portfolios, United SGD Fund, unit trusts and deposit strategies.',
  },
  {
    id: 'uob-home-loan',
    bank: 'uob',
    name: 'UOB Property Loan Specialists',
    role: 'Mortgage advisory',
    specializations: ['home-loan'],
    phone: '1800 388 2121',
    email: 'mortgagesales@uobgroup.com',
    hours: 'Mon–Fri 9am–6pm',
    url: 'https://www.uob.com.sg/personal/borrow/property-loans/private-home-loan.page',
    description:
      'Senior property specialists for HDB and private home loans, refinancing and complex/multi-property cases.',
  },

  // ── Standard Chartered ─────────────────────────────────────────────────────
  {
    id: 'sc-phone-banking',
    bank: 'standard-chartered',
    name: 'Standard Chartered Phone Banking',
    role: '24-hour client care',
    specializations: ['general', 'savings', 'fixed-deposit'],
    phone: '1800 747 7000',
    phoneOverseas: '+65 6747 7000',
    email: 'SG.ServiceRequest@sc.com',
    hours: '24 hours daily',
    url: 'https://www.sc.com/sg/help/contact-us/',
    description:
      'Main line for the Bonus$aver account, SGD time deposits, cards and general banking. SG.ServiceRequest@sc.com handles email service instructions; chat agents 8am–8pm daily.',
  },
  {
    id: 'sc-priority',
    bank: 'standard-chartered',
    name: 'Standard Chartered Priority Banking',
    role: 'Priority & wealth banking',
    specializations: ['investments', 'general', 'fixed-deposit'],
    phone: '1800 846 8000',
    phoneOverseas: '+65 6846 8000',
    hours: 'Priority Contact Centre 24/7',
    url: 'https://www.sc.com/sg/priority/',
    description:
      'Priority Banking desk for SC Invest portfolios, unit trusts, fixed income and multi-currency deposit strategies.',
  },
  {
    id: 'sc-home-loan',
    bank: 'standard-chartered',
    name: 'Standard Chartered Mortgage',
    role: 'Mortgage advisory (callback)',
    specializations: ['home-loan'],
    phone: '1800 747 7000',
    phoneOverseas: '+65 6747 7000',
    url: 'https://www.sc.com/sg/borrow/mortgages/',
    description:
      'Enquire about SORA-linked home loan packages and refinancing; request a mortgage specialist callback via the contact page.',
  },

  // ── Citibank ───────────────────────────────────────────────────────────────
  {
    id: 'citi-citiphone',
    bank: 'citibank',
    name: 'CitiPhone',
    role: 'General banking hotline',
    specializations: ['general', 'credit-card', 'savings'],
    phone: '6225 5225',
    hours: 'Mon–Fri 8am–8pm',
    url: 'https://www.citibank.com.sg/static/contact',
    description:
      'Main CitiPhone line for Citi accounts, deposits, Citi credit cards and ThankYou Rewards, and general enquiries.',
  },
  {
    id: 'citi-citigold',
    bank: 'citibank',
    name: 'Citigold',
    role: 'Priority & wealth banking',
    specializations: ['investments', 'general', 'fixed-deposit'],
    phone: '6323 3200',
    phoneOverseas: '+65 6323 3200',
    hours: '24 hours daily',
    url: 'https://www.citibank.com.sg/wealth-management/citigold/contact-us/',
    description:
      'Citigold wealth desk (24/7) for time deposits, investment funds, foreign exchange and multi-asset advisory. Citigold Private Client: +65 6732 2288.',
  },
  {
    id: 'citi-mortgage',
    bank: 'citibank',
    name: 'Citi Mortgage Client Care',
    role: 'Mortgage advisory',
    specializations: ['home-loan'],
    phone: '6238 8838',
    hours: 'Mon–Fri 9am–5pm',
    url: 'https://www1.citibank.com.sg/loans/mortgage/request-callback',
    description:
      'Mortgage Client Care line for SORA-linked and fixed-rate home loans, including Citigold preferential pricing. Request a callback online.',
  },

  // ── HSBC ───────────────────────────────────────────────────────────────────
  {
    id: 'hsbc-customer-service',
    bank: 'hsbc',
    name: 'HSBC Customer Service',
    role: 'General banking hotline',
    specializations: ['general', 'savings', 'credit-card'],
    phone: '1800 472 2669',
    phoneOverseas: '+65 6472 2669',
    hours: '24 hours daily',
    url: 'https://www.hsbc.com.sg/contact/',
    description:
      'Main line (1800-HSBC NOW) for the Everyday Global Account, SGD time deposits, HSBC cards and general enquiries.',
  },
  {
    id: 'hsbc-premier',
    bank: 'hsbc',
    name: 'HSBC Premier',
    role: 'Premier & wealth banking',
    specializations: ['investments', 'general', 'fixed-deposit'],
    phone: '1800 227 8889',
    phoneOverseas: '+65 6216 9080',
    hours: '24 hours daily',
    url: 'https://www.hsbc.com.sg/premier/existing-customers/',
    description:
      'Premier desk for unit trusts, bonds, structured products and wealth advisory. Call +65 6227 8889 for your relationship manager’s contact.',
  },
  {
    id: 'hsbc-home-loan',
    bank: 'hsbc',
    name: 'HSBC Home Loan Specialists',
    role: 'Mortgage advisory (callback)',
    specializations: ['home-loan'],
    phone: null,
    url: 'https://www.hsbc.com.sg/loans/products/home/',
    description:
      'Request a callback for SORA-linked and Premier SmartMortgage packages, including the deposit-offset feature for Premier clients.',
  },

  // ── Maybank ────────────────────────────────────────────────────────────────
  {
    id: 'maybank-customer-service',
    bank: 'maybank',
    name: 'Maybank Customer Service',
    role: 'General banking hotline',
    specializations: ['general', 'savings', 'credit-card'],
    phone: '1800 629 2265',
    phoneOverseas: '+65 6533 5229',
    hours: 'Full service 8am–8pm; emergencies 24/7',
    url: 'https://www.maybank2u.com.sg/en/personal/about_us/Contact-Us.page',
    description:
      'Main line (1800-MAYBANK) for the SaveUp account, fixed/time deposits, Maybank cards and general enquiries.',
  },
  {
    id: 'maybank-privilege',
    bank: 'maybank',
    name: 'Maybank Privilege',
    role: 'Priority & wealth banking',
    specializations: ['investments', 'fixed-deposit', 'general'],
    phone: '1800 536 9888',
    phoneOverseas: '+65 6536 9888',
    email: 'SG.privilege@maybank.com',
    hours: 'Mon–Fri 9am–6pm',
    url: 'https://www.maybank2u.com.sg/en/wealth/privilege/contact.html',
    description:
      'Priority banking desk for goal-based investments, unit trusts, Etiqa insurance-savings and time-deposit strategies.',
  },
  {
    id: 'maybank-home-loan',
    bank: 'maybank',
    name: 'Maybank Home Loan',
    role: 'Mortgage advisory',
    specializations: ['home-loan'],
    phone: '1800 629 2265',
    phoneOverseas: '+65 6533 5229',
    url: 'https://www.maybank2u.com.sg/en/personal/loans/property-loans/index.page',
    description:
      'Enquire about HDB and private property home loans (SRFR/FDMR packages), fixed-rate options and refinancing.',
  },
];

export const SPECIALIZATION_LABELS: Record<ContactSpecialization, string> = {
  'savings': 'Savings',
  'fixed-deposit': 'Fixed Deposits',
  'home-loan': 'Home Loans',
  'credit-card': 'Credit Cards',
  'investments': 'Investments',
  'general': 'General Banking',
};

export const SPECIALIZATION_COLORS: Record<ContactSpecialization, { bg: string; text: string; border: string }> = {
  'savings':       { bg: 'oklch(0.78 0.095 158 / 0.12)', text: 'var(--up)',   border: 'oklch(0.78 0.095 158 / 0.30)' },
  'fixed-deposit': { bg: 'var(--gold-soft)',               text: 'var(--gold)', border: 'var(--gold-line)' },
  'home-loan':     { bg: 'oklch(0.76 0.075 235 / 0.12)', text: 'var(--info)', border: 'oklch(0.76 0.075 235 / 0.30)' },
  'credit-card':   { bg: 'oklch(0.72 0.105 35 / 0.12)',  text: 'var(--down)', border: 'oklch(0.72 0.105 35 / 0.30)' },
  'investments':   { bg: 'color-mix(in oklab, oklch(0.72 0.09 300) 12%, transparent)', text: 'oklch(0.72 0.09 300)', border: 'color-mix(in oklab, oklch(0.72 0.09 300) 28%, transparent)' },
  'general':       { bg: 'var(--surface-2)',              text: 'var(--ink-3)', border: 'var(--line)' },
};
