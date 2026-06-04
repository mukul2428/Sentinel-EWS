const borrowers = [
  {
    id: "B001",
    name: "Arjun Sharma",
    email: "arjun.sharma@email.com",
    phone: "+91-9876543210",
    assignedAnalyst: "analyst1",
    loan: {
      id: "L001",
      amount: 500000,
      emiAmount: 12500,
      interestRate: 12.5,
      tenure: 48,
      disbursedDate: "2023-06-01",
      nextDueDate: "2024-06-15",
      outstandingBalance: 420000,
      loanType: "Personal"
    },
    repaymentHistory: [
      { month: "2024-05", status: "PAID", daysDelayed: 0, amount: 12500 },
      { month: "2024-04", status: "PAID", daysDelayed: 3, amount: 12500 },
      { month: "2024-03", status: "PAID", daysDelayed: 8, amount: 12500 },
      { month: "2024-02", status: "PARTIAL", daysDelayed: 12, amount: 8000 },
      { month: "2024-01", status: "MISSED", daysDelayed: 30, amount: 0 },
      { month: "2023-12", status: "PAID", daysDelayed: 2, amount: 12500 }
    ],
    accountSignals: {
      failedAutoDebits: 3,
      creditUtilization: 82,
      avgMonthlyInflow: 35000,
      lastMonthInflow: 22000,
      inflowDropPercent: 37,
      activeLoans: 2,
      currentDPD: 0,
      maxDPDLast90Days: 30
    },
    transactions: [
      { date: "2024-05-28", type: "DEBIT", amount: 8000, description: "Online Transfer" },
      { date: "2024-05-22", type: "CREDIT", amount: 22000, description: "Salary" },
      { date: "2024-05-15", type: "FAILED", amount: 12500, description: "EMI Auto-debit Failed" },
      { date: "2024-05-10", type: "DEBIT", amount: 15000, description: "Credit Card Payment" },
      { date: "2024-04-22", type: "CREDIT", amount: 35000, description: "Salary" }
    ]
  },
  {
    id: "B002",
    name: "Priya Mehta",
    email: "priya.mehta@email.com",
    phone: "+91-9123456789",
    assignedAnalyst: "analyst1",
    loan: {
      id: "L002",
      amount: 200000,
      emiAmount: 6200,
      interestRate: 14,
      tenure: 36,
      disbursedDate: "2023-09-01",
      nextDueDate: "2024-06-20",
      outstandingBalance: 158000,
      loanType: "Business"
    },
    repaymentHistory: [
      { month: "2024-05", status: "PAID", daysDelayed: 0, amount: 6200 },
      { month: "2024-04", status: "PAID", daysDelayed: 0, amount: 6200 },
      { month: "2024-03", status: "PAID", daysDelayed: 1, amount: 6200 },
      { month: "2024-02", status: "PAID", daysDelayed: 0, amount: 6200 },
      { month: "2024-01", status: "PAID", daysDelayed: 0, amount: 6200 },
      { month: "2023-12", status: "PAID", daysDelayed: 0, amount: 6200 }
    ],
    accountSignals: {
      failedAutoDebits: 0,
      creditUtilization: 28,
      avgMonthlyInflow: 85000,
      lastMonthInflow: 91000,
      inflowDropPercent: -7,
      activeLoans: 1,
      currentDPD: 0,
      maxDPDLast90Days: 1
    },
    transactions: [
      { date: "2024-05-20", type: "CREDIT", amount: 91000, description: "Business Revenue" },
      { date: "2024-05-15", type: "DEBIT", amount: 6200, description: "EMI Payment" },
      { date: "2024-05-10", type: "DEBIT", amount: 25000, description: "Supplier Payment" },
      { date: "2024-04-20", type: "CREDIT", amount: 85000, description: "Business Revenue" }
    ]
  },
  {
    id: "B003",
    name: "Rahul Verma",
    email: "rahul.verma@email.com",
    phone: "+91-9988776655",
    assignedAnalyst: "analyst2",
    loan: {
      id: "L003",
      amount: 750000,
      emiAmount: 18000,
      interestRate: 11,
      tenure: 60,
      disbursedDate: "2022-12-01",
      nextDueDate: "2024-06-10",
      outstandingBalance: 612000,
      loanType: "Home"
    },
    repaymentHistory: [
      { month: "2024-05", status: "MISSED", daysDelayed: 35, amount: 0 },
      { month: "2024-04", status: "PARTIAL", daysDelayed: 18, amount: 10000 },
      { month: "2024-03", status: "PARTIAL", daysDelayed: 22, amount: 9500 },
      { month: "2024-02", status: "PAID", daysDelayed: 7, amount: 18000 },
      { month: "2024-01", status: "PAID", daysDelayed: 5, amount: 18000 },
      { month: "2023-12", status: "PAID", daysDelayed: 0, amount: 18000 }
    ],
    accountSignals: {
      failedAutoDebits: 5,
      creditUtilization: 91,
      avgMonthlyInflow: 55000,
      lastMonthInflow: 28000,
      inflowDropPercent: 49,
      activeLoans: 3,
      currentDPD: 35,
      maxDPDLast90Days: 35
    },
    transactions: [
      { date: "2024-05-05", type: "FAILED", amount: 18000, description: "EMI Auto-debit Failed" },
      { date: "2024-05-02", type: "FAILED", amount: 18000, description: "EMI Auto-debit Failed" },
      { date: "2024-04-28", type: "CREDIT", amount: 28000, description: "Freelance Payment" },
      { date: "2024-04-15", type: "FAILED", amount: 18000, description: "EMI Auto-debit Failed" },
      { date: "2024-03-22", type: "CREDIT", amount: 55000, description: "Salary" }
    ]
  },
  {
    id: "B004",
    name: "Sunita Reddy",
    email: "sunita.reddy@email.com",
    phone: "+91-9345678901",
    assignedAnalyst: "analyst2",
    loan: {
      id: "L004",
      amount: 300000,
      emiAmount: 8500,
      interestRate: 13.5,
      tenure: 48,
      disbursedDate: "2023-03-01",
      nextDueDate: "2024-06-18",
      outstandingBalance: 245000,
      loanType: "Personal"
    },
    repaymentHistory: [
      { month: "2024-05", status: "PAID", daysDelayed: 2, amount: 8500 },
      { month: "2024-04", status: "PAID", daysDelayed: 5, amount: 8500 },
      { month: "2024-03", status: "PARTIAL", daysDelayed: 0, amount: 5000 },
      { month: "2024-02", status: "PAID", daysDelayed: 8, amount: 8500 },
      { month: "2024-01", status: "PAID", daysDelayed: 3, amount: 8500 },
      { month: "2023-12", status: "PAID", daysDelayed: 0, amount: 8500 }
    ],
    accountSignals: {
      failedAutoDebits: 1,
      creditUtilization: 62,
      avgMonthlyInflow: 42000,
      lastMonthInflow: 38000,
      inflowDropPercent: 10,
      activeLoans: 2,
      currentDPD: 0,
      maxDPDLast90Days: 8
    },
    transactions: [
      { date: "2024-05-22", type: "CREDIT", amount: 38000, description: "Salary" },
      { date: "2024-05-18", type: "DEBIT", amount: 8500, description: "EMI Payment" },
      { date: "2024-05-10", type: "DEBIT", amount: 12000, description: "Insurance Premium" },
      { date: "2024-04-22", type: "CREDIT", amount: 42000, description: "Salary" }
    ]
  },
  {
    id: "B005",
    name: "Deepak Nair",
    email: "deepak.nair@email.com",
    phone: "+91-9567891234",
    assignedAnalyst: "analyst1",
    loan: {
      id: "L005",
      amount: 1000000,
      emiAmount: 22000,
      interestRate: 10.5,
      tenure: 60,
      disbursedDate: "2022-08-01",
      nextDueDate: "2024-06-08",
      outstandingBalance: 820000,
      loanType: "Business"
    },
    repaymentHistory: [
      { month: "2024-05", status: "MISSED", daysDelayed: 42, amount: 0 },
      { month: "2024-04", status: "MISSED", daysDelayed: 38, amount: 0 },
      { month: "2024-03", status: "PARTIAL", daysDelayed: 20, amount: 12000 },
      { month: "2024-02", status: "PARTIAL", daysDelayed: 15, amount: 15000 },
      { month: "2024-01", status: "PAID", daysDelayed: 9, amount: 22000 },
      { month: "2023-12", status: "PAID", daysDelayed: 6, amount: 22000 }
    ],
    accountSignals: {
      failedAutoDebits: 7,
      creditUtilization: 96,
      avgMonthlyInflow: 90000,
      lastMonthInflow: 18000,
      inflowDropPercent: 80,
      activeLoans: 4,
      currentDPD: 42,
      maxDPDLast90Days: 42
    },
    transactions: [
      { date: "2024-05-20", type: "CREDIT", amount: 18000, description: "Partial Business Revenue" },
      { date: "2024-05-15", type: "FAILED", amount: 22000, description: "EMI Auto-debit Failed" },
      { date: "2024-05-08", type: "FAILED", amount: 22000, description: "EMI Auto-debit Failed" },
      { date: "2024-05-01", type: "FAILED", amount: 22000, description: "EMI Auto-debit Failed" },
      { date: "2024-04-22", type: "CREDIT", amount: 25000, description: "Business Revenue" }
    ]
  },
  {
    id: "B006",
    name: "Meera Pillai",
    email: "meera.pillai@email.com",
    phone: "+91-9123987654",
    assignedAnalyst: "analyst2",
    loan: {
      id: "L006",
      amount: 150000,
      emiAmount: 4500,
      interestRate: 15,
      tenure: 36,
      disbursedDate: "2024-01-01",
      nextDueDate: "2024-06-25",
      outstandingBalance: 128000,
      loanType: "Personal"
    },
    repaymentHistory: [
      { month: "2024-05", status: "PAID", daysDelayed: 0, amount: 4500 },
      { month: "2024-04", status: "PAID", daysDelayed: 0, amount: 4500 },
      { month: "2024-03", status: "PAID", daysDelayed: 0, amount: 4500 },
      { month: "2024-02", status: "PAID", daysDelayed: 0, amount: 4500 }
    ],
    accountSignals: {
      failedAutoDebits: 0,
      creditUtilization: 15,
      avgMonthlyInflow: 62000,
      lastMonthInflow: 65000,
      inflowDropPercent: -5,
      activeLoans: 1,
      currentDPD: 0,
      maxDPDLast90Days: 0
    },
    transactions: [
      { date: "2024-05-01", type: "CREDIT", amount: 65000, description: "Salary" },
      { date: "2024-05-05", type: "DEBIT", amount: 4500, description: "EMI Payment" },
      { date: "2024-04-01", type: "CREDIT", amount: 62000, description: "Salary" }
    ]
  },
  {
    id: "B007",
    name: "Vikram Singh",
    email: "vikram.singh@email.com",
    phone: "+91-9876001234",
    assignedAnalyst: "analyst1",
    loan: {
      id: "L007",
      amount: 400000,
      emiAmount: 10000,
      interestRate: 12,
      tenure: 48,
      disbursedDate: "2023-02-01",
      nextDueDate: "2024-06-12",
      outstandingBalance: 318000,
      loanType: "Vehicle"
    },
    repaymentHistory: [
      { month: "2024-05", status: "PAID", daysDelayed: 4, amount: 10000 },
      { month: "2024-04", status: "PARTIAL", daysDelayed: 10, amount: 7000 },
      { month: "2024-03", status: "PAID", daysDelayed: 6, amount: 10000 },
      { month: "2024-02", status: "PAID", daysDelayed: 0, amount: 10000 },
      { month: "2024-01", status: "PAID", daysDelayed: 0, amount: 10000 },
      { month: "2023-12", status: "PAID", daysDelayed: 2, amount: 10000 }
    ],
    accountSignals: {
      failedAutoDebits: 2,
      creditUtilization: 58,
      avgMonthlyInflow: 48000,
      lastMonthInflow: 43000,
      inflowDropPercent: 10,
      activeLoans: 2,
      currentDPD: 0,
      maxDPDLast90Days: 10
    },
    transactions: [
      { date: "2024-05-20", type: "CREDIT", amount: 43000, description: "Salary" },
      { date: "2024-05-12", type: "DEBIT", amount: 10000, description: "EMI Payment" },
      { date: "2024-04-20", type: "CREDIT", amount: 48000, description: "Salary" },
      { date: "2024-04-12", type: "FAILED", amount: 10000, description: "EMI Auto-debit Failed" }
    ]
  },
  {
    id: "B008",
    name: "Ananya Krishnan",
    email: "ananya.k@email.com",
    phone: "+91-9456789012",
    assignedAnalyst: "analyst2",
    loan: {
      id: "L008",
      amount: 600000,
      emiAmount: 15000,
      interestRate: 11.5,
      tenure: 48,
      disbursedDate: "2022-05-01",
      nextDueDate: "2024-06-22",
      outstandingBalance: 395000,
      loanType: "Home"
    },
    repaymentHistory: [
      { month: "2024-05", status: "PAID", daysDelayed: 0, amount: 15000 },
      { month: "2024-04", status: "PAID", daysDelayed: 0, amount: 15000 },
      { month: "2024-03", status: "PAID", daysDelayed: 0, amount: 15000 },
      { month: "2024-02", status: "PAID", daysDelayed: 0, amount: 15000 },
      { month: "2024-01", status: "PAID", daysDelayed: 1, amount: 15000 },
      { month: "2023-12", status: "PAID", daysDelayed: 0, amount: 15000 }
    ],
    accountSignals: {
      failedAutoDebits: 0,
      creditUtilization: 22,
      avgMonthlyInflow: 95000,
      lastMonthInflow: 98000,
      inflowDropPercent: -3,
      activeLoans: 1,
      currentDPD: 0,
      maxDPDLast90Days: 1
    },
    transactions: [
      { date: "2024-05-01", type: "CREDIT", amount: 98000, description: "Salary" },
      { date: "2024-05-05", type: "DEBIT", amount: 15000, description: "EMI Payment" },
      { date: "2024-04-01", type: "CREDIT", amount: 95000, description: "Salary" }
    ]
  },
  {
    id: "B009",
    name: "Karthik Bose",
    email: "karthik.bose@email.com",
    phone: "+91-9234567890",
    assignedAnalyst: "analyst1",
    loan: {
      id: "L009",
      amount: 250000,
      emiAmount: 7200,
      interestRate: 13,
      tenure: 40,
      disbursedDate: "2023-07-01",
      nextDueDate: "2024-06-14",
      outstandingBalance: 198000,
      loanType: "Personal"
    },
    repaymentHistory: [
      { month: "2024-05", status: "PARTIAL", daysDelayed: 14, amount: 4000 },
      { month: "2024-04", status: "PARTIAL", daysDelayed: 11, amount: 5500 },
      { month: "2024-03", status: "PAID", daysDelayed: 7, amount: 7200 },
      { month: "2024-02", status: "PAID", daysDelayed: 3, amount: 7200 },
      { month: "2024-01", status: "PAID", daysDelayed: 0, amount: 7200 },
      { month: "2023-12", status: "PAID", daysDelayed: 0, amount: 7200 }
    ],
    accountSignals: {
      failedAutoDebits: 2,
      creditUtilization: 74,
      avgMonthlyInflow: 38000,
      lastMonthInflow: 30000,
      inflowDropPercent: 21,
      activeLoans: 2,
      currentDPD: 14,
      maxDPDLast90Days: 14
    },
    transactions: [
      { date: "2024-05-22", type: "CREDIT", amount: 30000, description: "Salary" },
      { date: "2024-05-14", type: "FAILED", amount: 7200, description: "EMI Auto-debit Failed" },
      { date: "2024-05-10", type: "DEBIT", amount: 12000, description: "Loan Repayment - Other" },
      { date: "2024-04-22", type: "CREDIT", amount: 38000, description: "Salary" }
    ]
  },
  {
    id: "B010",
    name: "Pooja Joshi",
    email: "pooja.joshi@email.com",
    phone: "+91-9890123456",
    assignedAnalyst: "analyst2",
    loan: {
      id: "L010",
      amount: 180000,
      emiAmount: 5400,
      interestRate: 14.5,
      tenure: 36,
      disbursedDate: "2023-11-01",
      nextDueDate: "2024-06-30",
      outstandingBalance: 158000,
      loanType: "Education"
    },
    repaymentHistory: [
      { month: "2024-05", status: "PAID", daysDelayed: 0, amount: 5400 },
      { month: "2024-04", status: "PAID", daysDelayed: 0, amount: 5400 },
      { month: "2024-03", status: "PAID", daysDelayed: 2, amount: 5400 },
      { month: "2024-02", status: "PAID", daysDelayed: 0, amount: 5400 },
      { month: "2024-01", status: "PAID", daysDelayed: 0, amount: 5400 }
    ],
    accountSignals: {
      failedAutoDebits: 0,
      creditUtilization: 31,
      avgMonthlyInflow: 52000,
      lastMonthInflow: 52000,
      inflowDropPercent: 0,
      activeLoans: 1,
      currentDPD: 0,
      maxDPDLast90Days: 2
    },
    transactions: [
      { date: "2024-05-01", type: "CREDIT", amount: 52000, description: "Salary" },
      { date: "2024-05-05", type: "DEBIT", amount: 5400, description: "EMI Payment" },
      { date: "2024-04-01", type: "CREDIT", amount: 52000, description: "Salary" }
    ]
  }
];

module.exports = borrowers;
