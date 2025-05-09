import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

export default function PromptPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('image');
  const bottomRef = useRef(null);
  const hasSentReviewLink = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem('user_email');
    if (!storedEmail) {
      navigate('/');
      return;
    }
  
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode') || 'image';
    setMode(modeParam);
  
    setMessages([{ role: 'user', text: `Email submitted by user: ${storedEmail}` }]);
    const existingSession = localStorage.getItem('session_id') || uuidv4();
    localStorage.setItem('session_id', existingSession);
    setSessionId(existingSession);
  }, [navigate]);  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');

    try {
      await fetch('https://sumhuman.app.n8n.cloud/webhook/645a8208-6a0d-410d-a56f-4b6e1b90bed5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Kulabrands1#`,
        },
        body: JSON.stringify({ chatInput: trimmed, sessionId, email: localStorage.getItem('user_email') }),
      });
    } catch (err) {
      console.error('Error sending to webhook:', err);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // useEffect(() => {
  //   if (!sessionId) return;
  //   setLoading(true);

  //   const startTime = Date.now();
  //   const maxPollingDuration = 8 * 60 * 1000; // 10 minutes

  //   const pollImages = setInterval(async () => {
  //     try {
  //       const elapsedTime = Date.now() - startTime;
  //       if (elapsedTime > maxPollingDuration) {
  //         clearInterval(pollImages);
  //         setLoading(false);
  //         return;
  //       }
    
  //       const { data, error } = await supabase
  //         .from('image_staging_for_review')
  //         .select('id, image_url')
  //         .eq('session_id', sessionId)
  //         .order('created_at', { ascending: true });
    
  //       if (error) {
  //         console.error('Supabase fetch error:', error);
  //         return;
  //       }
    
  //       if ((data && data.length > 10 && data && data.length < 100)  && !hasSentReviewLink.current) {
  //         setMessages((prev) => [
  //           ...prev,
  //           { role: 'bot', text: '🖼️ Images have been generated successfully!' },
  //           {
  //             role: 'bot',
  //             text: (
  //               <a href="/review" className="text-blue-400 underline hover:text-blue-300">
  //                 ✅ Click here to review your images
  //               </a>
  //             ),
  //           },
  //         ]);
  //         hasSentReviewLink.current = true;
  //         clearInterval(pollImages);
  //         setLoading(false);
  //       }
  //     } catch (err) {
  //       console.error('Polling failed:', err);
  //       setLoading(false);
  //     }
  //   }, 4000);

  //   return () => clearInterval(pollImages);
  // }, [sessionId]);
  
  useEffect(() => {
    if (!sessionId) return;
  
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'image';
  
    setLoading(true);
    const startTime = Date.now();
    const maxPollingDuration = 3 * 60 * 1000; // 3 minutes
  
    const pollInterval = setInterval(async () => {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > maxPollingDuration) {
        clearInterval(pollInterval);
        setLoading(false);
        return;
      }
  
      if (mode === 'video') {
        const { data, error } = await supabase
          .from('gen_video_urls')
          .select('id, video_url').single()

        console.log('Video data:', data);
        if (error) {
          console.error('Video polling error:', error);
          return;
        }
  
        if (data?.video_url && !hasSentReviewLink.current) {
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: '🎬 Your video has been generated!' },
            {
              role: 'bot',
              text: (
                <a
                  href={data.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 underline hover:text-green-300"
                >
                  ▶️ Watch your video here
                </a>
              ),
            },
          ]);
          hasSentReviewLink.current = true;
          clearInterval(pollInterval);
          setLoading(false);
        }
      } else {
        const { data, error } = await supabase
          .from('image_staging_for_review')
          .select('id, image_url')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
  
        if (error) {
          console.error('Image polling error:', error);
          return;
        }
  
        if (data && data.length > 10 && data.length < 100 && !hasSentReviewLink.current) {
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: '🖼️ Images have been generated successfully!' },
            {
              role: 'bot',
              text: (
                <a
                  href="/review"
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  ✅ Click here to review your images
                </a>
              ),
            },
          ]);
          hasSentReviewLink.current = true;
          clearInterval(pollInterval);
          setLoading(false);
        }
      }
    }, 4000);
  
    return () => clearInterval(pollInterval);
  }, [sessionId]);
  
  return (
    <div className="flex flex-col h-screen bg-[#121212] text-white">
      <header className="w-full border-b border-gray-700 bg-[#1f1f1f] py-4 shadow-md">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Prompt Playground</h1>
          <button
            onClick={() => {
              localStorage.removeItem('session_id');
              window.location.href = '/';
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {loading && 
            <div className="text-center text-gray-400 py-4">
              {mode === 'video' ? 'Looking for video results...' : 'Looking for image results...'}
            </div>
          }
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed shadow-md ${
                msg.role === 'user'
                  ? 'bg-blue-600 self-end ml-auto text-white'
                  : 'bg-gray-700 self-start mr-auto text-white'
              }`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-gray-700 bg-[#1f1f1f] py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 bg-[#2a2a2a] text-white px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
