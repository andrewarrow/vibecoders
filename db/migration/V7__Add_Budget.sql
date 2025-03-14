-- Create budget categories table
CREATE TABLE IF NOT EXISTS budget_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create budget transactions table
CREATE TABLE IF NOT EXISTS budget_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  category_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_budget_categories_user_id ON budget_categories(user_id);
CREATE INDEX idx_budget_transactions_user_id ON budget_transactions(user_id);
CREATE INDEX idx_budget_transactions_category_id ON budget_transactions(category_id);
CREATE INDEX idx_budget_transactions_date ON budget_transactions(date);

-- Insert some default categories
INSERT INTO budget_categories (user_id, name) 
VALUES 
(1, 'Groceries'),
(1, 'Dining'),
(1, 'Utilities'),
(1, 'Transportation'),
(1, 'Entertainment'),
(1, 'Health'),
(1, 'Shopping'),
(1, 'Housing'),
(1, 'Travel'),
(1, 'Education'),
(1, 'Subscriptions'),
(1, 'Gifts');

-- Insert sample transactions
INSERT INTO budget_transactions (user_id, date, amount, description)
VALUES
(1, '2025-03-12', -149.39, 'So Cal Gas'),
(1, '2025-03-12', -3.80, 'Amznpharma'),
(1, '2025-03-12', -10.00, 'Amznpharma'),
(1, '2025-03-12', -27.48, 'Chick Fil A  03331'),
(1, '2025-03-12', -92.00, 'Aaa Ca Membership');