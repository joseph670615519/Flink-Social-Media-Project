// Test Firebase Storage Component
import React, { useState } from 'react';
import { testFirebaseStorage } from '../utils/firebaseDebug';

const FirebaseTest = () => {
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    setTestResult('Testing Firebase Storage...');
    
    const result = await testFirebaseStorage();
    
    if (result) {
      setTestResult('Firebase Storage is working correctly!');
    } else {
      setTestResult('Firebase Storage test failed. Check console for details.');
    }
    
    setTesting(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #ccc',
      borderRadius: '8px',
      padding: '15px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Firebase Storage Test</h4>
      <button 
        onClick={runTest} 
        disabled={testing}
        style={{
          background: testing ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: testing ? 'not-allowed' : 'pointer',
          marginBottom: '10px'
        }}
      >
        {testing ? 'Testing...' : 'Test Storage'}
      </button>
      {testResult && (
        <div style={{ 
          padding: '8px', 
          background: testResult.includes('working correctly') ? '#d4edda' : '#f8d7da',
          color: testResult.includes('working correctly') ? '#155724' : '#721c24',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {testResult}
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;