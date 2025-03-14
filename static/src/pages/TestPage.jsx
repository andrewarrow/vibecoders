import React from 'react';

const TestPage = () => {
  
  return (
    <>
      <div style={{
        background: 'red',
        color: 'white',
        padding: '20px',
        margin: '20px',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        TEST PAGE - THIS SHOULD BE VISIBLE
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-purple-500 mb-4">Test Page</h1>
        <p className="text-gray-300">This is a test page to troubleshoot routing issues.</p>
      </div>
    </>
  );
};

export default TestPage;