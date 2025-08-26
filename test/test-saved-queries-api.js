// Quick test script to check if the saved queries API is working

async function testSavedQueriesAPI() {
  const baseURL = 'http://localhost:88/api/v1';
  
  try {
    // Test 1: Check if the server is running
    console.log('Testing server health...');
    const healthResponse = await fetch(`${baseURL.replace('/api/v1', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Server health:', healthData);
    
    // Test 2: Try to access saved queries endpoint (should get 401 without auth)
    console.log('\nTesting saved queries endpoint...');
    const savedQueriesResponse = await fetch(`${baseURL}/saved-queries`);
    console.log('📊 Saved queries response status:', savedQueriesResponse.status);
    
    if (savedQueriesResponse.status === 401) {
      console.log('✅ Endpoint exists but requires authentication (expected)');
    } else if (savedQueriesResponse.status === 404) {
      console.log('❌ Endpoint not found - route may not be registered');
    } else {
      const data = await savedQueriesResponse.text();
      console.log('📄 Response:', data);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server may not be running. Try starting it with:');
      console.log('   cd backendNEx && npm start');
    }
  }
}

testSavedQueriesAPI();