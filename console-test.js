// Copy and paste this into the browser console at http://localhost:3000

async function testAIGeneration() {
    console.log('🧪 Testing AI Generation...');
    
    try {
        // First test the AI connection
        console.log('1️⃣ Testing AI connection...');
        const aiTest = await fetch('/api/test-ai');
        const aiResult = await aiTest.json();
        
        if (aiResult.success) {
            console.log('✅ AI connection successful');
            console.log('AI Response:', aiResult.aiResponse);
        } else {
            console.error('❌ AI connection failed:', aiResult.error);
            return;
        }
        
        // Test full processing
        console.log('\n2️⃣ Testing full processing...');
        const processResponse = await fetch('/api/process', {
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
            console.log('✅ Processing successful!');
            console.log('🤖 Generation method:', processResult.data?.generationMethod);
            
            if (processResult.data?.generationMethod === 'ai') {
                console.log('🎉 AI generation worked!');
            } else {
                console.log('⚠️ Fell back to template generation');
            }
            
            console.log('📄 Article:', processResult.data?.article);
        } else {
            console.error('❌ Processing failed:', processResult.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testAIGeneration();