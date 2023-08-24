import { Deliverable, Milestone } from "../../shared";

export function parseMilestones(markdownText: string): Milestone[] {
  const developmentRoadmapMatch = markdownText.match(/## Development Roadmap :nut_and_bolt:\n([\s\S]*)/);
  if (!developmentRoadmapMatch) {
    console.log('No development roadmap section found.');
    return [];
  }
  const developmentRoadmapText = developmentRoadmapMatch[1];

  const milestonesText = developmentRoadmapText.split('### ');

  const milestones: Milestone[] = [];
  for (const milestoneText of milestonesText) {
    if (!milestoneText.trim()) continue;  

    const nameMatch = milestoneText.match(/^([^\n]+)/);
    if (!nameMatch) {
      console.log(`Missing name in milestone:\n${milestoneText}`);
      continue;
    } else if(nameMatch[1] === 'Overview') {
      continue;
    }
    
    const durationMatch = milestoneText.match(/Estimated duration:\s*\*\*([\s\S]*?)\*\*/m);
    const FTEMatch = milestoneText.match(/FTE:\s*\*\*([\s\S]*?)\*\*/m);
    const costsMatch = milestoneText.match(/Costs:\s*\*\*([\s\S]*?)\*\*/m);
    
    const deliverableRegex = /\|\s*(\*\*[\w.]+\*\*|\d+\.)\s*\|\s*([\s\S]*?)\s*\|\s*([\s\S]*?)(?=\s*\||\n|$)/g;

    const deliverables: Deliverable[] = [];
    let match;
    while ((match = deliverableRegex.exec(milestoneText)) !== null) {
      deliverables.push({
        number: match[1].replaceAll("*", ""),
        name: match[2],
        specification: match[3].trim()
      });
    }
    
    const licenseMatch = milestoneText.match(/License\s*\|\s*([^\|]+)/);
    const license = licenseMatch ? licenseMatch[1].trim() : '';

    milestones.push({
      name: nameMatch[1],
      duration: durationMatch ? durationMatch[1].trim().replace(/\s*-\s*$/, '') : '',
      FTE: FTEMatch ? FTEMatch[1].trim().replace(/\s*-\s*$/, '') : 'N/A',      
      costs: costsMatch ? costsMatch[1].trim().replace('\n', '').replace(',', '').replace('USD', '').split(' ')[0] : 'N/A',      
      deliverables,
      license,
    });
  }

  return milestones;
}
