-- VocalLearn Seed Data: Finance Basics
-- Run this AFTER the schema migration to populate initial lesson content

-- ============================================
-- Subject: Finance Basics
-- ============================================
INSERT INTO subjects (id, name, description, icon, is_community)
VALUES (
  '91b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Finance Basics',
  'Core personal finance concepts: compound interest, budgeting, investing, and money management fundamentals.',
  '💰',
  false
);

-- ============================================
-- Lesson 1: Compound Interest & Savings
-- ============================================
INSERT INTO lessons (id, subject_id, title, description, order_index)
VALUES (
  'b1c2d3e4-f5a6-7890-bcde-f12345678901',
  '91b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Compound Interest & Savings',
  'Understand how compound interest works and why starting early matters.',
  1
);

-- Facts for Lesson 1
INSERT INTO facts (lesson_id, content, explanation, strictness, order_index, tags) VALUES
('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'Compound interest is interest earned on both the original principal and previously accumulated interest.', 'Unlike simple interest which only applies to the principal, compound interest grows exponentially because each period''s interest becomes part of the next period''s base.', 'medium', 1, ARRAY['compound-interest', 'definition']),

('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'The compound interest formula is A = P(1 + r/n)^(nt), where P is principal, r is annual rate, n is compounding frequency, and t is time in years.', 'A is the final amount. For example, $1000 at 5% compounded monthly for 10 years: A = 1000(1 + 0.05/12)^(12×10) = $1,647.01', 'high', 2, ARRAY['compound-interest', 'formula']),

('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'The Rule of 72: divide 72 by the annual interest rate to estimate how many years it takes to double your money.', 'At 6% interest, your money doubles in approximately 72/6 = 12 years. At 8%, it''s about 9 years.', 'high', 3, ARRAY['compound-interest', 'rule-of-72']),

('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'Starting to invest 10 years earlier can result in significantly more wealth than investing larger amounts later, due to compound growth over time.', 'Someone who invests $200/month from age 25-65 will typically have more than someone who invests $400/month from age 35-65, even though the latter invested more total dollars.', 'low', 4, ARRAY['compound-interest', 'time-value']),

('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'An emergency fund should contain 3 to 6 months of living expenses, kept in a high-yield savings account.', 'This protects against job loss, medical emergencies, or unexpected expenses without needing to sell investments or take on debt.', 'medium', 5, ARRAY['savings', 'emergency-fund']),

('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'The 50/30/20 budgeting rule allocates 50% of after-tax income to needs, 30% to wants, and 20% to savings and debt repayment.', 'Needs include rent, food, insurance. Wants include dining out, entertainment. The 20% for savings should be treated as non-negotiable.', 'high', 6, ARRAY['budgeting', 'rule']),

('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'Paying yourself first means automatically transferring money to savings before spending on anything else.', 'Set up automatic transfers on payday so saving is the default, not something you do with leftover money.', 'medium', 7, ARRAY['savings', 'strategy']),

('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'APY (Annual Percentage Yield) reflects the total interest earned in a year including compounding, while APR (Annual Percentage Rate) does not include compounding.', 'When comparing savings accounts, always compare APY. When comparing loans, the APR doesn''t tell the full cost — look at the total cost including compounding.', 'medium', 8, ARRAY['interest-rates', 'terminology']),

('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'Inflation averages about 2-3% per year, which means money in a regular savings account (0.01% APY) loses purchasing power over time.', 'If inflation is 3% and your savings earns 0.5%, you''re effectively losing 2.5% per year in real value. High-yield savings accounts (4-5% APY) help offset this.', 'medium', 9, ARRAY['inflation', 'purchasing-power']),

('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'A high-yield savings account typically earns 10-50x more interest than a traditional bank savings account.', 'Online banks like Ally, Marcus, or Discover often offer 4-5% APY vs. traditional banks offering 0.01-0.1%.', 'low', 10, ARRAY['savings', 'high-yield']);

-- ============================================
-- Lesson 2: Investing Fundamentals
-- ============================================
INSERT INTO lessons (id, subject_id, title, description, order_index)
VALUES (
  'c1d2e3f4-a5b6-7890-cdef-123456789012',
  '91b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Investing Fundamentals',
  'Key concepts for getting started with investing: stocks, bonds, index funds, and risk.',
  2
);

-- Facts for Lesson 2
INSERT INTO facts (lesson_id, content, explanation, strictness, order_index, tags) VALUES
('c1d2e3f4-a5b6-7890-cdef-123456789012', 'A stock represents partial ownership in a company. When you buy a share, you own a tiny piece of that business.', 'As the company grows and profits, the stock price tends to increase. You can also earn dividends — a share of the company''s profits paid to shareholders.', 'medium', 1, ARRAY['stocks', 'definition']),

('c1d2e3f4-a5b6-7890-cdef-123456789012', 'A bond is a loan you make to a government or corporation. They pay you back with interest over a set period.', 'Bonds are generally less risky than stocks but offer lower returns. U.S. Treasury bonds are considered among the safest investments in the world.', 'medium', 2, ARRAY['bonds', 'definition']),

('c1d2e3f4-a5b6-7890-cdef-123456789012', 'An index fund tracks a market index like the S&P 500, giving you exposure to hundreds of companies in one investment.', 'The S&P 500 index fund holds shares in the 500 largest U.S. companies. It''s diversified, low-cost, and has historically returned about 10% per year on average.', 'medium', 3, ARRAY['index-funds', 'diversification']),

('c1d2e3f4-a5b6-7890-cdef-123456789012', 'The S&P 500 has returned an average of approximately 10% per year over the last century, before adjusting for inflation.', 'After inflation, the real return is closer to 7%. Past returns don''t guarantee future performance, but the long-term trend has been consistently upward.', 'high', 4, ARRAY['returns', 'historical']),

('c1d2e3f4-a5b6-7890-cdef-123456789012', 'Diversification means spreading investments across different assets to reduce risk. Don''t put all your eggs in one basket.', 'If one investment loses value, others may gain, balancing your portfolio. Index funds provide instant diversification.', 'medium', 5, ARRAY['diversification', 'risk']),

('c1d2e3f4-a5b6-7890-cdef-123456789012', 'Dollar-cost averaging means investing a fixed amount at regular intervals regardless of market price, reducing the impact of volatility.', 'By investing $500 every month, you buy more shares when prices are low and fewer when prices are high, averaging out your cost per share over time.', 'medium', 6, ARRAY['strategy', 'dca']),

('c1d2e3f4-a5b6-7890-cdef-123456789012', 'An expense ratio is the annual fee charged by a fund, expressed as a percentage. Index funds typically charge 0.03-0.20%, while actively managed funds charge 0.50-2.00%.', 'A 1% difference in fees can cost you hundreds of thousands of dollars over a 30-year investing period due to compound growth of those fees.', 'high', 7, ARRAY['fees', 'expense-ratio']),

('c1d2e3f4-a5b6-7890-cdef-123456789012', 'A 401(k) is an employer-sponsored retirement account with tax advantages. Many employers match contributions — that''s free money you should always take.', 'If your employer matches 50% up to 6% of your salary, contribute at least 6% to get the full match. Not doing so is leaving money on the table.', 'medium', 8, ARRAY['retirement', '401k']),

('c1d2e3f4-a5b6-7890-cdef-123456789012', 'A Roth IRA lets you invest after-tax dollars, and all growth and withdrawals in retirement are tax-free.', 'Contribution limit is $7,000/year (2024). Best for young people who expect to be in a higher tax bracket later. You can withdraw contributions (not earnings) at any time without penalty.', 'medium', 9, ARRAY['retirement', 'roth-ira']),

('c1d2e3f4-a5b6-7890-cdef-123456789012', 'Time in the market beats timing the market. Consistently investing over long periods outperforms trying to predict market highs and lows.', 'Studies show that missing just the 10 best trading days over 20 years can cut your returns in half. Stay invested through ups and downs.', 'low', 10, ARRAY['strategy', 'long-term']);
