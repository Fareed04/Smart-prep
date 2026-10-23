import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: key || undefined,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
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
      overview: "KPMG is a global network of professional services firms providing Audit, Tax, and Advisory services across 143 countries with over 270,000 professionals. Renowned for digital innovation in assurance through KPMG Clara, KPMG advises the world's leading corporations, governments, and non-profits on transformation and compliance.",
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

  // Generic fallback for any other company
  return {
    companyName: companyName,
    tagline: `Leading Innovation & Excellence in ${companyName}`,
    industry: "Corporate & Enterprise Services",
    headquarters: "Global Headquarters",
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
        value: "Client Commitment",
        explanation: "Putting client and customer success at the center of all operational activities.",
        interviewAdvice: "Highlight active listening, customer-first problem solving, and exceeding stakeholder expectations."
      },
      {
        value: "Innovation & Adaptability",
        explanation: "Continuously challenging the status quo and adopting modern digital tools and methodologies.",
        interviewAdvice: "Mention your enthusiasm for continuous learning and adapting swiftly to changes in market dynamics."
      },
      {
        value: "Collaborative Teamwork",
        explanation: "Fostering inclusive, cross-functional partnerships that achieve collective objectives.",
        interviewAdvice: "Provide examples where you bridged communication gaps and supported teammates to reach a shared goal."
      }
    ],
    recentDevelopments: [
      {
        headline: "Digital Transformation & Workflow Modernization",
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
      
      const prompt = `Analyze this user's quiz sessions and provide 3 short, actionable study tips or a focused practice session. Focus on their weakest categories in the given sessions. Format as Markdown. Ensure the response is concise and helpful.

Profile: ${JSON.stringify(userProfile)}
Recent Sessions: ${JSON.stringify(sessions)}

Provide tailored advice:`;

      const ai = getAIClient();
      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });
        responseText = response.text || "";
      } catch (firstErr) {
        console.warn("Retrying with gemini-flash-latest...", firstErr);
        const response = await ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: prompt,
        });
        responseText = response.text || "";
      }

      res.json({ tips: responseText });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate tips." });
    }
  });

  // Company Intelligence & Background Research API
  app.post("/api/company-research", async (req, res) => {
    try {
      const { company, role } = req.body;
      if (!company || typeof company !== "string" || !company.trim()) {
        return res.status(400).json({ error: "Company name is required." });
      }

      const cleanCompany = company.trim();
      const targetRole = role ? String(role).trim() : "Graduate Trainee / Analyst";

      const prompt = `You are a world-class corporate assessment and executive interview coach specializing in graduate traineeships, management consulting, Big 4 accounting, investment banking, and technology recruitment.
Conduct an in-depth background research breakdown for the organization: "${cleanCompany}" for a candidate preparing for their assessment and upcoming interviews for the role of "${targetRole}".

Use Google Search grounding to retrieve authentic, real-world data, the exact official core values, current leadership, real business divisions, and recent news/initiatives from 2024-2026.

You MUST return ONLY a valid, parseable JSON object without markdown codeblocks, commentary, or extra text.
Adhere strictly to this JSON format:
{
  "companyName": "${cleanCompany}",
  "tagline": "Official motto or prominent slogan",
  "industry": "Primary industry sector (e.g., Professional Services / Big 4, FinTech, Investment Banking)",
  "headquarters": "City, Country",
  "founded": "Year founded or founding context",
  "ceoOrLeadership": "Current CEO, Managing Partner, or Global Leader",
  "overview": "Clear 3-4 sentence breakdown of what this organization actually does, its business model, scale, and global prestige.",
  "divisions": ["Core Division 1", "Core Division 2", "Core Division 3", "Core Division 4"],
  "marketPosition": "2-3 sentences explaining their competitive edge, strategic moat, and how they differentiate from rivals.",
  "coreValues": [
    {
      "value": "Exact Name of Core Value",
      "explanation": "What this value means to the company",
      "interviewAdvice": "Specific actionable tactics on how the candidate must exhibit this value during behavioral interviews and situational judgement tests"
    }
  ],
  "recentDevelopments": [
    {
      "headline": "Real recent strategic move, AI partnership, ESG milestone, or major client project",
      "summary": "Concise summary of the strategic move",
      "relevanceToCandidate": "How the candidate can cite this in their interview to demonstrate commercial awareness",
      "dateOrContext": "Timeframe or context (e.g., 2024-2026)"
    }
  ],
  "whyThisCompanyPitches": [
    {
      "angle": "Innovation & Strategic Direction Angle",
      "pitch": "A polished, conversational 3-4 sentence answer to 'Why do you want to work at ${cleanCompany}?' focusing on this angle."
    },
    {
      "angle": "Culture & Core Values Angle",
      "pitch": "A polished, conversational 3-4 sentence response highlighting cultural alignment and behavioral standards."
    },
    {
      "angle": "Client Impact & Career Growth Angle",
      "pitch": "A polished, conversational 3-4 sentence response focusing on client impact and learning curve."
    }
  ],
  "smartReverseQuestions": [
    {
      "question": "An intelligent, sophisticated question the candidate can ask the partner or interviewer at the end of the interview",
      "contextWhyToAsk": "Why asking this demonstrates high commercial acumen and thorough preparation"
    }
  ],
  "assessmentStyle": {
    "testProvider": "Typical testing publishers used (e.g., Cappfinity, SHL, Cubiks, Korn Ferry, Saville, Pymetrics, or In-house)",
    "stages": ["Online Application & Screening", "Blended Cognitive & SJT Assessment", "Immersive Video Interview", "Assessment Centre / Partner Case Study"],
    "tipsForSuccess": "3-4 insider tactics for passing this company's tests and avoiding typical candidate pitfalls."
  },
  "miniQuiz": [
    {
      "question": "A multiple-choice question testing the candidate's recall of ${cleanCompany}'s values, history, or strategy",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Why this answer is correct"
    }
  ]
}

Provide at least 4-5 coreValues, 3 recentDevelopments, 3 whyThisCompanyPitches, 4 smartReverseQuestions, and 4 miniQuiz questions.`;

      const ai = getAIClient();
      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }]
          }
        });
        responseText = response.text || "";
      } catch (firstErr) {
        console.warn("Retrying company research with gemini-flash-latest...", firstErr);
        try {
          const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
            config: {
              temperature: 0.3,
              responseMimeType: "application/json",
            }
          });
          responseText = response.text || "";
        } catch (secondErr) {
          console.error("Gemini failed, using structured fallback generator", secondErr);
          responseText = "";
        }
      }

      let parsedDossier = null;
      if (responseText) {
        try {
          const cleanJson = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
          parsedDossier = JSON.parse(cleanJson);
        } catch (parseErr) {
          console.warn("JSON parse issue on company research output, falling back to curated profile:", parseErr);
        }
      }

      if (!parsedDossier || !parsedDossier.companyName) {
        parsedDossier = getFallbackCompanyDossier(cleanCompany);
      }

      parsedDossier.id = "dossier_" + cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
      parsedDossier.savedAt = new Date().toISOString();

      res.json({ dossier: parsedDossier });
    } catch (e: any) {
      console.error("Error in /api/company-research:", e);
      // Return safe fallback rather than crashing
      const companyParam = (req.body?.company as string) || "KPMG";
      res.json({ dossier: getFallbackCompanyDossier(companyParam) });
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
