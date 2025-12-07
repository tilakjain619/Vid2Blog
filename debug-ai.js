// Debug script to test AI generation step by step
const fetch = require('node-fetch');

async function debugAI() {
  console.log('🔍 Debugging AI Generation...\n');
  
  try {
    // Step 1: Test basic OpenRouter connection
    console.log('Step 1: Testing OpenRouter API connection...');
    const testResponse = await fetch('http://localhost:3000/api/test-ai');
    const testResult = await testResponse.json();
    
    if (testResult.success) {
      console.log('✅ OpenRouter API connection successful');
      console.log('Response:', testResult.aiResponse);
    } else {
      console.log('❌ OpenRouter API connection failed:', testResult.error);
      return;
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Step 2: Test with a simple YouTube video
    console.log('Step 2: Testing full pipeline with YouTube video...');
    console.log('Using video: https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
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
    
    console.log('Process Response Status:', processResponse.status);
    console.log('Process Result:', JSON.stringify(processResult, null, 2));
    
    if (processResult.success) {
      console.log('\n✅ Processing successful!');
      console.log('Generation Method:', processResult.data?.generationMethod);
      console.log('Article Title:', processResult.data?.article?.title);
      console.log('Article Sections:', processResult.data?.article?.sections?.length);
      
      if (processResult.data?.generationMethod === 'ai') {
        console.log('🤖 AI generation was used successfully!');
      } else {
        console.log('📝 Template-based generation was used (AI may have failed)');
      }
    } else {
      console.log('\n❌ Processing failed:', processResult.error);
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

debugAI();