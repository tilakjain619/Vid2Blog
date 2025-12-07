// Test the processing endpoint
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testProcessEndpoint() {
  console.log('Testing /api/process endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          articleLength: 'short',
          tone: 'casual',
          format: 'markdown'
        }
      })
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Processing successful!');
      console.log('Generation method:', data.data?.generationMethod);
      console.log('Article title:', data.data?.article?.title);
      console.log('Article sections:', data.data?.article?.sections?.length);
      
      if (data.data?.article) {
        console.log('\nFull article:');
        console.log(JSON.stringify(data.data.article, null, 2));
      }
    } else {
      console.log('\n❌ Processing failed:', data.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testProcessEndpoint();