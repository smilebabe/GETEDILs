// frontend/src/lib/context-builder.js

export const contextBuilder = {
    /**
     * Builds a comprehensive user context for the AI.
     * Uses defensive programming to ensure "SYSTEM_OFFLINE" is never triggered.
     */
    async buildContext({ userId, profile, walletBalance, recentActivity, location, preferences }) {
        const now = new Date();
        
        const context = {
            // CRITICAL: Tells the GETEAssistant the neural link is active
            status: (userId || profile) ? "ONLINE" : "GUEST_MODE",
            
            user: {
                id: userId || 'guest_id',
                name: profile?.full_name || 'Valued User',
                trustScore: profile?.trust_score || 0,
                verified: profile?.is_verified || false,
                joinDate: profile?.created_at || now.toISOString()
            },
            
            financial: {
                balance: walletBalance || 0,
                recentTransactions: recentActivity?.transactions?.slice(0, 5) || [],
                monthlySpend: this.calculateMonthlySpend(recentActivity?.transactions || [])
            },
            
            professional: {
                skills: profile?.skills || [],
                jobMatches: recentActivity?.jobs?.length || 0,
                enrolledCourses: recentActivity?.enrollments?.length || 0,
                isDeveloper: profile?.skills?.some(s => ['react', 'next.js', 'python'].includes(s.toLowerCase())) || false
            },
            
            location: {
                region: location || profile?.region || 'Addis Ababa',
                city: profile?.city || 'Ethiopia',
                timezone: 'Africa/Addis_Ababa'
            },
            
            preferences: {
                language: preferences?.language || 'am', // Defaults to Amharic
                notifications: preferences?.notifications ?? true,
                darkMode: preferences?.theme === 'dark' || true // OS usually defaults to dark
            },
            
            temporal: {
                hour: now.getHours(),
                day: now.getDay(),
                month: now.getMonth(),
                isRamadan: this.isRamadan(),
                isEthiopianHoliday: false // Default to false, updated by async check below
            }
        };

        // Non-blocking holiday check to prevent UI hang
        this.checkEthiopianHoliday().then(isHoliday => {
            context.temporal.isEthiopianHoliday = isHoliday;
        });
        
        return context;
    },
    
    /**
     * Calculates the sum of debits in the last 30 days.
     */
    calculateMonthlySpend(transactions) {
        if (!Array.isArray(transactions)) return 0;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return transactions
            .filter(t => t.type === 'debit' && new Date(t.created_at) > thirtyDaysAgo)
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    },
    
    /**
     * Check if current date falls within Ramadan.
     */
    isRamadan() {
        const now = new Date();
        // 2026 Ramadan estimate: Feb 18 - Mar 19
        const ramadanStart2026 = new Date(2026, 1, 18); // Feb is 1
        const ramadanEnd2026 = new Date(2026, 2, 19);   // Mar is 2
        return now >= ramadanStart2026 && now <= ramadanEnd2026;
    },
    
    /**
     * Calls internal API to check for local public holidays.
     */
    async checkEthiopianHoliday() {
        try {
            // Using your established API route
            const response = await fetch('/api/ethiopian-holidays/today');
            if (!response.ok) return false;
            const data = await response.json();
            return !!data.isHoliday;
        } catch (error) {
            // Silent fail to maintain OS stability
            return false;
        }
    }
};
