import { useEffect, useState, useRef } from 'react';

function App() {
  const [prompts, setPrompts] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.source !== window || event.data?.type !== 'PROMPT_INDEX_UPDATE') return;
      setPrompts(event.data.prompts || []);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const scrollToPrompt = (index) => {
    const messages = document.querySelectorAll('[data-message-author-role="user"]');
    const el = messages[index];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (prompts.length === 0) return null;

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: 9999,
      }}
      className={` ${isDark ? 'dark' : ''}  transition-shadow duration-300 ${isDragging ? 'shadow-lg' : 'shadow-md'} font-sans border rounded-2xl overflow-hidden w-60 flex flex-col ${isDark ? 'bg-[#212121] border-white/10 text-white' : 'bg-white/95 border-gray-200 text-gray-900'} backdrop-blur-md`}
    >
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between p-3 cursor-move select-none border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50/80 border-gray-100'}`}
      >
        <span className={`font-medium text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Index ({prompts.length})
        </span>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className={`p-1 rounded-md transition-colors group ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-400'}`}
        >
          {isMinimized ? (
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          ) : (
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          )}
        </button>
      </div>

      {!isMinimized && (
        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-600 scrollbar-thin">
          <ul className="space-y-1">
            {prompts.map((p, i) => (
              <li
                key={i}
                onClick={() => scrollToPrompt(i)}
                className={`group cursor-pointer px-3 py-2 rounded-xl transition-all duration-200 text-sm flex items-baseline gap-3 ${isDark ? 'hover:bg-white/10 text-white hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
              >
                <span className="opacity-50 font-mono text-xs w-6 text-right flex-shrink-0">{i + 1}.</span>
                <span className="line-clamp-2 leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
