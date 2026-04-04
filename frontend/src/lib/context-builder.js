// src/lib/context-builder.js
export const contextBuilder = {
    buildContext: async ({ userId, profile, walletBalance, location }) => {
        return {
            timestamp: new Date().toISOString(),
            user_tier: profile?.tier || 'free',
            current_balance: walletBalance,
            market_context: 'Ethiopia',
            region: location || 'Addis Ababa',
            active_pillar: window.location.pathname.split('/')[1] || 'dashboard'
        };
    }
};
