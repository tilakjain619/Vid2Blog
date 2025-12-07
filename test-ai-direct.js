// Direct test of OpenRouter API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testOpenRouterDirect() {
  console.log('Testing OpenRouter API directly...');
  
  const apiKey = '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';
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Vid2Blog Test'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          {
            role: 'user',
            content: `Create a blog article about: Test Video Title

Video Summary: This is a test video about JavaScript programming basics.

Main Topics: JavaScript, Programming, Web Development

Key Points:
- Programming: Introduction to JavaScript syntax
- Web Development: Building interactive websites
- Tutorial: Step-by-step coding examples

Instructions: Write a comprehensive article (600-1000 words). Use a professional, informative tone suitable for business or educational content.

Please respond with ONLY a JSON object in this exact format:
{
  "title": "Your article title here",
  "introduction": "Introduction paragraph",
  "sections": [
    {"heading": "Section 1", "content": "Content for section 1"},
    {"heading": "Section 2", "content": "Content for section 2"}
  ],
  "conclusion": "Conclusion paragraph",
  "tags": ["tag1", "tag2", "tag3"]
}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Response:', JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('\nAI Generated Content:');
      console.log(data.choices[0].message.content);
      
      // Try to parse the JSON
      try {
        const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('\nParsed JSON:');
          console.log(JSON.stringify(parsed, null, 2));
        } else {
          console.log('\nNo JSON found in response');
        }
      } catch (parseError) {
        console.log('\nFailed to parse JSON:', parseError.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testOpenRouterDirect();