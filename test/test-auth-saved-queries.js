// Test script to check authentication with saved queries API

async function testAuthenticatedSavedQueries() {
  const baseURL = 'http://localhost:88/api/v1';
  
  try {
    // First, let's try to login to get a token
    console.log('Testing login to get authentication token...');
    
    // Using test credentials from initDatabase.js
    const loginData = {
      username: 'superadmin',
      password: 'admin123'
    };
    
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
      credentials: 'include' // Important for cookies
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Login successful');
      
      // Extract token from response or cookies
      let token = null;
      
      // Check if token is in response
      if (loginResult.data && loginResult.data.token) {
        token = loginResult.data.token;
        console.log('📝 Token from response:', token.substring(0, 20) + '...');
      }
      
      // Check cookies
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('🍪 Set-Cookie headers:', cookies);
      
      // Now test the saved queries endpoint with authentication
      console.log('\nTesting saved queries with authentication...');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const savedQueriesResponse = await fetch(`${baseURL}/saved-queries`, {
        headers,
        credentials: 'include' // Include cookies
      });
      
      console.log('Saved queries response status:', savedQueriesResponse.status);
      
      if (savedQueriesResponse.ok) {
        const data = await savedQueriesResponse.json();
        console.log('✅ Saved queries retrieved successfully:', data);
      } else {
        const errorText = await savedQueriesResponse.text();
        console.log('❌ Saved queries error:', errorText);
      }
      
      // Test creating a query
      console.log('\nTesting create query...');
      
      const testQuery = {
        name: 'Test Query ' + Date.now(),
        description: 'Test query created by test script',
        reportParams: {
          reportType: 'test',
          dateRange: { start: '2024-01-01', end: '2024-12-31' }
        },
        activeFilters: [],
        filterValues: {}
      };
      
      const createResponse = await fetch(`${baseURL}/saved-queries`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(testQuery)
      });
      
      console.log('Create query response status:', createResponse.status);
      
      if (createResponse.ok) {
        const createResult = await createResponse.json();
        console.log('✅ Query created successfully:', createResult);
      } else {
        const createError = await createResponse.text();
        console.log('❌ Create query error:', createError);
      }
      
    } else {
      const loginError = await loginResponse.text();
      console.log('❌ Login failed:', loginError);
      console.log('💡 Make sure you have valid test credentials or the auth endpoint is working');
    }
    
  } catch (error) {
    console.error('❌ Error testing authenticated API:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server may not be running. Try starting it with:');
      console.log('   cd backendNEx && npm start');
    }
  }
}

testAuthenticatedSavedQueries();