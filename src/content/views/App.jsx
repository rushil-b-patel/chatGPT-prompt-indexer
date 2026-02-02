import { useEffect, useState, useRef, useMemo, useCallback } from 'react';

function App() {
  const [prompts, setPrompts] = useState([]);
  const [isMinimized, setIsMinimized] = useState(true);
  const [position, setPosition] = useState(() => ({
    x: window.innerWidth - 290,
    y: 50
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [toggleSearch, setToggleSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dragStart = useRef({ x: 0, y: 0 });

  const SNIPPET_WIDTH = 240; // w-60 = 15rem = 240px
  const SNIPPET_MIN_HEIGHT = 100;

  const search = (query) => {
    setIsMinimized(false);
    setSearchQuery(query);
  }

  const clampPosition = useCallback((x, y) => ({
    x: Math.max(0, Math.min(x, window.innerWidth - SNIPPET_WIDTH)),
    y: Math.max(0, Math.min(y, window.innerHeight - SNIPPET_MIN_HEIGHT))
  }), []);

  const highlightText = useCallback((text, query) => {
    if (!query.trim()) {
      return text;
    };
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      return text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className={isDark ? 'bg-yellow-500/40 text-white rounded-sm px-0.5' : 'bg-yellow-300 rounded-sm px-0.5'}>
            {part}
          </mark>
        ) : part
      );
    } catch {
      return text;
    }
  }, [isDark]);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const messageHandler = (event) => {
      if (event.source !== window || event.data?.type !== 'PROMPT_INDEX_UPDATE') return;
      setPrompts(event.data.prompts || []);
    };
    window.addEventListener('message', messageHandler);

    const resizeHandler = () => {
      setPosition((prev) => ({
        x: Math.max(0, Math.min(prev.x, window.innerWidth - SNIPPET_WIDTH)),
        y: Math.max(0, Math.min(prev.y, window.innerHeight - SNIPPET_MIN_HEIGHT))
      }));
    };
    window.addEventListener('resize', resizeHandler);

    return () => {
      observer.disconnect();
      window.removeEventListener('message', messageHandler);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  const scrollToPrompt = (index) => {
    const messages = document.querySelectorAll('[data-message-author-role="user"]');
    const el = messages[index];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  };

  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) {
      return prompts.map((p, i) => ({
        text: p,
        originalIndex: i
      }));
    }

    const q = searchQuery.toLowerCase();

    return prompts
      .map((p, i) => ({ text: p, originalIndex: i }))
      .filter(({ text }) => text.toLowerCase().includes(q));
  }, [prompts, searchQuery]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  // Drag handling effect (kept separate due to isDragging dependency)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      setPosition(clampPosition(newX, newY));
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
  }, [isDragging, clampPosition]);

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
        {toggleSearch ? (
          <input
            type="text"
            value={searchQuery}
            placeholder="Search..."
            autoFocus
            className={`w-3/4 px-2 py-1 text-sm rounded-lg outline-none transition-all duration-200 border ${
              isDark
                ? 'bg-[#2d2d2d] border-white/20 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            }`}
            onChange={(e) => search(e.target.value)}
          />
        ) : (
          <span className={`font-medium text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Index ({prompts.length})
          </span>
        )}
        <div className="flex items-center justify-around">
          <button
            onClick={() => setToggleSearch(!toggleSearch)}
            className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-400'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-4.65a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
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
      </div>

      {!isMinimized && (
        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-600 scrollbar-thin">
          <ul className="space-y-1">
            {filteredPrompts.map(({ text, originalIndex }, i) => (
              <li
                key={originalIndex}
                onClick={() => scrollToPrompt(originalIndex)}
                className={`group cursor-pointer px-3 py-2 rounded-xl transition-all duration-200 text-sm flex items-baseline gap-3 ${isDark ? 'hover:bg-white/10 text-white hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
              >
                <span className="opacity-50 font-mono text-xs w-6 text-right flex-shrink-0">{originalIndex + 1}.</span>
                <span className="line-clamp-2 leading-relaxed">{highlightText(text, searchQuery)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
