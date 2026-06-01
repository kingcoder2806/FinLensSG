export const BANK_URLS = {
  dbs: {
    savings: "https://www.dbs.com.sg/personal/deposits/savings-accounts/multiplier",
    fixedDeposit: "https://www.dbs.com.sg/personal/deposits/fixed-deposits/sgd-fixed-deposit",
    funds: "https://www.dbs.com.sg/personal/investments/funds-and-etfs",
    homeLoan: "https://www.dbs.com.sg/personal/loans/home-loans/home-loan-rates",
    creditCard: "https://www.dbs.com.sg/personal/cards/credit-cards",
  },
  ocbc: {
    savings: "https://www.ocbc.com/personal-banking/deposits/360-account",
    fixedDeposit: "https://www.ocbc.com/personal-banking/deposits/fixed-deposit",
    funds: "https://www.ocbc.com/personal-banking/investments/unit-trusts",
    homeLoan: "https://www.ocbc.com/personal-banking/loans/home-loans",
    creditCard: "https://www.ocbc.com/personal-banking/cards/credit-cards",
  },
  uob: {
    savings: "https://www.uob.com.sg/personal/save/deposits/one-account.page",
    fixedDeposit: "https://www.uob.com.sg/personal/save/deposits/fixed-deposit.page",
    funds: "https://www.uob.com.sg/personal/invest/funds/unit-trusts.page",
    homeLoan: "https://www.uob.com.sg/personal/borrow/property-loans/home-loan.page",
    creditCard: "https://www.uob.com.sg/personal/cards/credit-cards.page",
  },
  sc: {
    savings: "https://www.sc.com/sg/save/accounts/bonussaver/",
    fixedDeposit: "https://www.sc.com/sg/save/deposits/sgd-time-deposit/",
    funds: "https://www.sc.com/sg/invest/funds/",
    homeLoan: "https://www.sc.com/sg/borrow/mortgages/",
    creditCard: "https://www.sc.com/sg/credit-cards/",
  },
  citi: {
    savings: "https://www.citibank.com.sg/en/personal-banking/deposits/",
    fixedDeposit: "https://www.citibank.com.sg/en/personal-banking/deposits/fixed-deposits/",
    funds: "https://www.citibank.com.sg/en/personal-banking/investments/",
    homeLoan: "https://www.citibank.com.sg/en/personal-banking/loans/home-loans/",
    creditCard: "https://www.citibank.com.sg/en/personal-banking/credit-cards/",
  },
  hsbc: {
    savings: "https://www.hsbc.com.sg/savings/products/everyday-global/",
    fixedDeposit: "https://www.hsbc.com.sg/savings/products/time-deposit/",
    funds: "https://www.hsbc.com.sg/investments/products/funds/",
    homeLoan: "https://www.hsbc.com.sg/mortgages/products/",
    creditCard: "https://www.hsbc.com.sg/credit-cards/products/",
  },
  maybank: {
    savings: "https://www.maybank2u.com.sg/en/personal/deposits/saveup-programme.page",
    fixedDeposit: "https://www.maybank2u.com.sg/en/personal/deposits/fixed-deposit.page",
    funds: "https://www.maybank2u.com.sg/en/personal/investments/unit-trusts.page",
    homeLoan: "https://www.maybank2u.com.sg/en/personal/loans/home-loans.page",
    creditCard: "https://www.maybank2u.com.sg/en/personal/cards/credit-cards.page",
  },
} as const;

export type BankUrlKey = keyof typeof BANK_URLS;
export type ProductUrlKey = keyof (typeof BANK_URLS)[BankUrlKey];
