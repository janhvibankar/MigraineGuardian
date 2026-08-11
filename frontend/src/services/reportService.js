/**
 * Report Service (Mock Frontend Architecture)
 *
 * Provides weekly and monthly clinical summaries, export actions, and shareable link generators.
 */

import { MOCK_REPORTS_DATA } from '../data/mockReports';

export const reportService = {
  getReport: (type = 'weekly') => {
    return MOCK_REPORTS_DATA[type] || MOCK_REPORTS_DATA.weekly;
  },

  generatePdfReport: async (type = 'weekly') => {
    await new Promise((res) => setTimeout(res, 400));
    return {
      success: true,
      filename: `MigraineGuardian_${type}_report_${new Date().toISOString().split('T')[0]}.pdf`,
      downloadUrl: '#',
    };
  },

  generateShareLink: async (type = 'weekly') => {
    await new Promise((res) => setTimeout(res, 300));
    return {
      success: true,
      shareUrl: `https://migraineguardian.app/share/rep_${Date.now()}_ev`,
      expiresIn: '7 days',
    };
  },
};
