import { 
  extractProposalInfo,
  extractProposalChapters,
  extractTeamMembers,
  extractTeamInfo
} from './proposal-parser';

describe('parser', () => {

  describe('extractProposalInfo', () => {
    it('extracts title', () => {
      const content = `# My Proposal Title`;

      const info = extractProposalInfo(content);

      expect(info.title).toBe('My Proposal Title');
    });

    it('extracts payment address', () => {
      // see https://github.com/w3f/Grants-Program/blob/403193031a516acbb5ae7f2e95b9b8836b91b93a/applications/application-template.md#L8
      const paymentAddress = '1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg (USDC)';
      const content = `- **Payment Address:** ${paymentAddress}`;
      const info = extractProposalInfo(content);
      expect(info.paymentAddress).toBe(paymentAddress);
    });
    
    it('extracts level', () => {
      const content = `- **Level:** 3`;
      const info = extractProposalInfo(content);
      expect(info.level).toBe(3);
    });

    it('extracts level, even with other characters in it', () => {
      const content = `- **Level:** level 3 🐓 bla bla`;
      const info = extractProposalInfo(content);
      expect(info.level).toBe(3);
    });
  
    it('extracts total FTE', () => {
      const fteLine = `- **Full-Time Equivalent (FTE):** 2.5`;
      const info = extractProposalInfo(fteLine);
      expect(info.totalFTE).toBe(2.5);
    });
  
    it('extracts duration', () => {
      const content = `- **Total Estimated Duration:** 12 months`;
      const info = extractProposalInfo(content);
      expect(info.totalDuration).toBe(12);
    });
  
    it('extracts total costs and currency', () => {
      const content = `- **Total Costs:** 10000 USD`;
      const info = extractProposalInfo(content);
      expect(info.currencyAmount.amount).toBe(10000);
      expect(info.currencyAmount.currency).toBe('USD');
    });
  });

  describe('extractProposalChapters', () => {

    it('extracts project overview', () => {
      const content = `
        # Project Overview
        
        This is my project
        
        ## Another chapter
      `;

      const chapters = extractProposalChapters(content);
      
      expect(chapters.projectOverview).toContain('This is my project');
      expect(chapters.projectOverview).toContain('## Another chapter');
    });

  });

  describe('extractTeamMembers', () => {

    it('extracts members into array', () => {
      const content = `
          ### Team members
          - Tony Stark
          - Thor Odinson
          ### Another section
      `;

      const members = extractTeamMembers(content.split('\n'));

      expect(members).toEqual(['Tony Stark', 'Thor Odinson']);
    });

  });

  describe('extractTeamInfo', () => {

    it('extracts team name', () => {
      const content = `- **Team Name:** Avengers`;

      const team = extractTeamInfo(content.split('\n'));

      expect(team.name).toBe('Avengers');
    });

  });

});