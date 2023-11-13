import { Milestone } from '../../shared';
import { parseMilestones } from './milestone-parser';

describe('parseMarkdown', () => {
  it('correctly parses a valid markdown', () => {
    const markdownText = `
    ## Development Roadmap :nut_and_bolt:

    This section should break the development roadmap down into milestones and deliverables. To assist you in defining it, we have created a document with examples for some grant categories [here](../docs/Support%20Docs/grant_guidelines_per_category.md). Since these will be part of the agreement, it helps to describe _the functionality we should expect in as much detail as possible_, plus how we can verify and test that functionality. Whenever milestones are delivered, we refer to this document to ensure that everything has been delivered as expected.

    Below we provide an **example roadmap**. In the descriptions, it should be clear how your project is related to Substrate, Kusama or Polkadot. We _recommend_ that teams structure their roadmap as 1 milestone ≈ 1 month.

    > :exclamation: If any of your deliverables is based on somebody else's work, make sure you work and publish _under the terms of the license_ of the respective project and that you **highlight this fact in your milestone documentation** and in the source code if applicable! **Teams that submit others' work without attributing it will be immediately terminated.**

    ### Overview

    - **Total Estimated Duration:** 2 months
    - **Full-Time Equivalent (FTE):**  2 FTE
    - **Total Costs:** 12,000 USD

    ### Milestone 1 Example — Basic functionality

    - **Estimated duration:** 1 month
    - **FTE:**  1,5
    - **Costs:** 8,000 USD

    > :exclamation: **The default deliverables 0a-0d below are mandatory for all milestones**, and deliverable 0e at least for the last one. 

    | Number | Deliverable | Specification |
    | -----: | ----------- | ------------- |
    | **0a.** | License | Apache 2.0 |
    | **0b.** | Documentation | We will provide both **inline documentation** of the code and a basic **tutorial** that explains how a user can (for example) spin up one of our Substrate nodes and send test transactions, which will show how the new functionality works. |
    | **0c.** | Testing and Testing Guide | Core functions will be fully covered by comprehensive unit tests to ensure functionality and robustness. In the guide, we will describe how to run these tests. |
    | **0d.** | Docker | We will provide a Dockerfile(s) that can be used to test all the functionality delivered with this milestone. |
    | 0e. | Article | We will publish an **article**/workshop that explains [...] (what was done/achieved as part of the grant). (Content, language and medium should reflect your target audience described above.) |
    | 1. | Substrate module: X | We will create a Substrate module that will... (Please list the functionality that will be implemented for the first milestone. You can refer to details provided in previous sections.) |
    | 2. | Substrate module: Y | The Y Substrate module will... |
    `;

    const expectedOutput: Milestone[] = [
      {
        FTE: "1,5",
        costs: "8000",
        deliverables: [
          {
            name: "License",
            number: "0a.",
            specification: "Apache 2.0",
          },
          {
            name: "Documentation",
            number: "0b.",
            specification: "We will provide both **inline documentation** of the code and a basic **tutorial** that explains how a user can (for example) spin up one of our Substrate nodes and send test transactions, which will show how the new functionality works.",
          },
          {
            name: "Testing and Testing Guide",
            number: "0c.",
            specification: "Core functions will be fully covered by comprehensive unit tests to ensure functionality and robustness. In the guide, we will describe how to run these tests.",
          },
          {
            name: "Docker",
            number: "0d.",
            specification: "We will provide a Dockerfile(s) that can be used to test all the functionality delivered with this milestone.",
          },
          {
            name: "Substrate module: X",
            number: "1.",
            specification: "We will create a Substrate module that will... (Please list the functionality that will be implemented for the first milestone. You can refer to details provided in previous sections.)",
          },
          {
            name: "Substrate module: Y",
            number: "2.",
            specification: "The Y Substrate module will...",
          },
        ],
        duration: "1 month",
        license: "Apache 2.0",
        name: "Milestone 1 Example — Basic functionality",
      },
    ];

    expect(parseMilestones(markdownText)).toEqual(expectedOutput);
  });
});
