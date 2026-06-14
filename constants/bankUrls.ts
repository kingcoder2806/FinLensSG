export const BANK_URLS = {
  dbs: {
    savings: "https://www.dbs.com.sg/personal/deposits/savings-accounts/multiplier",
    fixedDeposit: "https://www.dbs.com.sg/personal/rates/deposit-rates/fixed-deposits.page",
    funds: "https://www.dbs.com.sg/personal/investments/funds-and-etfs",
    homeLoan: "https://www.dbs.com.sg/personal/loans/home-loans/home-loan-rates",
    creditCard: "https://www.dbs.com.sg/personal/cards/credit-cards",
  },
  ocbc: {
    savings: "https://www.ocbc.com/personal-banking/deposits/360-account",
    fixedDeposit: "https://www.ocbc.com/personal-banking/deposits/fixed-deposit-account.page",
    funds: "https://www.ocbc.com/personal-banking/investments/unit-trusts",
    homeLoan: "https://www.ocbc.com/personal-banking/loans/home-loans",
    creditCard: "https://www.ocbc.com/personal-banking/cards/credit-cards",
  },
  uob: {
    savings: "https://www.uob.com.sg/personal/save/everyday-accounts/one-account.page",
    fixedDeposit: "https://www.uob.com.sg/personal/save/fixed-deposits/singapore-dollar-fixed-deposit.page",
    funds: "https://www.uob.com.sg/personal/invest/unit-trusts/index.page",
    homeLoan: "https://www.uob.com.sg/personal/borrow/property-loans/private-home-loan.page",
    creditCard: "https://www.uob.com.sg/personal/cards/index.page",
  },
  sc: {
    savings: "https://www.sc.com/sg/save/current-accounts/bonussaver/",
    fixedDeposit: "https://www.sc.com/sg/save/time-deposits/sgd-time-deposit/",
    funds: "https://www.sc.com/sg/wealth/investment/unit-trusts/",
    homeLoan: "https://www.sc.com/sg/borrow/mortgages/",
    creditCard: "https://www.sc.com/sg/credit-cards/",
  },
  citi: {
    savings: "https://www.citibank.com.sg/personal-banking/deposits/savings-account",
    fixedDeposit: "https://www.citibank.com.sg/personal-banking/deposits/fixed-deposit-account",
    funds: "https://www.citibank.com.sg/investments/investment-products/investment-funds/",
    homeLoan: "https://www1.citibank.com.sg/loans/mortgage",
    creditCard: "https://www.citibank.com.sg/credit-cards",
  },
  hsbc: {
    savings: "https://www.hsbc.com.sg/accounts/products/everyday-global/",
    fixedDeposit: "https://www.hsbc.com.sg/accounts/products/time-deposit/",
    funds: "https://www.hsbc.com.sg/wealth/investments/products/unit-trusts/",
    homeLoan: "https://www.hsbc.com.sg/loans/products/home/",
    creditCard: "https://www.hsbc.com.sg/credit-cards/",
  },
  maybank: {
    savings: "https://www.maybank2u.com.sg/en/personal/accounts/savings/SaveUp-Account.page",
    fixedDeposit: "https://www.maybank2u.com.sg/en/personal/accounts/time-deposit/singapore-dollar-time-deposit.page",
    funds: "https://www.maybank2u.com.sg/en/personal/investment/unit-trusts/index.page",
    homeLoan: "https://www.maybank2u.com.sg/en/personal/loans/property-loans/home-loan-private-property.page",
    creditCard: "https://www.maybank2u.com.sg/en/personal/cards/index.page",
  },
} as const;

export type BankUrlKey = keyof typeof BANK_URLS;
export type ProductUrlKey = keyof (typeof BANK_URLS)[BankUrlKey];
