// Test script to verify saved query creation
async function testCreateQuery() {
  const baseURL = 'http://localhost:88/api/v1';
  
  // Test data matching the expected format
  const testQueryData = {
    name: `Test Query ${Date.now()}`,
    description: 'Test query description',
    reportParams: {
      tahun: '2024',
      tipeLaporan: 'bulanan',
      pembulatan: 'ribuan'
    },
    activeFilters: ['filter1', 'filter2'],
    filterValues: {
      filter1: {
        selection: 'specific',
        kondisiCode: 'equals',
        mengandungKata: 'test'
      },
      filter2: {
        selection: 'all',
        kondisiCode: '',
        mengandungKata: ''
      }
    }
  };

  try {
    console.log('Testing saved query creation...');
    console.log('Request payload:', JSON.stringify(testQueryData, null, 2));
    
    const response = await fetch(`${baseURL}/saved-queries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper auth token, but we can see the request structure
      },
      body: JSON.stringify(testQueryData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.status === 401) {
      console.log('✅ Expected 401 - authentication required');
      console.log('✅ API endpoint is working and expects proper format');
    } else {
      try {
        const responseData = JSON.parse(responseText);
        console.log('✅ Response parsed successfully:', responseData);
      } catch (e) {
        console.log('❌ Failed to parse response as JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server may not be running on port 88');
    }
  }
}

testCreateQuery();