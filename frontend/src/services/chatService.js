/**
 * Chat Service (Frontend Architecture with Multilingual Readiness)
 *
 * Handles companion conversations, prompt processing, source citations, and evidence-grounded responses.
 * Prepared for future RAG chatbot integration with language parameter support.
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

  sendMessage: async (query, options = {}) => {
    // Determine language from options or default to 'en'
    const language = typeof options === 'string' ? options : (options?.language || 'en');

    // Simulated network reflection delay
    await new Promise((res) => setTimeout(res, 600));

    const lower = query.toLowerCase();

    // Prepare response based on query and language context
    if (lower.includes('why') && lower.includes('risk')) {
      let text = 'Your recent risk estimate is higher alongside reduced sleep and increased stress compared with your personal baseline. These patterns can be associated with migraine risk, although individual triggers vary.';
      let rec = 'Prioritizing 7.5 to 8 hours of quiet rest tonight and taking short screen breaks this afternoon can help support autonomic recovery.';
      
      if (language === 'hi') {
        text = 'आपकी व्यक्तिगत आधार रेखा की तुलना में कम नींद और बढ़े हुए तनाव के कारण आज आपका जोखिम अनुमान अधिक है। ये पैटर्न माइग्रेन के बढ़ते जोखिम से जुड़े हो सकते हैं।';
        rec = 'आज रात 7.5 से 8 घंटे की शांत नींद को प्राथमिकता देना और दोपहर में स्क्रीन से छोटे ब्रेक लेना आपके स्वास्थ्य को संतुलित करने में मदद कर सकता है।';
      } else if (language === 'mr') {
        text = 'तुमच्या नेहमीच्या नोंदींच्या तुलनेत कमी झोप आणि वाढलेल्या ताणामुळे आज तुमचा जोखीम अंदाज जास्त आहे. हे पॅटर्न मायग्रेनचा त्रास वाढण्याशी संबंधित असू शकतात.';
        rec = 'आज रात्री ७.५ ते ८ तास शांत झोप घेणे आणि दुपारच्या वेळी स्क्रीनपासून थोडे ब्रेक घेणे तुमच्या आरोग्यासाठी फायदेशीर ठरेल.';
      }

      return {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text,
        language,
        dataPoints: [
          { label: language === 'hi' ? 'नींद' : language === 'mr' ? 'झोप' : 'Sleep', value: '5.8h', note: '1.2h below baseline' },
          { label: language === 'hi' ? 'तनाव' : language === 'mr' ? 'ताण' : 'Stress', value: '8 / 10', note: 'Higher than recent average' },
          { label: language === 'hi' ? 'स्क्रीन समय' : language === 'mr' ? 'स्क्रीन वेळ' : 'Screen time', value: '8.2h', note: 'Elevated optical exposure' },
        ],
        recommendation: rec,
        sources: [
          'American Migraine Foundation',
          'Headache: The Journal of Head and Face Pain',
          'Mayo Clinic Clinical Guidelines',
        ],
        safetyNote: language === 'hi' 
          ? 'केवल शैक्षिक सहायता। अचानक गंभीर सिरदर्द होने पर कृपया तुरंत चिकित्सीय सहायता लें।'
          : language === 'mr'
          ? 'केवळ शैक्षणिक माहिती. अचानक तीव्र डोकेदुखी जाणवल्यास कृपया तात्काळ डॉक्टरांचा सल्ला घ्या.'
          : 'Educational support only. If experiencing sudden "thunderclap" headache or severe visual symptoms, please seek prompt medical care.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    if (lower.includes('pattern') || lower.includes('logs') || lower.includes('notice')) {
      let text = 'Looking across your last 7 to 30 days of entries, your logged episodes most frequently occurred when shorter sleep (<6.0 hours) coincided with high daily stress (>7/10).';
      let rec = 'Maintaining your recent 2.2L hydration routine has created a valuable physiological buffer. Your main opportunity for balance is evening wind-down consistency.';

      if (language === 'hi') {
        text = 'पिछले 7 से 30 दिनों के आपके रिकॉर्ड को देखते हुए, जब कम नींद (6.0 घंटे से कम) और उच्च दैनिक तनाव (7/10 से अधिक) एक साथ हुए, तब माइग्रेन की घटनाएं सबसे अधिक हुईं।';
        rec = 'प्रतिदिन 2.2L पानी पीने की आपकी आदत ने एक सुरक्षात्मक संतुलन बनाया है। शाम को नियमित विश्राम करना आपके लिए सबसे लाभकारी होगा।';
      } else if (language === 'mr') {
        text = 'मागील ७ ते ३० दिवसांच्या नोंदी तपासता, जेव्हा कमी झोप (६.० तासांपेक्षा कमी) आणि जास्त ताण (७/१० पेक्षा जास्त) एकत्र आले, तेव्हा मायग्रेनचा त्रास सर्वाधिक झाला.';
        rec = 'दररोज २.२ लिटर पाणी पिण्याच्या तुमच्या सवयीने उत्तम संतुलन राखले आहे. संध्याकाळी वेळेवर विश्रांती घेणे तुमच्यासाठी खूप फायदेशीर ठरेल.';
      }

      return {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text,
        language,
        dataPoints: [
          { label: 'Sleep Correlation', value: '68% recurrence', note: 'Precedes sensitive days' },
          { label: 'Hydration Buffer', value: '+0.6L improvement', note: 'Protective factor' },
          { label: 'Screen Sensitivity', value: '+18% sensitivity', note: 'Sessions >7.5h' },
        ],
        recommendation: rec,
        sources: ['American Migraine Foundation', 'Neurology Clinical Practice'],
        safetyNote:
          'These insights illustrate personal associations and do not establish clinical causation.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    // Default supportive response
    let text = 'Thank you for noting that. In your logs, we observe that your baseline stability responds best to consistent hydration, regular sleep timing, and steady screen pacing.';
    let rec = 'Would you like to review how this relates to your recent 7-day risk trend or explore a soothing wind-down routine?';

    if (language === 'hi') {
      text = 'यह बताने के लिए धन्यवाद। आपके लॉग्स में, हम देखते हैं कि आपका स्वास्थ्य नियमित हाइड्रेशन, समय पर नींद और संतुलित स्क्रीन समय पर सबसे अच्छा प्रतिसाद देता है।';
      rec = 'क्या आप देखना चाहेंगे कि यह आपके हाल के 7-दिवसीय जोखिम से कैसे संबंधित है?';
    } else if (language === 'mr') {
      text = 'नोंद केल्याबद्दल धन्यवाद. तुमच्या नोंदींवरून असे दिसते की नियमित पाणी पिणे, वेळेवर झोप आणि स्क्रीन वेळेवर नियंत्रण ठेवल्याने तुमचे आरोग्य अधिक संतुलित राहते.';
      rec = 'तुम्हाला तुमच्या ७-दिवसीय जोखीम कल किंवा शांत झोपेच्या दिनचर्येबद्दल अधिक जाणून घ्यायचे आहे का?';
    }

    return {
      id: `asst-${Date.now()}`,
      sender: 'assistant',
      text,
      language,
      recommendation: rec,
      sources: ['American Migraine Foundation', 'Neurology Research Literature'],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  },
};

export default chatService;
