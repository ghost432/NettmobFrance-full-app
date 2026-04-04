import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation, clientNavigation } from '@/constants/navigation';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    MessageSquare,
    Send,
    ArrowLeft,
    AlertCircle,
    CheckCircle,
    Eye,
    Clock,
    XCircle,
    Loader2,
    Paperclip
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { safeJsonParse } from '@/lib/utils';

const DisputeDetails = () => {
    useDocumentTitle('Détails du Litige');
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [dispute, setDispute] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchDispute = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/disputes/${id}`);
            setDispute(data.dispute);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Erreur chargement litige:', error);
            toast.error('Erreur lors du chargement du litige');
            navigate(`/${user.role}/disputes`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchDispute();
        }
    }, [id, user.role, navigate]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + attachments.length > 3) {
            toast.error('Maximum 3 fichiers attachés autorisés par message');
            return;
        }
        setAttachments(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && attachments.length === 0) return;

        try {
            setSending(true);
            const formData = new FormData();
            formData.append('message', newMessage);

            attachments.forEach(file => {
                formData.append('attachments', file);
            });

            await api.post(`/disputes/${id}/message`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setNewMessage('');
            setAttachments([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            await fetchDispute();
        } catch (error) {
            console.error('Erreur envoi message:', error);
            toast.error('Erreur lors de l\'envoi du message');
        } finally {
            setSending(false);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: { variant: 'secondary', icon: Clock, label: 'En attente' },
            under_review: { variant: 'default', icon: Eye, label: 'En examen' },
            resolved: { variant: 'success', icon: CheckCircle, label: 'Résolu' },
            rejected: { variant: 'destructive', icon: XCircle, label: 'Rejeté' }
        };

        const config = variants[status] || variants.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const menuItems = user?.role === 'automob' ? automobNavigation : clientNavigation;

    if (loading) {
        return (
            <DashboardLayout
                title="Détails du Litige"
                description="Chargement..."
                menuItems={menuItems}
            >
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    if (!dispute) return null;

    return (
        <DashboardLayout
            title="Détails du Litige"
            description={`Litige #${dispute.id} pour la mission: ${dispute.mission_title}`}
            menuItems={menuItems}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <button
                        onClick={() => navigate(`/${user.role}/disputes`)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux litiges
                    </button>

                    <h2 className="text-xl font-bold">{dispute.title}</h2>

                    <div className="flex gap-2 mb-4 flex-wrap">
                        {getStatusBadge(dispute.status)}
                    </div>

                    <div className="space-y-3 mt-4 text-sm text-gray-700 dark:text-gray-300">
                        <div>
                            <strong>Mission:</strong> {dispute.mission_title}
                        </div>
                        <div>
                            <strong>Créé par:</strong> {dispute.creator_name} ({dispute.created_by_role})
                        </div>
                        <div>
                            <strong>Contre:</strong> {dispute.against_name} ({dispute.against_role})
                        </div>
                        <div>
                            <strong>Date:</strong> {new Date(dispute.created_at).toLocaleDateString()}
                        </div>
                        {parseFloat(dispute.disputed_amount) > 0 && (
                            <div>
                                <strong>Montant réclamé:</strong> {parseFloat(dispute.disputed_amount).toFixed(2)}€
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <strong>Description:</strong>
                            <p className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{dispute.description}</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col h-[calc(100vh-200px)] min-h-[500px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm" id="messages">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Messages
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <MessageSquare className="w-12 h-12 mb-2 text-gray-300" />
                                <p>Aucun message. Envoyez votre premier message ci-dessous.</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isOwn = msg.user_id === user.id;
                                const isAdmin = msg.user_role === 'admin';

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`text-xs text-gray-500 mb-1 px-1`}>
                                            {isAdmin ? 'Administrateur' : (isOwn ? 'Vous' : msg.user_name)}
                                        </div>
                                        <div
                                            className={`max-w-[80%] rounded-lg p-3 ${isAdmin
                                                ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100'
                                                : (isOwn
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                                                )
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap text-sm">{msg.message}</p>

                                            {msg.attachments && safeJsonParse(msg.attachments)?.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {safeJsonParse(msg.attachments).map((att, i) => (
                                                        <a
                                                            key={i}
                                                            href={`${import.meta.env.VITE_API_URL}${att}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs hover:underline mt-1 bg-black/10 p-1 rounded inline-block break-all"
                                                        >
                                                            <Paperclip className="w-3 h-3 flex-shrink-0" /> Pièce jointe {i + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(msg.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        {dispute.status === 'resolved' || dispute.status === 'rejected' ? (
                            <div className="text-center p-3 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg text-sm">
                                Ce litige est fermé. Vous ne pouvez plus envoyer de messages.
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Écrivez votre message..."
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={sending}
                                    />

                                    <input
                                        type="file"
                                        id="message-file"
                                        className="hidden"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={sending}
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                                        className="gap-2 shrink-0 px-3 md:px-4"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        <span className="hidden sm:inline">Envoyer</span>
                                    </Button>
                                </div>

                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {attachments.map((file, index) => (
                                            <span key={index} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">
                                                <Paperclip className="w-3 h-3" />
                                                {file.name}
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="text-red-500 hover:text-red-700 ml-1"
                                                >
                                                    <XCircle className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DisputeDetails;
