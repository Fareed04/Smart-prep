import { CompanyDossier } from '../types';

export const COMPANY_PRESETS: CompanyDossier[] = [
  {
    id: 'preset_kpmg',
    companyName: 'KPMG',
    targetRole: 'Graduate Trainee / Analyst',
    tagline: 'Global Multidisciplinary Audit, Tax, and Advisory Network',
    createdAt: new Date().toISOString(),
    overview: {
      industry: 'Professional Services / Big 4 Accounting & Advisory',
      headquarters: 'Amstelveen, Netherlands (KPMG International)',
      globalReach: '273,000+ partners and staff operating in 143 countries and territories',
      keyLeadership: 'Bill Thomas (Global Chairman & CEO)',
      summary: 'KPMG is one of the Big Four accounting organizations, providing audit, tax, and advisory services. The firm serves corporations, governments, public sector agencies, and non-profits. Known for its multidisciplinary model, KPMG combines financial rigor with advanced digital solutions, helping clients navigate regulatory complexity, risk, and transformation.',
      primaryCompetitors: ['PwC', 'Deloitte', 'EY', 'BDO', 'Grant Thornton']
    },
    values: [
      {
        name: 'Integrity',
        description: 'We do what is right. We hold ourselves to the highest ethical and professional standards.',
        application: 'In interviews and SJTs, always demonstrate uncompromising professional skepticism. When faced with client pressure or deadlines, prioritize regulatory compliance and accuracy over pleasing the client.'
      },
      {
        name: 'Excellence',
        description: 'We never stop learning and improving. Continuous curiosity drives our standard of quality.',
        application: 'Highlight a real scenario where you proactively researched an unfamiliar domain or automated a repetitive task to improve outcome quality.'
      },
      {
        name: 'Courage',
        description: 'We think and act boldly. We are not afraid to speak up when something feels amiss or suggest novel solutions.',
        application: 'Show willingness to constructively challenge assumptions during group assessment center exercises, and explain how you respectfully voice concerns when numbers do not reconcile.'
      },
      {
        name: 'Together',
        description: 'We respect each other and draw strength from our differences. Collaboration across service lines is our competitive edge.',
        application: 'In group tasks, actively draw in quieter teammates, build upon others’ suggestions, and seek consensus rather than dominating the conversation.'
      },
      {
        name: 'For Better',
        description: 'We do what matters. Our work impacts capital markets, public trust, and the communities we operate in.',
        application: 'Explain why serving public trust and transparent financial reporting genuinely motivates you, beyond standard corporate goals.'
      }
    ],
    strategicPriorities: [
      {
        title: 'Multi-Billion Dollar AI & Microsoft Alliance',
        detail: 'KPMG expanded its landmark partnership with Microsoft with a multi-billion dollar commitment to embed Azure OpenAI across its smart audit platform (KPMG Clara) and advisory toolsets.',
        interviewTip: 'Reference how KPMG is equipping early-career professionals with AI tooling to shift focus from manual data entry to critical analysis and strategic client advisory.'
      },
      {
        title: 'KPMG Clara Smart Audit Platform',
        detail: 'KPMG’s cloud-based automated audit platform delivers continuous auditing, data ingestion, and predictive risk indicators across client ledgers in real time.',
        interviewTip: 'Mention how Clara demonstrates KPMG’s technological edge and how you look forward to leveraging digital auditing workflows.'
      },
      {
        title: 'Global ESG & Decarbonization Advisory',
        detail: 'KPMG has invested over $1.5 billion into ESG transformation hubs, helping multinationals prepare for CSRD, SEC climate rules, and sustainable supply chain redesign.',
        interviewTip: 'Touch on how commercial clients require multidisciplinary ESG assurance, connecting financial reporting with non-financial sustainability metrics.'
      }
    ],
    recentInitiatives: [
      'Global rollout of KPMG Clara Generative AI Assistant for audit teams to synthesize complex contract terms and verify disclosures.',
      'Expansion of KPMG Ignition innovation hubs across major business centers to prototype digital twin and tax technology solutions.',
      'Publication of the KPMG Global CEO Outlook report highlighting generative AI resilience and supply chain nearshoring as top executive priorities.'
    ],
    whyUsTalkingPoints: [
      {
        angle: 'True Multidisciplinary Culture',
        talkingPoint: 'Unlike firms that operate in strict silos, KPMG fosters collaboration between Audit, Deal Advisory, and Technology Consulting. For an early-career professional, this means broad commercial exposure and learning how macro-economic trends impact complete business models.'
      },
      {
        angle: 'Leading Investments in Trainee Technology',
        talkingPoint: 'KPMG’s massive co-innovation with Microsoft and the rollout of KPMG Clara proves the firm is actively shaping the future of professional services rather than playing catch-up. I want to build my career where digital enablement is integrated from day one.'
      },
      {
        angle: 'People-First Values and Public Trust',
        talkingPoint: 'The clarity of KPMG’s values—especially "Integrity: We do what is right" and "Together: We draw strength from our differences"—resonates with my approach to teamwork and ethics in high-stakes environments.'
      }
    ],
    assessmentIntel: {
      cultureAndSjtFocus: 'KPMG Situational Judgement Tests (SJT) test for professional skepticism and procedural integrity. The correct choice consistently involves verifying independent evidence rather than taking management verbal assurances at face value. Teamwork answers should prioritize open communication with senior managers over trying to solve complex client discrepancies in isolation.',
      interviewWatchouts: [
        'Never state that audit is solely about "finding mistakes"; frame it as providing confidence, capital market stability, and constructive business insights.',
        'Avoid appearing too individualistic in assessment centers; KPMG assesses team cohesion and collective output far more than individual showmanship.'
      ],
      smartQuestionsToAsk: [
        'With the continuous evolution of KPMG Clara, how are graduate trainees on client sites trained to interpret automated anomaly detection results alongside experienced audit managers?',
        'How does KPMG maintain consistency and cross-border collaboration across member firms when running international group audits?',
        'What opportunities exist for trainees to participate in corporate citizenship or ESG client engagements during their initial training contract?'
      ]
    },
    keyTerminology: [
      { term: 'KPMG Clara', meaning: 'KPMG’s global smart audit cloud platform that aggregates client ledger data and executes automated risk tests.' },
      { term: 'Professional Skepticism', meaning: 'An attitude that includes a questioning mind, being alert to conditions indicating potential misstatement, and critical assessment of audit evidence.' },
      { term: 'Deal Advisory', meaning: 'KPMG’s service line advising on mergers, acquisitions, valuations, turnaround, and transaction restructuring.' },
      { term: 'AQI (Audit Quality Indicators)', meaning: 'Quantitative metrics used by KPMG to evaluate audit rigor, independence, partner supervision hours, and technical training.' }
    ],
    sampleScenario: {
      scenario: 'During your interim fieldwork on a corporate client, you notice a significant discrepancy between the client’s inventory ledger and physical warehouse counts. The client’s finance manager urges you to disregard it as a "timing error" so that the quarterly review can be signed off today.',
      question: 'What is the most aligned course of action reflecting KPMG’s values and professional standards?',
      options: [
        'Accept the finance manager’s explanation to ensure the client deadline is met, making a mental note to check again next quarter.',
        'Politely explain that you must verify the reconciliation documentation, document the variance, and immediately brief your senior in-charge or manager.',
        'Confront the client manager aggressively and threaten to report them to regulatory authorities.',
        'Privately alter the spreadsheet inventory numbers so that both reports match for today’s submission.'
      ],
      correctIndex: 1,
      explanation: 'Option 2 embodies KPMG’s core values of Integrity ("We do what is right") and Courage ("We think and act boldly"). As an auditor or consultant, professional skepticism mandates verifying objective evidence and consulting senior oversight rather than yielding to client pressure or altering records.'
    }
  },
  {
    id: 'preset_pwc',
    companyName: 'PwC (PricewaterhouseCoopers)',
    targetRole: 'Graduate Associate / Consultant',
    tagline: 'Leading Global Professional Services Network Focused on Sustained Outcomes',
    createdAt: new Date().toISOString(),
    overview: {
      industry: 'Professional Services / Big 4 Accounting, Tax, & Consulting',
      headquarters: 'London, United Kingdom (PwC International)',
      globalReach: '364,000+ professionals across 151 countries',
      keyLeadership: 'Mohamed Kande (Global Chair)',
      summary: 'PwC is the world’s second-largest professional services network by revenue. Guided by its overarching strategy "The New Equation," PwC brings together multidisciplinary teams in assurance, tax, deals, and consulting to build trust and solve complex global challenges.',
      primaryCompetitors: ['Deloitte', 'EY', 'KPMG', 'Strategy&', 'McKinsey']
    },
    values: [
      {
        name: 'Act with Integrity',
        description: 'Speak up for what is right, especially when it feels difficult. Expect and deliver the highest quality.',
        application: 'Highlight instances where you adhered to data privacy standards or identified inconsistencies in academic/work deliverables.'
      },
      {
        name: 'Make a Difference',
        description: 'Stay informed and ask questions about the future of the world. Create impact that lasts beyond today.',
        application: 'Discuss how your career choices are oriented toward sustainable economic growth and building market trust.'
      },
      {
        name: 'Care',
        description: 'Make the effort to understand every person and what matters to them. Recognize individual contributions.',
        application: 'Emphasize empathy in leadership: supporting team members under pressure and respecting diverse viewpoints.'
      },
      {
        name: 'Work Together',
        description: 'Collaborate and co-create across boundaries. Value everyone’s perspective.',
        application: 'In group exercises, actively synthesize differing opinions into a cohesive strategy rather than forcing your own idea.'
      },
      {
        name: 'Reimagine the Possible',
        description: 'Dare to challenge the status quo and try new things. Innovate, test, and learn from failure.',
        application: 'Explain how you embrace digital tools, generative AI, and automation to streamline workflows.'
      }
    ],
    strategicPriorities: [
      {
        title: 'The New Equation',
        detail: 'PwC’s global strategy focused on two fundamental client needs: building trust in an uncertain world and delivering sustained commercial outcomes through human-led, tech-powered execution.',
        interviewTip: 'Explicitly reference "The New Equation" and articulate how trust and tech work hand-in-hand in your target business line.'
      },
      {
        title: 'Enterprise AI Ecosystem & Harvey Partnership',
        detail: 'PwC has forged enterprise alliances with OpenAI, Microsoft, and legal AI platform Harvey to accelerate client tax, legal, and operational analysis.',
        interviewTip: 'Mention your awareness of how generative AI is shifting associate roles from routine review to strategic problem-solving.'
      }
    ],
    recentInitiatives: [
      'Multi-year $1B investment to expand generative AI capabilities across US, UK, and global member firms.',
      'Publication of the PwC Annual Global CEO Survey detailing business model reinvention strategies.',
      'Integration of Strategy& (strategy consulting arm) with digital engineering teams for end-to-end client transformations.'
    ],
    whyUsTalkingPoints: [
      {
        angle: 'The New Equation Alignment',
        talkingPoint: 'PwC’s unique positioning around "The New Equation" combines technical assurance with strategic business transformation. I am drawn to how the firm blends human empathy and deep technological capability to solve long-term client challenges.'
      },
      {
        angle: 'World-Class Learning and Mobility',
        talkingPoint: 'PwC’s structured development programs, global secondment opportunities, and digital upskilling academies provide an unmatched launchpad for professional qualification.'
      }
    ],
    assessmentIntel: {
      cultureAndSjtFocus: 'PwC looks for candidates demonstrating the "PwC Professional" framework: Whole Leadership, Business Acumen, Technical and Digital Capabilities, Global and Inclusive Acumen, and Relationships. In situational questions, balance analytical precision with interpersonal diplomacy.',
      interviewWatchouts: [
        'Never treat technology as an afterthought; PwC tests heavily for digital curiosity and commercial awareness.',
        'Be prepared to discuss current business news (e.g., inflation trends, AI regulation, energy transition).'
      ],
      smartQuestionsToAsk: [
        'How has the rollout of "The New Equation" influenced the way cross-functional teams in Deals and Consulting pitch to clients?',
        'What specific digital certifications or upskilling paths do associates undertake during their first two years at PwC?'
      ]
    },
    keyTerminology: [
      { term: 'The New Equation', meaning: 'PwC’s global strategic framework centering on Trust and Sustained Outcomes.' },
      { term: 'PwC Professional', meaning: 'The firm-wide leadership framework assessing candidates across 5 core competencies.' },
      { term: 'Strategy&', meaning: 'PwC’s global premium strategy consulting team (formerly Booz & Company).' }
    ],
    sampleScenario: {
      scenario: 'You are working on a tight client deadline. A senior associate gives you complex financial spreadsheets with several broken formulas and missing source footnotes.',
      question: 'What is the most constructive action?',
      options: [
        'Delete the broken cells so the workbook appears clean before sending to the client.',
        'Quickly diagnose the broken references, prepare a list of clear clarifying questions, and schedule a brief sync with the associate to confirm the source data.',
        'Ignore the errors since you were not the one who created the formulas.',
        'Send an angry email copying the partner criticizing the associate’s work.'
      ],
      correctIndex: 1,
      explanation: 'Option 2 demonstrates technical accountability and "Work Together" values—proactively identifying issues and collaborating respectfully to deliver quality.'
    }
  },
  {
    id: 'preset_deloitte',
    companyName: 'Deloitte',
    targetRole: 'Analyst / Consultant',
    tagline: 'World’s Largest Professional Services & Consulting Organization',
    createdAt: new Date().toISOString(),
    overview: {
      industry: 'Management Consulting, Audit & Assurance, Risk Advisory, & Tax',
      headquarters: 'London, UK (Deloitte Touche Tohmatsu Limited)',
      globalReach: '457,000+ professionals across 150+ countries',
      keyLeadership: 'Joe Ucuzoglu (Global CEO)',
      summary: 'Deloitte is the largest professional services firm globally by both revenue and headcount. With market-dominating consulting, risk advisory, cyber, and audit arms, Deloitte advises the vast majority of Fortune Global 500 companies on business model innovation, enterprise cloud, and compliance.',
      primaryCompetitors: ['PwC', 'EY', 'KPMG', 'Accenture', 'McKinsey', 'BCG']
    },
    values: [
      {
        name: 'Lead the Way',
        description: 'Deloitte is not just participating in the future; we are shaping it for our clients and our profession.',
        application: 'Show initiative. Mention a project where you took ownership when there was ambiguity and guided the team to a deliverable.'
      },
      {
        name: 'Serve with Integrity',
        description: 'Preserving client trust and public confidence through unwavering ethical decisions.',
        application: 'Demonstrate that you respect confidentiality, intellectual property, and ethical conduct under pressure.'
      },
      {
        name: 'Take Care of Each Other',
        description: 'Prioritizing team wellbeing, mutual support, and mentorship.',
        application: 'Discuss how you mentor peers or step in to help teammates during intense project phases.'
      },
      {
        name: 'Foster Inclusion',
        description: 'We are at our best when we foster an environment where everyone can belong and thrive.',
        application: 'Highlight experience collaborating with international or cross-disciplinary cohorts.'
      },
      {
        name: 'Collaborate for Measurable Impact',
        description: 'Driving tangible, positive results for clients and societal stakeholders.',
        application: 'Always quantify your impact in interviews (e.g., "saved 4 hours weekly", "increased accuracy by 25%").'
      }
    ],
    strategicPriorities: [
      {
        title: 'Unlimited Scale in Digital & Enterprise Cloud',
        detail: 'Deloitte Consulting leads global alliances with AWS, Google Cloud, SAP, and Salesforce, implementing massive enterprise transformations.',
        interviewTip: 'Connect your analytical skills with Deloitte’s end-to-end ability to not just formulate strategy, but implement technology.'
      },
      {
        title: 'Omnia and Cortex AI Platforms',
        detail: 'Deloitte’s proprietary artificial intelligence platforms used to power audit analytics, supply chain forecasting, and predictive modeling.',
        interviewTip: 'Mention how Deloitte’s proprietary platforms give analysts superior tools to diagnose business risks.'
      }
    ],
    recentInitiatives: [
      'Major multi-million dollar expansion of Deloitte AI Academy to upskill 20,000+ staff in enterprise gen AI engineering.',
      'Strategic advisory on global energy transition and public infrastructure decarbonization projects.',
      'Consolidation into four modernized business units to accelerate cross-functional client solutions.'
    ],
    whyUsTalkingPoints: [
      {
        angle: 'Unrivaled Scale & Consulting Supremacy',
        talkingPoint: 'Deloitte combines the rigorous governance of a Big Four accounting firm with the strategic firepower of the world’s largest consulting practice. This enables holistic impact that smaller boutiques cannot replicate.'
      },
      {
        angle: 'Culture of Continuous Innovation',
        talkingPoint: 'Through initiatives like the Deloitte AI Academy and innovation studios, the firm gives graduates the tools and backing to pioneer novel solutions for market-defining clients.'
      }
    ],
    assessmentIntel: {
      cultureAndSjtFocus: 'Deloitte assessments evaluate structured thinking, client empathy, and commercial savvy. Candidates should demonstrate adaptability, structured problem decomposition (e.g. MECE frameworks), and the ability to articulate value clearly to senior executive stakeholders.',
      interviewWatchouts: [
        'Avoid vague generalizations. Deloitte interviewers appreciate structured, data-backed STAR responses.',
        'Do not confuse Deloitte Consulting with Audit—tailor your answers to the specific business line you are interviewing for.'
      ],
      smartQuestionsToAsk: [
        'How is Deloitte leveraging its alliances with AWS and Google Cloud to solve client operational bottlenecks in this sector?',
        'What differentiates the project experience for a first-year analyst at Deloitte compared to other tier-one consulting firms?'
      ]
    },
    keyTerminology: [
      { term: 'Omnia', meaning: 'Deloitte’s next-generation global audit platform powered by cloud and advanced analytics.' },
      { term: 'Cortex', meaning: 'Deloitte’s enterprise data analytics and AI platform.' },
      { term: 'MECE', meaning: 'Mutually Exclusive, Collectively Exhaustive—a consulting framework for problem-solving.' }
    ]
  },
  {
    id: 'preset_ey',
    companyName: 'EY (Ernst & Young)',
    targetRole: 'Graduate Trainee / Analyst',
    tagline: 'Global Professional Services Organization Building a Better Working World',
    createdAt: new Date().toISOString(),
    overview: {
      industry: 'Professional Services / Big 4 Accounting, Strategy & Transactions, Tax & Consulting',
      headquarters: 'London, United Kingdom (EY Global)',
      globalReach: '400,000+ people across 150+ countries',
      keyLeadership: 'Janet Truncale (Global Chair & CEO)',
      summary: 'EY is a global leader in assurance, consulting, strategy, transactions, and tax. Unified by its purpose "Building a better working world," EY helps create long-term value for clients, people, and society while fostering trust in the capital markets.',
      primaryCompetitors: ['PwC', 'Deloitte', 'KPMG', 'Parthenon', 'Accenture']
    },
    values: [
      {
        name: 'Integrity and Respect',
        description: 'Demonstrating honesty, ethics, and mutual respect in all professional interactions.',
        application: 'Show that you respect diverse viewpoints and maintain high ethical standards in academic and work scenarios.'
      },
      {
        name: 'Energy, Enthusiasm, and Courage',
        description: 'Bringing passion and resilience to challenging assignments and having the courage to lead.',
        application: 'Convey genuine enthusiasm for client problem-solving and demonstrate grit when learning difficult topics.'
      },
      {
        name: 'Teaming and Collaboration',
        description: 'Success is a team effort. Building strong relationships across cultures and service lines.',
        application: 'Highlight your collaborative nature in group assessments, ensuring all team members are aligned on deliverables.'
      }
    ],
    strategicPriorities: [
      {
        title: 'Building a Better Working World',
        detail: 'EY’s core purpose that informs every client engagement, sustainability initiative, and employee experience program.',
        interviewTip: 'Explicitly connect your personal values with the concept of building long-term stakeholder value.'
      },
      {
        title: 'EY.ai Platform & $1.4B AI Investment',
        detail: 'EY launched EY.ai, unifying artificial intelligence capabilities with deep industry domain knowledge and ethical AI governance frameworks.',
        interviewTip: 'Mention how EY.ai reflects the firm’s commitment to responsible and transparent AI adoption for enterprise clients.'
      }
    ],
    recentInitiatives: [
      'Appointment of Janet Truncale as Global Chair & CEO, the first woman to lead a Big Four accounting firm globally.',
      'Launch of EY Parthenon’s global corporate resilience and restructuring study for executive leaders.',
      'Expansion of EY Tech MBA and Masters degrees offered tuition-free to employees in partnership with Hult International Business School.'
    ],
    whyUsTalkingPoints: [
      {
        angle: 'Purpose-Driven Work',
        talkingPoint: 'EY’s purpose of "Building a better working world" is not a marketing slogan; it permeates client advisory, sustainable investing, and capital market assurance. I want to build a career where commercial success is aligned with societal value.'
      },
      {
        angle: 'Unmatched Educational Investment in People',
        talkingPoint: 'EY’s unique offerings like the free EY Tech MBA, EY Badges, and continuous upskilling demonstrate an investment in employee development that stands out in the industry.'
      }
    ],
    assessmentIntel: {
      cultureAndSjtFocus: 'EY assesses candidates against the "Transformative Leadership" framework: purpose-driven, agile, collaborative, and curious. In behavioral scenarios, emphasize asking thoughtful questions, active listening, and proposing ethical, well-grounded recommendations.',
      interviewWatchouts: [
        'Do not appear transactional; EY places high value on interpersonal authenticity and long-term career curiosity.',
        'Be prepared to explain why EY specifically over PwC or Deloitte.'
      ],
      smartQuestionsToAsk: [
        'How is the EY.ai platform being deployed to assist early-career professionals in automating repetitive audit verification tasks?',
        'What has been the impact of the EY Badges program on skill diversification across junior client teams?'
      ]
    },
    keyTerminology: [
      { term: 'EY Parthenon', meaning: 'EY’s global strategy consulting arm focusing on CEO-level strategic and transactional advice.' },
      { term: 'EY.ai', meaning: 'EY’s unified artificial intelligence platform and governance architecture.' },
      { term: 'EY Badges', meaning: 'The firm’s internal micro-credentialing program rewarding employees for learning tech, sustainability, and leadership skills.' }
    ]
  },
  {
    id: 'preset_mckinsey',
    companyName: 'McKinsey & Company',
    targetRole: 'Business Analyst / Associate',
    tagline: 'Global Management Consulting Firm Advising C-Suite & World Leaders',
    createdAt: new Date().toISOString(),
    overview: {
      industry: 'Management & Strategy Consulting (MBB)',
      headquarters: 'New York, NY, USA',
      globalReach: '45,000+ colleagues across 130+ cities in 65+ countries',
      keyLeadership: 'Bob Sternfels (Global Managing Partner)',
      summary: 'McKinsey & Company is the oldest and most prestigious of the "Big Three" strategy consulting firms (MBB). McKinsey advises senior leaders of top corporations, governments, and non-profits on strategy, operations, technology, mergers, and sustainability.',
      primaryCompetitors: ['Boston Consulting Group (BCG)', 'Bain & Company', 'Strategy&', 'Oliver Wyman']
    },
    values: [
      {
        name: 'Adhere to the Highest Professional Standards',
        description: 'Put client interests ahead of firm interests. Maintain uncompromising confidentiality and objectivity.',
        application: 'In interviews, emphasize factual objectivity and putting client outcomes before personal ambition.'
      },
      {
        name: 'Improve Client Performance Significantly',
        description: 'Deliver non-linear, sustainable, and transformative improvements, not incremental advice.',
        application: 'Structure your thinking in terms of bottom-line impact, top-line growth, and operational resilience.'
      },
      {
        name: 'Obligation to Dissent',
        description: 'Every team member, regardless of seniority, has an intellectual obligation to speak up if they disagree with a proposed solution or hypothesis.',
        application: 'A hallmark McKinsey value. In group discussions, politely challenge flawed logic and encourage rigorous testing of alternatives.'
      }
    ],
    strategicPriorities: [
      {
        title: 'QuantumBlack, AI by McKinsey',
        detail: 'McKinsey’s specialized data science, machine learning, and generative AI arm, deploying custom algorithms directly into client operations.',
        interviewTip: 'Show appreciation for how McKinsey integrates data scientists and software engineers alongside generalist strategy consultants.'
      },
      {
        title: 'McKinsey Sustainability',
        detail: 'Dedicated global practice helping major industries achieve net-zero transitions while sustaining economic competitiveness.',
        interviewTip: 'Connect macro sustainability trends to strategic capital allocation and risk management.'
      }
    ],
    recentInitiatives: [
      'Publication of McKinsey’s benchmark report on The Economic Potential of Generative AI, estimating $4.4T in annual global value.',
      'Launch of Lilli, McKinsey’s proprietary internal gen-AI platform synthesized on over 100,000 internal documents and case studies.',
      'Strategic advisory on national semiconductor and industrial reshoring strategies worldwide.'
    ],
    whyUsTalkingPoints: [
      {
        angle: 'Unrivaled CEO-Level Access & Strategic Depth',
        talkingPoint: 'McKinsey tackles the highest-stakes problems at the C-suite and board level. As a Business Analyst, the steep learning curve and breadth of strategic exposure across industries is unmatched.'
      },
      {
        angle: 'The Obligation to Dissent Culture',
        talkingPoint: 'I deeply admire McKinsey’s cultural norm that hierarchy never trumps data. The "obligation to dissent" ensures that the best idea wins regardless of whether it originates from a first-year analyst or senior partner.'
      }
    ],
    assessmentIntel: {
      cultureAndSjtFocus: 'McKinsey evaluates candidates via the Problem Solving Game (PSG / Solve) and rigorous Personal Experience Interviews (PEI) focusing on Leadership, Personal Impact, and Entrepreneurial Drive. Frameworks must be hypothesis-driven, structured, and customized rather than mechanical.',
      interviewWatchouts: [
        'Avoid memorized generic frameworks; customize your structure to the specific industry and problem nuances.',
        'In the PEI (behavioral), focus on your specific actions (use "I" rather than "we") and dive deep into your psychological motivation.'
      ],
      smartQuestionsToAsk: [
        'How has the adoption of internal tools like Lilli transformed the cadence of initial hypothesis formulation on client studies?',
        'How do generalist consultants collaborate with QuantumBlack specialists when developing client AI roadmaps?'
      ]
    },
    keyTerminology: [
      { term: 'QuantumBlack', meaning: 'McKinsey’s advanced AI, data science, and machine learning division.' },
      { term: 'Obligation to Dissent', meaning: 'The cultural principle requiring any consultant to voice objections to ideas or evidence that do not hold up.' },
      { term: 'Lilli', meaning: 'McKinsey’s internal generative AI platform providing instant access to decades of firm IP and research.' },
      { term: 'PEI', meaning: 'Personal Experience Interview—McKinsey’s deep-dive behavioral evaluation.' }
    ]
  },
  {
    id: 'preset_goldman_sachs',
    companyName: 'Goldman Sachs',
    targetRole: 'Analyst (Global Banking & Markets)',
    tagline: 'Leading Global Financial Institution and Investment Bank',
    createdAt: new Date().toISOString(),
    overview: {
      industry: 'Investment Banking, Global Markets, & Asset/Wealth Management',
      headquarters: 'New York, NY, USA',
      globalReach: '45,000+ employees globally across premier financial centers',
      keyLeadership: 'David Solomon (Chairman & CEO)',
      summary: 'The Goldman Sachs Group, Inc. is a leading global investment banking, securities, and investment management firm. Goldman Sachs provides a wide range of financial services to a substantial and diversified client base including corporations, financial institutions, governments, and individuals.',
      primaryCompetitors: ['Morgan Stanley', 'J.P. Morgan', 'Citigroup', 'Bank of America', 'Evercore']
    },
    values: [
      {
        name: 'Partnership',
        description: 'We prioritize our team and our clients over individual stardom. We operate with a shared commitment to collective success.',
        application: 'Showcase how you collaborate under pressure, cross-check peers’ financial models, and celebrate team wins.'
      },
      {
        name: 'Client Service',
        description: 'Our clients’ interests always come first. Dedicated to delivering advice that creates long-term value.',
        application: 'Illustrate how you anticipate client or stakeholder needs and deliver impeccably formatted deliverables.'
      },
      {
        name: 'Integrity',
        description: 'Expect our people to maintain high ethical standards in everything they do, both in their work for the firm and in their personal lives.',
        application: 'Stress zero-tolerance for compliance shortcuts or unverified financial figures.'
      },
      {
        name: 'Excellence',
        description: 'We take great pride in the professional quality of our work. We have an uncompromising determination to achieve excellence.',
        application: 'Detail your rigorous attention to detail, error-checking routines, and resilience through challenging analysis.'
      }
    ],
    strategicPriorities: [
      {
        title: 'Core Global Banking & Markets Focus',
        detail: 'Goldman Sachs has sharpened its focus on its world-leading M&A advisory, debt underwriting, equity capital markets, and institutional trading franchises.',
        interviewTip: 'Express understanding of how high-interest rate environments and geopolitical shifts impact deal flow and debt refinancing.'
      },
      {
        title: 'Asset & Wealth Management Expansion',
        detail: 'Growing fee-based, recurring asset management revenue across private equity, private credit, real estate, and ultra-high-net-worth wealth advisory.',
        interviewTip: 'Highlight the explosive growth of private credit and alternative assets as corporate alternatives to public bond markets.'
      }
    ],
    recentInitiatives: [
      'Dominant #1 global ranking in announced and completed M&A advisory transactions for the past two decades.',
      'Continued integration of automated market-making and quantitative execution platforms in fixed income, currencies, and commodities (FICC).',
      'Publication of Goldman Sachs Global Macro Research analyses driving institutional market perspectives.'
    ],
    whyUsTalkingPoints: [
      {
        angle: 'Unmatched Deal Pedigree and Market Authority',
        talkingPoint: 'Goldman Sachs consistently leads the league tables on the most complex, market-defining M&A and capital raising transactions. For a junior analyst, the density of deal experience and financial modeling rigor is the gold standard of Wall Street.'
      },
      {
        angle: 'Meritocratic, High-Performance Culture',
        talkingPoint: 'The culture of Goldman Sachs pushes everyone to perform at the highest standard while emphasizing apprenticeship. Learning directly from industry-leading managing directors offers an incomparable professional foundation.'
      }
    ],
    assessmentIntel: {
      cultureAndSjtFocus: 'Goldman Sachs assessments (HireVue video interviews and Superdays) evaluate extreme attention to detail, intellectual horsepower, commercial curiosity, and composure under pressure. Technical financial acumen must be paired with humble, partner-oriented interpersonal maturity.',
      interviewWatchouts: [
        'Never submit a pitch or calculation with formatting or decimal inconsistencies; accuracy is paramount.',
        'Know the markets: be ready to talk about the S&P 500, 10-year Treasury yield, inflation expectations, and a recent transaction Goldman advised on.'
      ],
      smartQuestionsToAsk: [
        'How is the firm positioning its advisory teams to navigate the rebound in cross-border M&A and sponsor exit pipelines?',
        'What advice would you give to an incoming analyst to make an immediate, indispensable contribution to their deal team during their first 90 days?'
      ]
    },
    keyTerminology: [
      { term: 'Pitchbook', meaning: 'The comprehensive presentation deck created by bankers to pitch strategic ideas or M&A transactions to corporate clients.' },
      { term: 'League Tables', meaning: 'Rankings of investment banks by transaction volume and fees generated in M&A, equity, and debt.' },
      { term: 'FICC', meaning: 'Fixed Income, Currencies, and Commodities trading division.' }
    ]
  }
];

export const POPULAR_COMPANY_NAMES = [
  'KPMG',
  'PwC',
  'Deloitte',
  'EY',
  'McKinsey & Company',
  'Goldman Sachs',
  'J.P. Morgan',
  'Boston Consulting Group (BCG)',
  'Bain & Company',
  'Morgan Stanley',
  'Google / Alphabet',
  'Amazon',
  'Microsoft',
  'Unilever',
  'Procter & Gamble',
  'Shell',
  'Standard Chartered',
  'Citigroup',
  'Accenture'
];

export const TRACK_PRESETS = [
  'Graduate Trainee / Analyst',
  'Audit & Assurance',
  'Consulting & Strategy',
  'Deal Advisory & Corporate Finance',
  'Tax & Legal',
  'Technology & Cyber Advisory',
  'Software Engineering / Tech',
  'Investment Banking & Markets',
  'Risk & Financial Advisory'
];
