import React, { useState } from 'react';
import { testFirebaseConnection } from '../../firebase/test-connection';

const FirebaseTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const handleTest = async () => {
    setTesting(true);
    setResults([]);
    
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const logs = [];
    
    console.log = (...args) => {
      logs.push({ type: 'log', message: args.join(' ') });
      originalLog(...args);
    };
    
    console.error = (...args) => {
      logs.push({ type: 'error', message: args.join(' ') });
      originalError(...args);
    };

    try {
      await testFirebaseConnection();
    } catch (error) {
      logs.push({ type: 'error', message: error.message });
    }
    
    // Restore console
    console.log = originalLog;
    console.error = originalError;
    
    setResults(logs);
    setTesting(false);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', margin: '20px', borderRadius: '8px' }}>
      <h3>🔥 Firebase Connection Test</h3>
      
      <button 
        onClick={handleTest} 
        disabled={testing}
        style={{
          padding: '10px 20px',
          backgroundColor: testing ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: testing ? 'not-allowed' : 'pointer'
        }}
      >
        {testing ? 'Testing...' : 'Test Firebase Connection'}
      </button>
      
      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Test Results:</h4>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '10px', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            {results.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  color: result.type === 'error' ? 'red' : 'black',
                  marginBottom: '5px'
                }}
              >
                {result.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;
