import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Select from 'react-select';

const Budget = () => {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]); // Options formatted for react-select
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // For date navigation
  const [currentDate, setCurrentDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  
  // For bulk import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);

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
  
  // Remove any lingering code from the old typeahead implementation
  
  // No extra effect needed since we handle initialization in fetchTransactions

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/budget/transactions', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Set all transactions
        setTransactions(data);
        
        // Extract unique dates from transactions and sort them
        const uniqueDates = [...new Set(data.map(t => t.date))].sort();
        setAvailableDates(uniqueDates);
        
        // If no currentDate is set or it's not in the available dates, use the latest date
        if (!currentDate || !uniqueDates.includes(currentDate)) {
          setCurrentDate(uniqueDates.length > 0 ? uniqueDates[0] : null);
        }
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
        
        // Format categories for react-select
        const options = data.map(category => ({
          value: category.id,
          label: category.name
        }));
        setCategoryOptions(options);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (err) {
      setError('An error occurred while fetching categories');
      console.error(err);
    }
  };

  const handleCategoryChange = async (transactionId, selectedOption) => {
    // Find the transaction to update
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    // Extract the categoryId and categoryName from the selected option
    const categoryId = selectedOption ? selectedOption.value : null;
    const categoryName = selectedOption ? selectedOption.label : '';
    
    // Create updated transaction object for optimistic updates
    const updatedTransaction = { 
      ...transaction, 
      category_id: categoryId,
      category_name: categoryName
    };
    
    // Update the UI optimistically
    setTransactions(prevTransactions => 
      prevTransactions.map(t => 
        t.id === transactionId ? updatedTransaction : t
      )
    );
    
    try {
      // Send request to backend
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
      
      if (!response.ok) {
        // Revert the optimistic update if there's an error
        setTransactions(prevTransactions => 
          prevTransactions.map(t => 
            t.id === transactionId ? transaction : t
          )
        );
        setError('Failed to update category');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      // Revert the optimistic update
      setTransactions(prevTransactions => 
        prevTransactions.map(t => 
          t.id === transactionId ? transaction : t
        )
      );
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
        // Update categories list
        setCategories([...categories, newCat]);
        
        // Update react-select options
        setCategoryOptions([
          ...categoryOptions, 
          { value: newCat.id, label: newCat.name }
        ]);
        
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
  
  // Parse date from MM/DD/YYYY to YYYY-MM-DD
  const parseDate = (dateStr) => {
    if (!dateStr) return '';
    
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };
  
  // Navigate to previous day
  const goToPreviousDay = () => {
    const currentIndex = availableDates.findIndex(date => date === currentDate);
    if (currentIndex > 0) {
      setCurrentDate(availableDates[currentIndex - 1]);
    }
  };
  
  // Navigate to next day
  const goToNextDay = () => {
    const currentIndex = availableDates.findIndex(date => date === currentDate);
    if (currentIndex < availableDates.length - 1) {
      setCurrentDate(availableDates[currentIndex + 1]);
    }
  };
  
  // Handle bulk import of transactions
  const handleImport = async () => {
    if (!importData.trim()) {
      setError('Import data cannot be empty');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setIsImporting(true);
    
    try {
      // Parse the import data
      const lines = importData.trim().split('\n');
      const parsedTransactions = [];
      
      // Process each line
      for (const line of lines) {
        // Try to match the format: "MM/DD/YYYY -amount description"
        const match = line.match(/(\d{2}\/\d{2}\/\d{4})\s+(-?\d+\.\d{2})\s+(.+)/);
        
        if (match) {
          const [, dateStr, amountStr, description] = match;
          const amount = parseFloat(amountStr);
          const formattedDate = parseDate(dateStr); // Convert to YYYY-MM-DD
          
          parsedTransactions.push({
            date: formattedDate,
            amount,
            description: description.trim()
          });
        }
      }
      
      if (parsedTransactions.length === 0) {
        setError('No valid transactions found in the import data');
        setIsImporting(false);
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Send parsed transactions to the server
      const response = await fetch('/api/budget/transactions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ transactions: parsedTransactions }),
      });
      
      if (response.ok) {
        // Refresh transactions after import
        await fetchTransactions();
        setSuccess(`Successfully imported ${parsedTransactions.length} transactions`);
        setImportData('');
        setShowImportModal(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to import transactions');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('An error occurred while importing transactions');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Filter transactions for current date
  const currentDayTransactions = useMemo(() => {
    if (!currentDate) return [];
    return transactions.filter(transaction => transaction.date === currentDate);
  }, [transactions, currentDate]);

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
      
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Add Day Data</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                onClick={() => setShowImportModal(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Paste transaction data in the format:<br/>
                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">MM/DD/YYYY -amount Description</code>
              </p>
              <textarea
                className="w-full h-64 border rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="03/10/2025 -577.76 Irs&#10;03/10/2025 -1.25 City Of Santa Moni&#10;..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                disabled={isImporting}
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm mr-2"
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm"
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Transactions</h2>
            {currentDate && (
              <div className="ml-4 flex items-center">
                <button 
                  onClick={goToPreviousDay}
                  disabled={availableDates.indexOf(currentDate) <= 0}
                  className={`px-2 py-1 rounded text-sm mr-2 ${
                    availableDates.indexOf(currentDate) <= 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  ← Previous Day
                </button>
                <span className="text-sm font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {formatDate(currentDate)}
                </span>
                <button 
                  onClick={goToNextDay}
                  disabled={availableDates.indexOf(currentDate) >= availableDates.length - 1}
                  className={`px-2 py-1 rounded text-sm ml-2 ${
                    availableDates.indexOf(currentDate) >= availableDates.length - 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Next Day →
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <button 
              className="bg-green-500 text-white px-4 py-2 rounded text-sm mr-3"
              onClick={() => setShowImportModal(true)}
            >
              Add Day Data
            </button>
            
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
              {currentDayTransactions.map((transaction) => (
                <tr key={transaction.id} data-transaction-id={transaction.id}>
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
                    <div className="flex items-center w-full">
                      <div className="w-full">
                        <Select
                          className="text-sm"
                          classNamePrefix="react-select"
                          options={categoryOptions}
                          isClearable={true}
                          placeholder="Select category"
                          value={transaction.category_id
                            ? { value: transaction.category_id, label: transaction.category_name }
                            : null
                          }
                          onChange={(selectedOption) => {
                            handleCategoryChange(transaction.id, selectedOption);
                          }}
                          // Custom styling to match Tailwind design
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: 'rgb(209, 213, 219)',
                              minHeight: '32px',
                              backgroundColor: document.documentElement.classList.contains('dark') 
                                ? 'rgb(55, 65, 81)' // dark:bg-gray-700
                                : 'white',
                            }),
                            placeholder: (base) => ({
                              ...base,
                              color: document.documentElement.classList.contains('dark') 
                                ? 'rgba(255, 255, 255, 0.5)' 
                                : 'rgb(156, 163, 175)', // text-gray-400
                            }),
                            input: (base) => ({
                              ...base,
                              color: document.documentElement.classList.contains('dark') 
                                ? 'white' 
                                : 'inherit',
                            }),
                            singleValue: (base) => ({
                              ...base,
                              color: document.documentElement.classList.contains('dark') 
                                ? 'white' 
                                : 'inherit',
                            }),
                            menu: (base) => ({
                              ...base,
                              backgroundColor: document.documentElement.classList.contains('dark') 
                                ? 'rgb(31, 41, 55)' // dark:bg-gray-800
                                : 'white',
                              zIndex: 50,
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isFocused
                                ? document.documentElement.classList.contains('dark') 
                                  ? 'rgb(30, 58, 138)' // dark:bg-blue-900
                                  : 'rgb(239, 246, 255)' // bg-blue-50
                                : 'transparent',
                              color: document.documentElement.classList.contains('dark') 
                                ? 'white' 
                                : 'black',
                            }),
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {currentDayTransactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No transactions found for {formatDate(currentDate)}
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