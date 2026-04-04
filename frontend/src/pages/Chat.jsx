import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../lib/api';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from '../components/ui/toast';

const Chat = () => {
  useDocumentTitle('Messages');
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await chatAPI.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Erreur chargement conversations:', error);
        toast.error('Impossible de charger les conversations');
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedConv) {
        try {
          const { data } = await chatAPI.getMessages(selectedConv.id);
          setMessages(data);
        } catch (error) {
          console.error('Erreur chargement messages:', error);
          toast.error('Impossible de charger les messages');
        }
      }
    };
    fetchMessages();
  }, [selectedConv]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const { data } = await chatAPI.sendMessage(selectedConv.id, { message: newMessage });
      setMessages([...messages, data]);
      setNewMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error('Impossible d\'envoyer le message');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="text-2xl font-bold text-primary">NettmobFrance</Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link to="/missions" className="text-foreground hover:text-primary transition-colors">Missions</Link>
            <ThemeToggle />
            <button onClick={logout} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">Déconnexion</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 h-[600px]">
          <div className="bg-card rounded-lg shadow border border-border overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Conversations</h3>
            </div>
            {conversations.map(conv => (
              <div key={conv.id} onClick={() => setSelectedConv(conv)}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${selectedConv?.id === conv.id ? 'bg-primary/10' : 'hover:bg-accent'}`}>
                <h4 className="font-semibold text-foreground">{conv.participant_name}</h4>
                <p className="text-sm text-muted-foreground">{conv.mission_title}</p>
              </div>
            ))}
          </div>

          <div className="col-span-2 bg-card rounded-lg shadow border border-border flex flex-col">
            {selectedConv ? (
              <>
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">{selectedConv.participant_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedConv.mission_title}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender_id === user.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
                  <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Votre message..." className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground" />
                  <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Envoyer
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Sélectionnez une conversation
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
