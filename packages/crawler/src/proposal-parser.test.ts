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
        // ...
      });
  
      // Other test cases
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