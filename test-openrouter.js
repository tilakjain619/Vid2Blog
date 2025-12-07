// Simple test for OpenRouter integration
const fetch = require('node-fetch');

async function testOpenRouter() {
  console.log('Testing OpenRouter integration...');
  
  try {
    // Test the connection endpoint
    const testResponse = await fetch('http://localhost:3000/api/ai/test');
    const testResult = await testResponse.json();
    
    console.log('Connection test:', testResult);
    
    if (testResult.connected) {
      console.log('✅ OpenRouter API is connected and working!');
      
      // Test article generation
      const generateResponse = await fetch('http://localhost:3000/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testPrompt: 'This is a test video about web development and JavaScript programming.'
        })
      });
      
      const generateResult = await generateResponse.json();
      
      if (generateResult.success) {
        console.log('✅ AI article generation test successful!');
        console.log('Generated title:', generateResult.article?.title);
      } else {
        console.log('❌ AI article generation test failed:', generateResult.error);
      }
    } else {
      console.log('❌ OpenRouter API connection failed');
      console.log('Make sure to set OPENROUTER_API_KEY in your .env file');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testOpenRouter();