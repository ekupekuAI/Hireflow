import type { Candidate, Job } from '@/lib/types'

export const SAMPLE_JOB: Job = {
  id: 'job_sample',
  title: 'Senior Backend Engineer — Payments',
  rawText: `Senior Backend Engineer — Payments (Fintech)

About the role:
We are hiring a Senior Backend Engineer to build and scale the core payments platform
that processes millions of transactions per day. You will own critical services end to end,
design for reliability and security, and mentor other engineers.

Required qualifications (must have):
- 5+ years of professional backend engineering experience
- Strong Python (production services, not scripting)
- Hands-on AWS experience (EC2, S3, Lambda)
- Solid SQL / relational database design
- Experience building and operating REST APIs at scale
- Experience with microservices / distributed systems
- Prior experience in fintech, payments, or banking

Nice to have:
- Kubernetes / Docker in production
- Team leadership or mentoring experience
- Security best practices (OAuth, encryption)
- Data engineering (Kafka, Spark, ETL pipelines)

Responsibilities:
- Design, build, and operate payment microservices
- Ensure high availability, reliability, and security
- Collaborate cross-functionally with product and compliance
- Mentor engineers and drive engineering best practices`,
}

interface SeedCandidate {
  id: string
  name: string
  meta: Candidate['meta']
  rawText: string
}

const SEED: SeedCandidate[] = [
  {
    id: 'c1',
    name: 'Priya Sharma',
    meta: { gender: 'female', age: 31, school: 'IIT Bombay', location: 'Bengaluru' },
    rawText: `Priya Sharma — Senior Software Engineer
Bengaluru, India

Summary:
Senior backend engineer with 7 years building high-throughput payment systems. She has led
a team of 5 engineers and is passionate about reliability.

Experience:
- Senior Backend Engineer, PayWave (2020–present): Built and operated payment microservices in
  Python and AWS (Lambda, S3, EC2) processing 4M+ transactions/day. Led migration to a
  microservices architecture. Mentored and managed 5 engineers. Owned PCI-compliant services.
- Backend Engineer, FinCore (2017–2020): Designed REST APIs and PostgreSQL schemas for a
  digital banking product. Introduced CI/CD with GitHub Actions.

Skills: Python, AWS, PostgreSQL, REST APIs, Microservices, Docker, Kubernetes, OAuth, Agile.

Education: B.Tech Computer Science, IIT Bombay (2013).`,
  },
  {
    id: 'c2',
    name: 'Marcus Johnson',
    meta: { gender: 'male', age: 34, school: 'Ohio State University', location: 'Columbus, OH' },
    rawText: `Marcus Johnson — Software Engineer
Columbus, OH

Summary:
Backend engineer with 6 years in e-commerce and retail platforms.

Experience:
- Software Engineer, ShopStack (2018–present): Built Java Spring Boot services for a retail
  marketplace checkout. Designed REST APIs and MySQL databases. Worked in Agile/Scrum teams.
- Junior Developer, RetailNow (2017–2018): Maintained monolithic Java application.

Skills: Java, Spring Boot, MySQL, REST APIs, Docker, Agile.

Education: B.S. Computer Science, Ohio State University (2016).`,
  },
  {
    id: 'c3',
    name: 'Wei Chen',
    meta: { gender: 'male', age: 33, school: 'Stanford University', location: 'San Francisco, CA' },
    rawText: `Wei Chen — Staff Engineer
San Francisco, CA

Summary:
Distributed systems engineer with 8 years in payments and trading infrastructure.

Experience:
- Staff Engineer, LedgerPay (2019–present): Architected payment microservices in Go and Python
  on Kubernetes (AWS EKS). Built systems processing 10M+ payment events/day with 99.99% uptime.
  Led security hardening and OAuth token services. Mentored senior engineers.
- Senior Engineer, TradeFlow (2015–2019): High-availability trading APIs, PostgreSQL, Kafka.

Skills: Go, Python, AWS, Kubernetes, Microservices, PostgreSQL, Kafka, REST APIs, Security, System Design.

Education: M.S. Computer Science, Stanford University.`,
  },
  {
    id: 'c4',
    name: 'Aisha Khan',
    meta: { gender: 'female', age: 29, school: 'University of Toronto', location: 'Toronto, CA' },
    rawText: `Aisha Khan — Machine Learning Engineer
Toronto, Canada

Summary:
ML engineer with 5 years in healthcare data platforms.

Experience:
- ML Engineer, MediSense (2019–present): Built Python NLP pipelines (PyTorch, Hugging Face) for
  clinical notes. Deployed models on AWS. Designed REST APIs to serve predictions. Built ETL
  pipelines with Airflow.
- Data Scientist, HealthGrid (2018–2019): Predictive models with scikit-learn and pandas.

Skills: Python, Machine Learning, Deep Learning, NLP, AWS, REST APIs, Data Engineering, SQL.

Education: M.S. Computer Science, University of Toronto.`,
  },
  {
    id: 'c5',
    name: 'David Miller',
    meta: { gender: 'male', age: 27, school: 'Arizona State University', location: 'Phoenix, AZ' },
    rawText: `David Miller — Full-Stack Developer
Phoenix, AZ

Summary:
Full-stack developer with 4 years, primarily frontend with some backend.

Experience:
- Frontend Engineer, BrightApps (2020–present): Built React and TypeScript web apps. Some Node.js
  REST endpoints. Worked with a small startup team.
- Web Developer, LocalSites (2019–2020): WordPress and JavaScript sites.

Skills: JavaScript, TypeScript, React, Node.js, REST APIs, Agile.

Education: B.S. Information Technology, Arizona State University (2019).`,
  },
  {
    id: 'c6',
    name: 'Sofia Rossi',
    meta: { gender: 'female', age: 30, school: 'Politecnico di Milano', location: 'Milan, IT' },
    rawText: `Sofia Rossi — Backend & Data Engineer
Milan, Italy

Summary:
Backend and data engineer with 6 years across fintech and payments analytics.

Experience:
- Backend Engineer, PagoNext (2019–present): Python microservices for a payments platform on AWS.
  Built Kafka + Spark data pipelines for transaction analytics and fraud signals. PostgreSQL and
  REST APIs. Collaborated with compliance on PCI requirements.
- Data Engineer, DataForge (2017–2019): ETL pipelines, Airflow, SQL.

Skills: Python, AWS, PostgreSQL, Kafka, Spark, Data Engineering, REST APIs, Microservices, Docker.

Education: M.S. Software Engineering, Politecnico di Milano.`,
  },
  {
    id: 'c7',
    name: 'James Wilson',
    meta: { gender: 'male', age: 38, school: 'University of Washington', location: 'Seattle, WA' },
    rawText: `James Wilson — Principal Engineer
Seattle, WA

Summary:
Systems engineer with 9 years in gaming and real-time engines.

Experience:
- Principal Engineer, PixelForge (2016–present): Built C++ real-time game server engines.
  Optimized low-latency networking. Led a team of 8. Some Python tooling.
- Senior Engineer, GameHaus (2014–2016): Multiplayer backend in C++.

Skills: C++, System Design, Leadership, Python, Microservices, Testing.

Education: B.S. Computer Science, University of Washington.`,
  },
  {
    id: 'c8',
    name: 'Fatima Al-Sayed',
    meta: { gender: 'female', age: 28, school: 'Cairo University', location: 'Dubai, UAE' },
    rawText: `Fatima Al-Sayed — Backend Engineer
Dubai, UAE

Summary:
Backend engineer with 5 years building SaaS platforms.

Experience:
- Backend Engineer, CloudDesk (2019–present): Node.js and TypeScript REST APIs for a B2B SaaS.
  Dockerized services on AWS. PostgreSQL. Introduced automated testing with Jest.
- Software Engineer, AppNile (2018–2019): Python Django backend.

Skills: TypeScript, Node.js, Python, REST APIs, Docker, AWS, PostgreSQL, Testing, Agile.

Education: B.S. Computer Engineering, Cairo University.`,
  },
  {
    id: 'c9',
    name: 'Robert Brown',
    meta: { gender: 'male', age: 25, school: 'Community College of Denver', location: 'Denver, CO' },
    rawText: `Robert Brown — Junior Backend Developer
Denver, CO

Summary:
Backend developer with 3 years, eager to grow in fintech.

Experience:
- Backend Developer, MicroLoan Co (2021–present): Built Python Flask REST APIs for a small
  lending product. Worked with PostgreSQL. Some AWS (EC2).
- Intern, DataStart (2020–2021): SQL reporting.

Skills: Python, Flask, SQL, REST APIs, AWS, Agile.

Education: A.S. Software Development, Community College of Denver.`,
  },
  {
    id: 'c10',
    name: 'Lin Zhang',
    meta: { gender: 'female', age: 32, school: 'Zhejiang University', location: 'Singapore' },
    rawText: `Lin Zhang — Senior Backend Engineer
Singapore

Summary:
Senior backend engineer with 7 years in payments and financial infrastructure.

Experience:
- Senior Backend Engineer, FinBridge (2019–present): Designed and operated Python payment
  microservices on AWS (Lambda, EC2, S3) handling cross-border transactions. Built secure OAuth
  services and encryption for sensitive data. Owned PostgreSQL schemas and REST APIs. Improved
  reliability to 99.98%. Mentored 3 engineers.
- Backend Engineer, PaySafe Labs (2016–2019): Microservices, Docker, Kubernetes, banking APIs.

Skills: Python, AWS, PostgreSQL, REST APIs, Microservices, Docker, Kubernetes, Security, OAuth.

Education: B.Eng Computer Science, Zhejiang University.`,
  },
]

export const SAMPLE_CANDIDATES: Candidate[] = SEED.map((s) => ({
  id: s.id,
  name: s.name,
  meta: s.meta,
  rawText: s.rawText,
}))
