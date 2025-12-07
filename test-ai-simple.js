// Simple test for AI functionality
const fetch = require('node-fetch');

async function testAI() {
  console.log('Testing AI functionality...');
  
  try {
    // Test the AI connection
    console.log('1. Testing OpenRouter connection...');
    const testResponse = await fetch('http://localhost:3000/api/test-ai');
    const testResult = await testResponse.json();
    
    console.log('AI Connection Test Result:', testResult);
    
    if (testResult.success) {
      console.log('✅ OpenRouter API is working!');
      console.log('AI Response:', testResult.aiResponse);
    } else {
      console.log('❌ OpenRouter API test failed:', testResult.error);
      return;
    }
    
    // Test full processing pipeline with a simple video
    console.log('\n2. Testing full processing pipeline...');
    const processResponse = await fetch('http://localhost:3000/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          articleLength: 'short',
          tone: 'casual',
          format: 'markdown'
        }
      })
    });
    
    const processResult = await processResponse.json();
    
    if (processResult.success) {
      console.log('✅ Full processing pipeline successful!');
      console.log('Generation method:', processResult.data?.generationMethod || 'unknown');
      console.log('Article title:', processResult.data?.article?.title);
      console.log('Article sections:', processResult.data?.article?.sections?.length || 0);
    } else {
      console.log('❌ Processing pipeline failed:', processResult.error);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testAI();