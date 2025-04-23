import { useState, useEffect } from 'react';

export default function Settings({ onSave }) {
  const [key, setKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini'); // Default model
  const [token, setToken] = useState(1000); // Default token limit

  useEffect(() => {
    chrome.storage.local.get(['apiKey', 'model', 'token'], (result) => {
      if (result.apiKey) setKey(result.apiKey);
      if (result.model) setModel(result.model);
      if (result.token) setToken(result.token);
    });
  }, []);

  const handleSave = () => {
    chrome.storage.local.set({ apiKey: key, model, token }, () => {
      // ✅ Update parent with all settings
      onSave(key, model, token);
  
      alert('Settings saved');
    });
  };

  return (
    <div>
      <h4>Settings</h4>
      <input
        type="password"
        placeholder="Enter your OpenAI API Key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        style={{ width: '100%', marginBottom: '0.5rem' }}
      />
      <input
        type="text"
        placeholder="Enter model (default: gpt-4o-mini)"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        style={{ width: '100%', marginBottom: '0.5rem' }}
      />
      <input
        type="number"
        placeholder="Enter max token (default: 1000)"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        style={{ width: '100%', marginBottom: '0.5rem' }}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
