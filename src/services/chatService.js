/**
 * Chat Service (Mock Frontend Architecture)
 *
 * Handles companion conversations, prompt processing, source citations, and evidence-grounded responses.
 */

import { MOCK_CHAT_DATA } from '../data/mockChat';

export const chatService = {
  getInitialChatContext: () => {
    return MOCK_CHAT_DATA;
  },

  getSuggestedQuestions: () => {
    return MOCK_CHAT_DATA.suggestedQuestions;
  },

  getConversationHistory: () => {
    return MOCK_CHAT_DATA.conversationHistory;
  },

  sendMessage: async (query) => {
    // Simulated network reflection delay
    await new Promise((res) => setTimeout(res, 600));

    const lower = query.toLowerCase();

    if (lower.includes('why') && lower.includes('risk')) {
      return {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: 'Your recent risk estimate is higher alongside reduced sleep and increased stress compared with your personal baseline. These patterns can be associated with migraine risk, although individual triggers vary.',
        dataPoints: [
          { label: 'Sleep', value: '5.8h', note: '1.2h below baseline' },
          { label: 'Stress', value: '8 / 10', note: 'Higher than recent average' },
          { label: 'Screen time', value: '8.2h', note: 'Elevated optical exposure' },
        ],
        recommendation:
          'Prioritizing 7.5 to 8 hours of quiet rest tonight and taking short screen breaks this afternoon can help support autonomic recovery.',
        sources: [
          'American Migraine Foundation',
          'Headache: The Journal of Head and Face Pain',
          'Mayo Clinic Clinical Guidelines',
        ],
        safetyNote:
          'Educational support only. If experiencing sudden "thunderclap" headache or severe visual symptoms, please seek prompt medical care.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    if (lower.includes('pattern') || lower.includes('logs') || lower.includes('notice')) {
      return {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: 'Looking across your last 7 to 30 days of entries, your logged episodes most frequently occurred when shorter sleep (<6.0 hours) coincided with high daily stress (>7/10).',
        dataPoints: [
          { label: 'Sleep Correlation', value: '68% recurrence', note: 'Precedes sensitive days' },
          { label: 'Hydration Buffer', value: '+0.6L improvement', note: 'Protective factor' },
          { label: 'Screen Sensitivity', value: '+18% sensitivity', note: 'Sessions >7.5h' },
        ],
        recommendation:
          'Maintaining your recent 2.2L hydration routine has created a valuable physiological buffer. Your main opportunity for balance is evening wind-down consistency.',
        sources: ['American Migraine Foundation', 'Neurology Clinical Practice'],
        safetyNote:
          'These insights illustrate personal associations and do not establish clinical causation.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    if (lower.includes('sleep') || lower.includes('routine') || lower.includes('rest')) {
      return {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: 'Sleep regularity is one of the most potent stabilizing factors for the trigeminal vascular system. Both sleep debt and erratic waking hours can lower your threshold to other sensory triggers.',
        dataPoints: [
          { label: 'Current 7-day Avg', value: '6.4h', note: 'Target: 7.5h' },
          { label: 'Consistency Delta', value: '±45 min', note: 'Bedtime variance' },
        ],
        recommendation:
          'Try establishing a quiet 45-minute buffer before sleep: dim overhead lights, switch devices to warm night mode, and avoid strenuous tasks.',
        sources: ['Sleep Foundation Clinical Review', 'Headache Journal (2022)'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    if (lower.includes('stress') || lower.includes('pss') || lower.includes('anxiety')) {
      return {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: 'Your entries show that daily stress ratings above 7/10 are associated with increased risk estimates. Stress elevates sympathetic tone and increases muscular tightness in the suboccipital and neck areas.',
        dataPoints: [
          { label: 'Recent Stress Mean', value: '6.2 / 10', note: 'Daily log index' },
          { label: 'Baseline PSS Score', value: '14 / 40', note: 'Moderate baseline' },
        ],
        recommendation:
          'Try 2 short "micro-resets" during your workday: 5 deep diaphragmatic breaths (4s in, 6s out) and gentle shoulder blade retractions.',
        sources: ['American Headache Society', 'Behavioral Medicine Guidelines'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    if (lower.includes('report') || lower.includes('doctor') || lower.includes('clinical')) {
      return {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: 'Your weekly report synthesizes your 2 recorded migraine days, average 54% risk probability, and lifestyle delta metrics to facilitate meaningful conversations with your doctor.',
        dataPoints: [
          { label: 'Logged Episodes', value: '2 Days', note: 'Wed & Sat' },
          { label: 'Avg Severity', value: '7.0 / 10', note: 'Moderate-severe' },
        ],
        recommendation:
          'You can view or print the full report on the Reports page to discuss medication timing and preventive routines with your neurologist.',
        sources: ['American Headache Society Physician Consensus'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    // Default supportive response
    return {
      id: `asst-${Date.now()}`,
      sender: 'assistant',
      text: 'Thank you for noting that. In your logs, we observe that your baseline stability responds best to consistent hydration, regular sleep timing, and steady screen pacing.',
      recommendation:
        'Would you like to review how this relates to your recent 7-day risk trend or explore a soothing wind-down routine?',
      sources: ['American Migraine Foundation', 'Neurology Research Literature'],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  },
};
