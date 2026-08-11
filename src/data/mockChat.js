/**
 * Centralized Mock Conversational Dataset for MigraineGuardian
 *
 * NOTE: Simulated health companion responses grounded in evidence literature.
 */

export const MOCK_CHAT_DATA = {
  header: {
    title: 'MigraineGuardian',
    subtext: 'Personalized migraine information and support',
    trustIndicator: 'Educational support • Not a diagnosis',
  },
  suggestedQuestions: [
    'Why was my risk higher this week?',
    'What patterns do you notice in my logs?',
    'How can I improve my sleep routine?',
    'What does my weekly report mean?',
    'Can you explain my stress pattern?',
  ],
  conversationHistory: [
    { id: '1', title: 'Risk Factor Interpretation', date: 'Today, 8:15 AM', active: true },
    { id: '2', title: 'Sleep Consistency & Melatonin', date: 'Yesterday', active: false },
    { id: '3', title: 'Hydration Buffer Guidelines', date: '3 days ago', active: false },
    { id: '4', title: 'Weekly Report Walkthrough', date: 'Last week', active: false },
  ],
  initialMessages: [
    {
      id: 'msg-1',
      sender: 'assistant',
      text: 'Hello! I am here to help you understand your recent patterns, explore gentle lifestyle buffers, and review your tracking data in a calm, supportive space.',
      sources: ['American Migraine Foundation', 'Journal of Headache and Pain (2023)'],
      time: 'Just now',
    },
    {
      id: 'msg-2',
      sender: 'user',
      text: 'Why was my risk higher this week?',
      time: '8:31 AM',
    },
    {
      id: 'msg-3',
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
      time: '8:31 AM',
    },
  ],
};
