// Simple test to verify the processing pipeline works
const fetch = require('node-fetch');

async function testPipeline() {
  try {
    console.log('Testing processing pipeline...');
    
    const response = await fetch('http://localhost:3000/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          articleLength: 'short',
          tone: 'casual',
          format: 'markdown'
        }
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Pipeline test successful!');
      console.log('Metadata:', result.data?.metadata?.title);
      console.log('Article generated:', !!result.data?.article);
    } else {
      console.log('❌ Pipeline test failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testPipeline();