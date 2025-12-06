import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    Search, ArrowDown, ArrowUp, X, Maximize2, Minimize2,
    WrapText, Hash, Copy, Clipboard, FileText
} from 'lucide-react';
import { cn } from '../../utils/helpers';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: 'ini' | 'text';
    readOnly?: boolean;
    placeholder?: string;
}

interface SearchMatch {
    lineIndex: number;
    startIndex: number;
    endIndex: number;
}

export default function CodeEditor({
    value,
    onChange,
    readOnly = false,
    placeholder = 'Enter configuration...'
}: CodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentMatch, setCurrentMatch] = useState(0);
    const [matches, setMatches] = useState<SearchMatch[]>([]);
    const [wordWrap, setWordWrap] = useState(true);
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
    const [showGoToLine, setShowGoToLine] = useState(false);
    const [goToLineValue, setGoToLineValue] = useState('');

    const lines = useMemo(() => value.split('\n'), [value]);

    // Update cursor position on selection change
    const updateCursorPosition = useCallback(() => {
        if (textareaRef.current) {
            const pos = textareaRef.current.selectionStart;
            const textBefore = value.substring(0, pos);
            const linesBefore = textBefore.split('\n');
            setCursorPosition({
                line: linesBefore.length,
                column: linesBefore[linesBefore.length - 1].length + 1
            });
        }
    }, [value]);

    // Sync scroll between textarea and line numbers
    const handleScroll = useCallback(() => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    }, []);

    // Search functionality
    useEffect(() => {
        if (!searchQuery) {
            setMatches([]);
            setCurrentMatch(0);
            return;
        }

        const newMatches: SearchMatch[] = [];
        const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

        lines.forEach((line, lineIndex) => {
            let match;
            while ((match = regex.exec(line)) !== null) {
                newMatches.push({
                    lineIndex,
                    startIndex: match.index,
                    endIndex: match.index + match[0].length
                });
            }
        });

        setMatches(newMatches);
        setCurrentMatch(newMatches.length > 0 ? 0 : -1);
    }, [searchQuery, lines]);

    const goToNextMatch = useCallback(() => {
        if (matches.length > 0) {
            const next = (currentMatch + 1) % matches.length;
            setCurrentMatch(next);
            scrollToMatch(matches[next]);
        }
    }, [matches, currentMatch]);

    const goToPrevMatch = useCallback(() => {
        if (matches.length > 0) {
            const prev = currentMatch === 0 ? matches.length - 1 : currentMatch - 1;
            setCurrentMatch(prev);
            scrollToMatch(matches[prev]);
        }
    }, [matches, currentMatch]);

    const scrollToMatch = (match: SearchMatch) => {
        if (textareaRef.current) {
            const lineHeight = 20;
            textareaRef.current.scrollTop = match.lineIndex * lineHeight - 100;
        }
    };

    const goToLine = useCallback(() => {
        const lineNum = parseInt(goToLineValue, 10);
        if (isNaN(lineNum) || lineNum < 1 || lineNum > lines.length) return;

        if (textareaRef.current) {
            const lineHeight = 20;
            textareaRef.current.scrollTop = (lineNum - 1) * lineHeight;

            const position = lines.slice(0, lineNum - 1).join('\n').length + (lineNum > 1 ? 1 : 0);
            textareaRef.current.setSelectionRange(position, position);
            textareaRef.current.focus();
        }
        setShowGoToLine(false);
        setGoToLineValue('');
    }, [goToLineValue, lines]);

    const handleCopy = useCallback(() => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const selected = value.substring(start, end);
            if (selected) {
                navigator.clipboard.writeText(selected);
            } else {
                navigator.clipboard.writeText(value);
            }
        }
    }, [value]);

    const handlePaste = useCallback(async () => {
        const text = await navigator.clipboard.readText();
        if (textareaRef.current && text) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newValue = value.substring(0, start) + text + value.substring(end);
            onChange(newValue);
        }
    }, [value, onChange]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'f':
                        e.preventDefault();
                        setShowSearch(true);
                        break;
                    case 'g':
                        e.preventDefault();
                        setShowGoToLine(true);
                        break;
                }
            }
            if (e.key === 'Escape') {
                setShowSearch(false);
                setShowGoToLine(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div
            className={cn(
                "flex flex-col bg-slate-950 rounded-xl border border-slate-700/50 overflow-hidden transition-all",
                isFullscreen && "fixed inset-4 z-50"
            )}
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700/50">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowSearch(s => !s)}
                        className={cn(
                            "p-1.5 rounded hover:bg-slate-700 transition-colors",
                            showSearch ? "bg-slate-700 text-emerald-400" : "text-slate-400"
                        )}
                        title="Find (Ctrl+F)"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    <button
                        onClick={() => setShowGoToLine(true)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-colors"
                        title="Go to Line (Ctrl+G)"
                    >
                        <Hash className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-colors"
                        title="Copy"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handlePaste}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-colors"
                        title="Paste"
                    >
                        <Clipboard className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowLineNumbers(s => !s)}
                        className={cn(
                            "p-1.5 rounded hover:bg-slate-700 transition-colors",
                            showLineNumbers ? "text-emerald-400" : "text-slate-400"
                        )}
                        title="Toggle Line Numbers"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setWordWrap(w => !w)}
                        className={cn(
                            "p-1.5 rounded hover:bg-slate-700 transition-colors",
                            wordWrap ? "text-emerald-400" : "text-slate-400"
                        )}
                        title="Toggle Word Wrap"
                    >
                        <WrapText className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsFullscreen(f => !f)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-colors"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700/50">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find..."
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-emerald-500"
                        autoFocus
                    />
                    <span className="text-xs text-slate-400 min-w-[60px]">
                        {matches.length > 0 ? `${currentMatch + 1}/${matches.length}` : 'No results'}
                    </span>
                    <button onClick={goToPrevMatch} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                        <ArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={goToNextMatch} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                        <ArrowDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowSearch(false)} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Go to Line Dialog */}
            {showGoToLine && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700/50">
                    <span className="text-sm text-slate-400">Go to line:</span>
                    <input
                        type="number"
                        value={goToLineValue}
                        onChange={(e) => setGoToLineValue(e.target.value)}
                        min={1}
                        max={lines.length}
                        placeholder={`1-${lines.length}`}
                        className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-emerald-500"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && goToLine()}
                    />
                    <button
                        onClick={goToLine}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm"
                    >
                        Go
                    </button>
                    <button onClick={() => setShowGoToLine(false)} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Editor Area */}
            <div className={cn("flex flex-1", isFullscreen ? "h-[calc(100%-80px)]" : "h-[70vh]")}>
                {/* Line Numbers */}
                {showLineNumbers && (
                    <div
                        ref={lineNumbersRef}
                        className="flex-shrink-0 w-12 bg-slate-900/50 border-r border-slate-700/30 overflow-y-auto select-none"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        <div className="py-2 pr-2 text-right font-mono text-xs leading-5">
                            {lines.map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-5",
                                        cursorPosition.line === i + 1 ? "text-emerald-400" : "text-slate-600"
                                    )}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    onClick={updateCursorPosition}
                    onKeyUp={updateCursorPosition}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    spellCheck={false}
                    className={cn(
                        "flex-1 py-2 px-3 bg-transparent text-emerald-100 resize-none focus:outline-none font-mono text-sm leading-5",
                        wordWrap ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto"
                    )}
                    style={{
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        tabSize: 4
                    }}
                />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-700 text-white text-xs">
                <div className="flex items-center gap-4">
                    <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                    <span>{lines.length} lines</span>
                    <span>{value.length} characters</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>INI</span>
                    <span>UTF-8</span>
                </div>
            </div>
        </div>
    );
}
