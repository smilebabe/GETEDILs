// frontend/src/lib/context-builder.js
export const contextBuilder = {
    async buildContext({ userId, profile, walletBalance, recentActivity, location, preferences }) {
        const context = {
            user: {
                id: userId,
                name: profile?.full_name,
                trustScore: profile?.trust_score,
                verified: profile?.is_verified,
                joinDate: profile?.created_at
            },
            financial: {
                balance: walletBalance,
                recentTransactions: recentActivity?.transactions?.slice(0, 5),
                monthlySpend: this.calculateMonthlySpend(recentActivity?.transactions)
            },
            professional: {
                skills: profile?.skills || [],
                jobMatches: recentActivity?.jobs?.length || 0,
                enrolledCourses: recentActivity?.enrollments?.length || 0
            },
            location: {
                region: location || profile?.region,
                city: profile?.city,
                timezone: 'Africa/Addis_Ababa'
            },
            preferences: {
                language: preferences?.language || 'am',
                notifications: preferences?.notifications || true,
                darkMode: preferences?.theme === 'dark'
            },
            temporal: {
                hour: new Date().getHours(),
                day: new Date().getDay(),
                month: new Date().getMonth(),
                isRamadan: this.isRamadan(),
                isEthiopianHoliday: await this.checkEthiopianHoliday()
            }
        };
        
        return context;
    },
    
    calculateMonthlySpend(transactions) {
        if (!transactions) return 0;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return transactions
            .filter(t => t.type === 'debit' && new Date(t.created_at) > thirtyDaysAgo)
            .reduce((sum, t) => sum + t.amount, 0);
    },
    
    isRamadan() {
        // Check if current date is within Ramadan
        const now = new Date();
        // Simplified - implement actual Islamic calendar logic
        return false;
    },
    
    async checkEthiopianHoliday() {
        // API call to check Ethiopian holidays
        try {
            const response = await fetch('/api/ethiopian-holidays/today');
            const data = await response.json();
            return data.isHoliday;
        } catch {
            return false;
        }
    }
};
