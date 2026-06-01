export type BankSlug =
  | 'dbs'
  | 'ocbc'
  | 'uob'
  | 'standard-chartered'
  | 'citibank'
  | 'hsbc'
  | 'maybank';

export interface BankInfo {
  slug: BankSlug;
  name: string;
  shortName: string;
  phone: string;
  email?: string;
  website: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  logo: string; // emoji fallback
  description: string;
  established: number;
  headquarters: string;
}

export const BANKS: BankInfo[] = [
  {
    slug: 'dbs',
    name: 'DBS / POSB',
    shortName: 'DBS',
    phone: '1800 111 1111',
    email: 'customerservice@dbs.com',
    website: 'https://www.dbs.com.sg',
    color: '#E30613',
    bgClass: 'bg-red-600/10',
    textClass: 'text-red-400',
    borderClass: 'border-red-600/30',
    logo: '🏦',
    description:
      "Singapore's largest bank, headquartered at Marina Bay Financial Centre. Offers full retail, SME, and institutional banking.",
    established: 1968,
    headquarters: 'Marina Bay Financial Centre, Singapore',
  },
  {
    slug: 'ocbc',
    name: 'OCBC Bank',
    shortName: 'OCBC',
    phone: '1800 363 3333',
    email: 'customerservice@ocbc.com',
    website: 'https://www.ocbc.com',
    color: '#E30613',
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/30',
    logo: '🏛️',
    description:
      "OCBC Bank is Southeast Asia's second largest financial services group. Known for high savings rates and wealth management.",
    established: 1932,
    headquarters: 'OCBC Centre, Singapore',
  },
  {
    slug: 'uob',
    name: 'UOB',
    shortName: 'UOB',
    phone: '1800 222 2121',
    email: 'customerservice@uob.com.sg',
    website: 'https://www.uob.com.sg',
    color: '#005CAA',
    bgClass: 'bg-blue-600/10',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-600/30',
    logo: '🏢',
    description:
      'United Overseas Bank, one of the leading banks in Asia with a strong regional presence across 19 countries.',
    established: 1935,
    headquarters: 'UOB Plaza, Singapore',
  },
  {
    slug: 'standard-chartered',
    name: 'Standard Chartered',
    shortName: 'StanChart',
    phone: '1800 242 5000',
    website: 'https://www.sg.standardchartered.com',
    color: '#0CA24A',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    logo: '🌐',
    description:
      'International bank with 160+ year history. Strong in trade finance, wealth management, and priority banking in Singapore.',
    established: 1859,
    headquarters: '8 Marina Boulevard, Singapore',
  },
  {
    slug: 'citibank',
    name: 'Citibank',
    shortName: 'Citi',
    phone: '6225 5225',
    website: 'https://www.citibank.com.sg',
    color: '#003B95',
    bgClass: 'bg-indigo-600/10',
    textClass: 'text-indigo-400',
    borderClass: 'border-indigo-600/30',
    logo: '🌍',
    description:
      "Citibank Singapore is the country's largest foreign bank with over 50 years of operations. Known for credit cards and wealth management.",
    established: 1902,
    headquarters: '8 Marina View, Singapore',
  },
  {
    slug: 'hsbc',
    name: 'HSBC',
    shortName: 'HSBC',
    phone: '1800 227 8889',
    website: 'https://www.hsbc.com.sg',
    color: '#DB0011',
    bgClass: 'bg-rose-600/10',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-600/30',
    logo: '🔺',
    description:
      "HSBC Singapore is one of the world's largest banking and financial services organisations, offering premium banking services.",
    established: 1877,
    headquarters: '21 Collyer Quay, Singapore',
  },
  {
    slug: 'maybank',
    name: 'Maybank',
    shortName: 'Maybank',
    phone: '1800 629 2265',
    website: 'https://www.maybank2u.com.sg',
    color: '#FFCC00',
    bgClass: 'bg-yellow-500/10',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30',
    logo: '🌟',
    description:
      "Malaysia's largest bank with a significant presence in Singapore. Known for competitive fixed deposit rates and Islamic banking.",
    established: 1960,
    headquarters: '2 Battery Road, Singapore',
  },
];

export const BANK_MAP = Object.fromEntries(
  BANKS.map((b) => [b.slug, b])
) as Record<BankSlug, BankInfo>;

export const BANK_SLUGS = BANKS.map((b) => b.slug);
