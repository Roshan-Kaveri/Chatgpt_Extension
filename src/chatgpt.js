export async function fetchChatGPTResponse(prompt, apiKey, model , maxTokens ) {
  // Validate inputs just in case
  if (!apiKey) {
    alert('API key missing');
    return 'API key is required.';
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: parseInt(maxTokens) 
    })
  });

  const data = await res.json();


  return data.choices?.[0]?.message?.content || 'No response';
}
