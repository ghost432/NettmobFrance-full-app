import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export const AIAssistantWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Bonjour ! 👋 Je suis l'Assistant IA de NettmobFrance. Comment puis-je vous aider aujourd'hui ? Que ce soit pour comprendre le fonctionnement, écrire une belle description de mission ou créer un profil parfait, je suis là !"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Préparer l'historique pour l'API (sans les ids uniques internes)
            const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
            chatHistory.push({ role: 'user', content: userMessage.content });

            const response = await api.post('/ai/chat', { messages: chatHistory });

            if (response.data && response.data.message) {
                setMessages(prev => [
                    ...prev,
                    { id: (Date.now() + 1).toString(), role: 'assistant', content: response.data.message.content }
                ]);
            } else {
                throw new Error("Format de réponse inattendu");
            }
        } catch (error) {
            console.error('Erreur Chat IA:', error);
            setMessages(prev => [
                ...prev,
                { id: (Date.now() + 1).toString(), role: 'assistant', content: "Désolé, je rencontre des difficultés techniques pour vous répondre en ce moment. L'IA est peut-être surchargée.", isError: true }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Toggle Button & Tooltip */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                {/* Floating Label / Tooltip */}
                {!isOpen && (
                    <div className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium px-3 py-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-700 animate-fade-in animate-bounce">
                        Assistant IA 👋
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 relative",
                        isOpen ? "bg-slate-800 text-white scale-90 rotate-90" : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-110"
                    )}
                    aria-label="Toggle AI Assistant"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}

                    {/* Notification ping */}
                    {!isOpen && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
                        </span>
                    )}
                </button>
            </div>

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-32px)] sm:w-[340px] h-[450px] max-h-[calc(100vh-100px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 origin-bottom-right border border-blue-100 dark:border-slate-800",
                    isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-20 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4 text-white flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm overflow-hidden p-1">
                        <img src="/favicon-1.png" alt="NettmobFrance AI" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Assistant NettmobFrance</h3>
                        <p className="text-xs text-blue-100 opacity-90">Posez-moi vos questions !</p>
                    </div>
                </div>

                {/* Messages Layout */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50 scroll-smooth">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-3 max-w-[85%] text-sm",
                                message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            <div className={cn(
                                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden",
                                message.role === 'user' ? "bg-blue-600 text-white" : message.isError ? "bg-red-100 text-red-600" : "bg-white p-0.5 border border-slate-100 text-white"
                            )}>
                                {message.role === 'user' ? <User className="w-4 h-4" /> : message.isError ? <AlertCircle className="w-4 h-4" /> : <img src="/favicon-1.png" alt="AI" className="w-full h-full object-contain" />}
                            </div>

                            <div className={cn(
                                "p-3 rounded-2xl",
                                message.role === 'user'
                                    ? "bg-blue-600 text-white rounded-tr-none"
                                    : message.isError
                                        ? "bg-red-50 text-red-800 border border-red-100 rounded-tl-none dark:bg-red-950/30 dark:text-red-300 dark:border-red-900"
                                        : "bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                            )}>
                                {message.role === 'assistant' ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                                        <ReactMarkdown
                                            components={{
                                                a: ({ node, href, children, ...props }) => {
                                                    const isExternal = href && !href.startsWith('/');
                                                    return (
                                                        <a
                                                            href={href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:text-blue-700 underline font-medium"
                                                            {...props}
                                                        >
                                                            {children}
                                                        </a>
                                                    );
                                                }
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 max-w-[85%] mr-auto">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white p-0.5 border border-slate-100 shadow-sm overflow-hidden">
                                <img src="/favicon-1.png" alt="AI" className="w-full h-full object-contain" />
                            </div>
                            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm dark:bg-slate-800 dark:border-slate-700 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                <span className="text-xs text-slate-500 dark:text-slate-400">L'assistant réfléchit...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <form onSubmit={handleSend} className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Écrivez votre message..."
                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-transparent"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-1 w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>
                    <div className="p-2 text-center border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400">Propulsé par NettmobFrance IA</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AIAssistantWidget;
