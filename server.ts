import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

function getAIClient() {
  const key = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: key || undefined,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isApiKeyError(err: any): boolean {
  if (!err) return false;
  const str = typeof err === 'object' ? JSON.stringify(err) : String(err);
  return (
    err.status === 400 ||
    err.status === 403 ||
    str.includes("API_KEY_INVALID") ||
    str.includes("API key not valid") ||
    str.includes("PERMISSION_DENIED") ||
    str.includes("The caller does not have permission") ||
    str.includes("INVALID_ARGUMENT")
  );
}

function generateFallbackStudyTips(userProfile: any, sessions: any[]): string {
  if (!sessions || sessions.length === 0) {
    return `### Targeted Assessment Strategy & Recommendations

1. **Complete a Diagnostic Baseline Assessment**: Take your first full-length simulation or a quick 15-question quiz to establish your category benchmarks (Numerical, Verbal, Logical, and Situational Judgement).
2. **Master High-Yield Mental Math Shortcuts**: In Big 4 and corporate aptitude tests, candidates lose up to 40% of their time computing simple fractions and percentages manually. Practice ratio conversions (e.g., $1/8 = 12.5\\%$, $1/6 = 16.67\\%$) to save precious seconds.
3. **Internalize Company Cultural Competencies**: Review the **Company Intel** tab before tackling Situational Judgement questions—assessors evaluate candidate answers against specific corporate values.`;
  }

  const scores = sessions.map((s: any) => s.score || 0);
  const avg = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  const latest = scores[0];

  return `### Performance Insights & Coaching

- **Recent Average Score:** **${avg}%** (Latest Assessment: **${latest}%**)
- **Target Threshold:** 75%+ across all core testing streams

#### Actionable Improvement Tactics:

1. **Strategic Pacing Discipline**:
   Stick to a strict **45-to-50-second rule** per question. If a question appears too convoluted, flag it, make an educated elimination, and return at the end.

2. **Error Pattern Remediation**:
   Review questions you missed in your recent attempts. For **Numerical Reasoning**, focus on percentage change vs. percentage point difference. For **Verbal Reasoning**, avoid outside knowledge—rely strictly on facts stated in the text.

3. **Behavioral & Values Alignment**:
   In Situational Judgement items, always rank solutions that prioritize ethical integrity, client transparency, and proactive team collaboration as your highest-rated actions.`;
}

function getFallbackCompanyDossier(companyName: string) {
  const norm = companyName.toLowerCase();
  
  if (norm.includes("kpmg")) {
    return {
      companyName: "KPMG",
      tagline: "Together, For Better / Cutting Through Complexity",
      industry: "Professional Services / Big 4 Accounting & Advisory",
      headquarters: "Amstelveen, Netherlands (Global Operations)",
      founded: "1897 (Merger of Klynveld, Peat, Marwick, Goerdeler in 1987)",
      ceoOrLeadership: "Bill Thomas (Global Chairman & CEO)",
      overview: "KPMG is a global network of professional services firms providing Audit, Tax, and Advisory services across 143 countries with over 270,000 professionals. Renowned for digital innovation in assurance through KPMG Clara, KPMG advises the world's leading corporations, governments, and non-profits on transformation, compliance, and capital market integrity.",
      divisions: [
        "Audit & Assurance (Financial statement audits, ESG assurance, internal controls)",
        "Advisory (Management consulting, deal advisory, risk consulting, technology transformation)",
        "Tax & Legal (Corporate tax, international transfer pricing, trade compliance)",
        "KPMG Enterprise & Digital Solutions (Mid-market growth, data & AI implementation)"
      ],
      marketPosition: "Distinguished by a pragmatic, human-centric collaborative culture ('Together, For Better'). KPMG is recognized as a leader in trustworthy AI and digital audit integration, fostering an environment where graduate trainees gain early multidisciplinary exposure.",
      coreValues: [
        {
          value: "Integrity",
          explanation: "We do what is right. Acting ethically and transparently in all professional and personal dealings.",
          interviewAdvice: "In behavioral questions and SJTs, always prioritize professional ethics, public interest, and regulatory standards above short-term speed or commercial convenience."
        },
        {
          value: "Excellence",
          explanation: "We never stop learning and improving. Delivering high-quality work and holding ourselves to rigorous standards.",
          interviewAdvice: "Highlight your dedication to continuous learning, academic discipline, and willingness to study for professional certifications like ACA, ACCA, or CPA."
        },
        {
          value: "Courage",
          explanation: "We think and act boldly. Embracing difficult conversations and challenging conventional thinking.",
          interviewAdvice: "Share an example where you tactfully spoke up, questioned flawed assumptions, or proposed an innovative solution to an ambiguous dilemma."
        },
        {
          value: "Together",
          explanation: "We respect each other and draw strength from our differences. Collaboration and mutual respect.",
          interviewAdvice: "Focus on inclusive teamwork, peer mentoring, and active listening. Show how you bring out the best in team members from diverse backgrounds."
        },
        {
          value: "For Better",
          explanation: "We do what matters. Creating positive, sustainable impact for clients, capital markets, and society.",
          interviewAdvice: "Relate your personal ambitions to societal and environmental impact. Emphasize why contributing to trust in capital markets matters to you."
        }
      ],
      recentDevelopments: [
        {
          headline: "Global Strategic Alliance Expansion with Microsoft for Enterprise AI",
          summary: "KPMG committed multi-billion-dollar investments into AI and cloud services, integrating Microsoft Azure OpenAI directly into the KPMG Clara audit and advisory workflows.",
          relevanceToCandidate: "Citing this demonstrates strong commercial awareness of how technology is reshaping professional services and that you are eager to leverage AI-enabled tools.",
          dateOrContext: "2024-2026 Strategy"
        },
        {
          headline: "Major Expansion of ESG Assurance & Decarbonization Advisory",
          summary: "Scaling dedicated multidisciplinary ESG hubs to help clients navigate mandatory climate reporting frameworks like CSRD, SEC climate rules, and ISSB standards.",
          relevanceToCandidate: "Mentioning non-financial reporting shows forward-looking awareness of emerging audit requirements and advisory opportunities.",
          dateOrContext: "Recent Initiative"
        },
        {
          headline: "Launch of K-Tech Upskilling & Graduate Digital Accelerator",
          summary: "Comprehensive digital fluency curriculum designed to ensure all incoming graduate cohorts are trained in data analytics, Python, and automated testing.",
          relevanceToCandidate: "Shows you understand the day-to-day expectations and are excited about developing technical competencies from day one.",
          dateOrContext: "Ongoing Talent Focus"
        }
      ],
      whyThisCompanyPitches: [
        {
          angle: "Innovation & Digital Transformation Angle",
          pitch: "I am drawn to KPMG because you aren't just adapting to technological change in professional services—you are actively driving it. Your multi-billion-dollar alliance with Microsoft and the roll-out of AI-powered tools within KPMG Clara demonstrate a firm that empowers graduates to work with cutting-edge analytics from day one, rather than relying on legacy methods."
        },
        {
          angle: "Culture & 'Together, For Better' Alignment",
          pitch: "What stands out about KPMG compared to other Big Four networks is the authentic culture of collaboration embodied in 'Together, For Better'. In every interaction with current trainees, I noticed a genuine focus on collective success and mentorship. I want to build my career in an environment where diverse perspectives are celebrated and doing what is right comes first."
        },
        {
          angle: "Multidisciplinary Client Impact & Learning Curve",
          pitch: "KPMG offers an unparalleled breadth of exposure across public institutions, high-growth scale-ups, and FTSE 100 giants. Starting my career here means learning the fundamental mechanics of how complex global businesses operate, being challenged daily by senior mentors, and delivering work that genuinely protects trust in capital markets."
        }
      ],
      smartReverseQuestions: [
        {
          question: "How has the integration of Generative AI within KPMG Clara shifted the nature of tasks assigned to first- and second-year trainees on your engagements?",
          contextWhyToAsk: "Proves you understand their core audit software and are commercially curious about the evolution of the trainee role."
        },
        {
          question: "With the rapid rise of mandatory ESG disclosure requirements, how are your engagement teams collaborating across traditional Audit and Sustainability Advisory?",
          contextWhyToAsk: "Demonstrates advanced knowledge of current regulatory changes and cross-functional team dynamics."
        },
        {
          question: "Looking back at the graduate trainees who have progressed most rapidly in your practice, what behavioral habits separated the good from the exceptional?",
          contextWhyToAsk: "Shows ambition, self-awareness, and focus on practical success rather than just theoretical interest."
        },
        {
          question: "How has the firm's focus on 'Courage' empowered junior team members to share fresh ideas or challenge findings on client files?",
          contextWhyToAsk: "Directly mirrors their core value while prompting the interviewer to share a meaningful personal story."
        }
      ],
      assessmentStyle: {
        testProvider: "Cappfinity (Strengths-based cognitive and situational testing) & HireVue / Launchpad",
        stages: [
          "Stage 1: Online Application & Eligibility Screening",
          "Stage 2: Transforming Small Businesses (Blended Numerical, Critical Verbal, and Situational Judgement Assessment)",
          "Stage 3: Delivering Outcomes (Asynchronous Video Interview with scenario challenges)",
          "Stage 4: KPMG Discovery Centre (Virtual/In-person Assessment Centre, Group Collaboration, and Partner Case Interview)"
        ],
        tipsForSuccess: "KPMG tests are strength-based rather than purely speed-based. Prioritize accuracy and ethical integrity in all SJTs. In the video interview, use the STAR/CAR framework and weave in the core values (Courage, Integrity, Together, For Better, Excellence) naturally."
      },
      miniQuiz: [
        {
          question: "Which of the following is NOT one of KPMG's five official Global Core Values?",
          options: ["Integrity", "Courage", "Shareholder Maximization", "For Better"],
          answer: "Shareholder Maximization",
          explanation: "KPMG's five official values are Integrity, Excellence, Courage, Together, and For Better."
        },
        {
          question: "What is the name of KPMG's smart proprietary cloud-based audit technology platform?",
          options: ["KPMG Clara", "KPMG Beacon", "KPMG Omnia", "KPMG Canvas"],
          answer: "KPMG Clara",
          explanation: "KPMG Clara is the firm's intelligent audit platform that incorporates data analytics and Microsoft AI capabilities."
        },
        {
          question: "Which major technology giant did KPMG enter a landmark multi-billion-dollar strategic AI alliance with?",
          options: ["Microsoft", "Oracle", "Salesforce", "Cisco"],
          answer: "Microsoft",
          explanation: "KPMG expanded a landmark multi-billion-dollar alliance with Microsoft to integrate Azure OpenAI into its global service delivery."
        },
        {
          question: "What primary test publisher powers the blended assessment stage for the KPMG Graduate Trainee Assessment?",
          options: ["Cappfinity", "Talent Q", "Korn Ferry", "Criteria Corp"],
          answer: "Cappfinity",
          explanation: "KPMG famously uses Cappfinity's strengths-based testing framework to assess numerical reasoning, critical thinking, and situational judgement."
        }
      ]
    };
  }

  if (norm.includes("pwc") || norm.includes("pricewaterhouse")) {
    return {
      companyName: "PwC (PricewaterhouseCoopers)",
      tagline: "To build trust in society and solve important problems",
      industry: "Professional Services / Big 4 Accounting & Consulting",
      headquarters: "London, United Kingdom (Global Network)",
      founded: "1849 (Merger of Price Waterhouse and Coopers & Lybrand in 1998)",
      ceoOrLeadership: "Mohamed Kande (Global Chair) / Bob Moritz",
      overview: "PwC is the second-largest professional services network in the world with over 360,000 professionals across 152 countries. Providing Audit, Tax, and Advisory solutions, PwC is distinguished by Strategy& (its top-tier strategy consulting wing) and 'The New Equation', a strategy blending human expertise with digital acceleration.",
      divisions: [
        "Assurance (Financial audit, risk assurance, ESG reporting, internal controls)",
        "Advisory / Strategy& (Corporate strategy, deals, digital transformation, forensics)",
        "Tax & Legal (Global tax compliance, international transfer pricing, M&A tax)",
        "Deals (Valuations, corporate restructuring, transaction due diligence)"
      ],
      marketPosition: "Celebrated for top-tier executive strategy via Strategy& and large-scale enterprise transformation. PwC emphasizes whole-leadership and business acumen from day one through the PwC Professional framework.",
      coreValues: [
        {
          value: "Act with Integrity",
          explanation: "Speak up for what is right, especially when it feels difficult.",
          interviewAdvice: "Show instances where you adhered strictly to ethical principles and transparency despite project pressures."
        },
        {
          value: "Make a Difference",
          explanation: "Stay informed and be forward-thinking about the impact of your actions.",
          interviewAdvice: "Highlight projects where your individual initiative produced measurable improvements for clients or teams."
        },
        {
          value: "Care",
          explanation: "Make the effort to understand each person and what matters to them.",
          interviewAdvice: "Emphasize empathy, active listening, and supporting peers through high-intensity deadlines."
        },
        {
          value: "Work Together",
          explanation: "Collaborate across boundaries and draw strength from diverse perspectives.",
          interviewAdvice: "Demonstrate cross-functional collaboration and how you welcome contrasting ideas."
        },
        {
          value: "Reimagine the Possible",
          explanation: "Dare to challenge the status quo and experiment with innovative methods.",
          interviewAdvice: "Discuss creative problem solving and adopting new technologies to streamline complex tasks."
        }
      ],
      recentDevelopments: [
        {
          headline: "Expansion of 'The New Equation' Multi-Billion Global Strategy",
          summary: "Commitment to human-led, tech-powered transformation to build public trust and deliver sustained outcomes.",
          relevanceToCandidate: "Citing The New Equation shows you understand PwC's fundamental brand message.",
          dateOrContext: "2024-2026 Strategy"
        },
        {
          headline: "Global Enterprise AI Partnership with OpenAI & Harvey",
          summary: "PwC deployed generative AI models across its Tax, Legal, and Advisory practices to enhance document analysis.",
          relevanceToCandidate: "Shows enthusiasm for working alongside cutting-edge enterprise AI tools.",
          dateOrContext: "Tech Milestone"
        }
      ],
      whyThisCompanyPitches: [
        {
          angle: "The New Equation & Technology Leadership",
          pitch: "PwC's commitment to 'The New Equation'—being human-led and tech-powered—mirrors the exact environment where I want to launch my career. The combination of premier assurance with strategy consulting through Strategy& means I will gain both deep technical mastery and high-level commercial acumen."
        },
        {
          angle: "PwC Professional Leadership Framework",
          pitch: "I am specifically attracted to the PwC Professional framework, which evaluates candidates across Whole Leadership, Business Acumen, and Technical Capabilities. This holistic investment in trainees ensures that we grow into trusted commercial advisors from day one."
        }
      ],
      smartReverseQuestions: [
        {
          question: "How has 'The New Equation' shifted the nature of cross-service engagements between Assurance and Strategy& teams?",
          contextWhyToAsk: "Demonstrates deep familiarity with their signature brand philosophy."
        },
        {
          question: "Under the PwC Professional framework, what attribute do first-year associates typically find most challenging, and how does mentorship help them bridge it?",
          contextWhyToAsk: "Shows coachability, intellectual curiosity, and self-awareness."
        }
      ],
      assessmentStyle: {
        testProvider: "SHL & HireVue / Arctic Shores (Career Unlocked & Career Valuation)",
        stages: [
          "Stage 1: Online Application & Academic Eligibility",
          "Stage 2: Career Unlocked (Game-based and cognitive psychometric testing)",
          "Stage 3: Career Conversation (Video interview with situational prompts)",
          "Stage 4: Career Focus (Virtual assessment day, group case exercise, and senior partner interview)"
        ],
        tipsForSuccess: "In game-based and cognitive assessments, focus on steady accuracy and risk management. For behavioral interviews, map your answers to the 5 dimensions of the PwC Professional (Whole Leadership, Business Acumen, Technical, Global & Inclusive, Relationships)."
      },
      miniQuiz: [
        {
          question: "What is the official brand strategy driving PwC's global investments and transformation?",
          options: ["The New Equation", "Together For Better", "Building a Better World", "The Omnia Cloud"],
          answer: "The New Equation",
          explanation: "The New Equation is PwC's global strategy launched to address trust and sustained outcomes."
        },
        {
          question: "What is the name of PwC's prestigious global strategy consulting division?",
          options: ["Strategy&", "Monitor", "Parthenon", "Roland Berger"],
          answer: "Strategy&",
          explanation: "Strategy& is PwC's global strategy consulting group, originally founded as Booz & Company."
        }
      ]
    };
  }

  if (norm.includes("deloitte")) {
    return {
      companyName: "Deloitte",
      tagline: "Making an impact that matters",
      industry: "Professional Services / Big 4 Consulting & Advisory",
      headquarters: "London, UK (Global Secretariat)",
      founded: "1845 (Founded by William Welch Deloitte in London)",
      ceoOrLeadership: "Joe Ucuzoglu (Global CEO)",
      overview: "Deloitte is the largest professional services firm in the world by revenue and headcount, with over 450,000 professionals globally. Known for its powerhouse management consulting practice, risk advisory, tax, and audit services, Deloitte solves the most complex technological and organizational challenges for multinational corporations.",
      divisions: [
        "Consulting (Strategy, Core Business Operations, Enterprise Technology, Human Capital)",
        "Audit & Assurance (Financial statement audit, controls, ESG assurance via Deloitte Omnia)",
        "Risk Advisory (Cyber risk, regulatory compliance, operational resilience)",
        "Tax & Legal / Financial Advisory (M&A transactions, forensics, turnaround restructuring)"
      ],
      marketPosition: "Market leader in enterprise technology implementation, business transformation consulting, and generative AI deployment via the Deloitte AI Incubator.",
      coreValues: [
        {
          value: "Lead the way",
          explanation: "Deloitte aspires to be the undisputed leader, shaping the future of industries.",
          interviewAdvice: "Show ambition, leadership initiative in student or work projects, and intellectual curiosity."
        },
        {
          value: "Serve with integrity",
          explanation: "Upholding the highest standards of professional objectivity and public trust.",
          interviewAdvice: "Highlight zero-compromise ethics and compliance in all situational dilemmas."
        },
        {
          value: "Take care of each other",
          explanation: "Building an inclusive, supportive community that champions personal wellbeing.",
          interviewAdvice: "Share instances where you supported peer morale, mentored colleagues, or promoted psychological safety."
        },
        {
          value: "Collaborate for measurable impact",
          explanation: "Working seamlessly across disciplines to generate tangible client outcomes.",
          interviewAdvice: "Demonstrate cross-functional problem solving and quantitative results."
        }
      ],
      recentDevelopments: [
        {
          headline: "Expansion of Global GenAI Practice & CortexAI Suite",
          summary: "Multi-billion investment rolling out proprietary generative AI assistants across global client delivery teams.",
          relevanceToCandidate: "Shows readiness to adopt digital automation tools in daily client engagements.",
          dateOrContext: "2024-2026 Strategy"
        }
      ],
      whyThisCompanyPitches: [
        {
          angle: "Scale & Market Leadership",
          pitch: "I want to start my career at Deloitte because as the largest professional services firm globally, you work at the very nexus of strategy, technology, and governance. The opportunity to learn on engagements that genuinely reshape Fortune 500 operating models is second to none."
        }
      ],
      smartReverseQuestions: [
        {
          question: "With Deloitte's massive investments into CortexAI and Omnia, how has the day-to-day workflow of an entry-level analyst evolved over the past year?",
          contextWhyToAsk: "Demonstrates high commercial awareness of their internal technology ecosystem."
        }
      ],
      assessmentStyle: {
        testProvider: "Cappfinity / Imbue & HireVue",
        stages: [
          "Stage 1: Online Application",
          "Stage 2: Immersive Online Assessment (Numerical, Critical Thinking, SJT)",
          "Stage 3: Video Interview & Digital Case Challenge",
          "Stage 4: Final Assessment Centre / Partner Interview"
        ],
        tipsForSuccess: "Emphasize collaboration and leadership in group exercises. Use structured frameworks for business case questions."
      },
      miniQuiz: [
        {
          question: "What is Deloitte's worldwide core motto and purpose statement?",
          options: ["Making an impact that matters", "Together, For Better", "Building a better working world", "The New Equation"],
          answer: "Making an impact that matters",
          explanation: "Deloitte's central purpose statement is 'Making an impact that matters' for clients, people, and society."
        }
      ]
    };
  }

  if (norm.includes("ey") || norm.includes("ernst")) {
    return {
      companyName: "EY (Ernst & Young)",
      tagline: "Building a better working world",
      industry: "Professional Services / Big 4 Strategy & Assurance",
      headquarters: "London, UK (Global Operations)",
      founded: "1989 (Merger of Ernst & Whinney and Arthur Young)",
      ceoOrLeadership: "Janet Truncale (Global Chair & CEO)",
      overview: "EY is a leading global professional services network with more than 390,000 professionals in over 150 countries. EY operates across Assurance, Consulting, Strategy and Transactions (EY-Parthenon), and Tax, dedicated to increasing trust in business and promoting sustainable capital growth.",
      divisions: [
        "Assurance (Financial statement audit, climate & ESG assurance, forensics)",
        "Consulting (Business consulting, technology consulting, people advisory)",
        "Strategy and Transactions (EY-Parthenon strategy, M&A advisory, turnaround)",
        "Tax (Indirect tax, international tax, law, global compliance)"
      ],
      marketPosition: "Renowned for market-leading M&A and strategy advisory through EY-Parthenon, purpose-led transformation, and the EY.ai $1.4B technology investment platform.",
      coreValues: [
        {
          value: "Integrity, Respect, and Teaming",
          explanation: "Demonstrating authenticity, respecting colleagues, and prioritizing team wins.",
          interviewAdvice: "Showcase cooperative success where team cohesion drove the final result."
        },
        {
          value: "Energy, Enthusiasm, and Courage to Lead",
          explanation: "Approaching challenges with dynamic energy and taking accountability.",
          interviewAdvice: "Highlight proactive energy and taking initiative during difficult tasks."
        },
        {
          value: "Doing What Is Right",
          explanation: "Building trust through professional relationships based on ethical action.",
          interviewAdvice: "Reinforce commitment to ethical conduct and transparency in all scenarios."
        }
      ],
      recentDevelopments: [
        {
          headline: "Rollout of $1.4B EY.ai Platform & EY Fabric Architecture",
          summary: "Unifying AI capabilities and secure enterprise large language models across all global service lines.",
          relevanceToCandidate: "Highlights understanding of how EY harnesses AI to elevate client advisory.",
          dateOrContext: "2024-2026 Strategy"
        }
      ],
      whyThisCompanyPitches: [
        {
          angle: "Purpose-Driven Career Growth",
          pitch: "EY's dedication to 'Building a better working world' deeply aligns with my personal conviction that business must drive both economic growth and social trust. Whether in Assurance or EY-Parthenon, I want to develop rigorous commercial skills inside an organization that genuinely prioritizes sustainable impact."
        }
      ],
      smartReverseQuestions: [
        {
          question: "How has the rollout of EY.ai influenced the skillsets you now look for when recruiting entry-level graduate cohorts?",
          contextWhyToAsk: "Demonstrates knowledge of their $1.4B tech platform and forward-looking curiosity."
        }
      ],
      assessmentStyle: {
        testProvider: "Cappfinity (Strengths-based) & HireVue",
        stages: [
          "Stage 1: Online Application",
          "Stage 2: EY Strengths Assessment (Numerical, Verbal, SJT)",
          "Stage 3: Video Assessment with Written Exercise",
          "Stage 4: EY Experience Day (Assessment Centre & Partner Interview)"
        ],
        tipsForSuccess: "In the video stage, articulate why EY specifically over other Big Four firms. Emphasize teamwork and continuous curiosity."
      },
      miniQuiz: [
        {
          question: "What is EY's signature global purpose slogan?",
          options: ["Building a better working world", "Together, For Better", "The New Equation", "Lead with Pride"],
          answer: "Building a better working world",
          explanation: "EY's global purpose is 'Building a better working world'."
        }
      ]
    };
  }

  if (norm.includes("goldman")) {
    return {
      companyName: "Goldman Sachs",
      tagline: "Make things possible",
      industry: "Financial Services / Global Investment Banking",
      headquarters: "New York City, USA",
      founded: "1869 (Founded by Marcus Goldman)",
      ceoOrLeadership: "David Solomon (Chairman & CEO)",
      overview: "Goldman Sachs is a leading global investment banking, securities, and investment management firm providing a wide range of financial services to corporations, financial institutions, governments, and individuals.",
      divisions: [
        "Global Banking & Markets (Investment Banking, Fixed Income, Currencies & Commodities, Equities)",
        "Asset & Wealth Management (Private Wealth, Alternative Investments, Institutional Asset Management)",
        "Platform Solutions (Transaction Banking, Enterprise Partnerships)"
      ],
      marketPosition: "Preeminent brand in global mergers & acquisitions advisory, equity underwriting, and quantitative trading, known for exceptional intellectual rigor.",
      coreValues: [
        {
          value: "Partnership",
          explanation: "Collaborative teamwork across global divisions.",
          interviewAdvice: "Highlight collaborative projects, shared accountability, and low ego."
        },
        {
          value: "Client Service",
          explanation: "Putting client interests first with total commitment.",
          interviewAdvice: "Show dedication to delivering high-quality deliverables under pressure."
        },
        {
          value: "Integrity & Excellence",
          explanation: "Uncompromising compliance and flawless execution.",
          interviewAdvice: "Emphasize meticulous attention to detail and sound judgment."
        }
      ],
      recentDevelopments: [
        {
          headline: "Refocus on Core Global Banking & Markets Strengths",
          summary: "Strategic sharpening of high-margin corporate advisory, capital markets underwriting, and alternative assets.",
          relevanceToCandidate: "Shows strong market awareness of the firm's strategic pivot.",
          dateOrContext: "2024-2026 Strategy"
        }
      ],
      whyThisCompanyPitches: [
        {
          angle: "Intellectual Rigor & Meritocracy",
          pitch: "Goldman Sachs represents the benchmark of excellence in global capital markets. The culture of intense intellectual rigor, coupled with the opportunity to advise on landmark transactions alongside the industry's sharpest minds, makes it the ultimate environment to build commercial acumen."
        }
      ],
      smartReverseQuestions: [
        {
          question: "How has the One Goldman Sachs initiative reshaped collaboration between Global Banking & Markets and Wealth Management?",
          contextWhyToAsk: "Demonstrates deep familiarity with their core internal organizational structure."
        }
      ],
      assessmentStyle: {
        testProvider: "HireVue Video Interview & Superday Case Assessment",
        stages: [
          "Stage 1: Online Application",
          "Stage 2: Asynchronous HireVue Video Interview",
          "Stage 3: Superday (Back-to-back behavioral and technical interviews)"
        ],
        tipsForSuccess: "Know market indices, recent M&A deals, and pitch your story crisply. Perfect your 90-second 'Walk me through your resume'."
      },
      miniQuiz: [
        {
          question: "In what year was Goldman Sachs founded?",
          options: ["1869", "1905", "1929", "1845"],
          answer: "1869",
          explanation: "Goldman Sachs was founded in 1869 by Marcus Goldman in New York City."
        }
      ]
    };
  }

  // Generic fallback for any other company
  return {
    companyName: companyName,
    tagline: `Excellence, Innovation & Leadership at ${companyName}`,
    industry: "Corporate & Enterprise Services",
    headquarters: "Global Operations",
    founded: "Established Enterprise",
    ceoOrLeadership: "Executive Leadership Team",
    overview: `${companyName} is a premier organization operating at the forefront of its industry, delivering transformative solutions, products, and services to enterprise clients and consumers worldwide. The organization is recognized for high operational standards, market influence, and dedication to talent development.`,
    divisions: [
      "Core Operations & Service Delivery",
      "Strategic Business Development & Growth",
      "Technology, Data & Innovation",
      "Client Advisory & Solutions"
    ],
    marketPosition: `${companyName} differentiates itself through rigorous quality standards, customer focus, and agile execution, maintaining a resilient market presence against domestic and international rivals.`,
    coreValues: [
      {
        value: "Integrity & Ethics",
        explanation: "Uncompromising commitment to honesty, accountability, and transparent governance in every decision.",
        interviewAdvice: "Always illustrate how you uphold ethical standards under pressure or tight delivery deadlines."
      },
      {
        value: "Excellence & High Performance",
        explanation: "Relentless pursuit of quality and holding oneself to rigorous professional standards.",
        interviewAdvice: "Provide concrete examples of exceeding benchmarks and mastering technical skills."
      },
      {
        value: "Teamwork & Inclusion",
        explanation: "Respecting diverse perspectives and collaborating across boundaries for collective success.",
        interviewAdvice: "Highlight active listening, peer encouragement, and cross-functional team achievement."
      },
      {
        value: "Innovation & Adaptability",
        explanation: "Embracing change, continuous learning, and thinking creatively to solve challenging problems.",
        interviewAdvice: "Show instances where you embraced change, learned a new tool quickly, or proposed a creative improvement."
      }
    ],
    recentDevelopments: [
      {
        headline: "Digital Acceleration & Modernization Strategy",
        summary: `Strategic investments into data intelligence, automation, and cloud systems to improve operational efficiency and client responsiveness.`,
        relevanceToCandidate: "Shows you understand the firm's forward-looking tech adoption and are ready to contribute to efficient operations.",
        dateOrContext: "2024-2026 Strategy"
      },
      {
        headline: "Sustainability & Social Responsibility Commitments",
        summary: `Implementing environmental, social, and governance (ESG) practices across supply chains and internal operations.`,
        relevanceToCandidate: "Highlights your appreciation for sustainable long-term corporate citizenship.",
        dateOrContext: "Corporate Strategy"
      }
    ],
    whyThisCompanyPitches: [
      {
        angle: "Market Reputation & Industry Impact",
        pitch: `I am passionate about joining ${companyName} because of your stellar market reputation and the tangible impact of your work. Your commitment to high standards and innovation aligns with my desire to build a career in a high-velocity, intellectually rigorous environment.`
      },
      {
        angle: "Learning Curve & Professional Culture",
        pitch: `What distinguishes ${companyName} for me is the culture of continuous learning and empowerment. I want to contribute to a collaborative team that tackles complex business problems while nurturing early-career talent.`
      }
    ],
    smartReverseQuestions: [
      {
        question: `How are the strategic priorities of ${companyName} evolving with recent technological and market shifts over the next 12 to 24 months?`,
        contextWhyToAsk: "Demonstrates long-term thinking and high commercial awareness."
      },
      {
        question: "What key competencies or mindsets distinguish the top performers in this specific role during their first year?",
        contextWhyToAsk: "Shows drive, receptivity to coaching, and focus on delivering immediate value."
      }
    ],
    assessmentStyle: {
      testProvider: "Standard Corporate Psychometric & Situational Assessment",
      stages: [
        "Online Application & Resume Screening",
        "Cognitive & Situational Judgement Assessment",
        "Competency & Motivational Interview",
        "Final Round / Leadership Case Study"
      ],
      tipsForSuccess: `Research ${companyName}'s core values deeply, structure your interview responses using the STAR method (Situation, Task, Action, Result), and emphasize commercial awareness.`
    },
    miniQuiz: [
      {
        question: `When preparing an interview answer for ${companyName}, which technique is most effective?`,
        options: ["The STAR Method (Situation, Task, Action, Result)", "Giving one-word answers", "Focusing only on theoretical concepts without personal examples", "Skipping the results and impact"],
        answer: "The STAR Method (Situation, Task, Action, Result)",
        explanation: "The STAR method ensures your answers are structured, concrete, and evidence-based."
      },
      {
        question: `Why is it critical to research an organization's core values before an assessment?`,
        options: ["Situational judgement questions and behavioral interviews are scored against their values", "To memorize them word-for-word only", "To see if they offer snacks", "Values don't matter in recruitment"],
        answer: "Situational judgement questions and behavioral interviews are scored against their values",
        explanation: "Recruiters and automated assessment algorithms grade situational answers against the company's specific cultural competencies."
      }
    ]
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/study-tips", async (req, res) => {
    try {
      const { userProfile, sessions } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      let responseText = "";

      if (apiKey && apiKey.trim().length > 10) {
        const prompt = `Analyze this user's quiz sessions and provide 3 short, actionable study tips or a focused practice session. Focus on their weakest categories in the given sessions. Format as Markdown. Ensure the response is concise and helpful.

Profile: ${JSON.stringify(userProfile)}
Recent Sessions: ${JSON.stringify(sessions)}

Provide tailored advice:`;

        try {
          const ai = getAIClient();
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
          });
          responseText = response.text || "";
        } catch (firstErr: any) {
          if (isApiKeyError(firstErr)) {
            console.log("[Study Tips] Gemini API key is currently inactive/invalid. Using personalized coaching fallback.");
          } else {
            try {
              const ai = getAIClient();
              const response = await ai.models.generateContent({
                model: "gemini-flash-latest",
                contents: prompt,
              });
              responseText = response.text || "";
            } catch {
              console.log("[Study Tips] Secondary Gemini call failed, using personalized coaching fallback.");
            }
          }
        }
      }

      if (!responseText) {
        responseText = generateFallbackStudyTips(userProfile, sessions);
      }

      res.json({ tips: responseText });
    } catch {
      res.json({ tips: generateFallbackStudyTips(req.body?.userProfile, req.body?.sessions || []) });
    }
  });

  // Helper to ensure every dossier has competitors, STAR prompts, redFlags, and commonTraps
  function enrichDossier(dossier: any, targetRole: string) {
    const name = dossier.companyName || "the organization";
    const norm = name.toLowerCase();

    if (!Array.isArray(dossier.competitors) || dossier.competitors.length === 0) {
      if (norm.includes("kpmg")) {
        dossier.competitors = [
          { name: "PwC", differentiator: "KPMG leans into a tighter, human-centric 'Together, For Better' culture and deep Microsoft Azure AI integration via KPMG Clara, often giving junior trainees broader cross-client ownership earlier." },
          { name: "Deloitte", differentiator: "While Deloitte is the largest by consulting headcount, KPMG maintains a strong integrated Audit-Tax-Advisory balance and specialized mid-market agility via KPMG Enterprise." },
          { name: "EY", differentiator: "KPMG differentiates through cohesive multidisciplinary collaboration without structural split distractions, paired with targeted ESG and regulatory transformation hubs." }
        ];
      } else if (norm.includes("pwc") || norm.includes("pricewaterhouse")) {
        dossier.competitors = [
          { name: "Deloitte", differentiator: "PwC pairs world-leading assurance prestige with pure-play corporate strategy via Strategy& and 'The New Equation' human-led, tech-powered framework." },
          { name: "KPMG", differentiator: "PwC holds larger global advisory scale, an early enterprise OpenAI/Harvey deployment across Tax & Legal, and the structured PwC Professional leadership model." },
          { name: "EY", differentiator: "PwC combines dominant FTSE/Fortune 500 audit penetration with high-margin Deals and transaction services across 152 countries." }
        ];
      } else if (norm.includes("deloitte")) {
        dossier.competitors = [
          { name: "PwC", differentiator: "Deloitte leads the Big Four in global revenue and end-to-end technology, cyber, and digital engineering consulting scale." },
          { name: "Accenture", differentiator: "Unlike pure tech consultancies, Deloitte pairs deep enterprise technology delivery with Audit, Risk, Tax, and M&A advisory under one roof." },
          { name: "KPMG", differentiator: "Deloitte offers unmatched breadth across specialized industry verticals and global Deloitte University leadership centers." }
        ];
      } else if (norm.includes("ey") || norm.includes("ernst")) {
        dossier.competitors = [
          { name: "PwC", differentiator: "EY stands out for EY-Parthenon strategy, strong IPO and entrepreneurial founder ecosystems (World Entrepreneur of the Year), and 'Building a Better Working World'." },
          { name: "Deloitte", differentiator: "EY emphasizes global borderless teaming across integrated geographic areas and accessible Tech MBA / Badges upskilling for all employees." },
          { name: "KPMG", differentiator: "EY has a particularly strong footprint in transaction advisory, private equity diligence, and technology-sector assurance." }
        ];
      } else if (norm.includes("mckinsey")) {
        dossier.competitors = [
          { name: "BCG", differentiator: "McKinsey operates as a true 'One Firm' global staffing partnership with unparalleled C-suite board access and proprietary QuantumBlack AI capabilities." },
          { name: "Bain & Company", differentiator: "While Bain uses a home-office staffing model heavily weighted to private equity, McKinsey offers broader global mobility and public/social sector reach." },
          { name: "Deloitte / Big 4", differentiator: "McKinsey focuses on top-of-house CEO strategy, transformative organizational turnarounds, and rapid meritocratic progression." }
        ];
      } else if (norm.includes("goldman")) {
        dossier.competitors = [
          { name: "JP Morgan", differentiator: "Goldman Sachs is renowned for elite M&A advisory leadership, institutional trading precision, and an intense apprenticeship culture." },
          { name: "Morgan Stanley", differentiator: "Goldman pairs top-ranked investment banking league table dominance with proprietary quantitative engineering (Marquee platform)." },
          { name: "Citi / Bank of America", differentiator: "Goldman focuses intensely on high-margin institutional advisory, asset & wealth management, and global markets execution." }
        ];
      } else {
        dossier.competitors = [
          { name: "Tier-1 Industry Peers", differentiator: `${name} distinguishes itself through focused execution, strong brand equity, and investment in modern digital operations.` },
          { name: "Agile Market Challengers", differentiator: `${name} pairs institutional reliability and client trust with scalable talent development programs.` },
          { name: "Global Conglomerates", differentiator: `${name} offers early-career candidates high visibility, cross-functional ownership, and structured commercial training.` }
        ];
      }
    }

    if (Array.isArray(dossier.coreValues)) {
      dossier.coreValues = dossier.coreValues.map((v: any) => ({
        ...v,
        starPrompt: v.starPrompt || `Tell me about a time you demonstrated "${v.value}" under pressure or when facing competing priorities—what action did you take and what was the measurable outcome?`
      }));
    }

    if (!Array.isArray(dossier.redFlags) || dossier.redFlags.length === 0) {
      dossier.redFlags = [
        `Giving a generic "Why ${name}?" answer that could be copy-pasted onto a rival's application without naming specific platforms, divisions, or 2024–2026 initiatives.`,
        `Failing to connect your personal background to the commercial realities and day-to-day responsibilities of a ${targetRole}.`,
        `Ignoring ${name}'s official core values during Situational Judgement Tests—choosing expediency or unilateral decisions over ethics, transparency, and collaboration.`,
        `Ending the interview with "No, I don't have any questions" or asking basic facts already stated on the careers homepage.`
      ];
    }

    if (dossier.assessmentStyle && (!Array.isArray(dossier.assessmentStyle.commonTraps) || dossier.assessmentStyle.commonTraps.length === 0)) {
      dossier.assessmentStyle.commonTraps = [
        "Spending too long on a single multi-step numerical chart instead of flagging and preserving pacing discipline.",
        "Bringing outside assumptions into Verbal Reasoning passages rather than relying strictly on stated text.",
        "Treating Situational Judgement scenarios casually instead of systematically scoring each option against the firm's official values."
      ];
    }

    dossier.targetRole = targetRole;
    return dossier;
  }

  // Company Intelligence & Background Research API
  app.post("/api/company-research", async (req, res) => {
    try {
      const { company, role } = req.body;
      if (!company || typeof company !== "string" || !company.trim()) {
        return res.status(400).json({ error: "Company name is required." });
      }

      const cleanCompany = company.trim();
      const targetRole = role ? String(role).trim() : "Graduate Trainee / Analyst";
      const apiKey = process.env.GEMINI_API_KEY;

      let parsedDossier: any = null;
      let groundingSources: { title: string; uri: string }[] = [];
      let isLiveGrounded = false;

      // Only invoke Gemini API if a plausible API key is configured
      if (apiKey && apiKey.trim().length > 10) {
        const prompt = `You are a world-class corporate assessment and executive interview coach specializing in graduate traineeships, management consulting, Big 4 accounting, investment banking, and technology recruitment.
Conduct an in-depth background research breakdown for the organization: "${cleanCompany}" specifically tailored for a candidate preparing for assessments and interviews for the role of "${targetRole}".

Use Google Search grounding to retrieve authentic, real-world data: exact official core values, current leadership, real business divisions, key competitors, and recent strategic news/initiatives from 2024-2026.

You MUST return ONLY a valid, parseable JSON object without markdown codeblocks, commentary, or extra text.
Adhere strictly to this JSON format:
{
  "companyName": "${cleanCompany}",
  "tagline": "Official motto or prominent slogan",
  "industry": "Primary industry sector (e.g., Professional Services / Big 4, FinTech, Investment Banking)",
  "headquarters": "City, Country",
  "founded": "Year founded or brief founding context",
  "ceoOrLeadership": "Current CEO, Managing Partner, or Global Leader",
  "overview": "Clear 3-4 sentence breakdown of what this organization actually does, its business model, scale, and global prestige.",
  "divisions": ["Core Division 1", "Core Division 2", "Core Division 3", "Core Division 4"],
  "marketPosition": "2-3 sentences explaining their competitive edge, strategic moat, and how they differentiate from rivals.",
  "competitors": [
    {
      "name": "Direct Competitor Name",
      "differentiator": "1-2 sentences explaining specifically how ${cleanCompany} stands out against this rival so the candidate can answer 'Why ${cleanCompany} over [rival]?'"
    }
  ],
  "coreValues": [
    {
      "value": "Exact Name of Core Value",
      "explanation": "What this value means to the company",
      "interviewAdvice": "Specific actionable tactics on how the candidate must exhibit this value during behavioral interviews and situational judgement tests",
      "starPrompt": "A realistic behavioral STAR interview question an interviewer at ${cleanCompany} would ask to test this exact value for a ${targetRole} candidate"
    }
  ],
  "recentDevelopments": [
    {
      "headline": "Real recent strategic move, AI partnership, ESG milestone, or major client project",
      "summary": "Concise summary of the strategic move",
      "relevanceToCandidate": "How a ${targetRole} candidate can cite this in their interview to demonstrate commercial awareness",
      "dateOrContext": "Timeframe or context (e.g., 2025-2026)"
    }
  ],
  "whyThisCompanyPitches": [
    {
      "angle": "Innovation & Strategic Direction Angle",
      "pitch": "A polished, conversational 3-4 sentence answer to 'Why do you want to work at ${cleanCompany} as a ${targetRole}?' focusing on this angle."
    },
    {
      "angle": "Culture & Core Values Angle",
      "pitch": "A polished, conversational 3-4 sentence response highlighting cultural alignment and behavioral standards."
    },
    {
      "angle": "Client Impact & Career Growth Angle",
      "pitch": "A polished, conversational 3-4 sentence response focusing on impact and learning curve for a ${targetRole}."
    }
  ],
  "smartReverseQuestions": [
    {
      "question": "An intelligent, sophisticated question a ${targetRole} candidate can ask the partner or hiring manager at the end of the interview",
      "contextWhyToAsk": "Why asking this demonstrates high commercial acumen and thorough preparation"
    }
  ],
  "assessmentStyle": {
    "testProvider": "Typical testing publishers used (e.g., Cappfinity, SHL, Cubiks, Korn Ferry, Saville, Pymetrics, HackerRank, or In-house)",
    "stages": ["Stage 1: Online Application & Screening", "Stage 2: Assessment Details", "Stage 3: Interview Stage", "Stage 4: Final Round / Assessment Centre"],
    "tipsForSuccess": "3-4 concrete insider tactics for passing ${cleanCompany}'s ${targetRole} hiring process.",
    "commonTraps": ["Specific assessment or interview pitfall 1", "Specific assessment or interview pitfall 2", "Specific assessment or interview pitfall 3"]
  },
  "redFlags": [
    "Specific mistake 1 that causes ${cleanCompany} candidates to get rejected",
    "Specific mistake 2 to avoid in interviews",
    "Specific mistake 3 regarding commercial awareness or cultural fit"
  ],
  "miniQuiz": [
    {
      "question": "A multiple-choice question testing the candidate's recall of ${cleanCompany}'s values, leadership, platforms, or recent strategy",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Why this answer is correct"
    }
  ]
}

Provide at least 3 competitors, 4-5 coreValues, 3 recentDevelopments, 3 whyThisCompanyPitches, 4 smartReverseQuestions, 3 redFlags, and 4 miniQuiz questions.`;

        const extractGroundingSources = (resp: any) => {
          const chunks = resp?.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (!Array.isArray(chunks)) return [];
          const seen = new Set<string>();
          const result: { title: string; uri: string }[] = [];
          for (const chunk of chunks) {
            const uri = chunk?.web?.uri;
            const title = chunk?.web?.title;
            if (uri && typeof uri === "string" && !seen.has(uri)) {
              seen.add(uri);
              result.push({
                title: (title && String(title).trim()) || new URL(uri).hostname.replace(/^www\./, ""),
                uri,
              });
            }
            if (result.length >= 8) break;
          }
          return result;
        };

        let responseText = "";
        try {
          const ai = getAIClient();
          const response = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              tools: [{ googleSearch: {} }],
            },
          });
          responseText = response.text || "";
          groundingSources = extractGroundingSources(response);
          if (responseText) isLiveGrounded = true;
        } catch (firstErr: any) {
          if (isApiKeyError(firstErr)) {
            console.log(`[Company Research] Gemini API key not active or invalid. Serving curated dossier for "${cleanCompany}".`);
          } else {
            try {
              const ai = getAIClient();
              const response = await ai.models.generateContent({
                model: "gemini-3.8-flash",
                contents: prompt,
                config: {
                  responseMimeType: "application/json",
                  tools: [{ googleSearch: {} }],
                },
              });
              responseText = response.text || "";
              groundingSources = extractGroundingSources(response);
              if (responseText) isLiveGrounded = true;
            } catch {
              console.log(`[Company Research] Fallback model call failed, serving curated dossier for "${cleanCompany}".`);
            }
          }
        }

        if (responseText) {
          try {
            const cleanJson = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
            parsedDossier = JSON.parse(cleanJson);
          } catch {
            console.log("[Company Research] JSON parsing returned non-JSON, using structured dossier.");
          }
        }
      } else {
        console.log(`[Company Research] Using curated verified dossier for "${cleanCompany}".`);
      }

      if (!parsedDossier || !parsedDossier.companyName) {
        parsedDossier = getFallbackCompanyDossier(cleanCompany);
        isLiveGrounded = false;
      }

      parsedDossier = enrichDossier(parsedDossier, targetRole);
      parsedDossier.groundingSources = groundingSources;
      parsedDossier.isLiveGrounded = isLiveGrounded;
      parsedDossier.id = "dossier_" + cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
      parsedDossier.savedAt = new Date().toISOString();

      res.json({ dossier: parsedDossier });
    } catch {
      const companyParam = (req.body?.company as string) || "KPMG";
      const roleParam = (req.body?.role as string) || "Graduate Trainee / Analyst";
      const fallback = enrichDossier(getFallbackCompanyDossier(companyParam), roleParam);
      fallback.isLiveGrounded = false;
      fallback.id = "dossier_" + companyParam.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
      fallback.savedAt = new Date().toISOString();
      res.json({ dossier: fallback });
    }
  });

  // Fresh Company Knowledge Check Generator (never repeats previous mini-quiz questions)
  app.post("/api/company-quiz", async (req, res) => {
    try {
      const { company, role, overview, values, developments, previousQuestions } = req.body;
      const cleanCompany = (company && String(company).trim()) || "the organization";
      const targetRole = (role && String(role).trim()) || "Graduate Trainee / Analyst";
      const prevList: string[] = Array.isArray(previousQuestions) ? previousQuestions : [];
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey.trim().length > 10) {
        const prompt = `Create 4 brand-new, challenging multiple-choice interview readiness questions about "${cleanCompany}" for a "${targetRole}" candidate.
Use the context below to test commercial awareness, competitive differentiation, cultural values, and situational judgement.

Company Overview: ${overview || ""}
Core Values: ${JSON.stringify(values || [])}
Recent Initiatives: ${JSON.stringify(developments || [])}

CRITICAL: Do NOT repeat or rephrase any of these previously asked questions:
${prevList.map((q, i) => `${i + 1}. ${q}`).join("\n") || "None"}

Return ONLY a valid JSON array of 4 objects with no markdown fences:
[
  {
    "question": "Clear, specific question testing real knowledge or values judgement",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Exact matching string of the correct option",
    "explanation": "Concise 1-2 sentence explanation of why this is correct"
  }
]`;

        try {
          const ai = getAIClient();
          const response = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });
          const text = (response.text || "").replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.question) {
            return res.json({ questions: parsed.slice(0, 4) });
          }
        } catch (err) {
          console.log("[Company Quiz] Live generation unavailable, building dynamic contextual quiz.", err instanceof Error ? err.message : "");
        }
      }

      // Dynamic contextual fallback built from the dossier's actual values & developments
      const valNames: string[] = Array.isArray(values) ? values.map((v: any) => v.value).filter(Boolean) : [];
      const devHeadlines: string[] = Array.isArray(developments) ? developments.map((d: any) => d.headline).filter(Boolean) : [];
      const primaryValue = valNames[0] || "Integrity";
      const secondaryValue = valNames[1] || "Collaboration";
      const primaryDev = devHeadlines[0] || "Digital Transformation & Workflow Modernization";

      const dynamicFallback = [
        {
          question: `During a ${cleanCompany} assessment scenario, a tight client deadline tempts a teammate to skip a quality verification step. Applying "${primaryValue}", what is the strongest response?`,
          options: [
            "Flag the risk transparently, uphold quality standards, and coordinate a realistic plan with your manager",
            "Bypass the verification quietly to keep the client satisfied in the short term",
            "Ignore the teammate's shortcut as long as your own section is complete",
            "Delay the project indefinitely without communicating to stakeholders"
          ],
          answer: "Flag the risk transparently, uphold quality standards, and coordinate a realistic plan with your manager",
          explanation: `${cleanCompany} evaluates situational judgement directly against "${primaryValue}"—protecting quality and transparent communication always outweighs risky shortcuts.`
        },
        {
          question: `How can a ${targetRole} candidate best leverage "${primaryDev}" during a ${cleanCompany} interview?`,
          options: [
            "Connect the initiative to how the role is evolving and ask an insightful follow-up question about team impact",
            "Recite the press release headline verbatim without explaining why it matters",
            "Avoid mentioning recent news unless the interviewer brings it up first",
            "Compare it negatively against unrelated startups"
          ],
          answer: "Connect the initiative to how the role is evolving and ask an insightful follow-up question about team impact",
          explanation: "High-scoring candidates link strategic initiatives directly to the role's day-to-day value creation and commercial awareness."
        },
        {
          question: `When asked "Why ${cleanCompany} over direct competitors?" as a ${targetRole} applicant, what makes an answer stand out?`,
          options: [
            "Citing specific business divisions, cultural differentiation, and recent strategic investments tied to your career goals",
            "Saying it is a prestigious global company with good compensation",
            "Listing generic strengths that apply equally to every firm in the sector",
            "Criticizing competitors' employees directly"
          ],
          answer: "Citing specific business divisions, cultural differentiation, and recent strategic investments tied to your career goals",
          explanation: "Interviewers look for authentic, firm-specific research rather than interchangeable praise."
        },
        {
          question: `To demonstrate "${secondaryValue}" in a ${cleanCompany} behavioral interview, which answer structure is most compelling?`,
          options: [
            "A specific STAR example quantifying your personal actions, how you aligned stakeholders, and the measurable result",
            "A philosophical definition of teamwork without any real-world example",
            "Speaking only in 'we' statements without clarifying your own contribution",
            "Focusing solely on technical tools while skipping interpersonal impact"
          ],
          answer: "A specific STAR example quantifying your personal actions, how you aligned stakeholders, and the measurable result",
          explanation: "Concrete STAR stories that clarify your individual contribution and measurable outcomes score highest in competency rubrics."
        }
      ];

      res.json({ questions: dynamicFallback });
    } catch {
      res.status(500).json({ error: "Unable to generate fresh company quiz questions." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
