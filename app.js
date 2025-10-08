const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const API_KEY = "YOUR_API_KEY"; // Put your real API key here

const SYSTEM_PROMPT = `
Role:
- Primary Function: You are Coach Joel AI who helps the InterLink Community...
`;

// AI memory will be loaded from GitHub
let aiMemory = [];

async function loadMemoryFromGitHub() {
  const files = [
    { name: "Users Insights", url: "https://raw.githubusercontent.com/YourUsername/coach-joel-memory/main/memory-files/Users Insights_ Top AMA Questions.txt" },
    { name: "Official Payment Point", url: "https://raw.githubusercontent.com/YourUsername/coach-joel-memory/main/memory-files/The Only Way to Become an Official Payment Point Staking Verified $ITLG.txt" },
    { name: "Remember", url: "https://raw.githubusercontent.com/YourUsername/coach-joel-memory/main/memory-files/Remember.txt" },
    { name: "Official Ambassadors List", url: "https://raw.githubusercontent.com/YourUsername/coach-joel-memory/main/memory-files/Official Ambassadors List.txt" },
    { name: "Kenneth CFO", url: "https://raw.githubusercontent.com/YourUsername/coach-joel-memory/main/memory-files/Kenneth A. Timmering as Chief Financial Officer (CFO) at InterLink Labs .txt" },
    { name: "Wallet Update", url: "https://raw.githubusercontent.com/YourUsername/coach-joel-memory/main/memory-files/InterLink Wallet Update.txt" },
    { name: "Offline Events", url: "https://raw.githubusercontent.com/YourUsername/coach-joel-memory/main/memory-files/InterLink Offline Events Igniting a Global Wave of Connection Q2 and Q3.txt" },
    { name: "For Trainees", url: "https://raw.githubusercontent.com/YourUsername/coach-joel-memory/main/memory-files/For Trainees Only.txt" }
  ];

  for (const file of files) {
    try {
      const res = await fetch(file.url);
      const content = await res.text();
      aiMemory.push({ name: file.name, content });
    } catch (err) {
      console.warn(`Failed to load ${file.name}`, err);
    }
  }

  aiMemory.push({ name: "Whitepaper", content: "https://whitepaper.interlinklabs.ai/" });
  aiMemory.push({ name: "Coach House", content: "https://interlink-coach-house.gitbook.io/interlink.coach.house" });
}

/* ----- Your existing JS code for UI, sending messages, TTS, etc. ----- */
/* In sendMessage(), append aiMemory to the prompt: */

async function sendMessage(){
  if(!currentUser){ alert('Please sign in first'); return; }
  const text = composer.value.trim();
  if(!text) return;

  localMemory.push({role:'user', text});
  localStorage.setItem('coachjoel_mem_' + currentUser, JSON.stringify(localMemory));
  renderChat();
  composer.value = '';
  status('Thinking...');

  const profile = aiMemory.find(a => a.id?.toLowerCase() === currentUser?.toLowerCase() || a.telegram?.toLowerCase() === currentUser?.toLowerCase());
  const userInfo = profile ? `Profile: ${profile.name}` : 'Profile: not found';

  const aiMemoryText = aiMemory.map(m => `${m.name}:\n${m.content}`).join("\n\n");

  const prompt = SYSTEM_PROMPT + "\n\nAI Memory:\n" + aiMemoryText +
    "\n\nUser Info:\n" + userInfo +
    "\n\nConversation:\n" +
    localMemory.slice(-12).map(m => (m.role==='user' ? `User: ${m.text}` : `Coach Joel AI: ${m.text}`)).join("\n") +
    `\n\nUser: ${text}\nAssistant:`;

  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    status('Please wait...');
    const resp = await fetch(GEMINI_ENDPOINT + '?key=' + encodeURIComponent(API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await resp.json();
    const answer = j?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n') || 'I could not generate a response. Please try again later.';
    status('Ready');
    showTypingReveal(answer);
    speakText(answer);
  } catch(err){
    console.error('API error', err);
    localMemory.push({role:'ai', text: 'Error: ' + (err.message||err)});
    localStorage.setItem('coachjoel_mem_' + currentUser, JSON.stringify(localMemory));
    renderChat();
    status('Error contacting API');
  }
}

async function init(){
  await loadMemoryFromGitHub();
  if(window.speechSynthesis && window.speechSynthesis.getVoices().length === 0){
    window.speechSynthesis.onvoiceschanged = ()=>{};
  }
  status('Idle');
}
init();
