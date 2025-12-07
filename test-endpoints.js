// Test the endpoints to debug AI generation
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testEndpoints() {
    console.log('🧪 Testing AI Generation Endpoints\n');
    
    try {
        // Test 1: AI Connection
        console.log('1️⃣ Testing AI Connection...');
        const aiResponse = await fetch('http://localhost:3000/api/test-ai');
        const aiResult = await aiResponse.json();
        
        if (aiResult.success) {
            console.log('✅ AI Connection: SUCCESS');
            console.log(`   Response: ${aiResult.aiResponse.substring(0, 100)}...`);
        } else {
            console.log('❌ AI Connection: FAILED');
            console.log(`   Error: ${aiResult.error}`);
            return;
        }
        
        console.log('\n2️⃣ Testing Full Processing Pipeline...');
        
        // Test 2: Full Processing
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
            console.log('✅ Processing: SUCCESS');
            console.log(`   Generation Method: ${processResult.data?.generationMethod || 'unknown'}`);
            
            if (processResult.data?.generationMethod === 'ai') {
                console.log('🎉 AI GENERATION IS WORKING!');
            } else {
                console.log('⚠️  Using template fallback (AI might have failed)');
            }
            
            if (processResult.data?.article) {
                console.log(`   Article Title: "${processResult.data.article.title}"`);
                console.log(`   Article Sections: ${processResult.data.article.sections?.length || 0}`);
                console.log(`   Word Count: ${processResult.data.article.metadata?.wordCount || 'unknown'}`);
            }
            
        } else {
            console.log('❌ Processing: FAILED');
            console.log(`   Error: ${processResult.error}`);
        }
        
        console.log('\n📊 DIAGNOSIS:');
        if (aiResult.success && processResult.success) {
            if (processResult.data?.generationMethod === 'ai') {
                console.log('🎉 AI generation is working perfectly!');
            } else {
                console.log('⚠️  AI connection works, but processing uses template fallback');
                console.log('   This suggests the AI integration in the processing pipeline has an issue');
            }
        } else {
            console.log('❌ There are issues with the AI system');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testEndpoints();