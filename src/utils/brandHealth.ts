// Utility to calculate Brand Health Score
// Based on profile completeness, activity, and social connections

export const calculateBrandHealth = (user: any): number => {
    if (!user) return 0;

    let score = 0;

    // 1. Profile Completeness (Max 30)
    if (user.name) score += 10;
    if (user.email) score += 10;
    if (user.phone) score += 10;

    // 2. Subscription Status (Max 20)
    if (user.plan && user.plan !== 'free') {
        score += 20;
    } else {
        score += 5; // Free tier base
    }

    // 3. Activity & Gamification (Max 30)
    // Assuming these are passed in context or stored in user metadata for now
    // For MVP, we simulate or check basic properties
    if (user.role === 'admin') score += 30; // Admins always healthy :P
    else {
        // Mock checks
        score += 10; // Active user
        if (user.xp && user.xp > 1000) score += 10;
        if (user.level && user.level > 2) score += 10;
    }

    // 4. Verification (Max 20)
    if (user.email_verified) score += 20; // Assuming this field exists or mocked

    return Math.min(100, score);
};

export const getHealthRecommendations = (score: number, user: any): string[] => {
    const recs = [];

    if (!user.phone) recs.push('Telefon numaranızı ekleyin (+10 Puan)');
    if (user.plan === 'free') recs.push('Premium plana geçin (+15 Puan)');
    if (score < 50) recs.push('Profil bilgilerinizi tamamlayın');

    if (recs.length === 0 && score < 100) recs.push('Daha fazla proje oluşturun');
    if (score === 100) recs.push('Harika! Marka sağlığınız zirvede.');

    return recs;
};
