// Mock AI Service for Step Of Step
// In production, this would call OpenAI or a similar API

interface AIResponse {
    text: string;
    suggestions?: string[];
}



export const sendMessageToAI = async (message: string, context: any): Promise<AIResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerMsg = message.toLowerCase();

    // Context-aware responses
    if (lowerMsg.includes('merhaba') || lowerMsg.includes('selam')) {
        return {
            text: `Merhaba! Ben Step Of Step'in yapay zeka asistanıyım. ${context.userName ? context.userName + ', ' : ''}markanız için bugün size nasıl yardımcı olabilirim?`,
            suggestions: ['Marka kimliğimi nasıl güçlendiririm?', 'Sosyal medya stratejisi öner', 'Logo analizi yap']
        };
    }

    if (lowerMsg.includes('logo') || lowerMsg.includes('tasarım')) {
        return {
            text: "Logonuz markanızın yüzüdür. Modern, akılda kalıcı ve sektöre uygun olmalı. Eğer mevcut logonuzu analiz etmemi isterseniz, 'Logo Gen' aracımızı kullanabilir veya bana logonuzun hikayesini anlatabilirsiniz.",
            suggestions: ['Logo Gen aracına git', 'Renk paleti öner']
        };
    }

    if (lowerMsg.includes('sosyal medya') || lowerMsg.includes('instagram') || lowerMsg.includes('linkedin')) {
        return {
            text: "Sosyal medyada tutarlılık anahtardır. Hedef kitlenizin aktif olduğu saatlerde, değer katan içerikler paylaşmalısınız. 'Sosyal Akıl' (Social Mind) modülümüz ile içerik takvimi oluşturabiliriz.",
            suggestions: ['İçerik takvimi oluştur', 'Rakip analizi nasıl yapılır?']
        };
    }

    if (lowerMsg.includes('fiyat') || lowerMsg.includes('paket')) {
        return {
            text: "Markanızın büyüklüğüne ve hedeflerine göre farklı paketlerimiz mevcut. 'Paketi Yükselt' seçeneğinden size uygun planları inceleyebilirsiniz. Size özel bir teklif oluşturmamı ister misiniz?",
        };
    }

    // Default fallback
    return {
        text: "Bu konuda size yardımcı olabilirim. Marka stratejinizi geliştirmek için detayları konuşalım. Spesifik olarak hangi konuda takıldınız?",
        suggestions: ['Hedef kitle belirleme', 'Marka hikayesi oluşturma']
    };
};
