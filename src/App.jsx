import { useEffect, useState, useRef } from 'react';
import { fetchChatGPTResponse } from './chatgpt';
import Settings from './Settings';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism';
import remarkBreaks from 'remark-breaks';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [tokenLimit, setTokenLimit] = useState(1000);
  const [showSettings, setShowSettings] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentChat, setCurrentChat] = useState([]);
  const [currentChatIndex, setCurrentChatIndex] = useState(null);

  const chatEndRef = useRef(null);

  // Scroll to bottom whenever currentChat changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChat]);

  // Load stored settings and chats
  useEffect(() => {
    chrome.storage.local.get(
      ['apiKey', 'model', 'token', 'savedChats'],
      (result) => {
        if (result.apiKey) setApiKey(result.apiKey);
        if (result.model) setModel(result.model);
        if (result.token) setTokenLimit(result.token);
        if (result.savedChats) setSavedChats(result.savedChats);
      }
    );
  }, []);

  const handleAsk = async () => {
    if (!apiKey) {
      setCurrentChat((prev) => [
        ...prev,
        { role: 'system', content: 'API key not set. Please go to Settings.' }
      ]);
      return;
    }

    const updatedChat = [...currentChat, { role: 'user', content: prompt }];
    setCurrentChat(updatedChat);
    setPrompt('');

    const contextPrompt = updatedChat
      .map((msg) => `${msg.role === 'user' ? 'User' : 'GPT'}: ${msg.content}`)
      .join('\n');

    const gptReply = await fetchChatGPTResponse(
      contextPrompt,
      apiKey,
      model,
      tokenLimit
    );
    const finalChat = [...updatedChat, { role: 'gpt', content: gptReply }];
    setCurrentChat(finalChat);

    const title =
      finalChat.find((m) => m.role === 'user')?.content
        .split(/\s+/)
        .slice(0, 3)
        .join(' ') || 'Chat';

    const updatedSaved = [...savedChats];
    if (currentChatIndex !== null) {
      updatedSaved[currentChatIndex] = { prompt: title, response: finalChat };
    } else {
      updatedSaved.push({ prompt: title, response: finalChat });
      setCurrentChatIndex(updatedSaved.length - 1);
    }

    setSavedChats(updatedSaved);
    chrome.storage.local.set({ savedChats: updatedSaved });
  };

  const loadSavedChat = (chat, index) => {
    setCurrentChat(chat.response);
    setCurrentChatIndex(index);
    setPrompt('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img src="chatgpt-icon.png" alt="icon" style={styles.icon} />
        <h2 style={{ margin: 0 }}>ChatGPT</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={styles.settingsBtn}
        >
          ⚙️
        </button>
      </div>

      {showSettings ? (
        <Settings
          onSave={(key, newModel, newToken) => {
            setApiKey(key);
            setModel(newModel);
            setTokenLimit(newToken);
            setShowSettings(false);
          }}
        />
      ) : (
        <>
          <div style={styles.chatBox}>
            {currentChat.map((chat, i) => (
              <div
                key={i}
                style={{
                  ...styles.bubble,
                  ...(chat.role === 'user' ? styles.userBubble : styles.gptBubble)
                }}
              >
                <strong>{chat.role === 'user' ? 'You' : 'GPT'}:</strong>{' '}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypePrism]}
                >
                  {chat.content}
                </ReactMarkdown>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask something..."
            style={styles.textarea}
          />
          <button onClick={handleAsk} style={styles.askBtn}>
            Send
          </button>
        </>
      )}

      {showSidebar && (
        <div style={styles.sidebar}>
          <button
            onClick={() => setShowSidebar(false)}
            style={styles.closeBtn}
          >
            X
          </button>
          <h3>Saved Chats</h3>
          <ul style={styles.savedChatList}>
            {[...savedChats].reverse().map((chat, idx, arr) => {
              const actual = arr.length - 1 - idx;
              return (
                <li
                  key={actual}
                  onClick={() => loadSavedChat(chat, actual)}
                  style={styles.savedChatItem}
                >
                  {chat.prompt}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        onClick={() => setShowSidebar(!showSidebar)}
        style={styles.sidebarToggleBtn}
      >
        🗂️
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: '1rem',
    width: '400px',
    height: '500px' ,
    backgroundColor: '#343541',
    color: '#e5e7eb',
    borderRadius: '8px',
    fontFamily: 'Segoe UI, sans-serif',
    position: 'relative',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'space-between',
  },
  icon: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
  },
  settingsBtn: {
    background: 'none',
    border: 'none',
    color: '#e5e7eb',
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  chatBox: {
    maxWidth: '100%',
    padding: '0.5rem',
    borderRadius: '6px',
    maxHeight: '280px',
    overflowY: 'auto',
    marginBottom: '0.75rem',
  },
  bubble: {
    padding: '0.6rem',
    borderRadius: '8px',
    marginBottom: '0.5rem',
    maxWidth: '100%',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  userBubble: {
    backgroundColor: '#2b2c2f',
    alignSelf: 'flex-end',
    textAlign: 'right',
  },
  gptBubble: {
    backgroundColor: '#202123',
    alignSelf: 'flex-start',
  },
  textarea: {
    width: '94%',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #5a5f7a',
    backgroundColor: '#40414f',
    color: '#e5e7eb',
    fontSize: '0.95rem',
    resize: 'none',
  },
  askBtn: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#10a37f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '260px',
    height: '100vh',
    backgroundColor: '#282828',
    color: '#ffffff',
    padding: '1rem',
    zIndex: 9999,
    boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.5)',
    overflowY: 'auto',
  },
  savedChatList: {
    listStyle: 'none',
    padding: 0,
    marginTop: '1rem',
  },
  savedChatItem: {
    cursor: 'pointer',
    marginBottom: '0.75rem',
    padding: '0.5rem',
    backgroundColor: '#40414f',
    borderRadius: '4px',
    fontSize: '0.95rem',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    color: '#fff',
  },
  sidebarToggleBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#343541',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
   
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.5rem',
    cursor: 'pointer',
    position: 'absolute',
    top: 10,
    right: 10,
  },
};
