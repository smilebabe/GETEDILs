// frontend/src/lib/pillarRouter.js
import { supabase } from './supabase';

const pillarMap = {
  job: 'P3 GetJob',
  health: 'P8 GetHealth',
  marketplace: 'P6 GetMarketplace',
  governance: 'P15 GetGovernance',
  analytics: 'P14 GetAnalytics',
  agentic: 'P27 GetAgentic'
};

export default class PillarRouter {
  static async handleMessage({ user, role, content }) {
    const lower = content.toLowerCase();
    let pillarKey = null;

    for (const key of Object.keys(pillarMap)) {
      if (lower.includes(key)) {
        pillarKey = key;
        break;
      }
    }

    if (!pillarKey) {
      return `I couldn’t map your request. Please specify a pillar (e.g., job, health, governance).`;
    }

    switch (pillarKey) {
      case 'job':
        return await this.handleJob(user, role, content);
      case 'health':
        return await this.handleHealth(user, role, content);
      case 'marketplace':
        return await this.handleMarketplace(user, role, content);
      case 'governance':
        return await this.handleGovernance(user, role, content);
      case 'analytics':
        return await this.handleAnalytics(user, role, content);
      case 'agentic':
        return await this.handleAgentic(user, role, content);
      default:
        return `Routing your request to **${pillarMap[pillarKey]}**. Handler not yet implemented.`;
    }
  }

  // === Pillar Handlers ===

  static async handleJob(user, role, content) {
    const { data, error } = await supabase
      .from('jobs')
      .select('title, company, location')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) return `Error fetching jobs: ${error.message}`;
    if (!data.length) return `No job listings available right now.`;

    return `Here are the latest job listings:\n${data.map(j => `- ${j.title} at ${j.company} (${j.location})`).join('\n')}`;
  }

  static async handleHealth(user, role, content) {
    const { data, error } = await supabase
      .from('health_records')
      .select('record_type, notes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) return `Error fetching health records: ${error.message}`;
    if (!data.length) return `No health records found for your account.`;

    return `Your recent health records:\n${data.map(r => `- ${r.record_type}: ${r.notes} (${new Date(r.created_at).toLocaleDateString()})`).join('\n')}`;
  }

  static async handleMarketplace(user, role, content) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('title, price, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) return `Error fetching marketplace items: ${error.message}`;
    if (!data.length) return `No active marketplace items available.`;

    return `Latest marketplace items:\n${data.map(i => `- ${i.title} ($${i.price}) [${i.status}]`).join('\n')}`;
  }

  static async handleGovernance(user, role, content) {
    if (!['admin','governance'].includes(role)) {
      return `Access denied. Governance is restricted to admins and governance members.`;
    }

    const { data, error } = await supabase
      .from('governance_policies')
      .select('title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) return `Error fetching governance policies: ${error.message}`;
    if (!data.length) return `No governance policies available.`;

    return `Recent governance policies:\n${data.map(p => `- ${p.title} [${p.status}] (${new Date(p.created_at).toLocaleDateString()})`).join('\n')}`;
  }

  static async handleAnalytics(user, role, content) {
    if (!['premium','admin'].includes(role)) {
      return `Access denied. Analytics are restricted to premium users and admins.`;
    }
    return `Analytics pillar accessed. You can run advanced queries and visualize system metrics. (Stub for future dashboards)`;
  }

  static async handleAgentic(user, role, content) {
    if (role !== 'ai_agent') {
      return `Access denied. Agentic operations are restricted to AI agents.`;
    }
    return `Agentic pillar accessed. AI orchestration workflows can be triggered here. (Stub for automation engine)`;
  }
}
