import { CompanyResearchDossier, PitchEvaluationResult } from '../types';

export const CURATED_COMPANY_DOSSIERS: Record<string, CompanyResearchDossier> = {
  'KPMG': {
    companyName: 'KPMG',
    tagline: 'For Better | Inspire Confidence, Empower Change',
    industry: 'Professional Services / Big Four (Audit, Tax, Advisory)',
    founded: '1897 (Merged in 1987 by Klynveld Main Goerdeler & Peat Marwick)',
    headquarters: 'Amstelveen, Netherlands (Global) | Local HQ: Lagos (KPMG Nigeria), London (UK)',
    ceoOrLeadership: 'Bill Thomas (Global Chairman & CEO) | Tola Adeyemi (Senior Partner, KPMG West Africa)',
    scale: {
      globalEmployees: '~273,000 across 143 countries',
      revenueOrMarketCap: '$36.4 Billion (FY2023)',
      globalPresence: '143 countries and territories worldwide'
    },
    overview: 'KPMG is one of the global Big Four professional services organizations, renowned for auditing Fortune 500 corporations, providing sovereign economic advice, and delivering digital transformation. The firm is characterized by a strong culture of collegiality, ethical excellence, and social impact.\n\nIn Nigeria and across West Africa, KPMG has been a preeminent advisor for decades, guiding banking consolidations, fiscal policy reform, energy sector transitions, and enterprise risk management.',
    coreValues: [
      {
        name: 'Integrity',
        description: 'We do what is right. Doing what is right always comes before immediate commercial expediency.',
        howToDemonstrateInAssessment: 'In Situational Judgement Tests (SJTs), always prioritize honesty, compliance, and regulatory standards over shortcuts or concealing minor audit errors.'
      },
      {
        name: 'Excellence',
        description: 'We never stop learning and improving. Continuous technical mastery and intellectual curiosity.',
        howToDemonstrateInAssessment: 'Demonstrate enthusiasm for continuous learning, ask insightful data-driven questions, and show readiness to master new analytical tools like KPMG Clara.'
      },
      {
        name: 'Courage',
        description: 'We think and act boldly. Speaking up and challenging the consensus constructively.',
        howToDemonstrateInAssessment: 'In group exercises or behavioral scenarios, tactfully question faulty assumptions with evidence rather than silently following the group consensus.'
      },
      {
        name: 'Together',
        description: 'We respect each other and draw strength from our differences. Teamwork across diverse skillsets.',
        howToDemonstrateInAssessment: 'Actively acknowledge team members\' contributions, synthesize opposing views, and avoid dominating group case discussions.'
      },
      {
        name: 'For Better',
        description: 'We do what matters. Delivering a positive, long-term impact on our communities and clients.',
        howToDemonstrateInAssessment: 'Frame your career ambitions around creating systemic economic value and sustainable social impact, not merely individual prestige.'
      }
    ],
    cultureAndCompetencies: [
      {
        pillar: 'Career Growth & Psychological Safety',
        description: 'KPMG prides itself on an approachable partnership structure where trainees have direct access to senior leaders.',
        whatRecruitersLookFor: 'Self-awareness, coachability, and comfort receiving feedback.'
      },
      {
        pillar: 'Commercial Curiosity',
        description: 'Understanding how macroeconomic shifts, tax reforms, and interest rates impact client balance sheets.',
        whatRecruitersLookFor: 'Ability to connect raw numbers to real-world corporate strategy.'
      },
      {
        pillar: 'Digital Fluency',
        description: 'Embracing data analytics, AI, and automation in every engagement.',
        whatRecruitersLookFor: 'Familiarity with data manipulation, structured logic, and modern business software.'
      }
    ],
    keyBusinessLines: [
      {
        division: 'Audit & Assurance',
        description: 'Independent evaluation of corporate financial statements to build public trust and market confidence.',
        keyClientsOrProjects: 'Statutory audits for Tier-1 commercial banks, multinationals, and energy conglomerates using the cloud-native KPMG Clara platform.'
      },
      {
        division: 'Advisory (Deal Advisory, Management Consulting, Risk Consulting)',
        description: 'Strategic M&A guidance, restructuring, operational efficiency, cybersecurity, and regulatory risk.',
        keyClientsOrProjects: 'Cross-border mergers, banking digitalization, fintech compliance, and supply chain optimizations.'
      },
      {
        division: 'Tax & Regulatory Services',
        description: 'Corporate tax compliance, transfer pricing, international tax treaties, and regulatory dispute resolution.',
        keyClientsOrProjects: 'Advising multinationals on navigating complex regional tax codes, withholding tax, and VAT restructuring.'
      }
    ],
    recentDevelopmentsAndNews: [
      {
        title: 'Multi-Billion Dollar Global AI & Cloud Alliance with Microsoft',
        summary: 'KPMG announced a landmark $2B+ expansion of its global partnership with Microsoft to integrate Azure OpenAI into KPMG Clara and digital advisory engagements.',
        significanceForCandidates: 'Mention this alliance during interviews when discussing tech enablement: "I am particularly excited about how KPMG is equipping junior associates with Microsoft Copilot and Clara AI to shift focus from manual data collation to high-level strategic analysis."'
      },
      {
        title: 'KPMG Global Sustainability & ESG Strategy Practice',
        summary: 'Massive rollout of ESG assurance and decarbonization advisory practices across emerging and developed markets.',
        significanceForCandidates: 'Demonstrates modern commercial awareness; shows you recognize how non-financial reporting is becoming as crucial as statutory financial audits.'
      }
    ],
    whyUsTalkingPoints: [
      {
        angle: 'The "For Better" Purpose & Authentic Culture',
        talkingPoint: 'KPMG\'s distinctive commitment to doing what matters for both businesses and the broader economy resonates deeply with my personal work ethic.',
        exampleScript: '"What distinguishes KPMG for me is the authentic commitment to \'For Better\'. While all Big 4 firms offer top-tier client exposure, KPMG\'s emphasis on psychological safety, early autonomy, and solving foundational socioeconomic challenges means I will not just build technical acumen—I will contribute to building institutional trust."'
      },
      {
        angle: 'Pioneering Audit Technology (KPMG Clara)',
        talkingPoint: 'KPMG is actively modernizing professional services with intelligent, predictive audit platforms rather than legacy repetitive tasks.',
        exampleScript: '"I want to begin my career at a firm that leads the technological curve. KPMG\'s investment in Clara AI and its Microsoft cloud alliance proves that young professionals here are trained as strategic digital thinkers from Day One."'
      }
    ],
    anticipatedInterviewQuestions: [
      {
        question: 'Why KPMG specifically, and not PwC, Deloitte, or EY?',
        whyTheyAskIt: 'To weed out candidates who just copied and pasted a generic Big 4 answer.',
        suggestedAnswerStrategy: 'Acknowledge all Big 4 are great, but pivot immediately to KPMG\'s specific values (e.g. \'Together\' & \'For Better\'), a specific KPMG thought leadership report you read, and their transparent mentorship culture.'
      },
      {
        question: 'Tell me about a time you had to deliver difficult news or stand up for what was right against peer pressure.',
        whyTheyAskIt: 'Testing for the core value of Integrity and Courage in high-stakes client audit situations.',
        suggestedAnswerStrategy: 'Use the STAR method: describe a situation where a group was tempted to skip a step or ignore a flaw; explain how you diplomatically spoke up and protected the project\'s integrity.'
      }
    ],
    questionsToAskTheInterviewer: [
      {
        question: 'How has the rollout of KPMG Clara and the Microsoft AI alliance transformed the day-to-day workload and learning curve for first-year associates in your team?',
        context: 'Shows you know their actual proprietary tools and are already visualizing your day-to-day contributions.',
        whatItDemonstrates: 'High technological curiosity and deep research.'
      },
      {
        question: 'In your career at KPMG, what is the best example you have witnessed of the \'For Better\' value in action during a challenging client engagement?',
        context: 'Flips the question to the partner/manager, inviting them to share a proud moment.',
        whatItDemonstrates: 'Emotional intelligence and cultural alignment.'
      }
    ],
    cheatSheetSummary: {
      keyFacts: [
        'Global revenue: $36.4B with 273,000+ professionals across 143 countries.',
        'Core Global Values: Integrity, Excellence, Courage, Together, For Better.',
        'Flagship Audit Platform: KPMG Clara (integrated with Microsoft Azure AI).',
        'Senior Leadership: Bill Thomas (Global CEO), Tola Adeyemi (West Africa Senior Partner).',
        'Specializations: Audit & Assurance, Tax & Regulatory, Strategy & Advisory.'
      ],
      doSay: [
        'Mention "For Better" and "Inspire Confidence, Empower Change".',
        'Refer to KPMG Clara and data-driven auditing.',
        'Highlight collaborative problem solving and psychological safety.'
      ],
      dontSay: [
        'Never say "I want to join KPMG because it looks great on my CV / gives prestige".',
        'Do not describe the Big 4 as identical accounting shops.',
        'Avoid sounding like an individualistic lone-wolf; KPMG prizes teamwork.'
      ]
    },
    lastUpdated: new Date().toISOString()
  },
  'PwC': {
    companyName: 'PwC',
    tagline: 'The New Equation | Building Trust & Delivering Sustained Outcomes',
    industry: 'Professional Services / Big Four (Assurance, Advisory, Tax, Strategy&)',
    founded: '1849 (Merged in 1998 by Price Waterhouse and Coopers & Lybrand)',
    headquarters: 'London, United Kingdom (Global Network) | Regional HQs across 151 countries',
    ceoOrLeadership: 'Mohamed Kande (PwC Global Chairman) | Sam Abu (Regional Senior Partner, PwC West Market Area)',
    scale: {
      globalEmployees: '~364,000 worldwide',
      revenueOrMarketCap: '$55.4 Billion (FY2024)',
      globalPresence: '151 countries and 680+ locations'
    },
    overview: 'PricewaterhouseCoopers (PwC) is the second-largest professional services network in the world by revenue. Through its landmark strategy, "The New Equation," PwC combines human ingenuity with advanced technology to address the world\'s two most pressing needs: building trust in institutions and delivering sustained commercial outcomes.\n\nPwC is known for rigorous analytical training, Strategy& (its top-tier strategy consulting arm), and leading the professional services market in Generative AI adoption.',
    coreValues: [
      {
        name: 'Act with integrity',
        description: 'Speak up for what is right, especially when it is hard. Expect and deliver the highest ethical standards.',
        howToDemonstrateInAssessment: 'Show zero tolerance for deceptive practices, even when pressured by client deadlines.'
      },
      {
        name: 'Make a difference',
        description: 'Stay informed and ask questions about the future. Respond with agility to each new challenge.',
        howToDemonstrateInAssessment: 'Suggest innovative ways to improve process efficiency and solve root causes rather than symptoms.'
      },
      {
        name: 'Care',
        description: 'Make the effort to understand every person and what matters to them. Recognize everyone\'s value.',
        howToDemonstrateInAssessment: 'Support colleagues who may be overwhelmed; demonstrate active listening in team discussions.'
      },
      {
        name: 'Work together',
        description: 'Collaborate and share relationships, ideas, and knowledge across teams, departments, and borders.',
        howToDemonstrateInAssessment: 'Avoid information hoarding; proactively communicate cross-functional insights.'
      },
      {
        name: 'Reimagine the possible',
        description: 'Dare to challenge the status quo and try new things. Innovate, test, and learn from failure.',
        howToDemonstrateInAssessment: 'Propose creative digital solutions and show adaptability in the face of ambiguity.'
      }
    ],
    cultureAndCompetencies: [
      {
        pillar: 'The PwC Professional Framework',
        description: 'PwC\'s global leadership model evaluating 5 dimensions: Whole Leadership, Business Acumen, Technical and Digital, Global and Inclusive, and Relationships.',
        whatRecruitersLookFor: 'Self-leadership, digital agility, and the ability to build meaningful client relationships.'
      },
      {
        pillar: 'Human-Led, Tech-Powered',
        description: 'The foundation of The New Equation: technology amplifies human judgment, it does not replace it.',
        whatRecruitersLookFor: 'Candidates who understand both the algorithmic output and the human ethical context.'
      }
    ],
    keyBusinessLines: [
      {
        division: 'Assurance',
        description: 'Financial audits, internal controls assurance, ESG reporting, and capital markets readiness.',
        keyClientsOrProjects: 'Auditing blue-chip corporations, sovereign wealth funds, and major financial institutions.'
      },
      {
        division: 'Tax & Legal Services',
        description: 'Global compliance, indirect tax, transfer pricing, workforce tax, and commercial legal advisory.',
        keyClientsOrProjects: 'Cross-border tax structuring, digital tax compliance, and regulatory reform advocacy.'
      },
      {
        division: 'Advisory & Strategy&',
        description: 'High-level business strategy, operations, forensic accounting, cybersecurity, and financial deals.',
        keyClientsOrProjects: 'M&A valuation, sovereign fiscal strategy, banking recapitalization, and digital transformations.'
      }
    ],
    recentDevelopmentsAndNews: [
      {
        title: 'PwC Generative AI Expansion & ChatPwC Platform',
        summary: 'PwC deployed its internal enterprise-grade AI assistant (ChatPwC) across 100,000+ employees and partnered with OpenAI and Harvey AI for tax, audit, and legal acceleration.',
        significanceForCandidates: 'Demonstrates deep commercial awareness of PwC\'s operational modernization: mention ChatPwC and human-led tech delivery in your interview.'
      },
      {
        title: 'The New Equation Strategic Roadmap',
        summary: 'Multi-billion dollar commitment focused on trust-building, cyber resilience, and climate assurance reporting.',
        significanceForCandidates: 'Use the phrase "The New Equation" when answering "Why PwC?", demonstrating you know their current corporate North Star.'
      }
    ],
    whyUsTalkingPoints: [
      {
        angle: 'The PwC Professional Leadership Philosophy',
        talkingPoint: 'PwC\'s framework trains graduates not just as technicians, but as holistic business leaders who understand technology, relationships, and commercial acumen.',
        exampleScript: '"I am drawn to PwC because of the PwC Professional framework. It recognizes that in an AI-driven economy, technical expertise alone is insufficient; young professionals need Whole Leadership, Global Acumen, and Relationship building to solve multifaceted client challenges."'
      },
      {
        angle: '"The New Equation" Human-Led, Tech-Powered Execution',
        talkingPoint: 'PwC combines human empathy and ethics with cutting-edge AI and analytics.',
        exampleScript: '"PwC\'s concept of The New Equation—bringing diverse talent and cutting-edge digital platforms like ChatPwC together—is the exact environment where I want to build a career at the intersection of business and technology."'
      }
    ],
    anticipatedInterviewQuestions: [
      {
        question: 'How do you embody the 5 dimensions of the PwC Professional?',
        whyTheyAskIt: 'Direct test of whether you studied their recruitment criteria.',
        suggestedAnswerStrategy: 'Pick 2 dimensions (e.g. Whole Leadership and Technical & Digital) and give concrete stories showcasing initiative and tech problem solving.'
      },
      {
        question: 'What does "The New Equation" mean to you as a candidate?',
        whyTheyAskIt: 'Testing commercial awareness of their brand strategy.',
        suggestedAnswerStrategy: 'Explain that trust and sustained outcomes are interconnected—businesses cannot succeed without public trust, and technology must be guided by human integrity.'
      }
    ],
    questionsToAskTheInterviewer: [
      {
        question: 'How has the deployment of ChatPwC and Harvey AI shifted what PwC expects from graduate analysts in their first year on client engagements?',
        context: 'Extremely sharp question that shows you follow their technological rollouts.',
        whatItDemonstrates: 'Commercial mastery, tech literacy, and proactive initiative.'
      }
    ],
    cheatSheetSummary: {
      keyFacts: [
        'Global revenue: $55.4B with 364,000+ professionals across 151 countries.',
        'Core Strategy: "The New Equation" (Building Trust & Delivering Sustained Outcomes).',
        'Global Leadership Framework: "The PwC Professional" (5 pillars).',
        'Global Chairman: Mohamed Kande; Regional Leader (West Africa): Sam Abu.',
        'Strategy Arm: Strategy& (formerly Booz & Company).'
      ],
      doSay: [
        'Mention "The New Equation" and "Human-led, Tech-powered".',
        'Demonstrate alignment with the 5 PwC Professional attributes.',
        'Show interest in trust-building and ESG assurance.'
      ],
      dontSay: [
        'Do not refer to PwC as a pure "bookkeeping" firm.',
        'Avoid answers focused only on salary or prestige.'
      ]
    },
    lastUpdated: new Date().toISOString()
  },
  'EY': {
    companyName: 'EY',
    tagline: 'Building a better working world',
    industry: 'Professional Services / Big Four (Assurance, Consulting, Strategy and Transactions, Tax)',
    founded: '1989 (Origins trace back to Arthur Young and Alwin C. Ernst in 1903/1906)',
    headquarters: 'London, United Kingdom (Global Headquarters)',
    ceoOrLeadership: 'Janet Truncale (Global Chairman and CEO) | Anthony Oputa (Regional Managing Partner, EY West Africa)',
    scale: {
      globalEmployees: '~395,000 worldwide',
      revenueOrMarketCap: '$51.2 Billion (FY2024)',
      globalPresence: '150+ countries worldwide'
    },
    overview: 'Ernst & Young (EY) is a global leader in assurance, tax, transaction, and advisory services united by its clear global purpose: "Building a better working world." EY is celebrated for its entrepreneurial culture, premier transaction strategy advisory through EY-Parthenon, and ground-breaking employee education programs like EY Badges and free accredited Master\'s degrees.\n\nEY stands out for its high-trust client relationships and pioneering investments in artificial intelligence with its $1.4B EY.ai platform.',
    coreValues: [
      {
        name: 'People who demonstrate integrity, respect, and teaming',
        description: 'Doing what is right, fostering inclusion, and putting team success ahead of individual accolades.',
        howToDemonstrateInAssessment: 'In team tasks, actively support quieter peers and ensure every perspective is evaluated respectfully.'
      },
      {
        name: 'People with energy, enthusiasm, and the courage to lead',
        description: 'Proactive drive, passion for solving client puzzles, and resilience under pressure.',
        howToDemonstrateInAssessment: 'Show genuine intellectual curiosity and positive energy when tackling complex assessment cases.'
      },
      {
        name: 'People who build relationships based on doing the right thing',
        description: 'Long-term trusted partnerships rooted in honesty, transparency, and ethical conviction.',
        howToDemonstrateInAssessment: 'Never suggest cutting corners to hit short-term targets in hypothetical business simulations.'
      }
    ],
    cultureAndCompetencies: [
      {
        pillar: 'Transformative Leadership',
        description: 'EY\'s model of "Better Me, Better Us, Better Working World"—developing personal purpose to inspire others.',
        whatRecruitersLookFor: 'Authenticity, growth mindset, and clarity of personal purpose.'
      },
      {
        pillar: 'Continuous Upskilling & EY Badges',
        description: 'EY offers micro-credential badges in AI, Blockchain, Data Visualization, and fully funded tech MBAs.',
        whatRecruitersLookFor: 'Passion for self-directed continuous learning.'
      }
    ],
    keyBusinessLines: [
      {
        division: 'Assurance',
        description: 'Financial statement audits, climate change & sustainability services, and forensic investigations.',
        keyClientsOrProjects: 'Audits of global market leaders, energy conglomerates, and consumer goods giants.'
      },
      {
        division: 'Consulting (Business & Technology)',
        description: 'Customer experience, digital architecture, cloud transformation, supply chain, and risk management.',
        keyClientsOrProjects: 'Core banking modernizations, ERP implementations, and enterprise cyber resilience.'
      },
      {
        division: 'Strategy and Transactions (EY-Parthenon)',
        description: 'World-class corporate strategy, M&A due diligence, restructuring, and turnaround advisory.',
        keyClientsOrProjects: 'Advising private equity firms and Fortune 500 boards on multi-billion dollar acquisitions.'
      },
      {
        division: 'Tax',
        description: 'Business tax advisory, international tax, indirect tax, and tax technology transformation.',
        keyClientsOrProjects: 'Guiding cross-border supply chain tax efficiency and national tax reform alignment.'
      }
    ],
    recentDevelopmentsAndNews: [
      {
        title: 'Launch of $1.4B EY.ai Platform & AI Large Language Models',
        summary: 'EY announced the unification of its human consulting capabilities with advanced artificial intelligence, deploying EY.ai to accelerate audit risk analysis and tax advisory.',
        significanceForCandidates: 'Demonstrates awareness of how EY equips consultants with predictive AI tools.'
      },
      {
        title: 'Historic Leadership Transition to Janet Truncale',
        summary: 'Janet Truncale took office as Global Chairman and CEO, marking the first woman to lead a Big Four global professional services organization.',
        significanceForCandidates: 'Highlights EY\'s tangible commitment to diversity, meritocracy, and groundbreaking leadership.'
      }
    ],
    whyUsTalkingPoints: [
      {
        angle: '"Building a Better Working World" & Purpose-Led Consulting',
        talkingPoint: 'EY\'s purpose is not an afterthought—it guides which client problems the firm chooses to solve.',
        exampleScript: '"EY\'s purpose of \'Building a better working world\' is what sets it apart for me. In every client engagement, from audit to strategy with EY-Parthenon, the focus is on long-term value creation. That purpose-driven framework is where I want to build my career."'
      },
      {
        angle: 'Investment in People (EY Badges & Hult Tech MBA)',
        talkingPoint: 'EY provides world-class credentials and continuous education for junior talent.',
        exampleScript: '"I want to join EY because it is the only firm offering the EY Badges program and fully accredited degrees in emerging technologies. It proves that EY invests in its people\'s market value from Day One."'
      }
    ],
    anticipatedInterviewQuestions: [
      {
        question: 'What does "Building a better working world" mean in the context of your desired role?',
        whyTheyAskIt: 'To check if you understand their core global purpose.',
        suggestedAnswerStrategy: 'Connect the purpose to technical excellence—e.g. In Audit, building a better working world means providing unquestioned transparency so investors and employees can trust market institutions.'
      }
    ],
    questionsToAskTheInterviewer: [
      {
        question: 'How has the integration of the EY.ai platform changed how your team analyzes complex transaction due diligence or audit risk?',
        context: 'Highlights commercial and tech awareness.',
        whatItDemonstrates: 'Prepared, forward-looking candidate.'
      }
    ],
    cheatSheetSummary: {
      keyFacts: [
        'Global revenue: $51.2B with ~395,000 professionals.',
        'Motto / Purpose: "Building a better working world".',
        'Global CEO: Janet Truncale (First female global CEO of a Big Four firm).',
        'Strategy Arm: EY-Parthenon (Top global strategy consulting practice).',
        'Tech & AI Platform: EY.ai ($1.4B global investment).'
      ],
      doSay: [
        'Mention "Building a better working world" and EY Badges.',
        'Emphasize teaming and entrepreneurial initiative.',
        'Refer to Transformative Leadership.'
      ],
      dontSay: [
        'Never pretend to know an answer you do not know—EY values transparency.',
        'Do not overlook EY-Parthenon\'s strategy reputation.'
      ]
    },
    lastUpdated: new Date().toISOString()
  },
  'Deloitte': {
    companyName: 'Deloitte',
    tagline: 'Making an impact that matters',
    industry: 'Professional Services / Big Four (Consulting, Audit, Risk, Financial Advisory, Tax)',
    founded: '1845 (Founded by William Welch Deloitte in London)',
    headquarters: 'London, United Kingdom (Global DTTL) | Major regional hubs worldwide',
    ceoOrLeadership: 'Joe Ucuzoglu (Deloitte Global CEO) | Fatai Folarin (CEO, Deloitte West Africa)',
    scale: {
      globalEmployees: '~457,000 professionals worldwide',
      revenueOrMarketCap: '$67.2 Billion (FY2024)',
      globalPresence: '150+ countries and territories'
    },
    overview: 'Deloitte Touche Tohmatsu Limited (Deloitte) is the largest professional services organization in the world by revenue and headcount. Unlike some peers that spun off their consulting wings, Deloitte retained and heavily scaled its management, technology, and strategy consulting practices (including Monitor Deloitte).\n\nKnown for its world-renowned "Deloitte University" leadership campus, Deloitte advises governments, Fortune 100 boards, and tech innovators on mega-scale digital, regulatory, and financial transformations.',
    coreValues: [
      {
        name: 'Lead the way',
        description: 'Not only keeping pace, but shaping the market and setting new industry benchmarks.',
        howToDemonstrateInAssessment: 'Bring forward-thinking perspectives and structured, innovative problem solving to cases.'
      },
      {
        name: 'Serve with integrity',
        description: 'Highest standards of professional conduct and unbiased objectivity.',
        howToDemonstrateInAssessment: 'Always verify data sources and resist assumptions in numerical and verbal reasoning exercises.'
      },
      {
        name: 'Take care of each other',
        description: 'Fostering a culture of well-being, psychological safety, and mutual support.',
        howToDemonstrateInAssessment: 'Recognize teammates under stress in team simulations and offer constructive support.'
      },
      {
        name: 'Foster inclusion',
        description: 'Creating an environment where diverse backgrounds produce superior solutions.',
        howToDemonstrateInAssessment: 'Solicit and amplify alternative viewpoints during group case exercises.'
      },
      {
        name: 'Collaborate for measurable impact',
        description: 'Translating strategic insights into tangible, real-world metrics for clients.',
        howToDemonstrateInAssessment: 'Always conclude recommendations with quantified impact and KPIs.'
      }
    ],
    cultureAndCompetencies: [
      {
        pillar: 'Scale & Multidisciplinary Depth',
        description: 'The ability to assemble world-leading engineers, tax lawyers, auditors, and economists under one roof.',
        whatRecruitersLookFor: 'Cross-functional curiosity and comfort operating in complex, matrixed environments.'
      },
      {
        pillar: 'Deloitte University (DU) Experience',
        description: 'Commitment to leadership development through immersive, in-person executive education.',
        whatRecruitersLookFor: 'High emotional intelligence, presentation charisma, and leadership drive.'
      }
    ],
    keyBusinessLines: [
      {
        division: 'Consulting (Monitor Deloitte, Human Capital, Core Business Operations)',
        description: 'Industry-leading management and technology consulting tackling end-to-end digital transformations.',
        keyClientsOrProjects: 'ERP migrations, cloud transformations with AWS/Google/Salesforce, national economic policies.'
      },
      {
        division: 'Audit & Assurance',
        description: 'Independent audit powered by Deloitte Omnia cloud analytics.',
        keyClientsOrProjects: 'Statutory audits for the world\'s largest financial institutions and tech titans.'
      },
      {
        division: 'Risk Advisory',
        description: 'Cybersecurity, regulatory compliance, operational risk, and sustainability assurance.',
        keyClientsOrProjects: 'National critical infrastructure security and central bank prudential risk.'
      },
      {
        division: 'Financial Advisory (M&A, Forensics, Restructuring)',
        description: 'Corporate finance, valuation, insolvency, and financial crime investigations.',
        keyClientsOrProjects: 'Cross-border buyouts, sovereign debt restructurings, and forensic tracing.'
      }
    ],
    recentDevelopmentsAndNews: [
      {
        title: 'Deloitte Global GenAI Practice & CortexAI Suite',
        summary: 'Massive $1.4B investment expanding Deloitte\'s generative AI incubator, delivering enterprise AI models to Global 2000 enterprises.',
        significanceForCandidates: 'Demonstrates you understand Deloitte\'s market leadership in enterprise AI consulting.'
      },
      {
        title: 'Deloitte FY24 Record Revenue: $67.2 Billion',
        summary: 'Confirmed position as the largest professional services organization globally, driven by surging demand for AI and transformation consulting.',
        significanceForCandidates: 'Proves scale: you can discuss how Deloitte\'s unmatched breadth allows for multidisciplinary client solutions.'
      }
    ],
    whyUsTalkingPoints: [
      {
        angle: '"Making an Impact That Matters" & Scale',
        talkingPoint: 'Deloitte\'s unrivaled scale allows you to tackle systemic challenges that smaller firms cannot touch.',
        exampleScript: '"What draws me to Deloitte is the promise of \'Making an impact that matters\'. As the world\'s largest professional services firm with a preserved, market-leading consulting practice, Deloitte is uniquely positioned to solve the most complex, systemic challenges facing modern enterprises."'
      },
      {
        angle: 'Deloitte University (DU) & Lifelong Leadership',
        talkingPoint: 'Deloitte invests more in leadership development campuses than any other professional firm.',
        exampleScript: '"The emphasis Deloitte places on leadership development through Deloitte University demonstrates that you invest in people for the long term. I want to build a career in a culture that cultivates leadership as a core discipline."'
      }
    ],
    anticipatedInterviewQuestions: [
      {
        question: 'What does "Making an impact that matters" mean to you personally?',
        whyTheyAskIt: 'Testing your personal purpose against their organizational mission.',
        suggestedAnswerStrategy: 'Share an example where your effort created lasting, measurable improvement for a group or project.'
      }
    ],
    questionsToAskTheInterviewer: [
      {
        question: 'Given Deloitte\'s market-leading scale across Consulting and Audit, how frequently do cross-functional teams collaborate on large-scale national or enterprise transformations in your practice?',
        context: 'Shows understanding of their multidisciplinary advantage.',
        whatItDemonstrates: 'Sophisticated commercial acumen.'
      }
    ],
    cheatSheetSummary: {
      keyFacts: [
        'Global revenue: $67.2B (Largest professional services firm in the world).',
        'Global workforce: ~457,000 professionals in 150+ countries.',
        'Motto: "Making an impact that matters".',
        'Global CEO: Joe Ucuzoglu; West Africa CEO: Fatai Folarin.',
        'Audit Platform: Deloitte Omnia.'
      ],
      doSay: [
        'Emphasize "Making an impact that matters" and measurable KPIs.',
        'Mention the multidisciplinary consulting and audit strength.',
        'Show enthusiasm for Deloitte University and continuous leadership.'
      ],
      dontSay: [
        'Do not treat Deloitte as purely an audit firm; its consulting wing is massive.',
        'Never submit vague, unquantified recommendations.'
      ]
    },
    lastUpdated: new Date().toISOString()
  },
  'ARM': {
    companyName: 'ARM (Asset & Resource Management)',
    tagline: 'Empowering Growth, Preserving Wealth',
    industry: 'Investment Management / Non-Bank Financial Services',
    founded: '1994 (Established in Nigeria as an affiliate of Guaranty Trust Bank, now independent)',
    headquarters: 'Lagos, Nigeria (Ikoyi Headquarters) | Regional offices nationwide',
    ceoOrLeadership: 'Jumoke Ogundare (Group CEO, ARM Holding Company)',
    scale: {
      globalEmployees: '~1,000+ financial specialists',
      revenueOrMarketCap: 'Over ₦1.5+ Trillion in Assets Under Management (AUM)',
      globalPresence: 'Leading footprint in West Africa with international capital partnerships'
    },
    overview: 'Asset & Resource Management Holding Company (ARM) is Nigeria\'s premier independent non-bank financial services institution. Founded in 1994, ARM pioneered modern asset management, mutual funds, and infrastructure funds in West Africa.\n\nARM operates across Wealth Management, Pensions (ARM Pension Managers), Securities Brokerage, Real Estate, and Infrastructure Private Equity, managing over ₦1.5 trillion in client assets. For candidates seeking a high-caliber career in frontier market finance, asset allocation, and macro research, ARM is a gold-standard employer.',
    coreValues: [
      {
        name: 'Excellence',
        description: 'Unyielding commitment to high standards of financial stewardship, research rigor, and analytical precision.',
        howToDemonstrateInAssessment: 'Ensure mathematical precision and disciplined risk-reward reasoning in quantitative and reasoning assessments.'
      },
      {
        name: 'Integrity & Stewardship',
        description: 'Preserving trust as fiduciary custodians of pensioners, families, and institutional capital.',
        howToDemonstrateInAssessment: 'Always put the investor\'s risk tolerance and regulatory compliance before aggressive short-term yield.'
      },
      {
        name: 'Innovation & Agility',
        description: 'Pioneering new financial instruments, digital wealth platforms (e.g., ARM One), and alternative asset classes.',
        howToDemonstrateInAssessment: 'Show familiarity with fintech innovation and digital democratization of mutual funds.'
      },
      {
        name: 'Client Focus',
        description: 'Tailoring financial solutions to the unique life stages and investment horizons of clients.',
        howToDemonstrateInAssessment: 'In situational scenarios, always analyze the client\'s risk appetite and liquidity needs first.'
      },
      {
        name: 'Teamwork',
        description: 'Collaborative synergy across asset management, pensions, and research desks.',
        howToDemonstrateInAssessment: 'Demonstrate respectful, constructive communication during group case assessments.'
      }
    ],
    cultureAndCompetencies: [
      {
        pillar: 'Macroeconomic Acumen',
        description: 'Deep understanding of inflation, central bank monetary policy rates (MPR), currency dynamics, and debt markets.',
        whatRecruitersLookFor: 'Ability to interpret financial press, bond yields, and capital market trends.'
      },
      {
        pillar: 'Fiduciary Mindset',
        description: 'Treating client assets with supreme responsibility and risk discipline.',
        howToDemonstrateInAssessment: 'Prudent risk management combined with analytical foresight.'
      }
    ],
    keyBusinessLines: [
      {
        division: 'ARM Investment Managers (Asset Management)',
        description: 'Mutual funds (Money Market Fund, Discovery Balanced Fund, Ethical Fund) and institutional portfolios.',
        keyClientsOrProjects: 'Managing sovereign wealth mandates, high-net-worth individuals (HNWIs), and corporate treasuries.'
      },
      {
        division: 'ARM Pension Managers',
        description: 'One of Nigeria\'s top Pension Fund Administrators (PFAs), managing retirement savings accounts (RSAs).',
        keyClientsOrProjects: 'Retirement security for hundreds of thousands of Nigerian workers under the PenCom regulatory umbrella.'
      },
      {
        division: 'ARM Infrastructure & Real Estate',
        description: 'Private equity infrastructure fund investing in transport, energy, and commercial real estate.',
        keyClientsOrProjects: 'Lekki Toll Road concession, landmark hospital infrastructure, and urban commercial developments.'
      },
      {
        division: 'ARM Securities',
        description: 'Equities brokerage, fixed income dealing, and primary market treasury bills underwriting.',
        keyClientsOrProjects: 'Trading on the Nigerian Exchange (NGX) and FMDQ Securities Exchange.'
      }
    ],
    recentDevelopmentsAndNews: [
      {
        title: 'ARM One Digital Wealth Management App Expansion',
        summary: 'ARM accelerated retail investment adoption through ARM One, enabling micro-investing in money market funds and equities.',
        significanceForCandidates: 'Demonstrates understanding of financial inclusion and digital wealth democratization.'
      },
      {
        title: 'ARM Labs Innovation Program',
        summary: 'Incubation program supporting early-stage African fintech and proptech startups in partnership with Techstars.',
        significanceForCandidates: 'Proves ARM is not just a traditional fund manager, but an active catalyst for African tech entrepreneurship.'
      }
    ],
    whyUsTalkingPoints: [
      {
        angle: 'Pioneer in West African Capital Markets',
        talkingPoint: 'ARM created the modern asset management playbook in Nigeria and continues to set the benchmark for fiduciary excellence.',
        exampleScript: '"What distinguishes ARM for me is its track record as a homegrown financial pioneer. From launching one of the earliest mutual funds to founding the first private infrastructure fund in Nigeria, ARM offers young analysts the opportunity to work on investments that directly build national infrastructure and preserve multigenerational wealth."'
      },
      {
        angle: 'ARM Labs & Innovation Agility',
        talkingPoint: 'ARM combines traditional institutional stability with fintech agility through ARM Labs.',
        exampleScript: '"I want to join ARM because of the intersection between institutional asset management and innovation. Seeing programs like ARM Labs shows that the firm is actively shaping the future of African financial services."'
      }
    ],
    anticipatedInterviewQuestions: [
      {
        question: 'How does high inflation and Monetary Policy Rate (MPR) adjustments affect our Money Market Fund versus Equity portfolios?',
        whyTheyAskIt: 'Crucial test of commercial and macroeconomic awareness.',
        suggestedAnswerStrategy: 'Explain that rising MPR increases yields on short-term debt instruments (benefiting Money Market Funds), while potentially compressing equity valuations due to higher cost of capital.'
      }
    ],
    questionsToAskTheInterviewer: [
      {
        question: 'With the current macroeconomic shifts in inflation and foreign exchange, how is ARM positioning its alternative asset and infrastructure funds for institutional investors?',
        context: 'Shows advanced financial literacy and serious interest in ARM\'s specific funds.',
        whatItDemonstrates: 'Top-tier candidate readiness.'
      }
    ],
    cheatSheetSummary: {
      keyFacts: [
        'Founded: 1994; Nigeria\'s premier independent non-bank financial institution.',
        'Assets Under Management: Over ₦1.5+ Trillion.',
        'Group CEO: Jumoke Ogundare.',
        'Core Arms: Investment Managers, Pension Managers, Securities, Infrastructure, Real Estate.',
        'Flagship Retail Platform: ARM One & ARM Labs fintech incubator.'
      ],
      doSay: [
        'Mention fiduciary stewardship, wealth preservation, and risk-adjusted returns.',
        'Refer to ARM One and ARM Labs.',
        'Show an understanding of macroeconomic indicators (inflation, yields, PenCom).'
      ],
      dontSay: [
        'Do not confuse ARM with a commercial deposit money bank (it is an asset management firm).',
        'Avoid speculative trading mentalities; ARM emphasizes disciplined stewardship.'
      ]
    },
    lastUpdated: new Date().toISOString()
  }
};

const STORAGE_KEY_DOSSIERS = 'smartprep_company_dossiers';

export function getSavedDossiers(): Record<string, CompanyResearchDossier> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOSSIERS);
    const local = raw ? JSON.parse(raw) : {};
    return { ...CURATED_COMPANY_DOSSIERS, ...local };
  } catch {
    return { ...CURATED_COMPANY_DOSSIERS };
  }
}

export function saveDossierLocally(dossier: CompanyResearchDossier) {
  try {
    const current = getSavedDossiers();
    current[dossier.companyName] = dossier;
    localStorage.setItem(STORAGE_KEY_DOSSIERS, JSON.stringify(current));
  } catch (e) {
    console.warn("Failed to save dossier locally:", e);
  }
}

export async function fetchCompanyResearch(companyName: string, targetRole?: string): Promise<CompanyResearchDossier> {
  const normalized = companyName.trim();
  const saved = getSavedDossiers();
  
  // If we already have a curated/saved dossier and it's less than 30 days old, return it directly
  // but allow explicit live fetch
  if (saved[normalized]) {
    return saved[normalized];
  }

  // Call the server API endpoint
  const response = await fetch('/api/company-research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyName: normalized, targetRole })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to research company: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.dossier) {
    throw new Error("Invalid response format received from research server.");
  }

  saveDossierLocally(data.dossier);
  return data.dossier;
}

export async function evaluateWhyUsPitch(companyName: string, pitchText: string, targetRole?: string): Promise<PitchEvaluationResult> {
  const response = await fetch('/api/company-pitch-eval', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyName, pitchText, targetRole })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to evaluate pitch: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.evaluation) {
    throw new Error("Invalid response from evaluation server.");
  }

  return data.evaluation;
}
