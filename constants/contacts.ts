import type { BankSlug } from './banks';

export type ContactSpecialization =
  | 'savings'
  | 'fixed-deposit'
  | 'home-loan'
  | 'credit-card'
  | 'investments'
  | 'general';

export interface BankContact {
  id: string;
  bank: BankSlug;
  name: string;
  role: string;
  specializations: ContactSpecialization[];
  email: string;
  phone: string;
  bio: string;
  yearsExp: number;
  languages: string[];
}

export const BANK_CONTACTS: BankContact[] = [
  // ── DBS / POSB ─────────────────────────────────────────────────────────────
  {
    id: 'dbs-rachel-lim',
    bank: 'dbs',
    name: 'Rachel Lim',
    role: 'Senior Relationship Manager',
    specializations: ['savings', 'credit-card', 'general'],
    email: 'rachel.lim@dbs.com',
    phone: '+65 6327 2265',
    bio: 'Rachel has been with DBS for over 8 years, helping customers optimise their savings strategy and choose the right credit solutions. She specialises in the DBS Multiplier account and DBS card portfolio.',
    yearsExp: 8,
    languages: ['English', 'Mandarin'],
  },
  {
    id: 'dbs-david-tan',
    bank: 'dbs',
    name: 'David Tan',
    role: 'Home Loan Specialist',
    specializations: ['home-loan'],
    email: 'david.tan@dbs.com',
    phone: '+65 6327 8899',
    bio: 'David is a certified mortgage advisor with 11 years of experience structuring DBS home loan packages. He covers both HDB and private property financing, including the DBS Green Home Loan.',
    yearsExp: 11,
    languages: ['English', 'Mandarin', 'Cantonese'],
  },
  {
    id: 'dbs-priya-sharma',
    bank: 'dbs',
    name: 'Priya Sharma',
    role: 'Wealth Planning Associate',
    specializations: ['fixed-deposit', 'investments', 'general'],
    email: 'priya.sharma@dbs.com',
    phone: '+65 6327 5566',
    bio: 'Priya advises high-net-worth individuals on fixed deposit laddering, structured deposits, and DBS digiPortfolio. She holds the CACS certification and has worked in wealth management for 6 years.',
    yearsExp: 6,
    languages: ['English', 'Hindi', 'Tamil'],
  },

  // ── OCBC ───────────────────────────────────────────────────────────────────
  {
    id: 'ocbc-jason-wong',
    bank: 'ocbc',
    name: 'Jason Wong',
    role: 'Deposits & Savings Manager',
    specializations: ['savings', 'fixed-deposit', 'general'],
    email: 'jason.wong@ocbc.com',
    phone: '+65 6363 3333',
    bio: "Jason leads OCBC's retail deposits advisory team. He is the go-to contact for OCBC 360 account bonus tier optimisation and fixed deposit placements, particularly for fresh funds and rollover strategies.",
    yearsExp: 9,
    languages: ['English', 'Mandarin'],
  },
  {
    id: 'ocbc-mei-ling-chen',
    bank: 'ocbc',
    name: 'Mei Ling Chen',
    role: 'Property Finance Advisor',
    specializations: ['home-loan'],
    email: 'meiling.chen@ocbc.com',
    phone: '+65 6363 7788',
    bio: 'Mei Ling specialises in OCBC home loan packages for both HDB and private properties. With 10 years in property finance, she can structure SORA-linked and fixed-rate packages to minimise your total interest cost.',
    yearsExp: 10,
    languages: ['English', 'Mandarin', 'Hokkien'],
  },
  {
    id: 'ocbc-arjun-nair',
    bank: 'ocbc',
    name: 'Arjun Nair',
    role: 'Premier Banking Advisor',
    specializations: ['investments', 'general', 'credit-card'],
    email: 'arjun.nair@ocbc.com',
    phone: '+65 6363 9900',
    bio: 'Arjun manages Premier Banking relationships at OCBC, covering RoboInvest portfolios, Blue Chip Investment Plans, and OCBC Premier credit card benefits. He has 7 years in private and premier banking.',
    yearsExp: 7,
    languages: ['English', 'Tamil', 'Malay'],
  },

  // ── UOB ────────────────────────────────────────────────────────────────────
  {
    id: 'uob-sarah-ng',
    bank: 'uob',
    name: 'Sarah Ng',
    role: 'Deposits Specialist',
    specializations: ['fixed-deposit', 'savings'],
    email: 'sarah.ng@uob.com.sg',
    phone: '+65 6222 2121',
    bio: "Sarah is UOB's lead deposits specialist, with deep expertise in UOB One Account bonus tier structures and fixed deposit promotional rates. She helps customers time their placements to maximise returns.",
    yearsExp: 7,
    languages: ['English', 'Mandarin'],
  },
  {
    id: 'uob-michael-lee',
    bank: 'uob',
    name: 'Michael Lee',
    role: 'Senior Mortgage Manager',
    specializations: ['home-loan'],
    email: 'michael.lee@uob.com.sg',
    phone: '+65 6222 5566',
    bio: 'Michael has originated over S$400m in UOB home loans over his 12-year career. He specialises in complex cases — multi-property portfolios, foreign buyers, and high TDSR situations.',
    yearsExp: 12,
    languages: ['English', 'Mandarin', 'Bahasa Indonesia'],
  },
  {
    id: 'uob-farah-rahman',
    bank: 'uob',
    name: 'Farah Binte Rahman',
    role: 'Credit Solutions Manager',
    specializations: ['credit-card', 'general'],
    email: 'farah.rahman@uob.com.sg',
    phone: '+65 6222 3399',
    bio: 'Farah leads the consumer credit advisory team at UOB, specialising in the UOB One Card ecosystem and helping customers optimise cashback and rebates across Grab, Shopee, and everyday spend.',
    yearsExp: 5,
    languages: ['English', 'Malay', 'Mandarin'],
  },

  // ── Standard Chartered ─────────────────────────────────────────────────────
  {
    id: 'sc-nicholas-raj',
    bank: 'standard-chartered',
    name: 'Nicholas Raj',
    role: 'Priority Banking Manager',
    specializations: ['general', 'savings', 'fixed-deposit'],
    email: 'nicholas.raj@sc.com',
    phone: '+65 6747 7000',
    bio: 'Nicholas manages Priority Banking relationships at StanChart, with expertise in Bonus$aver account structuring and multi-currency deposit strategies. He has 9 years in international banking.',
    yearsExp: 9,
    languages: ['English', 'Tamil', 'Hindi'],
  },
  {
    id: 'sc-amanda-yeo',
    bank: 'standard-chartered',
    name: 'Amanda Yeo',
    role: 'Mortgage Specialist',
    specializations: ['home-loan'],
    email: 'amanda.yeo@sc.com',
    phone: '+65 6747 7700',
    bio: "Amanda focuses exclusively on StanChart's SORA-linked home loan packages. She is known for her transparent rate breakdowns and clear explanations of spread adjustments over the loan tenure.",
    yearsExp: 6,
    languages: ['English', 'Mandarin'],
  },
  {
    id: 'sc-kenneth-ong',
    bank: 'standard-chartered',
    name: 'Kenneth Ong',
    role: 'Investment & FD Advisor',
    specializations: ['investments', 'fixed-deposit', 'credit-card'],
    email: 'kenneth.ong@sc.com',
    phone: '+65 6747 8800',
    bio: 'Kenneth advises clients on SC Invest Portfolios, fixed income products, and the SC Journey card benefits programme. He holds the CFP certification and has 8 years in wealth advisory.',
    yearsExp: 8,
    languages: ['English', 'Mandarin', 'Cantonese'],
  },

  // ── Citibank ───────────────────────────────────────────────────────────────
  {
    id: 'citi-joanne-teo',
    bank: 'citibank',
    name: 'Joanne Teo',
    role: 'Citigold Relationship Manager',
    specializations: ['general', 'savings', 'investments'],
    email: 'joanne.teo@citi.com',
    phone: '+65 6225 5225',
    bio: 'Joanne manages Citigold and Citi Priority clients, advising on the Citi MaxiGain account and multi-asset investment strategies. She has 10 years in private and premier banking across Singapore and Hong Kong.',
    yearsExp: 10,
    languages: ['English', 'Mandarin', 'Cantonese'],
  },
  {
    id: 'citi-benjamin-koh',
    bank: 'citibank',
    name: 'Benjamin Koh',
    role: 'Home Loan Specialist',
    specializations: ['home-loan'],
    email: 'benjamin.koh@citi.com',
    phone: '+65 6225 8899',
    bio: "Benjamin structures Citi's SORA-linked and fixed-rate home loan packages. He specialises in high-value property financing (≥S$1M) and Citigold client mortgage concessions.",
    yearsExp: 7,
    languages: ['English', 'Mandarin'],
  },
  {
    id: 'citi-vivian-chan',
    bank: 'citibank',
    name: 'Vivian Chan',
    role: 'Card Benefits Specialist',
    specializations: ['credit-card', 'general'],
    email: 'vivian.chan@citi.com',
    phone: '+65 6225 6677',
    bio: "Vivian is the expert on Citi's ThankYou Rewards programme, Citi Rewards card earn rates, and the Citi Prestige lounge access ecosystem. She helps clients maximise their miles and points across the Citi portfolio.",
    yearsExp: 4,
    languages: ['English', 'Mandarin', 'Cantonese'],
  },

  // ── HSBC ───────────────────────────────────────────────────────────────────
  {
    id: 'hsbc-christopher-lim',
    bank: 'hsbc',
    name: 'Christopher Lim',
    role: 'Premier Relationship Manager',
    specializations: ['general', 'savings', 'investments'],
    email: 'christopher.lim@hsbc.com.sg',
    phone: '+65 6216 9008',
    bio: "Christopher manages HSBC Premier relationships, advising on the Everyday Global Account, Premier Wealth portfolios, and HSBC's global banking privileges. He has 13 years across HSBC Singapore and Hong Kong.",
    yearsExp: 13,
    languages: ['English', 'Mandarin', 'Cantonese'],
  },
  {
    id: 'hsbc-grace-tan',
    bank: 'hsbc',
    name: 'Grace Tan',
    role: 'Wealth Solutions Manager',
    specializations: ['fixed-deposit', 'investments'],
    email: 'grace.tan@hsbc.com.sg',
    phone: '+65 6216 8899',
    bio: "Grace advises HSBC clients on structured deposits, fixed income, and unit trust portfolios. She specialises in helping clients transition from HSBC's evolving Everyday+ programme to higher-yield alternatives.",
    yearsExp: 8,
    languages: ['English', 'Mandarin'],
  },
  {
    id: 'hsbc-daniel-huang',
    bank: 'hsbc',
    name: 'Daniel Huang',
    role: 'Property Finance Manager',
    specializations: ['home-loan'],
    email: 'daniel.huang@hsbc.com.sg',
    phone: '+65 6216 7700',
    bio: "Daniel specialises in HSBC Premier SmartMortgage packages, including the deposit-offset feature that can significantly reduce effective interest rates for high-balance Premier clients.",
    yearsExp: 9,
    languages: ['English', 'Mandarin', 'Teochew'],
  },

  // ── Maybank ────────────────────────────────────────────────────────────────
  {
    id: 'maybank-nurul-ain',
    bank: 'maybank',
    name: 'Nurul Ain Binte Ismail',
    role: 'Relationship Executive',
    specializations: ['savings', 'general', 'credit-card'],
    email: 'nurul.ain@maybank2u.com.sg',
    phone: '+65 6533 5229',
    bio: "Nurul Ain helps retail customers get the most from Maybank's SaveUp account bonus structure and Family & Friends card cashback programme. She is fluent in both English and Malay, serving Singapore's Malay community.",
    yearsExp: 4,
    languages: ['English', 'Malay'],
  },
  {
    id: 'maybank-aaron-chong',
    bank: 'maybank',
    name: 'Aaron Chong',
    role: 'Fixed Deposit & Savings Specialist',
    specializations: ['fixed-deposit', 'savings'],
    email: 'aaron.chong@maybank2u.com.sg',
    phone: '+65 6533 6688',
    bio: "Aaron is Maybank's top deposits specialist in Singapore, with deep knowledge of their consistently competitive 6M and 12M fixed deposit promotional rates. He advises on minimum placement thresholds and rollover options.",
    yearsExp: 6,
    languages: ['English', 'Mandarin', 'Malay'],
  },
  {
    id: 'maybank-patricia-goh',
    bank: 'maybank',
    name: 'Patricia Goh',
    role: 'Senior Financial Advisor',
    specializations: ['investments', 'savings', 'general'],
    email: 'patricia.goh@maybank2u.com.sg',
    phone: '+65 6533 7799',
    bio: "Patricia advises on Maybank Goal-Based Investments and Etiqa insurance-savings products, which also qualify for SaveUp account bonus tiers. She holds the IBF Level 2 certification.",
    yearsExp: 11,
    languages: ['English', 'Mandarin', 'Cantonese'],
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
