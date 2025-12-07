// Simple test script to verify the API works
const https = require('https');

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('Testing /api/process endpoint...');
    
    const result = await makeRequest({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      options: {
        articleLength: 'short',
        tone: 'casual',
        format: 'markdown'
      }
    });

    console.log('Status:', result.status);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ API test successful!');
      console.log('Video title:', result.data.data?.metadata?.title);
      console.log('Article generated:', !!result.data.data?.article);
      console.log('Transcript segments:', result.data.data?.transcript?.segments?.length || 0);
    } else {
      console.log('❌ API test failed:', result.data.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testAPI();