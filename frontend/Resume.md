\documentclass[letterpaper,10pt]{article}

% ---------- PACKAGES ----------
\usepackage[margin=0.5in]{geometry}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{tabularx}
\usepackage{microtype}

% ---------- GENERAL SETTINGS ----------
\pagestyle{empty}
\setlength{\tabcolsep}{0pt}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\raggedbottom
\raggedright

\microtypesetup{protrusion=true, expansion=true}

% ---------- SECTION FORMATTING ----------
\titleformat{\section}
    {\large\bfseries\scshape}
    {}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{8pt}{4pt}

\titleformat{\subsection}[runin]
    {\normalsize\bfseries}
    {}{0em}{}[:]
\titlespacing{\subsection}{0pt}{0pt}{0.3em}

% ---------- LIST SPACING ----------
\setlist[itemize]{
    topsep=2pt,
    partopsep=0pt,
    parsep=0pt,
    itemsep=1.5pt,
    leftmargin=0.15in,
    before={\vspace{0pt}},
    after={\vspace{2pt}}
}

% ---------- CUSTOM COMMANDS ----------
\newcommand{\resumeSubheading}[4]{
    \vspace{-1pt}
    \begin{tabularx}{\textwidth}{X r}
        \textbf{#1} & \small\textit{#2} \\
        \small\textit{#3} & \small\textit{#4}
    \end{tabularx}
    \vspace{-3pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \vspace{-1pt}
    \begin{tabularx}{\textwidth}{X r}
        \textbf{\small #1} & \small\textit{#2}
    \end{tabularx}
    \vspace{-4pt}
}

% ---------- DOCUMENT ----------
\begin{document}

% ---------- HEADER ----------
\begin{center}
    {\LARGE\bfseries VIGHNESH SADANAND POTDAR}\\[-1pt]
    \small
    \href{tel:+917820982044}{+91-78209-82044} \textbar{}
    \href{mailto:vighneshpotdar@gmail.com}{vighneshpotdar@gmail.com} \textbar{}
    \href{https://linkedin.com/in/vighnesh-potdar-830222254}{LinkedIn} \textbar{}
    \href{https://github.com/Voodels}{GitHub} \textbar{}
    \href{https://leetcode.com/u/Vergil73/}{LeetCode}
\end{center}

% ---------- PROFESSIONAL SUMMARY ----------
\section{Professional Summary}
\small
Final-year B.Tech IT student specializing in full-stack development and AI/ML. Proficient in React, Node.js, Python, AWS, and modern frameworks. Seeking software engineering opportunities to architect innovative, enterprise-grade solutions.

% ---------- EDUCATION ----------
\section{Education}
\resumeSubheading
    {Walchand College of Engineering}{Nov 2022 -- Mar 2026}
    {Bachelor of Technology in Information Technology \textbar{} CGPA: 7.5/10}{Sangli, Maharashtra}

% ---------- PROJECTS ----------
\section{Projects}
\resumeProjectHeading
    {Local RAG-AI System \textbar{} \textit{Python, Qdrant, LangChain, NLP}}{}
\begin{itemize}
    \item Built privacy-first Retrieval-Augmented Generation pipeline using Qdrant DB and locally-hosted LLMs ensuring complete data sovereignty.
    \item Achieved 35\% query accuracy improvement via semantic search and intelligent document chunking on 10k+ documents.
    \item \textbf{GitHub:} \href{https://github.com/Voodels/PrivateRagFromScratch}{github.com/Voodels/PrivateRagFromScratch}
\end{itemize}

\resumeProjectHeading
    {LinkStudio -- Production URL Shortener \textbar{} \textit{Deno, React, PostgreSQL, JWT}}{}
\begin{itemize}
    \item Engineered full-stack URL shortening platform with user authentication, category management, and real-time analytics.
    \item Deployed on Render (Deno backend) + Vercel (React frontend) with Neon PostgreSQL for production-grade reliability.
    \item Implemented Base62 encoding, collision detection, and CORS-secured RESTful APIs with comprehensive error handling.
    \item \textbf{Live:} \href{https://url-shortner-self-mu.vercel.app}{url-shortner-self-mu.vercel.app} \textbar{} \textbf{Code:} \href{https://github.com/Voodels/URL-Shortner}{github.com/Voodels/URL-Shortner}
\end{itemize}

% ---------- EXPERIENCE ----------
\section{Professional Experience}
\resumeSubheading
    {National Supercomputing Mission (NSM)}{Mar 2025 -- Aug 2025}
    {Software Engineering Intern}{Remote}
\begin{itemize}
    \item Configured high-availability MPI clusters supporting large-scale DL workloads on HPC infrastructure.
    \item Deployed containerized apps on AWS (EC2, S3, CloudFront) with load balancing, scaling, and security compliance.
    \item Conducted workshops on Generative AI, CUDA, and GPU acceleration for 100+ researchers.
\end{itemize}

\resumeSubheading
    {Firebyte Technologies}{Jun 2023 -- Aug 2023}
    {Full Stack Developer Intern}{Sangli, Maharashtra}
\begin{itemize}
    \item Built mobile-first e-commerce platform using React.js and Tailwind CSS for Agri Imports.
    \item Reduced page load time by 40\% using code splitting, lazy loading, and asset optimization.
    \item \textbf{Site:} \href{https://agriimportsfertilizer.com/}{agriimportsfertilizer.com}
\end{itemize}

% ---------- TECHNICAL SKILLS ----------
\section{Technical Skills}
\small
\begin{itemize}[leftmargin=0in, label={}]
\item \textbf{Languages:} Java, JavaScript, TypeScript, Python, C/C++, SQL, HTML5, CSS3
\item \textbf{Frontend:} React.js, Next.js, Tailwind, Bootstrap, Framer Motion
\item \textbf{Backend:} Node.js, Express.js, REST APIs, Microservices, JWT
\item \textbf{Databases:} MongoDB, MySQL, PostgreSQL, Firebase, Redis, Qdrant
\item \textbf{Cloud/DevOps:} AWS, Docker, Kubernetes, GitHub Actions, CI/CD, Linux
\item \textbf{AI/ML:} CUDA, Local LLMs, RAG, Vector Embeddings
\item \textbf{CS Fundamentals:} DSA, OOP, DBMS, CN, OS, System Design
\end{itemize}

% ---------- LEADERSHIP ----------
\section{Leadership \& Activities}
\resumeProjectHeading
    {Web Developer \textbar{} Walchand Linux Users' Group (WLUG)}{2023 -- 2024}
\begin{itemize}
    \item Led development of 3 high-traffic event websites using React, Next.js, and Framer Motion.
    \item \textbf{Websites:}
    \begin{itemize}
        \item \href{https://linuxdiary5.0.wcewlug.org/}{linuxdiary5.0.wcewlug.org} -- Annual Linux workshop series
        \item \href{https://osd2k24.wcewlug.org/}{osd2k24.wcewlug.org} -- Open Source Day 2024
        \item \href{https://meta2k25.wcewlug.org/}{meta2k25.wcewlug.org} -- Technical fest landing page
    \end{itemize}
    \item Conducted workshops on Linux, Docker, AWS, and Git for 200+ students.
\end{itemize}

% ---------- CERTIFICATIONS ----------
\section{Certifications}
\small
\begin{itemize}[leftmargin=0in, label={}]
    \item \textbf{NVIDIA DLI:} Fundamentals of Accelerated Computing with CUDA Python, AI-Based Anomaly Detection (2025)
    \item \textbf{Firebyte Technologies:} Full Stack Web Development Internship (2023)
\end{itemize}

\end{document}
