import { ProposalInfo, ProposalChapters, Team } from "../../shared";

const extractFromLine = (line: string, regex: RegExp): string | null => {
  const match = line.match(regex);
  return match ? match[0] : null;
};

export const extractTeamMembers = (lines: string[]) => {
  let isTeamSection = false;
  const teamMembers: string[] = [];
  for (let line of lines) {
    if (line.trim() === "### Team members") {
      isTeamSection = true;
      continue;
    }

    if (isTeamSection && line.trim().startsWith("###")) {
      break;
    }

    if (isTeamSection && line.trim().startsWith("- ")) {
      const member = line.trim().replace(/^- /, "").trim();
      teamMembers.push(member);
    }
  }

  return teamMembers;
};

export const extractTeamInfo = (lines: string[]): Team => {
  let currentTeam: Partial<Team> = {};

  for (let line of lines) {
    if (line.trim().startsWith("- **Team Name:**")) {
      currentTeam.name = extractFromLine(line, /(?<=\*\*Team Name:\*\* ).*/) || "";
    } 
    if (line.startsWith("- **Contact Name:**")) {
      currentTeam.contactName = extractFromLine(line, /(?<=\*\*Contact Name:\*\* ).*/) || "";
    } 
    if (line.startsWith("- **Contact Email:**")) {
      currentTeam.contactEmail = extractFromLine(line, /(?<=\*\*Contact Email:\*\* ).*/) || "";
    } 
    if (line.startsWith("- **Registered Address:**")) {
      const address = extractFromLine(line, /(?<=\*\*Registered Address:\*\* ).*/) || "";
      currentTeam.entity = { ...currentTeam.entity, address };
    } 
    if (line.startsWith("- **Registered Legal Entity:**")) {
      const name = extractFromLine(line, /(?<=\*\*Registered Legal Entity:\*\* ).*/) || "";
      currentTeam.entity = { ...currentTeam.entity, name };
    } 
    if (line.startsWith("- **Website:**")) {
      currentTeam.website = extractFromLine(line, /(?<=\*\*Website:\*\* ).*/) || "";
    }
    // Extract other fields like GitHub and LinkedIn
    if (line.startsWith("- https://github.com/")) {
      if (!currentTeam.repos) currentTeam.repos = [];
      currentTeam.repos.push(line.replace('-', '').trim());
    } 
    if (line.startsWith("- https://www.linkedin.com/")) {
      if (!currentTeam.linkedinProfiles) currentTeam.linkedinProfiles = [];
      currentTeam.linkedinProfiles.push(line.replace('-', '').trim());
    } 
    if (line.startsWith("- ") && 
        !line.startsWith("- **") && // Ensure we're not picking up other fields
        !line.startsWith("- https://")) { // Ensure we're not picking up URLs
      if (!currentTeam.members) currentTeam.members = [];
    }
  }

  currentTeam.members = extractTeamMembers(lines);

  return currentTeam as Team;
};

export const extractProposalInfo = (fileContent: string): ProposalInfo => {
  const lines = fileContent.split("\n");

  const team = extractTeamInfo(lines);

  const info = lines.reduce(
    (proposalInfo: Partial<ProposalInfo>, line: string) => {
      if (line.startsWith("- **Total Costs:**")) {
        const totalCostsInfo = (extractFromLine(line, /(?<=\*\*Total Costs:\*\* ).*/) || "").split(" ");
        proposalInfo.currencyAmount = {
          amount: parseFloat(totalCostsInfo[0].replace(",", "")) || 0,
          currency: totalCostsInfo[1]
        };
      } else if (line.startsWith("- **Level:**")) {
        proposalInfo.level = parseInt(extractFromLine(line, /(?<=\*\*Level:\*\* ).*/) || "0", 10);
      } else if (line.startsWith("- **Payment Address:**")) {
        proposalInfo.paymentAddress = extractFromLine(line, /(?<=\*\*Payment Address:\*\* ).*/) || "";
      } else if (line.startsWith("# ")) {
        const title = line.substring(2).trim();
        return { ...proposalInfo, title };
      } else if (line.startsWith("- **Payment Address:**")) {
        const paymentAddress = line.replace(/^- \**\[?Payment Address\]?:?\**\s*/i, "").trim();
        return { ...proposalInfo, paymentAddress };
      } else if (/^- \**\[?Total Estimated Duration\]?:?\**/i.test(line)) {
        const totalDuration = (() => {
          try {
            return parseFloat(line.replace(/^- \**\[?Total Estimated Duration\]?:?\**\s*/i, "").trim());
          } catch (error) {
            return 0;
          }
        })();
        return { ...proposalInfo, totalDuration };
      } else if (/^- \**\[?Full-Time Equivalent (FTE)\]?:?\**/i.test(line)) {
        const totalFTE = (() => {
          try {
            return parseFloat(line.replace(/^- \**\[?Full-Time Equivalent (FTE)\]?:?\**\s*/i, "").trim());
          } catch (error) {
            return 0;
          }
        })();
        return { ...proposalInfo, totalFTE };
      }

      return proposalInfo;
    },
    { team },
  );

  return info as ProposalInfo;
};

export const extractProposalChapters = (fileContent: string): ProposalChapters => {
  const lines = fileContent.split("\n");

  const chapterTitles = [
    "Project Overview",
    "Team",
    "Development Status",
    "Development Roadmap",
    "Future Plans",
  ];

  const chapterMapping: Record<string, keyof ProposalChapters> = {
    "Project Overview": "projectOverview",
    "Team": "team",
    "Development Status": "developmentStatus",
    "Development Roadmap": "developmentRoadmap",
    "Future Plans": "futurePlans",
  };

  const projectOverviewLine = lines.find((line) =>
    /^#{1,}\s+Project Overview/.test(line)
  ) ?? "";
  const chapterLines = lines.slice(lines.indexOf(projectOverviewLine));

  const chapters = chapterLines.reduce<Partial<ProposalChapters>>(
    (acc, line) => {
      const chapter = chapterTitles.find((title) =>
        new RegExp(`^\\s*#{1,}\\s+${title}`).test(line)
      );

      if (chapter) {
        const mappedKey = chapterMapping[chapter];
        if (!acc.hasOwnProperty(mappedKey)) {
          // Initialize the new chapter with its title line
          return { ...acc, [mappedKey]: line + "\n" };
        }
      } else {
        const lastKey = Object.keys(acc).pop() as keyof ProposalChapters;
        if (lastKey) {
          return { ...acc, [lastKey]: acc[lastKey] + line + "\n" };
        }
      }

      return acc;
    },
    {}
  );

  return chapters as ProposalChapters;
};

