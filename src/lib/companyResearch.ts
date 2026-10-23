import { CompanyDossier } from '../types';

export const STORAGE_KEY_SAVED_DOSSIERS = 'smartprep_saved_dossiers';

export const POPULAR_COMPANIES = [
  { name: 'KPMG', sector: 'Big 4 / Advisory & Assurance', color: 'from-blue-600 to-indigo-700' },
  { name: 'PwC', sector: 'Big 4 / Strategy & Assurance', color: 'from-orange-600 to-amber-700' },
  { name: 'Deloitte', sector: 'Big 4 / Risk, Tech & Audit', color: 'from-emerald-600 to-teal-800' },
  { name: 'EY', sector: 'Big 4 / Transaction & Advisory', color: 'from-yellow-600 to-amber-800' },
  { name: 'McKinsey & Company', sector: 'Management Consulting (MBB)', color: 'from-sky-700 to-blue-900' },
  { name: 'Goldman Sachs', sector: 'Investment Banking & Markets', color: 'from-slate-700 to-zinc-900' },
  { name: 'Google', sector: 'Technology & Cloud', color: 'from-red-600 to-orange-600' },
  { name: 'JP Morgan', sector: 'Corporate & Investment Banking', color: 'from-amber-800 to-stone-900' }
];

export function getSavedDossiers(): CompanyDossier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_DOSSIERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDossierLocally(dossier: CompanyDossier): void {
  try {
    const current = getSavedDossiers();
    const filtered = current.filter(d => d.companyName.toLowerCase() !== dossier.companyName.toLowerCase());
    filtered.unshift({ ...dossier, savedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY_SAVED_DOSSIERS, JSON.stringify(filtered.slice(0, 30)));
  } catch (e) {
    console.warn("Could not save company dossier locally:", e);
  }
}

export function deleteDossierLocally(companyName: string): void {
  try {
    const current = getSavedDossiers();
    const updated = current.filter(d => d.companyName.toLowerCase() !== companyName.toLowerCase());
    localStorage.setItem(STORAGE_KEY_SAVED_DOSSIERS, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not delete dossier locally:", e);
  }
}

export async function fetchCompanyResearch(companyName: string, role?: string): Promise<CompanyDossier> {
  const cleanName = companyName.trim();
  
  // 1. Try server endpoint with Gemini Search Grounding
  try {
    const response = await fetch('/api/company-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: cleanName, role }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.dossier) {
        saveDossierLocally(data.dossier);
        return data.dossier;
      }
    }
  } catch (err) {
    console.warn("Network call to /api/company-research failed, checking local cache:", err);
  }

  // 2. Check local saved dossiers
  const saved = getSavedDossiers();
  const existing = saved.find(d => d.companyName.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return existing;
  }

  // 3. Built-in instant curated dossiers for default firms
  const fallback = getCuratedFallback(cleanName);
  saveDossierLocally(fallback);
  return fallback;
}

function getCuratedFallback(companyName: string): CompanyDossier {
  const norm = companyName.toLowerCase();

  if (norm.includes('kpmg')) {
    return {
      id: 'dossier_kpmg_curated',
      companyName: 'KPMG',
      tagline: 'Together, For Better / Cutting Through Complexity',
      industry: 'Professional Services / Big 4 Accounting & Advisory',
      headquarters: 'Amstelveen, Netherlands (Global Operations)',
      founded: '1897 (Merged in 1987 from Klynveld, Peat, Marwick, Goerdeler)',
      ceoOrLeadership: 'Bill Thomas (Global Chairman & CEO)',
      overview: 'KPMG is a global network of professional services firms operating across 143 countries with more than 270,000 employees. KPMG delivers Audit, Tax, and Advisory services to multinational enterprises, financial institutions, and government bodies. Renowned for its technological innovation in assurance through KPMG Clara and values-driven culture, KPMG prioritizes multidisciplinary problem-solving for its clients.',
      divisions: [
        'Audit & Assurance (Financial Auditing, Controls Assurance, ESG & Climate Reporting)',
        'Advisory (Management Consulting, Deal Advisory, Risk Consulting, Cyber & Tech Transformation)',
        'Tax & Legal (Corporate Tax, International Trade, Employment & Indirect Taxes)',
        'KPMG Enterprise & Digital Solutions (Mid-market growth, cloud transformation, AI integration)'
      ],
      marketPosition: 'Distinguished among the Big Four for its human-centric collaborative culture ("Together, For Better"), trusted corporate governance, and multi-billion-dollar alliance with Microsoft to embed AI into everyday audit and advisory workflows.',
      coreValues: [
        {
          value: 'Integrity',
          explanation: 'We do what is right. Upholding the highest ethical standards without compromise.',
          interviewAdvice: 'In situational tests and interviews, always put regulatory compliance and ethics above commercial expediency or pleasing an impatient client.'
        },
        {
          value: 'Excellence',
          explanation: 'We never stop learning and improving. Holding ourselves to meticulous professional benchmarks.',
          interviewAdvice: 'Discuss your passion for continuous technical upskilling, curiosity, and eagerness to pursue professional qualifications (e.g. ACA/ACCA/CPA).'
        },
        {
          value: 'Courage',
          explanation: 'We think and act boldly. Embracing difficult challenges and constructive candor.',
          interviewAdvice: 'Give an example of tactfully challenging an assumption, owning a mistake transparently, or suggesting an unconventional approach to a problem.'
        },
        {
          value: 'Together',
          explanation: 'We respect each other and draw strength from our differences. Fostering inclusive teamwork.',
          interviewAdvice: 'Showcase how you collaborate with teammates from diverse academic or cultural backgrounds and actively listen to differing viewpoints.'
        },
        {
          value: 'For Better',
          explanation: 'We do what matters. Creating positive, sustainable, long-term impact for society and clients.',
          interviewAdvice: 'Connect your career ambitions to meaningful societal impact and explain why protecting the integrity of capital markets resonates with you.'
        }
      ],
      recentDevelopments: [
        {
          headline: 'Multi-Billion-Dollar Global Strategic Alliance Expansion with Microsoft',
          summary: 'KPMG and Microsoft agreed on a landmark expansion deploying Azure OpenAI and generative AI directly into the KPMG Clara audit ecosystem and advisory engagements.',
          relevanceToCandidate: 'Demonstrates deep commercial awareness of how technology is reshaping professional services and that you are eager to utilize AI tools from your first day as a trainee.',
          dateOrContext: '2024-2026 Strategy'
        },
        {
          headline: 'Major Scaling of ESG Assurance & Decarbonization Advisory Practice',
          summary: 'Expanding specialized multidisciplinary hubs to help global clients comply with mandatory non-financial disclosure frameworks (CSRD, ISSB, SEC climate rules).',
          relevanceToCandidate: 'Shows forward-looking appreciation of sustainability assurance as one of the fastest-growing practice areas in modern accounting.',
          dateOrContext: 'Recent Regulatory Initiative'
        },
        {
          headline: 'Rollout of the K-Tech Digital Fluency Curriculum for Graduates',
          summary: 'A dedicated internal accelerator training incoming graduate cohorts in data analytics, automation tools, and predictive financial modeling.',
          relevanceToCandidate: 'Highlights that you know what the day-to-day trainee experience entails and are excited about building digital fluency alongside traditional accounting skills.',
          dateOrContext: 'Ongoing Talent Initiative'
        }
      ],
      whyThisCompanyPitches: [
        {
          angle: 'Innovation & Digital Transformation Angle',
          pitch: "I am drawn to KPMG because the firm is actively pioneering the future of professional services rather than relying on legacy methods. Your multi-billion-dollar partnership with Microsoft and the integration of AI within KPMG Clara show that trainees are empowered with world-class digital tools from day one, allowing us to spend less time on manual tick-and-bash tasks and more time on high-value commercial analysis."
        },
        {
          angle: "Culture & 'Together, For Better' Alignment",
          pitch: "What stands out to me about KPMG compared to other Big Four networks is the authentic culture of collaboration encapsulated in 'Together, For Better'. In speaking with current KPMG trainees, every conversation emphasized a supportive environment where senior colleagues genuinely mentor early-career joiners and diverse perspectives are treated as a core strength."
        },
        {
          angle: 'Multidisciplinary Client Impact & Growth Curve',
          pitch: "KPMG offers an unmatched breadth of client engagements—from FTSE 100 leaders and public sector institutions to fast-growing tech scale-ups. Starting my graduate career here offers a steep learning curve where I will learn how complex organizations operate, develop robust commercial acumen, and contribute to audits that uphold public trust."
        }
      ],
      smartReverseQuestions: [
        {
          question: "How has the integration of Generative AI within KPMG Clara transformed the types of tasks assigned to first- and second-year trainees on your engagements?",
          contextWhyToAsk: "Shows you understand their flagship audit software and are commercially curious about the evolution of the graduate role."
        },
        {
          question: "With the accelerating enforcement of ESG disclosure regulations like CSRD, how frequently do traditional Audit teams collaborate with Sustainability Advisory specialists?",
          contextWhyToAsk: "Demonstrates advanced knowledge of current regulatory changes and cross-service-line teamwork."
        },
        {
          question: "Looking at the graduate trainees who have excelled most rapidly in your practice, what daily habits or behaviors set them apart from their peers?",
          contextWhyToAsk: "Demonstrates ambition, coachability, and a clear focus on delivering practical impact."
        },
        {
          question: "How does the leadership team foster the value of 'Courage' when a junior trainee spots an anomaly or has a new idea during a busy engagement?",
          contextWhyToAsk: "Mirrors their official core value while inviting the interviewer to share a genuine personal story."
        }
      ],
      assessmentStyle: {
        testProvider: 'Cappfinity (Strengths-based assessment) & HireVue / Launchpad',
        stages: [
          'Stage 1: Online Application & Automated Eligibility Screening',
          'Stage 2: Transforming Small Businesses (Blended Numerical, Critical Verbal, and Situational Judgement Assessment)',
          'Stage 3: Delivering Outcomes (Asynchronous Video Interview with situational scenario prompts)',
          'Stage 4: KPMG Discovery Centre (Virtual/In-person Assessment Day with group collaboration, report analysis, and partner case interview)'
        ],
        tipsForSuccess: "KPMG uses strengths-based testing rather than purely speed-based metrics. In Situational Judgement Tests (SJTs), always prioritize ethical integrity and client confidentiality above all else. In the video interview, use the STAR/CAR method (Context, Action, Result) and weave in KPMG's values naturally."
      },
      miniQuiz: [
        {
          question: "Which of the following is NOT one of KPMG's five official Global Core Values?",
          options: ["Integrity", "Courage", "Shareholder Maximization", "For Better"],
          answer: "Shareholder Maximization",
          explanation: "KPMG's five official core values are Integrity, Excellence, Courage, Together, and For Better."
        },
        {
          question: "What is the name of KPMG's proprietary smart cloud-based audit software platform?",
          options: ["KPMG Clara", "KPMG Beacon", "KPMG Omnia", "KPMG Canvas"],
          answer: "KPMG Clara",
          explanation: "KPMG Clara is the firm's intelligent audit platform integrating data analytics, workflow automation, and Microsoft Azure AI."
        },
        {
          question: "Which technology giant did KPMG partner with for a landmark multi-billion-dollar enterprise AI alliance?",
          options: ["Microsoft", "Oracle", "Salesforce", "Cisco"],
          answer: "Microsoft",
          explanation: "KPMG expanded a major multi-billion-dollar alliance with Microsoft to integrate OpenAI capabilities across its services."
        },
        {
          question: "What assessment publisher provides the blended cognitive and SJT test for the KPMG Graduate Trainee Assessment?",
          options: ["Cappfinity", "Talent Q", "Korn Ferry", "Criteria Corp"],
          answer: "Cappfinity",
          explanation: "KPMG famously partners with Cappfinity for strengths-based numerical, verbal, and situational judgement assessments."
        }
      ],
      savedAt: new Date().toISOString()
    };
  }

  if (norm.includes('pwc') || norm.includes('pricewaterhouse')) {
    return {
      id: 'dossier_pwc_curated',
      companyName: 'PwC (PricewaterhouseCoopers)',
      tagline: 'To build trust in society and solve important problems',
      industry: 'Professional Services / Big 4 Accounting & Consulting',
      headquarters: 'London, United Kingdom (Global Network)',
      founded: '1849 (Merger of Price Waterhouse and Coopers & Lybrand in 1998)',
      ceoOrLeadership: 'Bob Moritz / Mohamed Kande (Global Chair)',
      overview: 'PwC is the second-largest professional services firm in the world by revenue, operating in 152 countries with over 360,000 people. Operating across Assurance, Tax, and Advisory, PwC is renowned for its strategic management consulting through Strategy&, digital assets, and high-impact human-led, tech-powered transformation.',
      divisions: [
        'Assurance (Financial Audit, Risk Assurance, Digital Assurance, ESG)',
        'Consulting / Strategy& (Digital transformation, operations, corporate strategy)',
        'Tax & Legal (Global tax compliance, M&A tax, international structuring)',
        'Deals (Transaction services, corporate finance, valuations, restructuring)'
      ],
      marketPosition: 'Recognized for top-tier executive strategy consulting via Strategy& and a commitment to "The New Equation", blending deep human expertise with digital capabilities.',
      coreValues: [
        {
          value: 'Act with Integrity',
          explanation: 'Speak up for what is right, especially when it feels difficult.',
          interviewAdvice: 'Show instances where you adhered to principles despite peer pressure or tight deadlines.'
        },
        {
          value: 'Make a Difference',
          explanation: 'Stay informed and be forward-thinking about the impact of your actions.',
          interviewAdvice: 'Highlight actions where your work generated quantifiable improvement for a project, team, or community.'
        },
        {
          value: 'Care',
          explanation: 'Make the effort to understand each person and what matters to them.',
          interviewAdvice: 'Emphasize empathy, active listening, and supporting colleagues during high-stress periods.'
        },
        {
          value: 'Work Together',
          explanation: 'Collaborate across boundaries and share diverse perspectives.',
          interviewAdvice: 'Discuss projects where cross-functional alignment produced superior outcomes.'
        },
        {
          value: 'Reimagine the Possible',
          explanation: 'Dare to challenge the status quo and experiment with innovative solutions.',
          interviewAdvice: 'Share examples of creative problem solving or leveraging modern digital tools.'
        }
      ],
      recentDevelopments: [
        {
          headline: 'Launch of "The New Equation" Global Investment Program',
          summary: 'A multi-billion-dollar global commitment to help clients build trust and deliver sustained outcomes through human-led, tech-powered transformation.',
          relevanceToCandidate: 'Mentioning The New Equation shows you understand the firm’s core brand strategy.',
          dateOrContext: '2024-2026 Strategy'
        },
        {
          headline: 'Alliance with OpenAI & Harvey for Legal & Tax AI',
          summary: 'PwC deployed enterprise generative AI models to accelerate tax analysis and legal document review.',
          relevanceToCandidate: 'Demonstrates tech fluency and excitement about working with cutting-edge enterprise AI.',
          dateOrContext: 'Recent Tech Milestone'
        }
      ],
      whyThisCompanyPitches: [
        {
          angle: 'The New Equation & Industry Leadership',
          pitch: "PwC's commitment to 'The New Equation'—being human-led and tech-powered—mirrors the exact environment in which I want to start my career. Combining world-class technical assurance with innovative consulting through Strategy& means that as a graduate, I will be learning from the industry's foremost experts while solving real-world business challenges."
        },
        {
          angle: 'The PwC Professional Leadership Framework',
          pitch: "I am specifically attracted to how PwC develops its people through the PwC Professional framework. The focus on Whole Leadership and Business Acumen from day one ensures that trainees are not just technical specialists, but well-rounded commercial advisors."
        }
      ],
      smartReverseQuestions: [
        {
          question: "How has 'The New Equation' shifted the way engagement teams approach client problems that combine both technical accounting and digital transformation?",
          contextWhyToAsk: "Demonstrates familiarity with PwC's signature global strategy."
        },
        {
          question: "Under the PwC Professional framework, which attribute do first-year associates typically find most challenging to cultivate, and how does the firm support them?",
          contextWhyToAsk: "Shows deep knowledge of their internal development model and a willingness to be coached."
        }
      ],
      assessmentStyle: {
        testProvider: 'SHL / Arctic Shores & HireVue (Career Unlocked / Career Valuation)',
        stages: [
          'Online Application',
          'Career Unlocked (Game-based & psychometric blended assessment)',
          'Career Valuation (Immersive video interview with realistic job preview scenarios)',
          'Career Conversation / Assessment Day (Case study presentation & partner interview)'
        ],
        tipsForSuccess: "Prepare through the lens of the five PwC Professional attributes: Whole Leadership, Business Acumen, Technical and Digital, Global and Inclusive, and Relationships."
      },
      miniQuiz: [
        {
          question: "What is the name of PwC's overarching global business and brand strategy?",
          options: ["The New Equation", "Together, For Better", "Building a Better Working World", "Lead the Way"],
          answer: "The New Equation",
          explanation: "PwC's global strategy is called 'The New Equation', focusing on building trust and delivering sustained outcomes."
        },
        {
          question: "Which of the following is NOT one of the 5 pillars of the PwC Professional development framework?",
          options: ["Whole Leadership", "Business Acumen", "Unilateral Authority", "Global and Inclusive"],
          answer: "Unilateral Authority",
          explanation: "The 5 pillars are Whole Leadership, Business Acumen, Technical and Digital, Global and Inclusive, and Relationships."
        }
      ],
      savedAt: new Date().toISOString()
    };
  }

  // Default fallback for any other firm
  return {
    id: 'dossier_' + companyName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_curated',
    companyName: companyName,
    tagline: `Leading Innovation & Excellence at ${companyName}`,
    industry: 'Corporate & Professional Enterprise',
    headquarters: 'Global Headquarters',
    founded: 'Established Enterprise',
    ceoOrLeadership: 'Executive Leadership Team',
    overview: `${companyName} is a premier organization operating at the forefront of its industry, delivering transformative solutions, products, and services to enterprise clients and consumers worldwide. The organization is recognized for high operational standards, market influence, and dedication to early-career talent development.`,
    divisions: [
      'Core Operations & Service Delivery',
      'Strategic Business Development & Growth',
      'Technology, Data & Innovation',
      'Client Solutions & Advisory'
    ],
    marketPosition: `${companyName} differentiates itself through rigorous quality standards, customer focus, and agile execution, maintaining a resilient market presence against direct competitors.`,
    coreValues: [
      {
        value: 'Integrity & Ethics',
        explanation: 'Uncompromising commitment to honesty, accountability, and transparent governance in every decision.',
        interviewAdvice: 'Always illustrate how you uphold ethical standards under pressure or tight delivery deadlines.'
      },
      {
        value: 'Client Commitment',
        explanation: 'Putting client and customer success at the center of all operational activities.',
        interviewAdvice: 'Highlight active listening, customer-first problem solving, and exceeding stakeholder expectations.'
      },
      {
        value: 'Innovation & Adaptability',
        explanation: 'Continuously challenging the status quo and adopting modern digital tools and methodologies.',
        interviewAdvice: 'Mention your enthusiasm for continuous learning and adapting swiftly to changes in market dynamics.'
      },
      {
        value: 'Collaborative Teamwork',
        explanation: 'Fostering inclusive, cross-functional partnerships that achieve collective objectives.',
        interviewAdvice: 'Provide examples where you bridged communication gaps and supported teammates to reach a shared goal.'
      }
    ],
    recentDevelopments: [
      {
        headline: 'Digital Transformation & Workflow Modernization',
        summary: 'Strategic investments into data intelligence, automation, and cloud systems to improve operational efficiency and client responsiveness.',
        relevanceToCandidate: "Shows you understand the firm's forward-looking tech adoption and are ready to contribute to efficient operations.",
        dateOrContext: '2024-2026 Strategy'
      },
      {
        headline: 'Sustainability & Social Responsibility Commitments',
        summary: 'Implementing environmental, social, and governance (ESG) practices across supply chains and internal operations.',
        relevanceToCandidate: 'Highlights your appreciation for sustainable long-term corporate citizenship.',
        dateOrContext: 'Corporate Strategy'
      }
    ],
    whyThisCompanyPitches: [
      {
        angle: 'Market Reputation & Industry Impact',
        pitch: `I am passionate about joining ${companyName} because of your stellar market reputation and the tangible impact of your work. Your commitment to high standards and innovation aligns with my desire to build a career in a high-velocity, intellectually rigorous environment.`
      },
      {
        angle: 'Learning Curve & Professional Culture',
        pitch: `What distinguishes ${companyName} for me is the culture of continuous learning and empowerment. I want to contribute to a collaborative team that tackles complex business problems while nurturing early-career talent.`
      }
    ],
    smartReverseQuestions: [
      {
        question: `How are the strategic priorities of ${companyName} evolving with recent technological and market shifts over the next 12 to 24 months?`,
        contextWhyToAsk: 'Demonstrates long-term thinking and high commercial awareness.'
      },
      {
        question: 'What key competencies or mindsets distinguish the top performers in this specific role during their first year?',
        contextWhyToAsk: 'Shows drive, receptivity to coaching, and focus on delivering immediate value.'
      }
    ],
    assessmentStyle: {
      testProvider: 'Standard Corporate Psychometric & Situational Assessment',
      stages: [
        'Online Application & Resume Screening',
        'Cognitive & Situational Judgement Assessment',
        'Competency & Motivational Interview',
        'Final Round / Leadership Case Study'
      ],
      tipsForSuccess: `Research ${companyName}'s core values deeply, structure your interview responses using the STAR method (Situation, Task, Action, Result), and emphasize commercial awareness.`
    },
    miniQuiz: [
      {
        question: `When preparing an interview answer for ${companyName}, which technique is most effective?`,
        options: [
          'The STAR Method (Situation, Task, Action, Result)',
          'Giving one-word answers',
          'Focusing only on theoretical concepts without personal examples',
          'Skipping the results and impact'
        ],
        answer: 'The STAR Method (Situation, Task, Action, Result)',
        explanation: 'The STAR method ensures your answers are structured, concrete, and evidence-based.'
      },
      {
        question: `Why is it critical to research an organization's core values before an assessment?`,
        options: [
          "Situational judgement questions and behavioral interviews are scored against their values",
          'To memorize them word-for-word only',
          'To see if they offer snacks',
          "Values don't matter in recruitment"
        ],
        answer: "Situational judgement questions and behavioral interviews are scored against their values",
        explanation: "Recruiters and automated assessment algorithms grade situational answers against the company's specific cultural competencies."
      }
    ],
    savedAt: new Date().toISOString()
  };
}
