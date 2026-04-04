import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function PWAWelcome() {
    const navigate = useNavigate();

    const handleStart = () => {
        localStorage.setItem('pwa_launched', 'true');
        navigate('/login', { replace: true });
    };

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 text-center z-[9999]">
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
                <div className="w-24 h-24 mb-8 rounded-3xl bg-primary/10 flex items-center justify-center p-4">
                    <img src="/favicon-1.png" alt="NettmobFrance" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">
                    Bienvenue sur l'app <span className="text-primary block">NettmobFrance</span>
                </h1>
                <p className="text-muted-foreground font-medium mb-12">
                    Gérez vos missions, candidatures et plannings directement depuis votre mobile, avec des notifications en temps réel pour ne rien manquer.
                </p>
            </div>
            <div className="w-full max-w-sm pb-8">
                <Button
                    onClick={handleStart}
                    className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                    Commencer <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
            </div>
        </div>
    );
}
