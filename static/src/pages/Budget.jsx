import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Budget = () => {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Fetch transactions and categories
  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
      fetchCategories();
    }
  }, [isAuthenticated]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/budget/transactions', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else {
        setError('Failed to fetch transactions');
      }
    } catch (err) {
      setError('An error occurred while fetching transactions');
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/budget/categories', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (err) {
      setError('An error occurred while fetching categories');
      console.error(err);
    }
  };

  const handleCategoryChange = async (transactionId, categoryId) => {
    try {
      const response = await fetch('/api/budget/transactions/category', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          transaction_id: transactionId,
          category_id: categoryId,
        }),
      });
      
      if (response.ok) {
        // Update the transaction in the UI
        setTransactions(prevTransactions => 
          prevTransactions.map(t => 
            t.id === transactionId 
              ? { 
                  ...t, 
                  category_id: categoryId,
                  category_name: categories.find(c => c.id === categoryId)?.name || ''
                } 
              : t
          )
        );
        setSuccess('Category updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to update category');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('An error occurred while updating category');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const response = await fetch('/api/budget/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newCategory.trim()
        }),
      });
      
      if (response.ok) {
        const newCat = await response.json();
        setCategories([...categories, newCat]);
        setNewCategory('');
        setIsAddingCategory(false);
        setSuccess('Category added successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to add category');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('An error occurred while adding category');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Format date from YYYY-MM-DD to MM/DD/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-purple-600">Budget Tracker</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Transactions</h2>
          
          <div>
            {isAddingCategory ? (
              <form onSubmit={handleAddCategory} className="flex items-center">
                <input
                  type="text"
                  className="border rounded-l px-3 py-2 text-sm focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button 
                  type="submit"
                  className="bg-green-500 text-white px-3 py-2 text-sm rounded-r"
                >
                  Add
                </button>
                <button 
                  type="button"
                  className="bg-gray-300 text-gray-700 px-3 py-2 text-sm rounded ml-2"
                  onClick={() => setIsAddingCategory(false)}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button 
                className="bg-purple-500 text-white px-4 py-2 rounded text-sm"
                onClick={() => setIsAddingCategory(true)}
              >
                New Category
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatDate(transaction.date)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="relative">
                      <input
                        list={`categories-${transaction.id}`}
                        className="border rounded px-3 py-1 w-full text-sm focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Select category"
                        value={transaction.category_name || ''}
                        onChange={(e) => {
                          const selectedCategory = categories.find(c => c.name === e.target.value);
                          if (selectedCategory) {
                            handleCategoryChange(transaction.id, selectedCategory.id);
                          }
                        }}
                      />
                      <datalist id={`categories-${transaction.id}`}>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name} />
                        ))}
                      </datalist>
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Budget;