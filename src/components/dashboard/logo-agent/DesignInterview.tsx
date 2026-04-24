
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import type { BrandProfile } from './LogoEngine';

interface DesignInterviewProps {
    user: any;
    onComplete: (profile: BrandProfile) => void;
}

interface Message {
    id: number;
    text: string;
    sender: 'agent' | 'user';
    type?: 'text' | 'options';
    options?: string[];
}

const DesignInterview = ({ user, onComplete }: DesignInterviewProps) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: `Merhaba ${user?.name || 'Gezgin'}. Ben Neo, sana özel grafik tasarımcı ajanım. Markan için mükemmel logoyu tasarlamak üzere buradayım.`, sender: 'agent' }
    ]);
    const [currentStep, setCurrentStep] = useState(0);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Profile State
    const [profile, setProfile] = useState<BrandProfile & { details?: string }>({
        name: '',
        industry: '',
        spirit: '',
        geometry: '',
        vibe: '',
        details: ''
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Start conversation after a brief delay
        if (currentStep === 0) {
            setTimeout(() => {
                addAgentMessage("Öncelikle, markanızı diğerlerinden ayıran o ismi öğrenebilir miyim? (Marka Adı)");
                setCurrentStep(1);
            }, 1000);
        }
    }, [currentStep]);

    const addAgentMessage = (text: string, options?: string[]) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text,
                sender: 'agent',
                type: options ? 'options' : 'text',
                options
            }]);
        }, 1200);
    };

    const handleUserResponse = (text: string) => {
        const newMsg: Message = { id: Date.now(), text, sender: 'user' };
        setMessages(prev => [...prev, newMsg]);
        processResponse(text);
    };

    const processResponse = (response: string) => {
        switch (currentStep) {
            case 1: // Name
                setProfile(prev => ({ ...prev, name: response }));
                addAgentMessage(`Harika, "${response}" kulağa güçlü geliyor. Peki, hangi sektörde faaliyet gösteriyorsunuz?`,
                    ['Futbol / Spor Kulübü', 'Teknoloji / Yazılım', 'E-Ticaret / Moda', 'Danışmanlık', 'Yeme / İçme']);
                setCurrentStep(2);
                break;
            case 2: // Industry (Key Branching Point)
                setProfile(prev => ({ ...prev, industry: response }));

                const lowerRes = response.toLowerCase();
                // Context Check: Sports/Games
                if (lowerRes.includes('futbol') || lowerRes.includes('spor') || lowerRes.includes('kulüp') || lowerRes.includes('oyun') || lowerRes.includes('menajer')) {
                    addAgentMessage("Tam benim alanım! Bu bir takım veya oyun ise, logoda görmemiz gereken başrol oyuncusu kim? Hikayenin kahramanı?",
                        ['Teknik Direktör (Silüet)', 'Futbolcu (Aksiyon)', 'Arma / Kalkan', 'Top / Ekipman', 'Hayvan Figürü (Aslan/Kartal)']);
                    setCurrentStep(2.5); // Intermediate Context Step
                }
                // Context Check: Tech
                else if (lowerRes.includes('tekno') || lowerRes.includes('yazılım')) {
                    addAgentMessage("Teknoloji dünyası soyutluğu sever. Peki görsel dilimiz nasıl olmalı?",
                        ['Devre Yolları / Çip', 'Soyut Veri Noktaları', 'Minimal Kod Sembolleri', 'Fütüristik Yazı']);
                    setCurrentStep(2.5);
                }
                else {
                    // Standard Flow
                    addAgentMessage("Not aldım. Şimdi markanızın ruhunu nasıl tanımlarsınız?",
                        ['Modern & Minimal', 'Klasik & Güvenilir', 'Eğlenceli & Enerjik', 'Lüks & Premium', 'Doğal & Organik']);
                    setCurrentStep(3);
                }
                break;

            case 2.5: // Specific Visual Details
                setProfile(prev => ({ ...prev, details: response }));
                addAgentMessage("Bu detayı 'Emblem' tasarımına işleyeceğim. Peki markanın genel ruhu ve hissiyatı nasıl olmalı?", // Transition to Spirit
                    ['Modern & Minimal', 'Klasik & Güvenilir (Kraliyet)', 'Agresif & Güçlü', 'Lüks & Premium', 'Dostane']);
                setCurrentStep(3);
                break;

            case 3: // Vibe (Mapped to Spirit)
                setProfile(prev => ({ ...prev, vibe: response.split(' ')[0] }));
                addAgentMessage("Tasarım diline geçiyoruz. Hangi geometrik formlar size daha yakın geliyor?",
                    ['Keskin Hatlar (Kalkan/Elmas)', 'Yumuşak Hatlar (Daire)', 'Soyut Formlar', 'Denge (Üçgen)']);
                setCurrentStep(4);
                break;

            case 4: // Geometry
                const geo = response.includes('Keskin') || response.includes('Kalkan') ? 'Sharp' : response.includes('Yumuşak') ? 'Round' : 'Abstract';
                setProfile(prev => ({ ...prev, geometry: geo }));

                // If we already have details (e.g. Manager), skip metaphor or make it supportive
                if (profile.details) {
                    addAgentMessage("Çok iyi. Son olarak, logoda kullanmamı istediğiniz, markanızı simgeleyen özel bir renk tonu veya metafor var mı?",
                        ['Altın / Bronz (Zafer)', 'Mavi / Gümüş (Teknoloji)', 'Kırmızı / Siyah (Güç)', 'Yeşil (Saha)', 'Siyah / Beyaz (Klasik)']);
                    setCurrentStep(5);
                } else {
                    addAgentMessage("Son olarak, markanızı temsil eden bir metafor seçin.",
                        ['Aslan (Güç)', 'Baykuş (Bilgelik)', 'Roket (Hız)', 'Ağaç (Büyüme)', 'Atom (Bilim)']);
                    setCurrentStep(5);
                }
                break;

            case 5: // Spirit/Metaphor/Color
                const finalSpirit = response.split(' ')[0];
                setProfile(prev => ({ ...prev, spirit: finalSpirit }));
                addAgentMessage("Mükemmel. Tüm kritik verileri topladım. Şimdi atölyeme çekilip özellikle istediğiniz detayları işleyerek çizimlere başlıyorum...", undefined);
                setCurrentStep(6);

                // Finish
                setTimeout(() => {
                    // Clean up response for spirit if it was color
                    const finalProfile = { ...profile, spirit: finalSpirit };
                    onComplete(finalProfile);
                }, 2500);
                break;
            default:
                break;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        handleUserResponse(inputText);
        setInputText('');
    };

    return (
        <div className="flex flex-col h-[70vh] bg-white/20 backdrop-blur-xl rounded-[2rem] border border-white/30 overflow-hidden shadow-2xl ring-1 ring-white/20">
            {/* Header */}
            <div className="glass-panel p-4 bg-white/10 border-b border-white/30 rounded-t-[2rem] flex items-center gap-4 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-white to-white/50 p-0.5 shadow-lg">
                    <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <span className="text-xl font-black text-orange-500 drop-shadow-sm">N</span>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg tracking-wide drop-shadow-md">Tasarımcı Neo</h3>
                    <p className="text-white/80 text-xs flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                        Çevrimiçi & Yazıyor...
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] rounded-3xl p-5 shadow-lg relative ${msg.sender === 'user'
                            ? 'bg-orange-500 text-white rounded-br-sm'
                            : 'bg-white/90 text-zinc-800 rounded-bl-sm backdrop-blur-sm'
                            }`}>
                            <p className={`text-base leading-relaxed ${msg.sender === 'agent' ? 'font-medium' : 'font-semibold'}`}>
                                {msg.text}
                            </p>

                            {/* Options */}
                            {msg.options && (
                                <div className="mt-4 grid grid-cols-1 gap-2">
                                    {msg.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleUserResponse(opt)}
                                            className="w-full text-left px-4 py-3 bg-indigo-50/50 hover:bg-orange-50 text-indigo-900 rounded-xl transition-all border border-indigo-100 hover:border-orange-200 hover:shadow-sm group flex items-center justify-between"
                                        >
                                            <span className="font-semibold">{opt}</span>
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-500">→</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl rounded-bl-sm p-4 flex gap-2 shadow-lg">
                            <span className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce delay-0" />
                            <span className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce delay-100" />
                            <span className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce delay-200" />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white/10 border-t border-white/10 backdrop-blur-md flex items-center justify-center gap-3">
                <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Cevabınızı yazın..."
                    className="flex-1 w-full bg-white/20 text-white placeholder:text-white/20 rounded-full px-6 py-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/10 transition-all shadow-inner"
                    disabled={isTyping}
                />
                <button
                    type="submit"
                    className="w-14 h-14 bg-white text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    disabled={!inputText.trim() || isTyping}
                >
                    <Send size={24} className="" />
                </button>
            </form>
        </div>
    );
};

export default DesignInterview;
