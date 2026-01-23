--
-- PostgreSQL database dump
--

\restrict jD4iJSKEf3yhFc68jreTxzvUzDRtBbEZSmtNlcRF2ySyslkU5Jgy7JhlcwL0DGC

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: smartcareer
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO smartcareer;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: smartcareer
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: smartcareer
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'SAVED',
    'APPLIED',
    'SCREENING',
    'INTERVIEWING',
    'OFFER',
    'REJECTED',
    'WITHDRAWN'
);


ALTER TYPE public."ApplicationStatus" OWNER TO smartcareer;

--
-- Name: BadgeType; Type: TYPE; Schema: public; Owner: smartcareer
--

CREATE TYPE public."BadgeType" AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'EXPERT',
    'VERIFIED'
);


ALTER TYPE public."BadgeType" OWNER TO smartcareer;

--
-- Name: CreditType; Type: TYPE; Schema: public; Owner: smartcareer
--

CREATE TYPE public."CreditType" AS ENUM (
    'RESUME_REVIEW',
    'AI_INTERVIEW',
    'SKILL_TEST'
);


ALTER TYPE public."CreditType" OWNER TO smartcareer;

--
-- Name: Difficulty; Type: TYPE; Schema: public; Owner: smartcareer
--

CREATE TYPE public."Difficulty" AS ENUM (
    'EASY',
    'MEDIUM',
    'HARD'
);


ALTER TYPE public."Difficulty" OWNER TO smartcareer;

--
-- Name: InterviewStatus; Type: TYPE; Schema: public; Owner: smartcareer
--

CREATE TYPE public."InterviewStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."InterviewStatus" OWNER TO smartcareer;

--
-- Name: InterviewType; Type: TYPE; Schema: public; Owner: smartcareer
--

CREATE TYPE public."InterviewType" AS ENUM (
    'TECHNICAL',
    'BEHAVIORAL',
    'HR',
    'MIXED'
);


ALTER TYPE public."InterviewType" OWNER TO smartcareer;

--
-- Name: ResumeStatus; Type: TYPE; Schema: public; Owner: smartcareer
--

CREATE TYPE public."ResumeStatus" AS ENUM (
    'PENDING',
    'PARSING',
    'PARSED',
    'FAILED'
);


ALTER TYPE public."ResumeStatus" OWNER TO smartcareer;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: smartcareer
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'PAST_DUE',
    'HALTED',
    'PAUSED'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO smartcareer;

--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: smartcareer
--

CREATE TYPE public."TransactionType" AS ENUM (
    'PURCHASE',
    'CONSUME',
    'GRANT',
    'REFUND'
);


ALTER TYPE public."TransactionType" OWNER TO smartcareer;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: smartcareer
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'RECRUITER',
    'ADMIN',
    'INSTITUTION_ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO smartcareer;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO smartcareer;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.applications (
    id text NOT NULL,
    user_id text NOT NULL,
    job_id text NOT NULL,
    status public."ApplicationStatus" DEFAULT 'SAVED'::public."ApplicationStatus" NOT NULL,
    applied_at timestamp(3) without time zone,
    interview_date timestamp(3) without time zone,
    notes text,
    resume_used text,
    cover_letter text,
    salary_expected integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.applications OWNER TO smartcareer;

--
-- Name: ats_scores; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.ats_scores (
    id text NOT NULL,
    resume_id text NOT NULL,
    user_id text NOT NULL,
    job_role text NOT NULL,
    job_description text,
    overall_score integer NOT NULL,
    keyword_match_percent double precision NOT NULL,
    formatting_score integer NOT NULL,
    experience_score integer NOT NULL,
    education_score integer NOT NULL,
    matched_keywords text[],
    missing_keywords text[],
    formatting_issues text[],
    suggestions text[],
    raw_analysis jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ats_scores OWNER TO smartcareer;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.courses (
    id text NOT NULL,
    title text NOT NULL,
    provider text NOT NULL,
    url text NOT NULL,
    duration_hours integer NOT NULL,
    difficulty text NOT NULL,
    skill_id text NOT NULL,
    rating double precision DEFAULT 0,
    is_free boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.courses OWNER TO smartcareer;

--
-- Name: credit_transactions; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.credit_transactions (
    id text NOT NULL,
    user_id text NOT NULL,
    credit_type public."CreditType" NOT NULL,
    amount integer NOT NULL,
    transaction_type public."TransactionType" NOT NULL,
    description text,
    reference_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.credit_transactions OWNER TO smartcareer;

--
-- Name: institutions; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.institutions (
    id text NOT NULL,
    name text NOT NULL,
    domain text,
    logo_url text,
    address text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.institutions OWNER TO smartcareer;

--
-- Name: interview_questions; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.interview_questions (
    id text NOT NULL,
    session_id text NOT NULL,
    question_text text NOT NULL,
    question_type text DEFAULT 'technical'::text NOT NULL,
    user_answer text,
    score integer,
    feedback text,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.interview_questions OWNER TO smartcareer;

--
-- Name: interview_sessions; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.interview_sessions (
    id text NOT NULL,
    user_id text NOT NULL,
    type public."InterviewType" DEFAULT 'TECHNICAL'::public."InterviewType" NOT NULL,
    target_role text NOT NULL,
    difficulty public."Difficulty" DEFAULT 'MEDIUM'::public."Difficulty" NOT NULL,
    status public."InterviewStatus" DEFAULT 'PENDING'::public."InterviewStatus" NOT NULL,
    overall_score integer,
    feedback text,
    started_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.interview_sessions OWNER TO smartcareer;

--
-- Name: job_listings; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.job_listings (
    id text NOT NULL,
    title text NOT NULL,
    company text NOT NULL,
    location text NOT NULL,
    location_type text DEFAULT 'onsite'::text NOT NULL,
    description text NOT NULL,
    requirements text[],
    required_skills text[],
    salary_min integer,
    salary_max integer,
    salary_currency text DEFAULT 'USD'::text,
    experience_min integer,
    experience_max integer,
    source text NOT NULL,
    source_url text,
    external_id text,
    posted_at timestamp(3) without time zone,
    expires_at timestamp(3) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    scraped_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.job_listings OWNER TO smartcareer;

--
-- Name: job_role_cache; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.job_role_cache (
    id text NOT NULL,
    job_role_id text NOT NULL,
    certifications jsonb NOT NULL,
    course_suggestions jsonb NOT NULL,
    interview_questions jsonb,
    generated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.job_role_cache OWNER TO smartcareer;

--
-- Name: job_roles; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.job_roles (
    id text NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    required_skills text[],
    preferred_skills text[],
    keywords text[],
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.job_roles OWNER TO smartcareer;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.messages (
    id text NOT NULL,
    sender_id text NOT NULL,
    receiver_id text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.messages OWNER TO smartcareer;

--
-- Name: recruiter_jobs; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.recruiter_jobs (
    id text NOT NULL,
    recruiter_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    requirements text[],
    required_skills text[],
    location text NOT NULL,
    location_type text DEFAULT 'onsite'::text NOT NULL,
    salary_min integer,
    salary_max integer,
    experience_min integer,
    experience_max integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.recruiter_jobs OWNER TO smartcareer;

--
-- Name: recruiters; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.recruiters (
    id text NOT NULL,
    user_id text NOT NULL,
    company_name text NOT NULL,
    company_logo text,
    company_size text,
    industry text,
    website text,
    location text,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.recruiters OWNER TO smartcareer;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    user_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO smartcareer;

--
-- Name: resumes; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.resumes (
    id text NOT NULL,
    user_id text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    parsed_text text,
    status public."ResumeStatus" DEFAULT 'PENDING'::public."ResumeStatus" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.resumes OWNER TO smartcareer;

--
-- Name: saved_candidates; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.saved_candidates (
    id text NOT NULL,
    recruiter_id text NOT NULL,
    candidate_id text NOT NULL,
    notes text,
    tags text[],
    status text DEFAULT 'saved'::text NOT NULL,
    saved_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.saved_candidates OWNER TO smartcareer;

--
-- Name: skill_badges; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.skill_badges (
    id text NOT NULL,
    user_id text NOT NULL,
    skill_id text NOT NULL,
    badge_type public."BadgeType" DEFAULT 'VERIFIED'::public."BadgeType" NOT NULL,
    test_attempt_id text,
    issued_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone
);


ALTER TABLE public.skill_badges OWNER TO smartcareer;

--
-- Name: skill_tests; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.skill_tests (
    id text NOT NULL,
    skill_id text NOT NULL,
    title text NOT NULL,
    description text,
    difficulty public."Difficulty" DEFAULT 'MEDIUM'::public."Difficulty" NOT NULL,
    duration_minutes integer DEFAULT 30 NOT NULL,
    passing_score integer DEFAULT 70 NOT NULL,
    questions_count integer DEFAULT 10 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.skill_tests OWNER TO smartcareer;

--
-- Name: skills; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.skills (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    demand_score integer DEFAULT 50 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.skills OWNER TO smartcareer;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.subscription_plans (
    id text NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    price_monthly numeric(10,2) NOT NULL,
    price_yearly numeric(10,2) NOT NULL,
    features jsonb NOT NULL,
    razorpay_plan_id text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.subscription_plans OWNER TO smartcareer;

--
-- Name: test_attempts; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.test_attempts (
    id text NOT NULL,
    user_id text NOT NULL,
    test_id text NOT NULL,
    score integer,
    passed boolean,
    answers jsonb,
    started_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp(3) without time zone
);


ALTER TABLE public.test_attempts OWNER TO smartcareer;

--
-- Name: test_questions; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.test_questions (
    id text NOT NULL,
    test_id text NOT NULL,
    question_text text NOT NULL,
    question_type text DEFAULT 'mcq'::text NOT NULL,
    options jsonb NOT NULL,
    correct_answer text NOT NULL,
    explanation text,
    points integer DEFAULT 1 NOT NULL,
    order_index integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.test_questions OWNER TO smartcareer;

--
-- Name: user_credits; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.user_credits (
    id text NOT NULL,
    user_id text NOT NULL,
    credit_type public."CreditType" NOT NULL,
    balance integer DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_credits OWNER TO smartcareer;

--
-- Name: user_skills; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.user_skills (
    id text NOT NULL,
    user_id text NOT NULL,
    skill_id text NOT NULL,
    proficiency_level text NOT NULL,
    source text NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_skills OWNER TO smartcareer;

--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.user_subscriptions (
    id text NOT NULL,
    user_id text NOT NULL,
    plan_id text NOT NULL,
    razorpay_customer_id text,
    razorpay_subscription_id text,
    status public."SubscriptionStatus" DEFAULT 'ACTIVE'::public."SubscriptionStatus" NOT NULL,
    current_period_start timestamp(3) without time zone NOT NULL,
    current_period_end timestamp(3) without time zone NOT NULL,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_subscriptions OWNER TO smartcareer;

--
-- Name: users; Type: TABLE; Schema: public; Owner: smartcareer
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text,
    avatar_url text,
    is_verified boolean DEFAULT false NOT NULL,
    verify_token text,
    reset_token text,
    reset_expires timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    admin_for_institution_id text,
    institution_id text,
    target_job_role_id text
);


ALTER TABLE public.users OWNER TO smartcareer;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d8bd1ae7-779b-425a-824c-3c393d40992f	18236c3b1e9f21ba8010222e34e80520de380c2ad47f3138abc531784cda176a	2026-01-19 16:42:34.31665+00	20260110065944_init	\N	\N	2026-01-19 16:42:34.249568+00	1
82523895-2128-4bce-91f8-c0c4f4e0162b	225b13baa9c83706843f056f8f286308ecaa5828b1d200b69be04b66e33645d9	2026-01-19 16:42:34.399042+00	20260110093353_phase2	\N	\N	2026-01-19 16:42:34.320404+00	1
6f8202cd-fc3e-4052-bf96-b4934afae6a3	2dcf0b6150a809f7e3989ad36289470d2a0e7b4740cd04f4cbee9535733d9e8f	2026-01-19 16:42:34.477175+00	20260111161828_add_phase3_interviews_tests_badges	\N	\N	2026-01-19 16:42:34.402406+00	1
a43969ea-b812-45d3-8feb-cccf7ffb5abd	5ac6cf8a17749de943d31bb38f7dca1332afadf0acbb1f3e134bb9dfde753385	2026-01-19 16:42:34.580129+00	20260112102528_phase4	\N	\N	2026-01-19 16:42:34.48011+00	1
61a7df8a-0a9d-492e-ba8b-3bfaa525bc2d	387fc9d4219b8613cfadd673de85960ca2c6209e7490d9edba38e1773d3fa238	2026-01-19 16:42:36.280833+00	20260119164235_add_institutions	\N	\N	2026-01-19 16:42:36.229793+00	1
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.applications (id, user_id, job_id, status, applied_at, interview_date, notes, resume_used, cover_letter, salary_expected, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ats_scores; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.ats_scores (id, resume_id, user_id, job_role, job_description, overall_score, keyword_match_percent, formatting_score, experience_score, education_score, matched_keywords, missing_keywords, formatting_issues, suggestions, raw_analysis, created_at) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.courses (id, title, provider, url, duration_hours, difficulty, skill_id, rating, is_free, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: credit_transactions; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.credit_transactions (id, user_id, credit_type, amount, transaction_type, description, reference_id, created_at) FROM stdin;
\.


--
-- Data for Name: institutions; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.institutions (id, name, domain, logo_url, address, created_at, updated_at) FROM stdin;
11111111-1111-1111-1111-111111111111	Demo University	demo.edu	\N	123 Campus Drive, Tech City	2026-01-19 16:43:47.521	2026-01-19 16:43:47.521
\.


--
-- Data for Name: interview_questions; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.interview_questions (id, session_id, question_text, question_type, user_answer, score, feedback, order_index, created_at) FROM stdin;
\.


--
-- Data for Name: interview_sessions; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.interview_sessions (id, user_id, type, target_role, difficulty, status, overall_score, feedback, started_at, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: job_listings; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.job_listings (id, title, company, location, location_type, description, requirements, required_skills, salary_min, salary_max, salary_currency, experience_min, experience_max, source, source_url, external_id, posted_at, expires_at, is_active, scraped_at, created_at) FROM stdin;
\.


--
-- Data for Name: job_role_cache; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.job_role_cache (id, job_role_id, certifications, course_suggestions, interview_questions, generated_at, expires_at) FROM stdin;
\.


--
-- Data for Name: job_roles; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.job_roles (id, title, category, required_skills, preferred_skills, keywords, is_active, created_at) FROM stdin;
217c90ce-ae4e-4233-96d9-a5cd4f0d1b2f	Software Developer	Engineering	{JavaScript,Python,Java,Git,SQL,"REST APIs"}	{React,Node.js,Docker,AWS,TypeScript}	{software,developer,programming,coding,engineer,development}	t	2026-01-19 16:42:50.588
5c929a1f-4a38-441e-9528-8a1c8257065f	Frontend Developer	Engineering	{JavaScript,React,HTML,CSS,TypeScript}	{Next.js,Vue.js,"Tailwind CSS",Redux}	{frontend,react,javascript,ui,"web development","responsive design"}	t	2026-01-19 16:42:50.592
081d55c8-9828-4775-ba5e-3c82586edde8	Backend Developer	Engineering	{Node.js,Python,SQL,"REST APIs",Git}	{Docker,AWS,GraphQL,Redis,Kubernetes}	{backend,api,server,database,microservices}	t	2026-01-19 16:42:50.595
b31d6a20-1e7f-46d9-b15e-11dcd7764260	Full Stack Developer	Engineering	{JavaScript,React,Node.js,SQL,Git}	{TypeScript,Docker,AWS,GraphQL,MongoDB}	{fullstack,full-stack,"web developer",mern,mean}	t	2026-01-19 16:42:50.597
b7cf36d1-ac46-4e8d-845f-d2dd1bd496f6	Data Scientist	Data	{Python,"Machine Learning",SQL,Statistics,Pandas}	{TensorFlow,PyTorch,Spark,"Deep Learning",NLP}	{"data science",ml,ai,analytics,modeling}	t	2026-01-19 16:42:50.599
ec34b5ce-fe5c-4788-863b-2c1114f4a70e	Data Analyst	Data	{SQL,Excel,Python,"Data Visualization",Statistics}	{Tableau,"Power BI",R,Pandas}	{"data analyst",analytics,reporting,insights}	t	2026-01-19 16:42:50.601
b2a175bc-da3a-411c-924e-109ab82595bc	DevOps Engineer	Engineering	{Linux,Docker,CI/CD,AWS,Kubernetes}	{Terraform,Ansible,Prometheus,"GitLab CI"}	{devops,infrastructure,sre,cloud,automation}	t	2026-01-19 16:42:50.603
9c502a4a-9a9a-435b-93a9-4bd01c0c7be6	Cloud Engineer	Engineering	{AWS,Azure,Linux,Networking,Docker}	{Kubernetes,Terraform,Python,Security}	{cloud,aws,azure,gcp,infrastructure}	t	2026-01-19 16:42:50.605
030e1b15-f5eb-45f8-a722-7e66d1f7225e	Product Manager	Product	{"Product Strategy",Agile,"User Research",Roadmapping}	{SQL,"Data Analysis","A/B Testing",Figma}	{product,pm,strategy,roadmap,stakeholder}	t	2026-01-19 16:42:50.608
e6dc96d2-2e7a-423f-ab7b-aea6e9b170a9	Project Manager	Management	{"Project Planning",Agile,Scrum,"Stakeholder Management"}	{Jira,"MS Project","Risk Management",Budgeting}	{project,management,pmp,"scrum master"}	t	2026-01-19 16:42:50.611
9e55f369-fa42-4520-8156-ae06320dd30b	UI/UX Designer	Design	{Figma,"User Research",Wireframing,Prototyping}	{"Adobe XD",Sketch,HTML/CSS,"Design Systems"}	{design,ui,ux,"user experience",interface}	t	2026-01-19 16:42:50.614
1c083eea-bcdb-4160-b8cf-f70a323c4dfb	Machine Learning Engineer	Engineering	{Python,TensorFlow,PyTorch,"ML Algorithms",SQL}	{MLOps,Kubernetes,Spark,"Computer Vision"}	{"ml engineer","machine learning","deep learning",ai}	t	2026-01-19 16:42:50.616
14a5a258-b50e-43bc-8d40-2500277b7548	Mobile Developer	Engineering	{"React Native",Swift,Kotlin,JavaScript,Git}	{Flutter,iOS,Android,Firebase}	{mobile,ios,android,"app development"}	t	2026-01-19 16:42:50.619
cc319a35-84b2-43f6-97ad-a35ef4eeca82	QA Engineer	Engineering	{"Test Automation",Selenium,"Manual Testing",SQL}	{Cypress,Jest,"Performance Testing","API Testing"}	{qa,testing,"quality assurance",automation}	t	2026-01-19 16:42:50.621
aac9c7cf-bfa6-40ad-99ae-97a98c3eb1a3	Cybersecurity Analyst	Security	{"Network Security",SIEM,"Vulnerability Assessment",Linux}	{"Penetration Testing",Python,"Cloud Security",Compliance}	{security,cyber,infosec,"threat detection"}	t	2026-01-19 16:42:50.624
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.messages (id, sender_id, receiver_id, content, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: recruiter_jobs; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.recruiter_jobs (id, recruiter_id, title, description, requirements, required_skills, location, location_type, salary_min, salary_max, experience_min, experience_max, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recruiters; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.recruiters (id, user_id, company_name, company_logo, company_size, industry, website, location, is_verified, created_at, updated_at) FROM stdin;
dd41e4cb-7d2c-46d8-83dc-8ccc08bb10b4	873ae090-8e26-4bfa-b9b7-e6b7c5688ee3	TechHunters Inc.	\N	\N	Staffing & Recruiting	\N	San Francisco, CA	t	2026-01-19 16:42:50.576	2026-01-19 16:42:50.576
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
f581bd13-61b1-47db-aebb-9b872ed517d3	167f1894-99c7-42f2-9cc5-1cdc1bff8cdb	fabdddb40aa9fbe6cbcf246660549ac3ef5b08ec95427d6745c8c7dbda0f9d90d65b45ec3a5c2c1e8db77b04a22fee242341589f6ac7d8be8632544953d5e882	2026-02-18 16:54:20.323	2026-01-19 16:54:20.324
c26f0685-b3c9-4036-ac34-e57da2232c9a	167f1894-99c7-42f2-9cc5-1cdc1bff8cdb	fc0a7b18a79f3cb91fbbca0c65a0de81d57a409d7a9808a9cfc1e1b88293a055369e180d62c2a3c48a47a940b27535261be73ebe44f8a05c984bc3969bd27a04	2026-02-18 16:54:27.4	2026-01-19 16:54:27.402
2fcdfbc5-e3ee-47f6-aff0-a19c618671d3	22222222-2222-2222-2222-222222222222	6e17c66fe65d1698f41ca78b4a34d52a62e63a71ab5ece7e72a3079685e4697f7b1d785f9961019b143ffe8605c64ca238bdfc6505134d8c5219f67ea1a7b0f7	2026-02-18 17:01:16.835	2026-01-19 17:01:16.864
669fb620-36a4-451a-82ed-c28caf4f5fd1	22222222-2222-2222-2222-222222222222	5bf7c408831f44edcd0e6d2f58179b93aa84d78edf1adaa1ec3702a509ee8dfe4b0f26ba321732c5379034a6f2d1bdb09c40e7de36c79bab6c02a03d076384fc	2026-02-18 17:03:05.796	2026-01-19 17:03:05.797
24b3ffc7-957c-4edc-bfa2-55772ce37bf9	22222222-2222-2222-2222-222222222222	ccd05b2044c12ce753fd3fbf493af8e234dae38e22fa4105b72d19ed7f5ba6265510bee5c962d6ca9e9bc397621f2e89682705df2d5ddd5e0ec8d44fbd5a0c83	2026-02-18 17:06:42.806	2026-01-19 17:06:42.807
325a881f-8e98-403b-932f-bcf3e20d788b	22222222-2222-2222-2222-222222222222	fce319dfd7ee7f83b5e7e6a68a4ce846ef3f420e229dcdb6ad451f310696de5dfa43eca9a1af85146b565857eae85cfe040172bb1b19bb88282581b8d8158d0f	2026-02-18 17:13:01.04	2026-01-19 17:13:01.042
e1062c7f-eed3-4602-a170-7fd05458cb1c	22222222-2222-2222-2222-222222222222	491b8c3098b4589ffb933387113b62338ebaeca0312de5359a2d598081dbdd86703454b09290241d19cca01396ea2a00de19637a0a44cfa2efb84b25011616cc	2026-02-18 17:16:27.44	2026-01-19 17:16:27.442
450bc31f-aee5-44cc-a8d1-58fd6dacdd5e	22222222-2222-2222-2222-222222222222	9624f5c6c7aaf72bef87f766f7149c28719299b92ce85412fd254d46b820cf802f11266d48eeef90bd8314eb6160ee95b5935ce87fe69e7c787c38ff85fb2448	2026-02-18 17:17:16.005	2026-01-19 17:17:16.006
2d755700-0c7e-4ab0-b91e-b92ff67f4547	22222222-2222-2222-2222-222222222222	0864ae4905c06f8dcde5590e04b7149b57b114e557f8e52008552076666c097517c814173ec5d3a0ad29ec39369e291bd37e11bf0cd734821e16532c2bd927cd	2026-02-18 17:47:10.14	2026-01-19 17:47:10.141
\.


--
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.resumes (id, user_id, file_name, file_url, file_size, mime_type, parsed_text, status, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: saved_candidates; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.saved_candidates (id, recruiter_id, candidate_id, notes, tags, status, saved_at) FROM stdin;
\.


--
-- Data for Name: skill_badges; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.skill_badges (id, user_id, skill_id, badge_type, test_attempt_id, issued_at, expires_at) FROM stdin;
\.


--
-- Data for Name: skill_tests; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.skill_tests (id, skill_id, title, description, difficulty, duration_minutes, passing_score, questions_count, is_active, created_at) FROM stdin;
test-034bc207-f78b-4165-9d29-4b609af84226-EASY	034bc207-f78b-4165-9d29-4b609af84226	JavaScript Basics	JavaScript Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.736
test-034bc207-f78b-4165-9d29-4b609af84226-MEDIUM	034bc207-f78b-4165-9d29-4b609af84226	JavaScript Intermediate	Intermediate JavaScript	MEDIUM	20	70	10	t	2026-01-19 16:42:50.741
test-034bc207-f78b-4165-9d29-4b609af84226-HARD	034bc207-f78b-4165-9d29-4b609af84226	JavaScript Advanced	Advanced JavaScript Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.744
test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-EASY	c0398fc8-2709-47d0-b402-a6fdb0871b7c	Python Basics	Python Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.747
test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-MEDIUM	c0398fc8-2709-47d0-b402-a6fdb0871b7c	Python Intermediate	Intermediate Python	MEDIUM	20	70	10	t	2026-01-19 16:42:50.75
test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-HARD	c0398fc8-2709-47d0-b402-a6fdb0871b7c	Python Advanced	Advanced Python Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.752
test-887d4d29-a82f-4375-8f9d-37f06e38e07d-EASY	887d4d29-a82f-4375-8f9d-37f06e38e07d	React Basics	React Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.755
test-887d4d29-a82f-4375-8f9d-37f06e38e07d-MEDIUM	887d4d29-a82f-4375-8f9d-37f06e38e07d	React Intermediate	Intermediate React	MEDIUM	20	70	10	t	2026-01-19 16:42:50.758
test-887d4d29-a82f-4375-8f9d-37f06e38e07d-HARD	887d4d29-a82f-4375-8f9d-37f06e38e07d	React Advanced	Advanced React Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.761
test-7f43aec2-9894-49a5-85ab-977578c6dab7-EASY	7f43aec2-9894-49a5-85ab-977578c6dab7	Node.js Basics	Node.js Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.764
test-7f43aec2-9894-49a5-85ab-977578c6dab7-MEDIUM	7f43aec2-9894-49a5-85ab-977578c6dab7	Node.js Intermediate	Intermediate Node.js	MEDIUM	20	70	10	t	2026-01-19 16:42:50.766
test-7f43aec2-9894-49a5-85ab-977578c6dab7-HARD	7f43aec2-9894-49a5-85ab-977578c6dab7	Node.js Advanced	Advanced Node.js Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.774
test-0136902f-234b-4e70-a435-02a6eb6717a3-EASY	0136902f-234b-4e70-a435-02a6eb6717a3	TypeScript Basics	TypeScript Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.777
test-0136902f-234b-4e70-a435-02a6eb6717a3-MEDIUM	0136902f-234b-4e70-a435-02a6eb6717a3	TypeScript Intermediate	Intermediate TypeScript	MEDIUM	20	70	10	t	2026-01-19 16:42:50.779
test-0136902f-234b-4e70-a435-02a6eb6717a3-HARD	0136902f-234b-4e70-a435-02a6eb6717a3	TypeScript Advanced	Advanced TypeScript Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.782
test-499e6630-c332-45b7-9e73-eb50a87f02ba-EASY	499e6630-c332-45b7-9e73-eb50a87f02ba	SQL Basics	SQL Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.784
test-499e6630-c332-45b7-9e73-eb50a87f02ba-MEDIUM	499e6630-c332-45b7-9e73-eb50a87f02ba	SQL Intermediate	Intermediate SQL	MEDIUM	20	70	10	t	2026-01-19 16:42:50.787
test-499e6630-c332-45b7-9e73-eb50a87f02ba-HARD	499e6630-c332-45b7-9e73-eb50a87f02ba	SQL Advanced	Advanced SQL Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.789
test-a6ea686a-6686-4835-bc1b-caf312b35139-EASY	a6ea686a-6686-4835-bc1b-caf312b35139	Git Basics	Git Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.79
test-a6ea686a-6686-4835-bc1b-caf312b35139-MEDIUM	a6ea686a-6686-4835-bc1b-caf312b35139	Git Intermediate	Intermediate Git	MEDIUM	20	70	10	t	2026-01-19 16:42:50.793
test-a6ea686a-6686-4835-bc1b-caf312b35139-HARD	a6ea686a-6686-4835-bc1b-caf312b35139	Git Advanced	Advanced Git Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.795
test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-EASY	90a1bd3d-5e51-4f87-89bf-66c98cf5737c	AWS Basics	AWS Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.798
test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-MEDIUM	90a1bd3d-5e51-4f87-89bf-66c98cf5737c	AWS Intermediate	Intermediate AWS	MEDIUM	20	70	10	t	2026-01-19 16:42:50.8
test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-HARD	90a1bd3d-5e51-4f87-89bf-66c98cf5737c	AWS Advanced	Advanced AWS Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.802
test-119283d7-711d-4636-8429-72eff2be4b4f-EASY	119283d7-711d-4636-8429-72eff2be4b4f	Docker Basics	Docker Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.804
test-119283d7-711d-4636-8429-72eff2be4b4f-MEDIUM	119283d7-711d-4636-8429-72eff2be4b4f	Docker Intermediate	Intermediate Docker	MEDIUM	20	70	10	t	2026-01-19 16:42:50.806
test-119283d7-711d-4636-8429-72eff2be4b4f-HARD	119283d7-711d-4636-8429-72eff2be4b4f	Docker Advanced	Advanced Docker Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.808
test-80893a04-813c-484d-9e4f-3c53ff057999-EASY	80893a04-813c-484d-9e4f-3c53ff057999	Kubernetes Basics	Kubernetes Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.811
test-80893a04-813c-484d-9e4f-3c53ff057999-MEDIUM	80893a04-813c-484d-9e4f-3c53ff057999	Kubernetes Intermediate	Intermediate Kubernetes	MEDIUM	20	70	10	t	2026-01-19 16:42:50.813
test-80893a04-813c-484d-9e4f-3c53ff057999-HARD	80893a04-813c-484d-9e4f-3c53ff057999	Kubernetes Advanced	Advanced Kubernetes Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.816
test-1f0d5456-d886-4175-a3e1-bb87722940d1-EASY	1f0d5456-d886-4175-a3e1-bb87722940d1	Java Basics	Java Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.818
test-1f0d5456-d886-4175-a3e1-bb87722940d1-MEDIUM	1f0d5456-d886-4175-a3e1-bb87722940d1	Java Intermediate	Intermediate Java	MEDIUM	20	70	10	t	2026-01-19 16:42:50.82
test-1f0d5456-d886-4175-a3e1-bb87722940d1-HARD	1f0d5456-d886-4175-a3e1-bb87722940d1	Java Advanced	Advanced Java Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.822
test-cdf0528f-944a-48b0-a7bc-215ebc902345-EASY	cdf0528f-944a-48b0-a7bc-215ebc902345	HTML Basics	HTML Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.825
test-cdf0528f-944a-48b0-a7bc-215ebc902345-MEDIUM	cdf0528f-944a-48b0-a7bc-215ebc902345	HTML Intermediate	Intermediate HTML	MEDIUM	20	70	10	t	2026-01-19 16:42:50.827
test-cdf0528f-944a-48b0-a7bc-215ebc902345-HARD	cdf0528f-944a-48b0-a7bc-215ebc902345	HTML Advanced	Advanced HTML Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.835
test-56749108-e64b-455f-bf20-76307d8dda77-EASY	56749108-e64b-455f-bf20-76307d8dda77	CSS Basics	CSS Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.838
test-56749108-e64b-455f-bf20-76307d8dda77-MEDIUM	56749108-e64b-455f-bf20-76307d8dda77	CSS Intermediate	Intermediate CSS	MEDIUM	20	70	10	t	2026-01-19 16:42:50.842
test-56749108-e64b-455f-bf20-76307d8dda77-HARD	56749108-e64b-455f-bf20-76307d8dda77	CSS Advanced	Advanced CSS Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.845
test-2ed7e233-e6c8-486c-8266-0a539753d9b0-EASY	2ed7e233-e6c8-486c-8266-0a539753d9b0	REST APIs Basics	REST APIs Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.848
test-2ed7e233-e6c8-486c-8266-0a539753d9b0-MEDIUM	2ed7e233-e6c8-486c-8266-0a539753d9b0	REST APIs Intermediate	Intermediate REST APIs	MEDIUM	20	70	10	t	2026-01-19 16:42:50.851
test-2ed7e233-e6c8-486c-8266-0a539753d9b0-HARD	2ed7e233-e6c8-486c-8266-0a539753d9b0	REST APIs Advanced	Advanced REST APIs Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.853
test-47fb42c2-a404-4cb7-a986-c55ffd29c771-EASY	47fb42c2-a404-4cb7-a986-c55ffd29c771	MongoDB Basics	MongoDB Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.856
test-47fb42c2-a404-4cb7-a986-c55ffd29c771-MEDIUM	47fb42c2-a404-4cb7-a986-c55ffd29c771	MongoDB Intermediate	Intermediate MongoDB	MEDIUM	20	70	10	t	2026-01-19 16:42:50.86
test-47fb42c2-a404-4cb7-a986-c55ffd29c771-HARD	47fb42c2-a404-4cb7-a986-c55ffd29c771	MongoDB Advanced	Advanced MongoDB Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.863
test-8191d0c9-e34d-4c9a-833c-a84e855278f3-EASY	8191d0c9-e34d-4c9a-833c-a84e855278f3	PostgreSQL Basics	PostgreSQL Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.866
test-8191d0c9-e34d-4c9a-833c-a84e855278f3-MEDIUM	8191d0c9-e34d-4c9a-833c-a84e855278f3	PostgreSQL Intermediate	Intermediate PostgreSQL	MEDIUM	20	70	10	t	2026-01-19 16:42:50.869
test-8191d0c9-e34d-4c9a-833c-a84e855278f3-HARD	8191d0c9-e34d-4c9a-833c-a84e855278f3	PostgreSQL Advanced	Advanced PostgreSQL Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.872
test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-EASY	8db04d8e-79e1-450d-a4e4-e6e4c9d9037a	Linux Basics	Linux Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.875
test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-MEDIUM	8db04d8e-79e1-450d-a4e4-e6e4c9d9037a	Linux Intermediate	Intermediate Linux	MEDIUM	20	70	10	t	2026-01-19 16:42:50.878
test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-HARD	8db04d8e-79e1-450d-a4e4-e6e4c9d9037a	Linux Advanced	Advanced Linux Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.88
test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-EASY	3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2	Machine Learning Basics	Machine Learning Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.883
test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-MEDIUM	3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2	Machine Learning Intermediate	Intermediate Machine Learning	MEDIUM	20	70	10	t	2026-01-19 16:42:50.886
test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-HARD	3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2	Machine Learning Advanced	Advanced Machine Learning Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.888
test-06bae1b4-c6fc-4142-9936-f919b1732eaa-EASY	06bae1b4-c6fc-4142-9936-f919b1732eaa	TensorFlow Basics	TensorFlow Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.891
test-06bae1b4-c6fc-4142-9936-f919b1732eaa-MEDIUM	06bae1b4-c6fc-4142-9936-f919b1732eaa	TensorFlow Intermediate	Intermediate TensorFlow	MEDIUM	20	70	10	t	2026-01-19 16:42:50.893
test-06bae1b4-c6fc-4142-9936-f919b1732eaa-HARD	06bae1b4-c6fc-4142-9936-f919b1732eaa	TensorFlow Advanced	Advanced TensorFlow Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.896
test-160e9349-ac85-42f7-ade7-c369aa105a6f-EASY	160e9349-ac85-42f7-ade7-c369aa105a6f	PyTorch Basics	PyTorch Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.898
test-160e9349-ac85-42f7-ade7-c369aa105a6f-MEDIUM	160e9349-ac85-42f7-ade7-c369aa105a6f	PyTorch Intermediate	Intermediate PyTorch	MEDIUM	20	70	10	t	2026-01-19 16:42:50.9
test-160e9349-ac85-42f7-ade7-c369aa105a6f-HARD	160e9349-ac85-42f7-ade7-c369aa105a6f	PyTorch Advanced	Advanced PyTorch Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.901
test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-EASY	dbd5f7bf-e347-47c2-9eff-598b77c58b92	Agile Basics	Agile Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.904
test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-MEDIUM	dbd5f7bf-e347-47c2-9eff-598b77c58b92	Agile Intermediate	Intermediate Agile	MEDIUM	20	70	10	t	2026-01-19 16:42:50.906
test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-HARD	dbd5f7bf-e347-47c2-9eff-598b77c58b92	Agile Advanced	Advanced Agile Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.908
test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-EASY	ebe24dfc-42ad-4585-8a9e-991bc36e32ce	Scrum Basics	Scrum Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.91
test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-MEDIUM	ebe24dfc-42ad-4585-8a9e-991bc36e32ce	Scrum Intermediate	Intermediate Scrum	MEDIUM	20	70	10	t	2026-01-19 16:42:50.912
test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-HARD	ebe24dfc-42ad-4585-8a9e-991bc36e32ce	Scrum Advanced	Advanced Scrum Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.914
test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-EASY	742fd989-b3f4-4e70-90bc-d40aecfe9b22	Figma Basics	Figma Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.916
test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-MEDIUM	742fd989-b3f4-4e70-90bc-d40aecfe9b22	Figma Intermediate	Intermediate Figma	MEDIUM	20	70	10	t	2026-01-19 16:42:50.918
test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-HARD	742fd989-b3f4-4e70-90bc-d40aecfe9b22	Figma Advanced	Advanced Figma Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.92
test-77a90318-206b-47d9-b848-5fc0826a7f01-EASY	77a90318-206b-47d9-b848-5fc0826a7f01	Next.js Basics	Next.js Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.922
test-77a90318-206b-47d9-b848-5fc0826a7f01-MEDIUM	77a90318-206b-47d9-b848-5fc0826a7f01	Next.js Intermediate	Intermediate Next.js	MEDIUM	20	70	10	t	2026-01-19 16:42:50.929
test-77a90318-206b-47d9-b848-5fc0826a7f01-HARD	77a90318-206b-47d9-b848-5fc0826a7f01	Next.js Advanced	Advanced Next.js Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.931
test-f43f5086-2801-4967-b2bc-72bbd824986f-EASY	f43f5086-2801-4967-b2bc-72bbd824986f	GraphQL Basics	GraphQL Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.933
test-f43f5086-2801-4967-b2bc-72bbd824986f-MEDIUM	f43f5086-2801-4967-b2bc-72bbd824986f	GraphQL Intermediate	Intermediate GraphQL	MEDIUM	20	70	10	t	2026-01-19 16:42:50.935
test-f43f5086-2801-4967-b2bc-72bbd824986f-HARD	f43f5086-2801-4967-b2bc-72bbd824986f	GraphQL Advanced	Advanced GraphQL Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.937
test-15c8be26-50a5-4db2-a79a-d65db912ea12-EASY	15c8be26-50a5-4db2-a79a-d65db912ea12	Excel Basics	Excel Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.94
test-15c8be26-50a5-4db2-a79a-d65db912ea12-MEDIUM	15c8be26-50a5-4db2-a79a-d65db912ea12	Excel Intermediate	Intermediate Excel	MEDIUM	20	70	10	t	2026-01-19 16:42:50.942
test-15c8be26-50a5-4db2-a79a-d65db912ea12-HARD	15c8be26-50a5-4db2-a79a-d65db912ea12	Excel Advanced	Advanced Excel Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.944
test-613de450-5db2-41df-9a82-3e9f8c7deb59-EASY	613de450-5db2-41df-9a82-3e9f8c7deb59	Statistics Basics	Statistics Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.946
test-613de450-5db2-41df-9a82-3e9f8c7deb59-MEDIUM	613de450-5db2-41df-9a82-3e9f8c7deb59	Statistics Intermediate	Intermediate Statistics	MEDIUM	20	70	10	t	2026-01-19 16:42:50.948
test-613de450-5db2-41df-9a82-3e9f8c7deb59-HARD	613de450-5db2-41df-9a82-3e9f8c7deb59	Statistics Advanced	Advanced Statistics Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.95
test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-EASY	7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e	Tableau Basics	Tableau Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.953
test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-MEDIUM	7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e	Tableau Intermediate	Intermediate Tableau	MEDIUM	20	70	10	t	2026-01-19 16:42:50.955
test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-HARD	7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e	Tableau Advanced	Advanced Tableau Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.957
test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-EASY	da4b90a3-d6e0-49bf-8277-0e73358a8fc9	Power BI Basics	Power BI Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.959
test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-MEDIUM	da4b90a3-d6e0-49bf-8277-0e73358a8fc9	Power BI Intermediate	Intermediate Power BI	MEDIUM	20	70	10	t	2026-01-19 16:42:50.962
test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-HARD	da4b90a3-d6e0-49bf-8277-0e73358a8fc9	Power BI Advanced	Advanced Power BI Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.963
test-30788882-2a1b-4c76-a027-ffbcab0d17e9-EASY	30788882-2a1b-4c76-a027-ffbcab0d17e9	R Basics	R Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.965
test-30788882-2a1b-4c76-a027-ffbcab0d17e9-MEDIUM	30788882-2a1b-4c76-a027-ffbcab0d17e9	R Intermediate	Intermediate R	MEDIUM	20	70	10	t	2026-01-19 16:42:50.967
test-30788882-2a1b-4c76-a027-ffbcab0d17e9-HARD	30788882-2a1b-4c76-a027-ffbcab0d17e9	R Advanced	Advanced R Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.969
test-39068856-8c6c-413c-8113-e3428738ecf3-EASY	39068856-8c6c-413c-8113-e3428738ecf3	Pandas Basics	Pandas Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.971
test-39068856-8c6c-413c-8113-e3428738ecf3-MEDIUM	39068856-8c6c-413c-8113-e3428738ecf3	Pandas Intermediate	Intermediate Pandas	MEDIUM	20	70	10	t	2026-01-19 16:42:50.973
test-39068856-8c6c-413c-8113-e3428738ecf3-HARD	39068856-8c6c-413c-8113-e3428738ecf3	Pandas Advanced	Advanced Pandas Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.975
test-33414997-9c16-420f-9e13-2fdc3f613ea0-EASY	33414997-9c16-420f-9e13-2fdc3f613ea0	Data Visualization Basics	Data Visualization Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.978
test-33414997-9c16-420f-9e13-2fdc3f613ea0-MEDIUM	33414997-9c16-420f-9e13-2fdc3f613ea0	Data Visualization Intermediate	Intermediate Data Visualization	MEDIUM	20	70	10	t	2026-01-19 16:42:50.979
test-33414997-9c16-420f-9e13-2fdc3f613ea0-HARD	33414997-9c16-420f-9e13-2fdc3f613ea0	Data Visualization Advanced	Advanced Data Visualization Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.981
test-148aaa3c-c319-4b91-be36-c18b111c598e-EASY	148aaa3c-c319-4b91-be36-c18b111c598e	Data Modeling Basics	Data Modeling Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.984
test-148aaa3c-c319-4b91-be36-c18b111c598e-MEDIUM	148aaa3c-c319-4b91-be36-c18b111c598e	Data Modeling Intermediate	Intermediate Data Modeling	MEDIUM	20	70	10	t	2026-01-19 16:42:50.992
test-148aaa3c-c319-4b91-be36-c18b111c598e-HARD	148aaa3c-c319-4b91-be36-c18b111c598e	Data Modeling Advanced	Advanced Data Modeling Concepts	HARD	30	70	15	t	2026-01-19 16:42:50.995
test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-EASY	ddeed26d-cf2c-4192-89ec-efe49a06e1f2	Artificial Intelligence Basics	Artificial Intelligence Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:50.998
test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-MEDIUM	ddeed26d-cf2c-4192-89ec-efe49a06e1f2	Artificial Intelligence Intermediate	Intermediate Artificial Intelligence	MEDIUM	20	70	10	t	2026-01-19 16:42:51.001
test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-HARD	ddeed26d-cf2c-4192-89ec-efe49a06e1f2	Artificial Intelligence Advanced	Advanced Artificial Intelligence Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.004
test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-EASY	729b3b7e-4804-4eeb-a69b-3ad36d336ea5	C Basics	C Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.006
test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-MEDIUM	729b3b7e-4804-4eeb-a69b-3ad36d336ea5	C Intermediate	Intermediate C	MEDIUM	20	70	10	t	2026-01-19 16:42:51.008
test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-HARD	729b3b7e-4804-4eeb-a69b-3ad36d336ea5	C Advanced	Advanced C Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.011
test-1001daa3-af50-4d62-a8e0-07b6bba31aff-EASY	1001daa3-af50-4d62-a8e0-07b6bba31aff	C++ Basics	C++ Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.013
test-1001daa3-af50-4d62-a8e0-07b6bba31aff-MEDIUM	1001daa3-af50-4d62-a8e0-07b6bba31aff	C++ Intermediate	Intermediate C++	MEDIUM	20	70	10	t	2026-01-19 16:42:51.015
test-1001daa3-af50-4d62-a8e0-07b6bba31aff-HARD	1001daa3-af50-4d62-a8e0-07b6bba31aff	C++ Advanced	Advanced C++ Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.017
test-8f5dd442-70c8-49f1-b867-cadec10e9412-EASY	8f5dd442-70c8-49f1-b867-cadec10e9412	Go Basics	Go Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.019
test-8f5dd442-70c8-49f1-b867-cadec10e9412-MEDIUM	8f5dd442-70c8-49f1-b867-cadec10e9412	Go Intermediate	Intermediate Go	MEDIUM	20	70	10	t	2026-01-19 16:42:51.02
test-8f5dd442-70c8-49f1-b867-cadec10e9412-HARD	8f5dd442-70c8-49f1-b867-cadec10e9412	Go Advanced	Advanced Go Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.022
test-2c344fa7-edd0-44f9-966c-852055c44112-EASY	2c344fa7-edd0-44f9-966c-852055c44112	Rust Basics	Rust Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.024
test-2c344fa7-edd0-44f9-966c-852055c44112-MEDIUM	2c344fa7-edd0-44f9-966c-852055c44112	Rust Intermediate	Intermediate Rust	MEDIUM	20	70	10	t	2026-01-19 16:42:51.026
test-2c344fa7-edd0-44f9-966c-852055c44112-HARD	2c344fa7-edd0-44f9-966c-852055c44112	Rust Advanced	Advanced Rust Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.028
test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-EASY	49bd7e04-5cb2-40bd-a703-0bbc6368703f	Feature Engineering Basics	Feature Engineering Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.03
test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-MEDIUM	49bd7e04-5cb2-40bd-a703-0bbc6368703f	Feature Engineering Intermediate	Intermediate Feature Engineering	MEDIUM	20	70	10	t	2026-01-19 16:42:51.032
test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-HARD	49bd7e04-5cb2-40bd-a703-0bbc6368703f	Feature Engineering Advanced	Advanced Feature Engineering Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.034
test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-EASY	8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d	NumPy Basics	NumPy Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.036
test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-MEDIUM	8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d	NumPy Intermediate	Intermediate NumPy	MEDIUM	20	70	10	t	2026-01-19 16:42:51.038
test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-HARD	8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d	NumPy Advanced	Advanced NumPy Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.04
test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-EASY	04d478b4-c1d0-4b0a-b75c-3b339c4fef8f	Scikit-learn Basics	Scikit-learn Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.042
test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-MEDIUM	04d478b4-c1d0-4b0a-b75c-3b339c4fef8f	Scikit-learn Intermediate	Intermediate Scikit-learn	MEDIUM	20	70	10	t	2026-01-19 16:42:51.045
test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-HARD	04d478b4-c1d0-4b0a-b75c-3b339c4fef8f	Scikit-learn Advanced	Advanced Scikit-learn Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.047
test-2618e1cf-127d-4dd1-b772-77be1df7f091-EASY	2618e1cf-127d-4dd1-b772-77be1df7f091	Deep Learning Basics	Deep Learning Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.049
test-2618e1cf-127d-4dd1-b772-77be1df7f091-MEDIUM	2618e1cf-127d-4dd1-b772-77be1df7f091	Deep Learning Intermediate	Intermediate Deep Learning	MEDIUM	20	70	10	t	2026-01-19 16:42:51.05
test-2618e1cf-127d-4dd1-b772-77be1df7f091-HARD	2618e1cf-127d-4dd1-b772-77be1df7f091	Deep Learning Advanced	Advanced Deep Learning Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.052
test-03064e4f-1205-4e67-98ca-b6373f0a4b55-EASY	03064e4f-1205-4e67-98ca-b6373f0a4b55	Natural Language Processing Basics	Natural Language Processing Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.054
test-03064e4f-1205-4e67-98ca-b6373f0a4b55-MEDIUM	03064e4f-1205-4e67-98ca-b6373f0a4b55	Natural Language Processing Intermediate	Intermediate Natural Language Processing	MEDIUM	20	70	10	t	2026-01-19 16:42:51.056
test-03064e4f-1205-4e67-98ca-b6373f0a4b55-HARD	03064e4f-1205-4e67-98ca-b6373f0a4b55	Natural Language Processing Advanced	Advanced Natural Language Processing Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.057
test-45d8f8c2-703b-4905-8dff-e37e23726151-EASY	45d8f8c2-703b-4905-8dff-e37e23726151	Computer Vision Basics	Computer Vision Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.06
test-45d8f8c2-703b-4905-8dff-e37e23726151-MEDIUM	45d8f8c2-703b-4905-8dff-e37e23726151	Computer Vision Intermediate	Intermediate Computer Vision	MEDIUM	20	70	10	t	2026-01-19 16:42:51.063
test-45d8f8c2-703b-4905-8dff-e37e23726151-HARD	45d8f8c2-703b-4905-8dff-e37e23726151	Computer Vision Advanced	Advanced Computer Vision Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.065
test-5a9e25a1-6da1-4288-8951-bc8060a9127e-EASY	5a9e25a1-6da1-4288-8951-bc8060a9127e	Generative AI Basics	Generative AI Fundamentals	EASY	10	80	5	t	2026-01-19 16:42:51.067
test-5a9e25a1-6da1-4288-8951-bc8060a9127e-MEDIUM	5a9e25a1-6da1-4288-8951-bc8060a9127e	Generative AI Intermediate	Intermediate Generative AI	MEDIUM	20	70	10	t	2026-01-19 16:42:51.069
test-5a9e25a1-6da1-4288-8951-bc8060a9127e-HARD	5a9e25a1-6da1-4288-8951-bc8060a9127e	Generative AI Advanced	Advanced Generative AI Concepts	HARD	30	70	15	t	2026-01-19 16:42:51.071
\.


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.skills (id, name, category, demand_score, is_active, created_at) FROM stdin;
034bc207-f78b-4165-9d29-4b609af84226	JavaScript	Programming	95	t	2026-01-19 16:42:50.627
c0398fc8-2709-47d0-b402-a6fdb0871b7c	Python	Programming	95	t	2026-01-19 16:42:50.631
887d4d29-a82f-4375-8f9d-37f06e38e07d	React	Framework	90	t	2026-01-19 16:42:50.633
7f43aec2-9894-49a5-85ab-977578c6dab7	Node.js	Runtime	88	t	2026-01-19 16:42:50.635
0136902f-234b-4e70-a435-02a6eb6717a3	TypeScript	Programming	85	t	2026-01-19 16:42:50.637
499e6630-c332-45b7-9e73-eb50a87f02ba	SQL	Database	90	t	2026-01-19 16:42:50.645
a6ea686a-6686-4835-bc1b-caf312b35139	Git	Tool	88	t	2026-01-19 16:42:50.647
90a1bd3d-5e51-4f87-89bf-66c98cf5737c	AWS	Cloud	85	t	2026-01-19 16:42:50.649
119283d7-711d-4636-8429-72eff2be4b4f	Docker	DevOps	82	t	2026-01-19 16:42:50.651
80893a04-813c-484d-9e4f-3c53ff057999	Kubernetes	DevOps	78	t	2026-01-19 16:42:50.653
1f0d5456-d886-4175-a3e1-bb87722940d1	Java	Programming	85	t	2026-01-19 16:42:50.655
cdf0528f-944a-48b0-a7bc-215ebc902345	HTML	Web	85	t	2026-01-19 16:42:50.657
56749108-e64b-455f-bf20-76307d8dda77	CSS	Web	85	t	2026-01-19 16:42:50.659
2ed7e233-e6c8-486c-8266-0a539753d9b0	REST APIs	Architecture	88	t	2026-01-19 16:42:50.661
47fb42c2-a404-4cb7-a986-c55ffd29c771	MongoDB	Database	75	t	2026-01-19 16:42:50.664
8191d0c9-e34d-4c9a-833c-a84e855278f3	PostgreSQL	Database	80	t	2026-01-19 16:42:50.666
8db04d8e-79e1-450d-a4e4-e6e4c9d9037a	Linux	OS	80	t	2026-01-19 16:42:50.668
3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2	Machine Learning	AI	82	t	2026-01-19 16:42:50.67
06bae1b4-c6fc-4142-9936-f919b1732eaa	TensorFlow	AI	75	t	2026-01-19 16:42:50.672
160e9349-ac85-42f7-ade7-c369aa105a6f	PyTorch	AI	75	t	2026-01-19 16:42:50.674
dbd5f7bf-e347-47c2-9eff-598b77c58b92	Agile	Methodology	80	t	2026-01-19 16:42:50.676
ebe24dfc-42ad-4585-8a9e-991bc36e32ce	Scrum	Methodology	78	t	2026-01-19 16:42:50.678
742fd989-b3f4-4e70-90bc-d40aecfe9b22	Figma	Design	75	t	2026-01-19 16:42:50.68
77a90318-206b-47d9-b848-5fc0826a7f01	Next.js	Framework	78	t	2026-01-19 16:42:50.682
f43f5086-2801-4967-b2bc-72bbd824986f	GraphQL	API	72	t	2026-01-19 16:42:50.683
15c8be26-50a5-4db2-a79a-d65db912ea12	Excel	Tool	90	t	2026-01-19 16:42:50.685
613de450-5db2-41df-9a82-3e9f8c7deb59	Statistics	Data	85	t	2026-01-19 16:42:50.687
7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e	Tableau	Tool	88	t	2026-01-19 16:42:50.689
da4b90a3-d6e0-49bf-8277-0e73358a8fc9	Power BI	Tool	87	t	2026-01-19 16:42:50.691
30788882-2a1b-4c76-a027-ffbcab0d17e9	R	Programming	80	t	2026-01-19 16:42:50.693
39068856-8c6c-413c-8113-e3428738ecf3	Pandas	Data	92	t	2026-01-19 16:42:50.695
33414997-9c16-420f-9e13-2fdc3f613ea0	Data Visualization	Data	88	t	2026-01-19 16:42:50.697
148aaa3c-c319-4b91-be36-c18b111c598e	Data Modeling	Data	85	t	2026-01-19 16:42:50.704
ddeed26d-cf2c-4192-89ec-efe49a06e1f2	Artificial Intelligence	AI	90	t	2026-01-19 16:42:50.706
729b3b7e-4804-4eeb-a69b-3ad36d336ea5	C	Programming	75	t	2026-01-19 16:42:50.707
1001daa3-af50-4d62-a8e0-07b6bba31aff	C++	Programming	78	t	2026-01-19 16:42:50.71
8f5dd442-70c8-49f1-b867-cadec10e9412	Go	Programming	80	t	2026-01-19 16:42:50.712
2c344fa7-edd0-44f9-966c-852055c44112	Rust	Programming	72	t	2026-01-19 16:42:50.714
49bd7e04-5cb2-40bd-a703-0bbc6368703f	Feature Engineering	Data	82	t	2026-01-19 16:42:50.715
8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d	NumPy	Data	85	t	2026-01-19 16:42:50.717
04d478b4-c1d0-4b0a-b75c-3b339c4fef8f	Scikit-learn	AI	80	t	2026-01-19 16:42:50.719
2618e1cf-127d-4dd1-b772-77be1df7f091	Deep Learning	AI	85	t	2026-01-19 16:42:50.722
03064e4f-1205-4e67-98ca-b6373f0a4b55	Natural Language Processing	AI	78	t	2026-01-19 16:42:50.724
45d8f8c2-703b-4905-8dff-e37e23726151	Computer Vision	AI	75	t	2026-01-19 16:42:50.728
5a9e25a1-6da1-4288-8951-bc8060a9127e	Generative AI	AI	92	t	2026-01-19 16:42:50.73
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.subscription_plans (id, name, display_name, price_monthly, price_yearly, features, razorpay_plan_id, is_active, sort_order, created_at) FROM stdin;
92114d38-2c66-4615-9e0b-d47e0f2fce8f	free	Free	0.00	0.00	{"jobAlerts": false, "interviews": 1, "skillTests": 3, "resumeReviews": 3, "prioritySupport": false}	\N	t	0	2026-01-19 16:42:52.14
ce7a7e8a-a5e7-4995-9326-33456afdfec4	starter	Starter	299.00	2499.00	{"jobAlerts": true, "interviews": 5, "skillTests": 10, "resumeReviews": 15, "prioritySupport": false}	\N	t	1	2026-01-19 16:42:52.145
d8af1fea-2b40-47b0-91a3-89abcd8b3212	pro	Pro	799.00	6999.00	{"jobAlerts": true, "interviews": 20, "skillTests": "unlimited", "resumeReviews": "unlimited", "prioritySupport": true}	\N	t	2	2026-01-19 16:42:52.146
428fa24f-faca-4cb0-b87d-5612f82af0e5	enterprise	Enterprise	1999.00	17999.00	{"apiAccess": true, "jobAlerts": true, "interviews": "unlimited", "skillTests": "unlimited", "resumeReviews": "unlimited", "prioritySupport": true}	\N	t	3	2026-01-19 16:42:52.148
\.


--
-- Data for Name: test_attempts; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.test_attempts (id, user_id, test_id, score, passed, answers, started_at, completed_at) FROM stdin;
\.


--
-- Data for Name: test_questions; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.test_questions (id, test_id, question_text, question_type, options, correct_answer, explanation, points, order_index) FROM stdin;
q-test-034bc207-f78b-4165-9d29-4b609af84226-EASY-1	test-034bc207-f78b-4165-9d29-4b609af84226-EASY	What is the output of: typeof null?	mcq	["null", "undefined", "object", "number"]	object	\N	1	1
q-test-034bc207-f78b-4165-9d29-4b609af84226-EASY-2	test-034bc207-f78b-4165-9d29-4b609af84226-EASY	Which method adds an element to the end of an array?	mcq	["push()", "pop()", "shift()", "unshift()"]	push()	\N	1	2
q-test-034bc207-f78b-4165-9d29-4b609af84226-EASY-3	test-034bc207-f78b-4165-9d29-4b609af84226-EASY	What does === mean in JavaScript?	mcq	["Assignment", "Equality", "Strict equality", "Comparison"]	Strict equality	\N	1	3
q-test-034bc207-f78b-4165-9d29-4b609af84226-EASY-4	test-034bc207-f78b-4165-9d29-4b609af84226-EASY	Which keyword declares a block-scoped variable?	mcq	["var", "let", "const", "Both let and const"]	Both let and const	\N	1	4
q-test-034bc207-f78b-4165-9d29-4b609af84226-MEDIUM-5	test-034bc207-f78b-4165-9d29-4b609af84226-MEDIUM	What is a closure in JavaScript?	mcq	["A loop", "A function with access to outer scope", "An object", "An error"]	A function with access to outer scope	\N	1	5
q-test-034bc207-f78b-4165-9d29-4b609af84226-MEDIUM-6	test-034bc207-f78b-4165-9d29-4b609af84226-MEDIUM	Which method converts JSON string to object?	mcq	["JSON.stringify()", "JSON.parse()", "JSON.convert()", "JSON.object()"]	JSON.parse()	\N	1	6
q-test-034bc207-f78b-4165-9d29-4b609af84226-MEDIUM-7	test-034bc207-f78b-4165-9d29-4b609af84226-MEDIUM	What does async/await handle?	mcq	["Loops", "Promises", "Objects", "Arrays"]	Promises	\N	1	7
q-test-034bc207-f78b-4165-9d29-4b609af84226-HARD-8	test-034bc207-f78b-4165-9d29-4b609af84226-HARD	Which is NOT a JavaScript data type?	mcq	["string", "boolean", "float", "symbol"]	float	\N	1	8
q-test-034bc207-f78b-4165-9d29-4b609af84226-HARD-9	test-034bc207-f78b-4165-9d29-4b609af84226-HARD	What is the spread operator?	mcq	["...", "..", "***", "+++"]	...	\N	1	9
q-test-034bc207-f78b-4165-9d29-4b609af84226-HARD-10	test-034bc207-f78b-4165-9d29-4b609af84226-HARD	Which method creates a new array with filtered elements?	mcq	["map()", "filter()", "reduce()", "forEach()"]	filter()	\N	1	10
q-test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-EASY-1	test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-EASY	How do you create a list in Python?	mcq	["{}", "[]", "()", "<>"]	[]	\N	1	1
q-test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-EASY-2	test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-EASY	What keyword defines a function?	mcq	["function", "def", "func", "define"]	def	\N	1	2
q-test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-EASY-3	test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-EASY	Which is used for comments in Python?	mcq	["//", "/* */", "#", "--"]	#	\N	1	3
q-test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-EASY-4	test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-EASY	What is the output of: 3 ** 2?	mcq	["6", "9", "5", "1"]	9	\N	1	4
q-test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-MEDIUM-5	test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-MEDIUM	Which method adds an item to a list?	mcq	["add()", "append()", "push()", "insert()"]	append()	\N	1	5
q-test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-MEDIUM-6	test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-MEDIUM	What is a dictionary in Python?	mcq	["Ordered list", "Key-value pairs", "Tuple", "Set"]	Key-value pairs	\N	1	6
q-test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-MEDIUM-7	test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-MEDIUM	How do you start a for loop?	mcq	["for i in range():", "for (i=0):", "for i:", "loop i in:"]	for i in range():	\N	1	7
q-test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-HARD-8	test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-HARD	What does len() return?	mcq	["Type", "Length", "Sum", "Index"]	Length	\N	1	8
q-test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-HARD-9	test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-HARD	Which keyword is used for exception handling?	mcq	["catch", "try", "except", "Both try and except"]	Both try and except	\N	1	9
q-test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-HARD-10	test-c0398fc8-2709-47d0-b402-a6fdb0871b7c-HARD	What is self in a class method?	mcq	["A keyword", "Reference to instance", "A variable", "A function"]	Reference to instance	\N	1	10
q-test-887d4d29-a82f-4375-8f9d-37f06e38e07d-EASY-1	test-887d4d29-a82f-4375-8f9d-37f06e38e07d-EASY	What is JSX?	mcq	["A JavaScript library", "Syntax extension for JavaScript", "A CSS framework", "A database"]	Syntax extension for JavaScript	\N	1	1
q-test-887d4d29-a82f-4375-8f9d-37f06e38e07d-EASY-2	test-887d4d29-a82f-4375-8f9d-37f06e38e07d-EASY	Which hook manages state in functional components?	mcq	["useEffect", "useState", "useContext", "useRef"]	useState	\N	1	2
q-test-887d4d29-a82f-4375-8f9d-37f06e38e07d-EASY-3	test-887d4d29-a82f-4375-8f9d-37f06e38e07d-EASY	What does useEffect do?	mcq	["Manages state", "Handles side effects", "Creates context", "Optimizes rendering"]	Handles side effects	\N	1	3
q-test-887d4d29-a82f-4375-8f9d-37f06e38e07d-EASY-4	test-887d4d29-a82f-4375-8f9d-37f06e38e07d-EASY	How do you pass data to a child component?	mcq	["State", "Props", "Context", "Refs"]	Props	\N	1	4
q-test-887d4d29-a82f-4375-8f9d-37f06e38e07d-MEDIUM-5	test-887d4d29-a82f-4375-8f9d-37f06e38e07d-MEDIUM	What is the Virtual DOM?	mcq	["The actual DOM", "A lightweight copy of the DOM", "A CSS framework", "A database"]	A lightweight copy of the DOM	\N	1	5
q-test-887d4d29-a82f-4375-8f9d-37f06e38e07d-MEDIUM-6	test-887d4d29-a82f-4375-8f9d-37f06e38e07d-MEDIUM	Which method renders a React component?	mcq	["React.render()", "ReactDOM.render()", "Component.render()", "App.render()"]	ReactDOM.render()	\N	1	6
q-test-887d4d29-a82f-4375-8f9d-37f06e38e07d-MEDIUM-7	test-887d4d29-a82f-4375-8f9d-37f06e38e07d-MEDIUM	What is the purpose of keys in React lists?	mcq	["Styling", "Unique identification", "Event handling", "State management"]	Unique identification	\N	1	7
q-test-887d4d29-a82f-4375-8f9d-37f06e38e07d-HARD-8	test-887d4d29-a82f-4375-8f9d-37f06e38e07d-HARD	How do you create a React app?	mcq	["npm init react", "npx create-react-app", "npm react-new", "create react-app"]	npx create-react-app	\N	1	8
q-test-887d4d29-a82f-4375-8f9d-37f06e38e07d-HARD-9	test-887d4d29-a82f-4375-8f9d-37f06e38e07d-HARD	What is a React Fragment?	mcq	["A component without DOM node", "A style component", "An error boundary", "A hook"]	A component without DOM node	\N	1	9
q-test-887d4d29-a82f-4375-8f9d-37f06e38e07d-HARD-10	test-887d4d29-a82f-4375-8f9d-37f06e38e07d-HARD	Which hook shares data between components?	mcq	["useState", "useEffect", "useContext", "useMemo"]	useContext	\N	1	10
q-test-7f43aec2-9894-49a5-85ab-977578c6dab7-EASY-1	test-7f43aec2-9894-49a5-85ab-977578c6dab7-EASY	What is Node.js?	mcq	["A framework", "A JS runtime", "A database", "A language"]	A JS runtime	\N	1	1
q-test-7f43aec2-9894-49a5-85ab-977578c6dab7-EASY-2	test-7f43aec2-9894-49a5-85ab-977578c6dab7-EASY	Which module handles file I/O?	mcq	["fs", "http", "path", "os"]	fs	\N	1	2
q-test-7f43aec2-9894-49a5-85ab-977578c6dab7-EASY-3	test-7f43aec2-9894-49a5-85ab-977578c6dab7-EASY	What is the package manager for Node?	mcq	["npm", "npx", "node-pkg", "yarn"]	npm	\N	1	3
q-test-7f43aec2-9894-49a5-85ab-977578c6dab7-EASY-4	test-7f43aec2-9894-49a5-85ab-977578c6dab7-EASY	What is the Event Loop?	mcq	["Handling async callbacks", "A for loop", "A database query", "An error handler"]	Handling async callbacks	\N	1	4
q-test-7f43aec2-9894-49a5-85ab-977578c6dab7-MEDIUM-5	test-7f43aec2-9894-49a5-85ab-977578c6dab7-MEDIUM	Which framework is built on Node?	mcq	["Django", "Laravel", "Express", "Spring"]	Express	\N	1	5
q-test-7f43aec2-9894-49a5-85ab-977578c6dab7-MEDIUM-6	test-7f43aec2-9894-49a5-85ab-977578c6dab7-MEDIUM	How do you export a module?	mcq	["module.exports", "export default", "exports.module", "return module"]	module.exports	\N	1	6
q-test-7f43aec2-9894-49a5-85ab-977578c6dab7-MEDIUM-7	test-7f43aec2-9894-49a5-85ab-977578c6dab7-MEDIUM	What is a Stream?	mcq	["Data handling method", "A video", "A database", "A loop"]	Data handling method	\N	1	7
q-test-7f43aec2-9894-49a5-85ab-977578c6dab7-HARD-8	test-7f43aec2-9894-49a5-85ab-977578c6dab7-HARD	Which object is global in Node?	mcq	["window", "files", "process", "document"]	process	\N	1	8
q-test-7f43aec2-9894-49a5-85ab-977578c6dab7-HARD-9	test-7f43aec2-9894-49a5-85ab-977578c6dab7-HARD	What manages dependencies?	mcq	["package.json", "node_modules", "index.js", "npm.log"]	package.json	\N	1	9
q-test-7f43aec2-9894-49a5-85ab-977578c6dab7-HARD-10	test-7f43aec2-9894-49a5-85ab-977578c6dab7-HARD	What is middleware?	mcq	["Software glue", "Hardware", "Database", "Frontend"]	Software glue	\N	1	10
q-test-0136902f-234b-4e70-a435-02a6eb6717a3-EASY-1	test-0136902f-234b-4e70-a435-02a6eb6717a3-EASY	What is TypeScript?	mcq	["Superset of JS", "New language", "Database", "Framework"]	Superset of JS	\N	1	1
q-test-0136902f-234b-4e70-a435-02a6eb6717a3-EASY-2	test-0136902f-234b-4e70-a435-02a6eb6717a3-EASY	How do you define a type?	mcq	["type X = {}", "def X", "var X", "class X"]	type X = {}	\N	1	2
q-test-0136902f-234b-4e70-a435-02a6eb6717a3-EASY-3	test-0136902f-234b-4e70-a435-02a6eb6717a3-EASY	What is an Interface?	mcq	["Contract for object shape", "A class", "A function", "A variable"]	Contract for object shape	\N	1	3
q-test-0136902f-234b-4e70-a435-02a6eb6717a3-EASY-4	test-0136902f-234b-4e70-a435-02a6eb6717a3-EASY	Does TypeScript run in the browser?	mcq	["No, it transpiles", "Yes directly", "Only in Chrome", "Only with React"]	No, it transpiles	\N	1	4
q-test-0136902f-234b-4e70-a435-02a6eb6717a3-MEDIUM-5	test-0136902f-234b-4e70-a435-02a6eb6717a3-MEDIUM	What is "any" type?	mcq	["Disable type checking", "A string", "A number", "An object"]	Disable type checking	\N	1	5
q-test-0136902f-234b-4e70-a435-02a6eb6717a3-MEDIUM-6	test-0136902f-234b-4e70-a435-02a6eb6717a3-MEDIUM	What file extension is used?	mcq	[".ts", ".js", ".jsx", ".tsx"]	.ts	\N	1	6
q-test-0136902f-234b-4e70-a435-02a6eb6717a3-MEDIUM-7	test-0136902f-234b-4e70-a435-02a6eb6717a3-MEDIUM	How to make a property optional?	mcq	["prop?", "prop!", "optional prop", "*prop"]	prop?	\N	1	7
q-test-0136902f-234b-4e70-a435-02a6eb6717a3-HARD-8	test-0136902f-234b-4e70-a435-02a6eb6717a3-HARD	What is a Generic?	mcq	["Reusable component type", "A function", "A class", "A variable"]	Reusable component type	\N	1	8
q-test-0136902f-234b-4e70-a435-02a6eb6717a3-HARD-9	test-0136902f-234b-4e70-a435-02a6eb6717a3-HARD	Can you use JS libraries in TS?	mcq	["Yes", "No", "Only React", "Only Node"]	Yes	\N	1	9
q-test-0136902f-234b-4e70-a435-02a6eb6717a3-HARD-10	test-0136902f-234b-4e70-a435-02a6eb6717a3-HARD	What is a Union Type?	mcq	["Value can be A or B", "Joining strings", "Merging arrays", "A class"]	Value can be A or B	\N	1	10
q-test-499e6630-c332-45b7-9e73-eb50a87f02ba-EASY-1	test-499e6630-c332-45b7-9e73-eb50a87f02ba-EASY	What does SQL stand for?	mcq	["Structured Query Language", "Simple Query Language", "Standard Query Language", "System Query Language"]	Structured Query Language	\N	1	1
q-test-499e6630-c332-45b7-9e73-eb50a87f02ba-EASY-2	test-499e6630-c332-45b7-9e73-eb50a87f02ba-EASY	Which clause filters rows?	mcq	["SELECT", "FROM", "WHERE", "ORDER BY"]	WHERE	\N	1	2
q-test-499e6630-c332-45b7-9e73-eb50a87f02ba-EASY-3	test-499e6630-c332-45b7-9e73-eb50a87f02ba-EASY	Which JOIN returns all rows from both tables?	mcq	["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"]	FULL OUTER JOIN	\N	1	3
q-test-499e6630-c332-45b7-9e73-eb50a87f02ba-EASY-4	test-499e6630-c332-45b7-9e73-eb50a87f02ba-EASY	What does GROUP BY do?	mcq	["Sorts results", "Groups rows with same values", "Filters rows", "Joins tables"]	Groups rows with same values	\N	1	4
q-test-499e6630-c332-45b7-9e73-eb50a87f02ba-MEDIUM-5	test-499e6630-c332-45b7-9e73-eb50a87f02ba-MEDIUM	Which function counts rows?	mcq	["SUM()", "COUNT()", "AVG()", "MAX()"]	COUNT()	\N	1	5
q-test-499e6630-c332-45b7-9e73-eb50a87f02ba-MEDIUM-6	test-499e6630-c332-45b7-9e73-eb50a87f02ba-MEDIUM	What is a PRIMARY KEY?	mcq	["A foreign reference", "Unique identifier for a row", "An index", "A constraint"]	Unique identifier for a row	\N	1	6
q-test-499e6630-c332-45b7-9e73-eb50a87f02ba-MEDIUM-7	test-499e6630-c332-45b7-9e73-eb50a87f02ba-MEDIUM	Which command adds new rows?	mcq	["UPDATE", "INSERT", "CREATE", "ALTER"]	INSERT	\N	1	7
q-test-499e6630-c332-45b7-9e73-eb50a87f02ba-HARD-8	test-499e6630-c332-45b7-9e73-eb50a87f02ba-HARD	What does DISTINCT do?	mcq	["Sorts results", "Removes duplicates", "Filters null", "Joins tables"]	Removes duplicates	\N	1	8
q-test-499e6630-c332-45b7-9e73-eb50a87f02ba-HARD-9	test-499e6630-c332-45b7-9e73-eb50a87f02ba-HARD	Which clause sorts results?	mcq	["GROUP BY", "HAVING", "ORDER BY", "WHERE"]	ORDER BY	\N	1	9
q-test-499e6630-c332-45b7-9e73-eb50a87f02ba-HARD-10	test-499e6630-c332-45b7-9e73-eb50a87f02ba-HARD	What is a FOREIGN KEY?	mcq	["Primary identifier", "Reference to another table", "An index", "A function"]	Reference to another table	\N	1	10
q-test-a6ea686a-6686-4835-bc1b-caf312b35139-EASY-1	test-a6ea686a-6686-4835-bc1b-caf312b35139-EASY	Which command initializes a repository?	mcq	["git init", "git start", "git new", "git create"]	git init	\N	1	1
q-test-a6ea686a-6686-4835-bc1b-caf312b35139-EASY-2	test-a6ea686a-6686-4835-bc1b-caf312b35139-EASY	How do you stage files?	mcq	["git add", "git stage", "git commit", "git push"]	git add	\N	1	2
q-test-a6ea686a-6686-4835-bc1b-caf312b35139-EASY-3	test-a6ea686a-6686-4835-bc1b-caf312b35139-EASY	How do you save changes?	mcq	["git save", "git commit", "git store", "git lock"]	git commit	\N	1	3
q-test-a6ea686a-6686-4835-bc1b-caf312b35139-EASY-4	test-a6ea686a-6686-4835-bc1b-caf312b35139-EASY	Which command downloads from remote?	mcq	["git pull", "git push", "git down", "git get"]	git pull	\N	1	4
q-test-a6ea686a-6686-4835-bc1b-caf312b35139-MEDIUM-5	test-a6ea686a-6686-4835-bc1b-caf312b35139-MEDIUM	What is a branch?	mcq	["A parallel version of code", "A bug", "A folder", "A server"]	A parallel version of code	\N	1	5
q-test-a6ea686a-6686-4835-bc1b-caf312b35139-MEDIUM-6	test-a6ea686a-6686-4835-bc1b-caf312b35139-MEDIUM	How do you merge branches?	mcq	["git merge", "git join", "git combine", "git mix"]	git merge	\N	1	6
q-test-a6ea686a-6686-4835-bc1b-caf312b35139-MEDIUM-7	test-a6ea686a-6686-4835-bc1b-caf312b35139-MEDIUM	What checks the status of files?	mcq	["git status", "git check", "git info", "git state"]	git status	\N	1	7
q-test-a6ea686a-6686-4835-bc1b-caf312b35139-HARD-8	test-a6ea686a-6686-4835-bc1b-caf312b35139-HARD	what is .gitignore?	mcq	["Files to ignore", "Files to include", "Settings", "Log file"]	Files to ignore	\N	1	8
q-test-a6ea686a-6686-4835-bc1b-caf312b35139-HARD-9	test-a6ea686a-6686-4835-bc1b-caf312b35139-HARD	What is HEAD?	mcq	["The current commit", "The first commit", "The main branch", "The server"]	The current commit	\N	1	9
q-test-a6ea686a-6686-4835-bc1b-caf312b35139-HARD-10	test-a6ea686a-6686-4835-bc1b-caf312b35139-HARD	How do you view history?	mcq	["git log", "git history", "git timeline", "git past"]	git log	\N	1	10
q-test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-EASY-1	test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-EASY	What is EC2?	mcq	["Virtual server", "Storage", "Database", "DNS"]	Virtual server	\N	1	1
q-test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-EASY-2	test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-EASY	What is S3?	mcq	["Object storage", "Server", "Database", "Queue"]	Object storage	\N	1	2
q-test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-EASY-3	test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-EASY	What is Lambda?	mcq	["Serverless compute", "Database", "Storage", "Network"]	Serverless compute	\N	1	3
q-test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-EASY-4	test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-EASY	What defines infrastructure as code?	mcq	["CloudFormation", "EC2", "S3", "IAM"]	CloudFormation	\N	1	4
q-test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-MEDIUM-5	test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-MEDIUM	What service manages users?	mcq	["IAM", "EC2", "S3", "RDS"]	IAM	\N	1	5
q-test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-MEDIUM-6	test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-MEDIUM	What is RDS?	mcq	["Relational Database Service", "Remote Data Server", "Raw Data Storage", "Realtime Data System"]	Relational Database Service	\N	1	6
q-test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-MEDIUM-7	test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-MEDIUM	What connects VPCs?	mcq	["Peering", "Connecting", "Linking", "Joining"]	Peering	\N	1	7
q-test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-HARD-8	test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-HARD	What is CloudWatch?	mcq	["Monitoring service", "Storage", "Compute", "Database"]	Monitoring service	\N	1	8
q-test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-HARD-9	test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-HARD	What is a Region?	mcq	["Geographic area", "A city", "A building", "A server"]	Geographic area	\N	1	9
q-test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-HARD-10	test-90a1bd3d-5e51-4f87-89bf-66c98cf5737c-HARD	What is Auto Scaling?	mcq	["Adjusting capacity automatically", "manual resizing", "fixed size", "database index"]	Adjusting capacity automatically	\N	1	10
q-test-119283d7-711d-4636-8429-72eff2be4b4f-EASY-1	test-119283d7-711d-4636-8429-72eff2be4b4f-EASY	What is a container?	mcq	["Isolated execution env", "A virtual machine", "A folder", "A disk"]	Isolated execution env	\N	1	1
q-test-119283d7-711d-4636-8429-72eff2be4b4f-EASY-2	test-119283d7-711d-4636-8429-72eff2be4b4f-EASY	What creates a docker image?	mcq	["Dockerfile", "Imagefile", "Buildfile", "Containerfile"]	Dockerfile	\N	1	2
q-test-119283d7-711d-4636-8429-72eff2be4b4f-EASY-3	test-119283d7-711d-4636-8429-72eff2be4b4f-EASY	Which command lists containers?	mcq	["docker ps", "docker list", "docker show", "docker ls"]	docker ps	\N	1	3
q-test-119283d7-711d-4636-8429-72eff2be4b4f-EASY-4	test-119283d7-711d-4636-8429-72eff2be4b4f-EASY	What downloads images?	mcq	["docker pull", "docker get", "docker fetch", "docker down"]	docker pull	\N	1	4
q-test-119283d7-711d-4636-8429-72eff2be4b4f-MEDIUM-5	test-119283d7-711d-4636-8429-72eff2be4b4f-MEDIUM	What is Docker Compose?	mcq	["Multi-container tool", "Image builder", "Network tool", "Storage tool"]	Multi-container tool	\N	1	5
q-test-119283d7-711d-4636-8429-72eff2be4b4f-MEDIUM-6	test-119283d7-711d-4636-8429-72eff2be4b4f-MEDIUM	Where are images stored?	mcq	["Registry", "Folder", "Database", "Cloud"]	Registry	\N	1	6
q-test-119283d7-711d-4636-8429-72eff2be4b4f-MEDIUM-7	test-119283d7-711d-4636-8429-72eff2be4b4f-MEDIUM	What command removes a container?	mcq	["docker rm", "docker del", "docker remove", "docker kill"]	docker rm	\N	1	7
q-test-119283d7-711d-4636-8429-72eff2be4b4f-HARD-8	test-119283d7-711d-4636-8429-72eff2be4b4f-HARD	What is a Volume?	mcq	["Persistent data storage", "Sound level", "Network speed", "CPU usage"]	Persistent data storage	\N	1	8
q-test-119283d7-711d-4636-8429-72eff2be4b4f-HARD-9	test-119283d7-711d-4636-8429-72eff2be4b4f-HARD	What is the default registry?	mcq	["Docker Hub", "GitHub", "AWS", "Google"]	Docker Hub	\N	1	9
q-test-119283d7-711d-4636-8429-72eff2be4b4f-HARD-10	test-119283d7-711d-4636-8429-72eff2be4b4f-HARD	Which flag runs detached?	mcq	["-d", "-r", "-a", "-x"]	-d	\N	1	10
q-test-80893a04-813c-484d-9e4f-3c53ff057999-EASY-1	test-80893a04-813c-484d-9e4f-3c53ff057999-EASY	What is a Pod?	mcq	["Smallest deployable unit", "A container", "A server", "A volume"]	Smallest deployable unit	\N	1	1
q-test-80893a04-813c-484d-9e4f-3c53ff057999-EASY-2	test-80893a04-813c-484d-9e4f-3c53ff057999-EASY	What manages the cluster?	mcq	["Master/Control Plane", "Worker Node", "Pod", "Service"]	Master/Control Plane	\N	1	2
q-test-80893a04-813c-484d-9e4f-3c53ff057999-EASY-3	test-80893a04-813c-484d-9e4f-3c53ff057999-EASY	Which tool interacts with K8s?	mcq	["kubectl", "k8s-cli", "kube-tool", "docker"]	kubectl	\N	1	3
q-test-80893a04-813c-484d-9e4f-3c53ff057999-EASY-4	test-80893a04-813c-484d-9e4f-3c53ff057999-EASY	What is a Service?	mcq	["Network abstraction", "A pod", "A volume", "A deployment"]	Network abstraction	\N	1	4
q-test-80893a04-813c-484d-9e4f-3c53ff057999-MEDIUM-5	test-80893a04-813c-484d-9e4f-3c53ff057999-MEDIUM	What defines desired state?	mcq	["YAML Manifest", "JSON file", "Text file", "Script"]	YAML Manifest	\N	1	5
q-test-80893a04-813c-484d-9e4f-3c53ff057999-MEDIUM-6	test-80893a04-813c-484d-9e4f-3c53ff057999-MEDIUM	What is a ReplicaSet?	mcq	["Ensures pod count", "Data copy", "Network set", "Storage set"]	Ensures pod count	\N	1	6
q-test-80893a04-813c-484d-9e4f-3c53ff057999-MEDIUM-7	test-80893a04-813c-484d-9e4f-3c53ff057999-MEDIUM	What is a Namespace?	mcq	["Logical cluster partition", "A name", "A file", "A tag"]	Logical cluster partition	\N	1	7
q-test-80893a04-813c-484d-9e4f-3c53ff057999-HARD-8	test-80893a04-813c-484d-9e4f-3c53ff057999-HARD	What is Minikube?	mcq	["Local K8s cluster", "Small pod", "Mini container", "Network tool"]	Local K8s cluster	\N	1	8
q-test-80893a04-813c-484d-9e4f-3c53ff057999-HARD-9	test-80893a04-813c-484d-9e4f-3c53ff057999-HARD	What is Ingress?	mcq	["External access to services", "Internal network", "Storage", "Compute"]	External access to services	\N	1	9
q-test-80893a04-813c-484d-9e4f-3c53ff057999-HARD-10	test-80893a04-813c-484d-9e4f-3c53ff057999-HARD	What is Helm?	mcq	["Package manager", "Ship wheel", "Network tool", "Monitor"]	Package manager	\N	1	10
q-test-1f0d5456-d886-4175-a3e1-bb87722940d1-EASY-1	test-1f0d5456-d886-4175-a3e1-bb87722940d1-EASY	What is the JVM?	mcq	["Java Virtual Machine", "Java Visual Mode", "Java Variable Manager", "Java Video Maker"]	Java Virtual Machine	\N	1	1
q-test-1f0d5456-d886-4175-a3e1-bb87722940d1-EASY-2	test-1f0d5456-d886-4175-a3e1-bb87722940d1-EASY	Which keyword inherits a class?	mcq	["extends", "implements", "inherits", "uses"]	extends	\N	1	2
q-test-1f0d5456-d886-4175-a3e1-bb87722940d1-EASY-3	test-1f0d5456-d886-4175-a3e1-bb87722940d1-EASY	What is an Interface?	mcq	["Abstract type", "A class", "A variable", "A loop"]	Abstract type	\N	1	3
q-test-1f0d5456-d886-4175-a3e1-bb87722940d1-EASY-4	test-1f0d5456-d886-4175-a3e1-bb87722940d1-EASY	What is the entry point?	mcq	["public static void main", "start()", "init()", "run()"]	public static void main	\N	1	4
q-test-1f0d5456-d886-4175-a3e1-bb87722940d1-MEDIUM-5	test-1f0d5456-d886-4175-a3e1-bb87722940d1-MEDIUM	Are strings mutable?	mcq	["No", "Yes", "Sometimes", "Only generic"]	No	\N	1	5
q-test-1f0d5456-d886-4175-a3e1-bb87722940d1-MEDIUM-6	test-1f0d5456-d886-4175-a3e1-bb87722940d1-MEDIUM	What manages memory?	mcq	["Garbage Collector", "Programmer", "OS", "CPU"]	Garbage Collector	\N	1	6
q-test-1f0d5456-d886-4175-a3e1-bb87722940d1-MEDIUM-7	test-1f0d5456-d886-4175-a3e1-bb87722940d1-MEDIUM	Which collection has unique items?	mcq	["Set", "List", "Map", "Array"]	Set	\N	1	7
q-test-1f0d5456-d886-4175-a3e1-bb87722940d1-HARD-8	test-1f0d5456-d886-4175-a3e1-bb87722940d1-HARD	What is overloading?	mcq	["Same name diff parameters", "Same name same parameters", "Overriding", "Hiding"]	Same name diff parameters	\N	1	8
q-test-1f0d5456-d886-4175-a3e1-bb87722940d1-HARD-9	test-1f0d5456-d886-4175-a3e1-bb87722940d1-HARD	What is a package?	mcq	["Group of classes", "A box", "A variable", "A function"]	Group of classes	\N	1	9
q-test-1f0d5456-d886-4175-a3e1-bb87722940d1-HARD-10	test-1f0d5456-d886-4175-a3e1-bb87722940d1-HARD	Which is NOT a primitive?	mcq	["String", "int", "boolean", "char"]	String	\N	1	10
q-test-cdf0528f-944a-48b0-a7bc-215ebc902345-EASY-1	test-cdf0528f-944a-48b0-a7bc-215ebc902345-EASY	What does HTML stand for?	mcq	["Hyper Text Markup Language", "Hyperlinks and Text Markup Language", "Home Tool Markup Language", "Hyper Text Meta Language"]	Hyper Text Markup Language	\N	1	1
q-test-cdf0528f-944a-48b0-a7bc-215ebc902345-EASY-2	test-cdf0528f-944a-48b0-a7bc-215ebc902345-EASY	Which tag creates a link?	mcq	["<a>", "<link>", "<href>", "<url>"]	<a>	\N	1	2
q-test-cdf0528f-944a-48b0-a7bc-215ebc902345-EASY-3	test-cdf0528f-944a-48b0-a7bc-215ebc902345-EASY	Which is the largest heading?	mcq	["<h1>", "<h6>", "<head>", "<heading>"]	<h1>	\N	1	3
q-test-cdf0528f-944a-48b0-a7bc-215ebc902345-EASY-4	test-cdf0528f-944a-48b0-a7bc-215ebc902345-EASY	What is the correct tag for specific image?	mcq	["<img>", "<image>", "<picture>", "<pic>"]	<img>	\N	1	4
q-test-cdf0528f-944a-48b0-a7bc-215ebc902345-MEDIUM-5	test-cdf0528f-944a-48b0-a7bc-215ebc902345-MEDIUM	Which list is unordered?	mcq	["<ul>", "<ol>", "<li>", "<list>"]	<ul>	\N	1	5
q-test-cdf0528f-944a-48b0-a7bc-215ebc902345-MEDIUM-6	test-cdf0528f-944a-48b0-a7bc-215ebc902345-MEDIUM	What attribute creates a tooltip?	mcq	["title", "alt", "src", "href"]	title	\N	1	6
q-test-cdf0528f-944a-48b0-a7bc-215ebc902345-MEDIUM-7	test-cdf0528f-944a-48b0-a7bc-215ebc902345-MEDIUM	Which tag makes a new line?	mcq	["<br>", "<lb>", "<nl>", "<break>"]	<br>	\N	1	7
q-test-cdf0528f-944a-48b0-a7bc-215ebc902345-HARD-8	test-cdf0528f-944a-48b0-a7bc-215ebc902345-HARD	How do you make a checkbox?	mcq	["<input type=\\"checkbox\\">", "<check>", "<box>", "<input type=\\"check\\">"]	<input type="checkbox">	\N	1	8
q-test-cdf0528f-944a-48b0-a7bc-215ebc902345-HARD-9	test-cdf0528f-944a-48b0-a7bc-215ebc902345-HARD	What is the <div> element?	mcq	["A container", "A divider", "A database", "A drone"]	A container	\N	1	9
q-test-cdf0528f-944a-48b0-a7bc-215ebc902345-HARD-10	test-cdf0528f-944a-48b0-a7bc-215ebc902345-HARD	Which HTML5 element plays video?	mcq	["<video>", "<movie>", "<play>", "<media>"]	<video>	\N	1	10
q-test-56749108-e64b-455f-bf20-76307d8dda77-EASY-1	test-56749108-e64b-455f-bf20-76307d8dda77-EASY	What does CSS stand for?	mcq	["Cascading Style Sheets", "Colorful Style Sheets", "Computer Style Sheets", "Creative Style Sheets"]	Cascading Style Sheets	\N	1	1
q-test-56749108-e64b-455f-bf20-76307d8dda77-EASY-2	test-56749108-e64b-455f-bf20-76307d8dda77-EASY	How do you select an ID?	mcq	["#id", ".id", "*id", "id"]	#id	\N	1	2
q-test-56749108-e64b-455f-bf20-76307d8dda77-EASY-3	test-56749108-e64b-455f-bf20-76307d8dda77-EASY	Which property changes text color?	mcq	["color", "text-color", "font-color", "fg-color"]	color	\N	1	3
q-test-56749108-e64b-455f-bf20-76307d8dda77-EASY-4	test-56749108-e64b-455f-bf20-76307d8dda77-EASY	How do you center a div?	mcq	["margin: 0 auto", "text-align: center", "float: center", "align: center"]	margin: 0 auto	\N	1	4
q-test-56749108-e64b-455f-bf20-76307d8dda77-MEDIUM-5	test-56749108-e64b-455f-bf20-76307d8dda77-MEDIUM	What is Flexbox?	mcq	["Layout module", "A style", "A color", "A font"]	Layout module	\N	1	5
q-test-56749108-e64b-455f-bf20-76307d8dda77-MEDIUM-6	test-56749108-e64b-455f-bf20-76307d8dda77-MEDIUM	Which tag links CSS?	mcq	["<link>", "<style>", "<css>", "<script>"]	<link>	\N	1	6
q-test-56749108-e64b-455f-bf20-76307d8dda77-MEDIUM-7	test-56749108-e64b-455f-bf20-76307d8dda77-MEDIUM	What is z-index?	mcq	["Stack order", "Zoom level", "Zero index", "Zone"]	Stack order	\N	1	7
q-test-56749108-e64b-455f-bf20-76307d8dda77-HARD-8	test-56749108-e64b-455f-bf20-76307d8dda77-HARD	What is 1rem?	mcq	["Root element font size", "1 pixel", "10 pixels", "Parent font size"]	Root element font size	\N	1	8
q-test-56749108-e64b-455f-bf20-76307d8dda77-HARD-9	test-56749108-e64b-455f-bf20-76307d8dda77-HARD	How to make text bold?	mcq	["font-weight: bold", "text-style: bold", "font: bold", "style: bold"]	font-weight: bold	\N	1	9
q-test-56749108-e64b-455f-bf20-76307d8dda77-HARD-10	test-56749108-e64b-455f-bf20-76307d8dda77-HARD	What is the Box Model?	mcq	["Margin, Border, Padding, Content", "Box sizing", "Layout", "Grid"]	Margin, Border, Padding, Content	\N	1	10
q-test-2ed7e233-e6c8-486c-8266-0a539753d9b0-EASY-1	test-2ed7e233-e6c8-486c-8266-0a539753d9b0-EASY	What does REST stand for?	mcq	["Representational State Transfer", "Remote State Transfer", "Real State Transfer", "Rapid State Transfer"]	Representational State Transfer	\N	1	1
q-test-2ed7e233-e6c8-486c-8266-0a539753d9b0-EASY-2	test-2ed7e233-e6c8-486c-8266-0a539753d9b0-EASY	Which method retrieves data?	mcq	["GET", "POST", "PUT", "DELETE"]	GET	\N	1	2
q-test-2ed7e233-e6c8-486c-8266-0a539753d9b0-EASY-3	test-2ed7e233-e6c8-486c-8266-0a539753d9b0-EASY	Which method creates data?	mcq	["POST", "GET", "PUT", "DELETE"]	POST	\N	1	3
q-test-2ed7e233-e6c8-486c-8266-0a539753d9b0-EASY-4	test-2ed7e233-e6c8-486c-8266-0a539753d9b0-EASY	What is a 200 status code?	mcq	["OK", "Error", "Not Found", "Created"]	OK	\N	1	4
q-test-2ed7e233-e6c8-486c-8266-0a539753d9b0-MEDIUM-5	test-2ed7e233-e6c8-486c-8266-0a539753d9b0-MEDIUM	What is a 404 status code?	mcq	["Not Found", "OK", "Error", "Forbidden"]	Not Found	\N	1	5
q-test-2ed7e233-e6c8-486c-8266-0a539753d9b0-MEDIUM-6	test-2ed7e233-e6c8-486c-8266-0a539753d9b0-MEDIUM	What format is common for data?	mcq	["JSON", "XML", "HTML", "CSV"]	JSON	\N	1	6
q-test-2ed7e233-e6c8-486c-8266-0a539753d9b0-MEDIUM-7	test-2ed7e233-e6c8-486c-8266-0a539753d9b0-MEDIUM	What is an endpoint?	mcq	["URL for a resource", "A server", "A database", "A file"]	URL for a resource	\N	1	7
q-test-2ed7e233-e6c8-486c-8266-0a539753d9b0-HARD-8	test-2ed7e233-e6c8-486c-8266-0a539753d9b0-HARD	What is authentication?	mcq	["Verifying identity", "Encrypting data", "Compressing files", "Sending email"]	Verifying identity	\N	1	8
q-test-2ed7e233-e6c8-486c-8266-0a539753d9b0-HARD-9	test-2ed7e233-e6c8-486c-8266-0a539753d9b0-HARD	Which header sends a token?	mcq	["Authorization", "Authentication", "Token", "Key"]	Authorization	\N	1	9
q-test-2ed7e233-e6c8-486c-8266-0a539753d9b0-HARD-10	test-2ed7e233-e6c8-486c-8266-0a539753d9b0-HARD	What is idempotency?	mcq	["Same result multiple calls", "Fast response", "Secure call", "Error handling"]	Same result multiple calls	\N	1	10
q-test-47fb42c2-a404-4cb7-a986-c55ffd29c771-EASY-1	test-47fb42c2-a404-4cb7-a986-c55ffd29c771-EASY	What type of database is MongoDB?	mcq	["NoSQL", "SQL", "Graph", "Key-Value"]	NoSQL	\N	1	1
q-test-47fb42c2-a404-4cb7-a986-c55ffd29c771-EASY-2	test-47fb42c2-a404-4cb7-a986-c55ffd29c771-EASY	What stores data?	mcq	["Documents", "Tables", "Rows", "Sheets"]	Documents	\N	1	2
q-test-47fb42c2-a404-4cb7-a986-c55ffd29c771-EASY-3	test-47fb42c2-a404-4cb7-a986-c55ffd29c771-EASY	What format are documents?	mcq	["BSON", "JSON", "XML", "CSV"]	BSON	\N	1	3
q-test-47fb42c2-a404-4cb7-a986-c55ffd29c771-EASY-4	test-47fb42c2-a404-4cb7-a986-c55ffd29c771-EASY	Which method finds documents?	mcq	["find()", "select()", "query()", "get()"]	find()	\N	1	4
q-test-47fb42c2-a404-4cb7-a986-c55ffd29c771-MEDIUM-5	test-47fb42c2-a404-4cb7-a986-c55ffd29c771-MEDIUM	What is an _id?	mcq	["Unique identifier", "An index", "A key", "A name"]	Unique identifier	\N	1	5
q-test-47fb42c2-a404-4cb7-a986-c55ffd29c771-MEDIUM-6	test-47fb42c2-a404-4cb7-a986-c55ffd29c771-MEDIUM	What is a Collection?	mcq	["Group of documents", "A table", "A database", "A file"]	Group of documents	\N	1	6
q-test-47fb42c2-a404-4cb7-a986-c55ffd29c771-MEDIUM-7	test-47fb42c2-a404-4cb7-a986-c55ffd29c771-MEDIUM	How do you insert specific data?	mcq	["insertOne()", "add()", "put()", "create()"]	insertOne()	\N	1	7
q-test-47fb42c2-a404-4cb7-a986-c55ffd29c771-HARD-8	test-47fb42c2-a404-4cb7-a986-c55ffd29c771-HARD	What creates an index?	mcq	["createIndex()", "index()", "addIndex()", "makeIndex()"]	createIndex()	\N	1	8
q-test-47fb42c2-a404-4cb7-a986-c55ffd29c771-HARD-9	test-47fb42c2-a404-4cb7-a986-c55ffd29c771-HARD	What is Aggregation?	mcq	["Data processing pipeline", "Sorting", "Filtering", "Joining"]	Data processing pipeline	\N	1	9
q-test-47fb42c2-a404-4cb7-a986-c55ffd29c771-HARD-10	test-47fb42c2-a404-4cb7-a986-c55ffd29c771-HARD	Which is NOT a MongoDB tool?	mcq	["MySQL Workbench", "Compass", "Shell", "Atlas"]	MySQL Workbench	\N	1	10
q-test-8191d0c9-e34d-4c9a-833c-a84e855278f3-EASY-1	test-8191d0c9-e34d-4c9a-833c-a84e855278f3-EASY	What is PostgreSQL?	mcq	["Relational Database", "NoSQL", "Graph DB", "Key-Value Store"]	Relational Database	\N	1	1
q-test-8191d0c9-e34d-4c9a-833c-a84e855278f3-EASY-2	test-8191d0c9-e34d-4c9a-833c-a84e855278f3-EASY	What is pgAdmin?	mcq	["Management Tool", "A database", "A server", "A driver"]	Management Tool	\N	1	2
q-test-8191d0c9-e34d-4c9a-833c-a84e855278f3-EASY-3	test-8191d0c9-e34d-4c9a-833c-a84e855278f3-EASY	What stores JSON data?	mcq	["JSONB", "Text", "Blob", "Varchar"]	JSONB	\N	1	3
q-test-8191d0c9-e34d-4c9a-833c-a84e855278f3-EASY-4	test-8191d0c9-e34d-4c9a-833c-a84e855278f3-EASY	What handles concurrency?	mcq	["MVCC", "Locking", "Blocking", "Queuing"]	MVCC	\N	1	4
q-test-8191d0c9-e34d-4c9a-833c-a84e855278f3-MEDIUM-5	test-8191d0c9-e34d-4c9a-833c-a84e855278f3-MEDIUM	What is a Schema?	mcq	["Logical container", "A table", "A database", "A user"]	Logical container	\N	1	5
q-test-8191d0c9-e34d-4c9a-833c-a84e855278f3-MEDIUM-6	test-8191d0c9-e34d-4c9a-833c-a84e855278f3-MEDIUM	Which operator matches patterns?	mcq	["LIKE", "MATCH", "IS", "EQUALS"]	LIKE	\N	1	6
q-test-8191d0c9-e34d-4c9a-833c-a84e855278f3-MEDIUM-7	test-8191d0c9-e34d-4c9a-833c-a84e855278f3-MEDIUM	What is a foreign key?	mcq	["Referential integriy", "Primary key", "Index", "Data type"]	Referential integriy	\N	1	7
q-test-8191d0c9-e34d-4c9a-833c-a84e855278f3-HARD-8	test-8191d0c9-e34d-4c9a-833c-a84e855278f3-HARD	How to back up a DB?	mcq	["pg_dump", "backup", "export", "save"]	pg_dump	\N	1	8
q-test-8191d0c9-e34d-4c9a-833c-a84e855278f3-HARD-9	test-8191d0c9-e34d-4c9a-833c-a84e855278f3-HARD	What connects via CLI?	mcq	["psql", "postgres", "cli", "connect"]	psql	\N	1	9
q-test-8191d0c9-e34d-4c9a-833c-a84e855278f3-HARD-10	test-8191d0c9-e34d-4c9a-833c-a84e855278f3-HARD	What is an Index?	mcq	["Faster lookup structure", "A table", "A primary key", "A view"]	Faster lookup structure	\N	1	10
q-test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-EASY-1	test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-EASY	Which command lists files?	mcq	["ls", "list", "dir", "show"]	ls	\N	1	1
q-test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-EASY-2	test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-EASY	Which command changes directory?	mcq	["cd", "mv", "cp", "rm"]	cd	\N	1	2
q-test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-EASY-3	test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-EASY	What is root?	mcq	["Superuser", "A folder", "A disk", "A network"]	Superuser	\N	1	3
q-test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-EASY-4	test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-EASY	Which command shows current path?	mcq	["pwd", "cwd", "path", "where"]	pwd	\N	1	4
q-test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-MEDIUM-5	test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-MEDIUM	How to create a directory?	mcq	["mkdir", "newdir", "create", "md"]	mkdir	\N	1	5
q-test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-MEDIUM-6	test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-MEDIUM	What finds strings in files?	mcq	["grep", "find", "search", "locate"]	grep	\N	1	6
q-test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-MEDIUM-7	test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-MEDIUM	What changes permissions?	mcq	["chmod", "chown", "perm", "change"]	chmod	\N	1	7
q-test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-HARD-8	test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-HARD	What displays running processes?	mcq	["top", "list", "proc", "run"]	top	\N	1	8
q-test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-HARD-9	test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-HARD	Which symbol redirects output?	mcq	[">", "<", "|", "&"]	>	\N	1	9
q-test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-HARD-10	test-8db04d8e-79e1-450d-a4e4-e6e4c9d9037a-HARD	What is Bash?	mcq	["A shell", "A game", "A kernel", "A text editor"]	A shell	\N	1	10
q-test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-EASY-1	test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-EASY	What is supervised learning?	mcq	["Labeled data training", "Unlabeled data", "Reward based", "Clustering"]	Labeled data training	\N	1	1
q-test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-EASY-2	test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-EASY	What is unsupervised learning?	mcq	["Unlabeled data training", "Labeled data", "Reward based", "Regression"]	Unlabeled data training	\N	1	2
q-test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-EASY-3	test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-EASY	What fits a model?	mcq	["Training", "Testing", "Validating", "Predicting"]	Training	\N	1	3
q-test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-EASY-4	test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-EASY	What is overfitting?	mcq	["Learning noise", "Good generalization", "Simple model", "Underfitting"]	Learning noise	\N	1	4
q-test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-MEDIUM-5	test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-MEDIUM	What is a feature?	mcq	["Input variable", "Output variable", "Target", "Error"]	Input variable	\N	1	5
q-test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-MEDIUM-6	test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-MEDIUM	What is a label?	mcq	["Target variable", "Input variable", "A tag", "A type"]	Target variable	\N	1	6
q-test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-MEDIUM-7	test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-MEDIUM	What splits data?	mcq	["Train-test split", "Cut", "Divide", "Slice"]	Train-test split	\N	1	7
q-test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-HARD-8	test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-HARD	What measures accuracy?	mcq	["Metric", "Algorithm", "Feature", "Model"]	Metric	\N	1	8
q-test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-HARD-9	test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-HARD	What is classification?	mcq	["Predicting category", "Predicting number", "Clustering", "Reduction"]	Predicting category	\N	1	9
q-test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-HARD-10	test-3966ccd8-e30c-4fc9-a8c3-916b2d8a3ae2-HARD	What is regression?	mcq	["Predicting continuous value", "Predicting label", "Clustering", "Grouping"]	Predicting continuous value	\N	1	10
q-test-06bae1b4-c6fc-4142-9936-f919b1732eaa-EASY-1	test-06bae1b4-c6fc-4142-9936-f919b1732eaa-EASY	Who developed TensorFlow?	mcq	["Google", "Facebook", "Amazon", "Microsoft"]	Google	\N	1	1
q-test-06bae1b4-c6fc-4142-9936-f919b1732eaa-EASY-2	test-06bae1b4-c6fc-4142-9936-f919b1732eaa-EASY	What is a Tensor?	mcq	["Multi-dimensional array", "A number", "A string", "A list"]	Multi-dimensional array	\N	1	2
q-test-06bae1b4-c6fc-4142-9936-f919b1732eaa-EASY-3	test-06bae1b4-c6fc-4142-9936-f919b1732eaa-EASY	What API is high-level in TF?	mcq	["Keras", "Torch", "SciKit", "Pandas"]	Keras	\N	1	3
q-test-06bae1b4-c6fc-4142-9936-f919b1732eaa-EASY-4	test-06bae1b4-c6fc-4142-9936-f919b1732eaa-EASY	What is a Graph?	mcq	["Computation steps", "A chart", "A plot", "A circle"]	Computation steps	\N	1	4
q-test-06bae1b4-c6fc-4142-9936-f919b1732eaa-MEDIUM-5	test-06bae1b4-c6fc-4142-9936-f919b1732eaa-MEDIUM	What is TensorBoard?	mcq	["Visualization tool", "A dashboard", "A keyboard", "A screen"]	Visualization tool	\N	1	5
q-test-06bae1b4-c6fc-4142-9936-f919b1732eaa-MEDIUM-6	test-06bae1b4-c6fc-4142-9936-f919b1732eaa-MEDIUM	What runs a graph?	mcq	["Session", "Run", "Execute", "Start"]	Session	\N	1	6
q-test-06bae1b4-c6fc-4142-9936-f919b1732eaa-MEDIUM-7	test-06bae1b4-c6fc-4142-9936-f919b1732eaa-MEDIUM	What is a Variable?	mcq	["Mutable state", "Constant", "Input", "Output"]	Mutable state	\N	1	7
q-test-06bae1b4-c6fc-4142-9936-f919b1732eaa-HARD-8	test-06bae1b4-c6fc-4142-9936-f919b1732eaa-HARD	What is a Placeholder?	mcq	["Input for graph", "A variable", "A constant", "A tensor"]	Input for graph	\N	1	8
q-test-06bae1b4-c6fc-4142-9936-f919b1732eaa-HARD-9	test-06bae1b4-c6fc-4142-9936-f919b1732eaa-HARD	Where does TF run?	mcq	["CPU and GPU", "Only CPU", "Only GPU", "Only Cloud"]	CPU and GPU	\N	1	9
q-test-06bae1b4-c6fc-4142-9936-f919b1732eaa-HARD-10	test-06bae1b4-c6fc-4142-9936-f919b1732eaa-HARD	What handles automatic differentiation?	mcq	["GradientTape", "Diff", "Calc", "Auto"]	GradientTape	\N	1	10
q-test-160e9349-ac85-42f7-ade7-c369aa105a6f-EASY-1	test-160e9349-ac85-42f7-ade7-c369aa105a6f-EASY	Who developed PyTorch?	mcq	["Facebook", "Google", "Amazon", "Microsoft"]	Facebook	\N	1	1
q-test-160e9349-ac85-42f7-ade7-c369aa105a6f-EASY-2	test-160e9349-ac85-42f7-ade7-c369aa105a6f-EASY	What defines PyTorch?	mcq	["Dynamic computational graph", "Static graph", "No graph", "Slow execution"]	Dynamic computational graph	\N	1	2
q-test-160e9349-ac85-42f7-ade7-c369aa105a6f-EASY-3	test-160e9349-ac85-42f7-ade7-c369aa105a6f-EASY	What is a Tensor in PyTorch?	mcq	["Multi-dimensional array", "A number", "A string", "A list"]	Multi-dimensional array	\N	1	3
q-test-160e9349-ac85-42f7-ade7-c369aa105a6f-EASY-4	test-160e9349-ac85-42f7-ade7-c369aa105a6f-EASY	Which module builds networks?	mcq	["torch.nn", "torch.net", "torch.ml", "torch.ai"]	torch.nn	\N	1	4
q-test-160e9349-ac85-42f7-ade7-c369aa105a6f-MEDIUM-5	test-160e9349-ac85-42f7-ade7-c369aa105a6f-MEDIUM	What calculates gradients?	mcq	["backward()", "gradient()", "calc()", "diff()"]	backward()	\N	1	5
q-test-160e9349-ac85-42f7-ade7-c369aa105a6f-MEDIUM-6	test-160e9349-ac85-42f7-ade7-c369aa105a6f-MEDIUM	What moves tensors to GPU?	mcq	[".to(\\"cuda\\")", ".gpu()", ".move()", ".cuda()"]	.to("cuda")	\N	1	6
q-test-160e9349-ac85-42f7-ade7-c369aa105a6f-MEDIUM-7	test-160e9349-ac85-42f7-ade7-c369aa105a6f-MEDIUM	What manages optimization?	mcq	["torch.optim", "torch.learn", "torch.train", "torch.run"]	torch.optim	\N	1	7
q-test-160e9349-ac85-42f7-ade7-c369aa105a6f-HARD-8	test-160e9349-ac85-42f7-ade7-c369aa105a6f-HARD	What handles datasets?	mcq	["Dataset & DataLoader", "DataHandler", "DataMan", "LoadData"]	Dataset & DataLoader	\N	1	8
q-test-160e9349-ac85-42f7-ade7-c369aa105a6f-HARD-9	test-160e9349-ac85-42f7-ade7-c369aa105a6f-HARD	What is Autograd?	mcq	["Automatic differentiation", "Auto grading", "Auto graphing", "Automation"]	Automatic differentiation	\N	1	9
q-test-160e9349-ac85-42f7-ade7-c369aa105a6f-HARD-10	test-160e9349-ac85-42f7-ade7-c369aa105a6f-HARD	Is PyTorch Pythonic?	mcq	["Yes", "No", "Kind of", "Not at all"]	Yes	\N	1	10
q-test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-EASY-1	test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-EASY	What is the Agile Manifesto?	mcq	["Values for SW dev", "A rule book", "A contract", "A plan"]	Values for SW dev	\N	1	1
q-test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-EASY-2	test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-EASY	What is a Sprint?	mcq	["Time-boxed iteration", "A race", "A meeting", "A backlog"]	Time-boxed iteration	\N	1	2
q-test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-EASY-3	test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-EASY	What is a User Story?	mcq	["Feature description", "A novel", "A bug", "A test"]	Feature description	\N	1	3
q-test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-EASY-4	test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-EASY	What is the Daily Standup?	mcq	["Status meeting", "A break", "A report", "A plan"]	Status meeting	\N	1	4
q-test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-MEDIUM-5	test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-MEDIUM	Who owns the product backlog?	mcq	["Product Owner", "Scrum Master", "Developer", "Manager"]	Product Owner	\N	1	5
q-test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-MEDIUM-6	test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-MEDIUM	What is Kanban?	mcq	["Visual workflow method", "A Japanese car", "A city", "A tool"]	Visual workflow method	\N	1	6
q-test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-MEDIUM-7	test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-MEDIUM	What is Velocity?	mcq	["Measure of work done", "Speed of code", "Sprint length", "Bug count"]	Measure of work done	\N	1	7
q-test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-HARD-8	test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-HARD	What is Retrospective?	mcq	["Meeting to improve", "Reviewing code", "Testing", "Planning"]	Meeting to improve	\N	1	8
q-test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-HARD-9	test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-HARD	What is an Epic?	mcq	["Large body of work", "A story", "A task", "A bug"]	Large body of work	\N	1	9
q-test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-HARD-10	test-dbd5f7bf-e347-47c2-9eff-598b77c58b92-HARD	What prioritizes work?	mcq	["Backlog", "Email", "Chat", "Phone"]	Backlog	\N	1	10
q-test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-EASY-1	test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-EASY	What is Scrum?	mcq	["Agile framework", "A bug tracker", "A database", "A language"]	Agile framework	\N	1	1
q-test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-EASY-2	test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-EASY	Who facilitates the process?	mcq	["Scrum Master", "Product Owner", "Manager", "Lead"]	Scrum Master	\N	1	2
q-test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-EASY-3	test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-EASY	How long is a Sprint usually?	mcq	["2-4 weeks", "1 day", "6 months", "1 year"]	2-4 weeks	\N	1	3
q-test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-EASY-4	test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-EASY	What are the 3 roles?	mcq	["PO, SM, Team", "Manager, Lead, Dev", "Client, Boss, Worker", "None"]	PO, SM, Team	\N	1	4
q-test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-MEDIUM-5	test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-MEDIUM	What defines "Done"?	mcq	["Definition of Done", "Code compiles", "Manager says so", "Time is up"]	Definition of Done	\N	1	5
q-test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-MEDIUM-6	test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-MEDIUM	What consists of the Sprint Backlog?	mcq	["Tasks for the sprint", "All requirements", "Bugs only", "Features only"]	Tasks for the sprint	\N	1	6
q-test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-MEDIUM-7	test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-MEDIUM	What happens at Sprint Review?	mcq	["Demo work", "Plan work", "Fix bugs", "Write code"]	Demo work	\N	1	7
q-test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-HARD-8	test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-HARD	What is an artifact?	mcq	["Backlog, Increment", "Code", "Meeting", "Person"]	Backlog, Increment	\N	1	8
q-test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-HARD-9	test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-HARD	Is Scrum rigid?	mcq	["No, flexible", "Yes, strict", "Only on Tuesdays", "Maybe"]	No, flexible	\N	1	9
q-test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-HARD-10	test-ebe24dfc-42ad-4585-8a9e-991bc36e32ce-HARD	Can scope change in sprint?	mcq	["Ideally no", "Yes always", "If boss says", "If easy"]	Ideally no	\N	1	10
q-test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-EASY-1	test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-EASY	What is Figma?	mcq	["Design tool", "Code editor", "Database", "Operating System"]	Design tool	\N	1	1
q-test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-EASY-2	test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-EASY	Is Figma web-based?	mcq	["Yes", "No", "Only Mac", "Only Windows"]	Yes	\N	1	2
q-test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-EASY-3	test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-EASY	What creates responsive layouts?	mcq	["Auto Layout", "Constraints", "Grids", "Frames"]	Auto Layout	\N	1	3
q-test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-EASY-4	test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-EASY	What is a Component?	mcq	["Reusable element", "A layer", "A group", "A plugin"]	Reusable element	\N	1	4
q-test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-MEDIUM-5	test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-MEDIUM	What is Prototyping?	mcq	["Interaction flow", "Coding", "Drawing", "Saving"]	Interaction flow	\N	1	5
q-test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-MEDIUM-6	test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-MEDIUM	What stores shared styles?	mcq	["Design System / Library", "Folder", "File", "Cloud"]	Design System / Library	\N	1	6
q-test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-MEDIUM-7	test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-MEDIUM	What is a Frame?	mcq	["Container for elements", "A box", "A picture", "A window"]	Container for elements	\N	1	7
q-test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-HARD-8	test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-HARD	Can multiple people edit?	mcq	["Yes, realtime", "No", "One by one", "Offline only"]	Yes, realtime	\N	1	8
q-test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-HARD-9	test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-HARD	What handles vectors?	mcq	["Pen tool", "Brush", "Pencil", "Eraser"]	Pen tool	\N	1	9
q-test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-HARD-10	test-742fd989-b3f4-4e70-90bc-d40aecfe9b22-HARD	What installs extra features?	mcq	["Plugins", "Extensions", "Addons", "Mods"]	Plugins	\N	1	10
q-test-77a90318-206b-47d9-b848-5fc0826a7f01-EASY-1	test-77a90318-206b-47d9-b848-5fc0826a7f01-EASY	What is Next.js?	mcq	["React Framework", "Vue Framework", "A database", "A backend"]	React Framework	\N	1	1
q-test-77a90318-206b-47d9-b848-5fc0826a7f01-EASY-2	test-77a90318-206b-47d9-b848-5fc0826a7f01-EASY	What is SSR?	mcq	["Server-Side Rendering", "Super Speed React", "Static Site React", "Simple Site Render"]	Server-Side Rendering	\N	1	2
q-test-77a90318-206b-47d9-b848-5fc0826a7f01-EASY-3	test-77a90318-206b-47d9-b848-5fc0826a7f01-EASY	What handles routing?	mcq	["File-system based", "React Router", "Config file", "Database"]	File-system based	\N	1	3
q-test-77a90318-206b-47d9-b848-5fc0826a7f01-EASY-4	test-77a90318-206b-47d9-b848-5fc0826a7f01-EASY	What is getStaticProps?	mcq	["Fetch specific data build time", "Fetch runtime", "Fetch client side", "Fetch DB"]	Fetch specific data build time	\N	1	4
q-test-77a90318-206b-47d9-b848-5fc0826a7f01-MEDIUM-5	test-77a90318-206b-47d9-b848-5fc0826a7f01-MEDIUM	What is API Routes?	mcq	["Backend endpoints", "Frontend paths", "Database", "External API"]	Backend endpoints	\N	1	5
q-test-77a90318-206b-47d9-b848-5fc0826a7f01-MEDIUM-6	test-77a90318-206b-47d9-b848-5fc0826a7f01-MEDIUM	What optimizes images?	mcq	["next/image", "<img>", "ReactImage", "ImageOpt"]	next/image	\N	1	6
q-test-77a90318-206b-47d9-b848-5fc0826a7f01-MEDIUM-7	test-77a90318-206b-47d9-b848-5fc0826a7f01-MEDIUM	What is ISR?	mcq	["Incremental Static Regeneration", "Instant Static React", "Immediate Site Render", "Internal Server Route"]	Incremental Static Regeneration	\N	1	7
q-test-77a90318-206b-47d9-b848-5fc0826a7f01-HARD-8	test-77a90318-206b-47d9-b848-5fc0826a7f01-HARD	What file is the app entry?	mcq	["_app.js", "index.js", "main.js", "root.js"]	_app.js	\N	1	8
q-test-77a90318-206b-47d9-b848-5fc0826a7f01-HARD-9	test-77a90318-206b-47d9-b848-5fc0826a7f01-HARD	Does it support CSS modules?	mcq	["Yes", "No", "Only SASS", "Only global"]	Yes	\N	1	9
q-test-77a90318-206b-47d9-b848-5fc0826a7f01-HARD-10	test-77a90318-206b-47d9-b848-5fc0826a7f01-HARD	What handles dynamic routes?	mcq	["[param].js", "{param}.js", "param.js", ":param.js"]	[param].js	\N	1	10
q-test-f43f5086-2801-4967-b2bc-72bbd824986f-EASY-1	test-f43f5086-2801-4967-b2bc-72bbd824986f-EASY	What is GraphQL?	mcq	["Query language for APIs", "Database", "Framework", "Server"]	Query language for APIs	\N	1	1
q-test-f43f5086-2801-4967-b2bc-72bbd824986f-EASY-2	test-f43f5086-2801-4967-b2bc-72bbd824986f-EASY	What retrieves data?	mcq	["Query", "Mutation", "Subscription", "Get"]	Query	\N	1	2
q-test-f43f5086-2801-4967-b2bc-72bbd824986f-EASY-3	test-f43f5086-2801-4967-b2bc-72bbd824986f-EASY	What modifies data?	mcq	["Mutation", "Query", "Subscription", "Post"]	Mutation	\N	1	3
q-test-f43f5086-2801-4967-b2bc-72bbd824986f-EASY-4	test-f43f5086-2801-4967-b2bc-72bbd824986f-EASY	What defines the structure?	mcq	["Schema", "Table", "JSON", "Object"]	Schema	\N	1	4
q-test-f43f5086-2801-4967-b2bc-72bbd824986f-MEDIUM-5	test-f43f5086-2801-4967-b2bc-72bbd824986f-MEDIUM	Does it solve over-fetching?	mcq	["Yes", "No", "Sometimes", "Makes it worse"]	Yes	\N	1	5
q-test-f43f5086-2801-4967-b2bc-72bbd824986f-MEDIUM-6	test-f43f5086-2801-4967-b2bc-72bbd824986f-MEDIUM	How many endpoints usually?	mcq	["One", "Many", "None", "Two"]	One	\N	1	6
q-test-f43f5086-2801-4967-b2bc-72bbd824986f-MEDIUM-7	test-f43f5086-2801-4967-b2bc-72bbd824986f-MEDIUM	What allows real-time?	mcq	["Subscription", "Query", "Mutation", "Stream"]	Subscription	\N	1	7
q-test-f43f5086-2801-4967-b2bc-72bbd824986f-HARD-8	test-f43f5086-2801-4967-b2bc-72bbd824986f-HARD	What visualizes the API?	mcq	["GraphiQL", "Postman", "Browser", "Console"]	GraphiQL	\N	1	8
q-test-f43f5086-2801-4967-b2bc-72bbd824986f-HARD-9	test-f43f5086-2801-4967-b2bc-72bbd824986f-HARD	Is it typed?	mcq	["Yes, strongly typed", "No", "Weakly", "Dynamic"]	Yes, strongly typed	\N	1	9
q-test-f43f5086-2801-4967-b2bc-72bbd824986f-HARD-10	test-f43f5086-2801-4967-b2bc-72bbd824986f-HARD	Who developed it?	mcq	["Facebook", "Google", "Netflix", "Twitter"]	Facebook	\N	1	10
q-test-15c8be26-50a5-4db2-a79a-d65db912ea12-EASY-1	test-15c8be26-50a5-4db2-a79a-d65db912ea12-EASY	Which function is used to find the highest number in a range?	mcq	["MAX()", "HIGH()", "UPPER()", "TOP()"]	MAX()	\N	1	1
q-test-15c8be26-50a5-4db2-a79a-d65db912ea12-EASY-2	test-15c8be26-50a5-4db2-a79a-d65db912ea12-EASY	What does VLOOKUP stand for?	mcq	["Vertical Lookup", "Variable Lookup", "Value Lookup", "Vector Lookup"]	Vertical Lookup	\N	1	2
q-test-15c8be26-50a5-4db2-a79a-d65db912ea12-EASY-3	test-15c8be26-50a5-4db2-a79a-d65db912ea12-EASY	Which symbol starts a formula?	mcq	["$", "#", "=", "&"]	=	\N	1	3
q-test-15c8be26-50a5-4db2-a79a-d65db912ea12-EASY-4	test-15c8be26-50a5-4db2-a79a-d65db912ea12-EASY	What is a Pivot Table used for?	mcq	["Data Entry", "Data Summarization", "Formatting", "Printing"]	Data Summarization	\N	1	4
q-test-15c8be26-50a5-4db2-a79a-d65db912ea12-MEDIUM-5	test-15c8be26-50a5-4db2-a79a-d65db912ea12-MEDIUM	What is the intersection of a row and a column called?	mcq	["Grid", "Box", "Cell", "Point"]	Cell	\N	1	5
q-test-15c8be26-50a5-4db2-a79a-d65db912ea12-MEDIUM-6	test-15c8be26-50a5-4db2-a79a-d65db912ea12-MEDIUM	Which function calculates the average?	mcq	["MEAN()", "AVERAGE()", "AVG()", "MEDIAN()"]	AVERAGE()	\N	1	6
q-test-15c8be26-50a5-4db2-a79a-d65db912ea12-MEDIUM-7	test-15c8be26-50a5-4db2-a79a-d65db912ea12-MEDIUM	How do you absolute reference a cell?	mcq	["$A$1", "#A#1", "@A@1", "&A&1"]	$A$1	\N	1	7
q-test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-HARD-1	test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-HARD	Sample HARD question 1 for C?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-15c8be26-50a5-4db2-a79a-d65db912ea12-HARD-8	test-15c8be26-50a5-4db2-a79a-d65db912ea12-HARD	What does CONCATENATE do?	mcq	["Splits text", "Joins text", "Deletes text", "Hides text"]	Joins text	\N	1	8
q-test-15c8be26-50a5-4db2-a79a-d65db912ea12-HARD-9	test-15c8be26-50a5-4db2-a79a-d65db912ea12-HARD	Which chart is best for showing trends over time?	mcq	["Pie Chart", "Bar Chart", "Line Chart", "Scatter Plot"]	Line Chart	\N	1	9
q-test-15c8be26-50a5-4db2-a79a-d65db912ea12-HARD-10	test-15c8be26-50a5-4db2-a79a-d65db912ea12-HARD	What is Conditional Formatting?	mcq	["Changing cell format based on value", "Deleting cells", "Adding formulas", "Sorting data"]	Changing cell format based on value	\N	1	10
q-test-613de450-5db2-41df-9a82-3e9f8c7deb59-EASY-1	test-613de450-5db2-41df-9a82-3e9f8c7deb59-EASY	What is the mean?	mcq	["The middle value", "The most frequent value", "The average", "The range"]	The average	\N	1	1
q-test-613de450-5db2-41df-9a82-3e9f8c7deb59-EASY-2	test-613de450-5db2-41df-9a82-3e9f8c7deb59-EASY	What is the median?	mcq	["The middle value", "The average", "The most frequent value", "The difference"]	The middle value	\N	1	2
q-test-613de450-5db2-41df-9a82-3e9f8c7deb59-EASY-3	test-613de450-5db2-41df-9a82-3e9f8c7deb59-EASY	What does standard deviation measure?	mcq	["Central tendency", "Dispersion/Spread", "Probability", "Correlation"]	Dispersion/Spread	\N	1	3
q-test-613de450-5db2-41df-9a82-3e9f8c7deb59-EASY-4	test-613de450-5db2-41df-9a82-3e9f8c7deb59-EASY	What is a p-value?	mcq	["Probability of observing results by chance", "The power of a test", "The sample size", "The mean"]	Probability of observing results by chance	\N	1	4
q-test-613de450-5db2-41df-9a82-3e9f8c7deb59-MEDIUM-5	test-613de450-5db2-41df-9a82-3e9f8c7deb59-MEDIUM	What is correlation?	mcq	["Causation", "Relationship between variables", "Difference between means", "Variance"]	Relationship between variables	\N	1	5
q-test-613de450-5db2-41df-9a82-3e9f8c7deb59-MEDIUM-6	test-613de450-5db2-41df-9a82-3e9f8c7deb59-MEDIUM	What is a null hypothesis?	mcq	["The hypothesis to be tested (no effect)", "The alternative hypothesis", "The conclusion", "The error rate"]	The hypothesis to be tested (no effect)	\N	1	6
q-test-613de450-5db2-41df-9a82-3e9f8c7deb59-MEDIUM-7	test-613de450-5db2-41df-9a82-3e9f8c7deb59-MEDIUM	Which distribution is "Bell Curve"?	mcq	["Uniform", "Binomial", "Normal", "Poisson"]	Normal	\N	1	7
q-test-613de450-5db2-41df-9a82-3e9f8c7deb59-HARD-8	test-613de450-5db2-41df-9a82-3e9f8c7deb59-HARD	What is statistical significance?	mcq	["Importance of result", "Unlikely to sample error", "Large effect size", "High correlation"]	Unlikely to sample error	\N	1	8
q-test-613de450-5db2-41df-9a82-3e9f8c7deb59-HARD-9	test-613de450-5db2-41df-9a82-3e9f8c7deb59-HARD	What is Type I error?	mcq	["False Positive", "False Negative", "Correct rejection", "Correct acceptance"]	False Positive	\N	1	9
q-test-613de450-5db2-41df-9a82-3e9f8c7deb59-HARD-10	test-613de450-5db2-41df-9a82-3e9f8c7deb59-HARD	What is regression used for?	mcq	["Predicting values", "Sorting data", "Calculating mean", "Plotting charts"]	Predicting values	\N	1	10
q-test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-EASY-1	test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-EASY	What is a Dimension in Tableau?	mcq	["Quantitative value", "Categorical field", "A calculation", "A parameter"]	Categorical field	\N	1	1
q-test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-EASY-2	test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-EASY	What is a Measure in Tableau?	mcq	["Categorical field", "Quantitative numeric value", "A map", "A filter"]	Quantitative numeric value	\N	1	2
q-test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-EASY-3	test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-EASY	What file extension is a Tableau Workbook?	mcq	[".twb", ".tde", ".hyper", ".tds"]	.twb	\N	1	3
q-test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-EASY-4	test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-EASY	Which chart type is best for part-to-whole?	mcq	["Bar", "Line", "Pie", "Scatter"]	Pie	\N	1	4
q-test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-MEDIUM-5	test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-MEDIUM	What is a Dashboard?	mcq	["A single chart", "Collection of views", "A data source", "A calculation"]	Collection of views	\N	1	5
q-test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-MEDIUM-6	test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-MEDIUM	How do you filter data?	mcq	["Drag to Filter shelf", "Delete rows", "Hide columns", "Color codes"]	Drag to Filter shelf	\N	1	6
q-test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-MEDIUM-7	test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-MEDIUM	What is a Calculated Field?	mcq	["Field created by formula", "Field from database", "A parameter", "A group"]	Field created by formula	\N	1	7
q-test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-HARD-8	test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-HARD	What is a Story in Tableau?	mcq	["Sequence of visualizations", "A single sheet", "A novel", "A script"]	Sequence of visualizations	\N	1	8
q-test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-HARD-9	test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-HARD	What indicates a geographic field?	mcq	["Globe icon", "abc icon", "# icon", "Calendar icon"]	Globe icon	\N	1	9
q-test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-HARD-10	test-7be05e0d-d01c-4ef4-8b0a-4d46a0060d0e-HARD	What is blending?	mcq	["Mixing colors", "Combining data from multiple sources", "Filtering", "Sorting"]	Combining data from multiple sources	\N	1	10
q-test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-EASY-1	test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-EASY	What language is used for formulas in Power BI?	mcq	["SQL", "DAX", "Python", "Java"]	DAX	\N	1	1
q-test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-EASY-2	test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-EASY	What is Power Query used for?	mcq	["Data Transformation", "Visualization", "Reporting", "Sharing"]	Data Transformation	\N	1	2
q-test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-EASY-3	test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-EASY	What does DAX stand for?	mcq	["Data Analysis Expressions", "Data Access XML", "Dynamic Analysis X", "Database Auto Exchange"]	Data Analysis Expressions	\N	1	3
q-test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-EASY-4	test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-EASY	What is a Slicer?	mcq	["A visual filter", "A chart type", "A data source", "A theme"]	A visual filter	\N	1	4
q-test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-MEDIUM-5	test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-MEDIUM	Which view is used to manage relationships?	mcq	["Report View", "Data View", "Model View", "Query View"]	Model View	\N	1	5
q-test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-MEDIUM-6	test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-MEDIUM	What is a Measure in Power BI?	mcq	["Static value", "Calculation performed on aggregate", "A column", "A table"]	Calculation performed on aggregate	\N	1	6
q-test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-MEDIUM-7	test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-MEDIUM	What file extension is a Power BI file?	mcq	[".pbix", ".pbi", ".pbx", ".power"]	.pbix	\N	1	7
q-test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-HARD-8	test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-HARD	What is the Report Canvas?	mcq	["Where you create visuals", "Where you write code", "Where you edit data", "Where you manage users"]	Where you create visuals	\N	1	8
q-test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-HARD-9	test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-HARD	Can you use Python visuals in Power BI?	mcq	["Yes", "No", "Only R", "Only SQL"]	Yes	\N	1	9
q-test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-HARD-10	test-da4b90a3-d6e0-49bf-8277-0e73358a8fc9-HARD	What is Row-Level Security?	mcq	["Restricting data based on user roles", "Locking rows", "Hiding columns", "Encrypting data"]	Restricting data based on user roles	\N	1	10
q-test-30788882-2a1b-4c76-a027-ffbcab0d17e9-EASY-1	test-30788882-2a1b-4c76-a027-ffbcab0d17e9-EASY	What operator assigns a value in R?	mcq	["=", "<-", "->", "=="]	<-	\N	1	1
q-test-30788882-2a1b-4c76-a027-ffbcab0d17e9-EASY-2	test-30788882-2a1b-4c76-a027-ffbcab0d17e9-EASY	Which function creates a vector?	mcq	["v()", "c()", "vec()", "create()"]	c()	\N	1	2
q-test-30788882-2a1b-4c76-a027-ffbcab0d17e9-EASY-3	test-30788882-2a1b-4c76-a027-ffbcab0d17e9-EASY	What is a DataFrame?	mcq	["A 2D structure like a table", "A list", "A matrix", "A graph"]	A 2D structure like a table	\N	1	3
q-test-30788882-2a1b-4c76-a027-ffbcab0d17e9-EASY-4	test-30788882-2a1b-4c76-a027-ffbcab0d17e9-EASY	Which library is popular for plotting?	mcq	["ggplot2", "matplotlib", "seaborn", "pandas"]	ggplot2	\N	1	4
q-test-30788882-2a1b-4c76-a027-ffbcab0d17e9-MEDIUM-5	test-30788882-2a1b-4c76-a027-ffbcab0d17e9-MEDIUM	How do you install a package?	mcq	["install.packages()", "get.package()", "require()", "library()"]	install.packages()	\N	1	5
q-test-30788882-2a1b-4c76-a027-ffbcab0d17e9-MEDIUM-6	test-30788882-2a1b-4c76-a027-ffbcab0d17e9-MEDIUM	What output does summary() give?	mcq	["Statistical summary", "First rows", "Structure", "Graph"]	Statistical summary	\N	1	6
q-test-30788882-2a1b-4c76-a027-ffbcab0d17e9-MEDIUM-7	test-30788882-2a1b-4c76-a027-ffbcab0d17e9-MEDIUM	What symbol accesses lines in a DataFrame?	mcq	["@", "$", "#", "&"]	$	\N	1	7
q-test-30788882-2a1b-4c76-a027-ffbcab0d17e9-HARD-8	test-30788882-2a1b-4c76-a027-ffbcab0d17e9-HARD	What is shiny used for?	mcq	["Web apps", "Machine learning", "Database", "Cleanup"]	Web apps	\N	1	8
q-test-30788882-2a1b-4c76-a027-ffbcab0d17e9-HARD-9	test-30788882-2a1b-4c76-a027-ffbcab0d17e9-HARD	Which is NOT a data type in R?	mcq	["numeric", "character", "logical", "dictionary"]	dictionary	\N	1	9
q-test-30788882-2a1b-4c76-a027-ffbcab0d17e9-HARD-10	test-30788882-2a1b-4c76-a027-ffbcab0d17e9-HARD	What does %>% mean?	mcq	["Pipe operator", "Greater than", "Modulo", "Comment"]	Pipe operator	\N	1	10
q-test-39068856-8c6c-413c-8113-e3428738ecf3-EASY-1	test-39068856-8c6c-413c-8113-e3428738ecf3-EASY	What is the primary data structure in Pandas?	mcq	["Series", "DataFrame", "List", "Array"]	DataFrame	\N	1	1
q-test-39068856-8c6c-413c-8113-e3428738ecf3-EASY-2	test-39068856-8c6c-413c-8113-e3428738ecf3-EASY	How do you read a CSV file?	mcq	["pd.read_csv()", "pd.load_csv()", "pd.csv()", "pd.open()"]	pd.read_csv()	\N	1	2
q-test-39068856-8c6c-413c-8113-e3428738ecf3-EASY-3	test-39068856-8c6c-413c-8113-e3428738ecf3-EASY	Which method shows the first few rows?	mcq	["head()", "top()", "start()", "first()"]	head()	\N	1	3
q-test-39068856-8c6c-413c-8113-e3428738ecf3-EASY-4	test-39068856-8c6c-413c-8113-e3428738ecf3-EASY	How do you check for missing values?	mcq	["isna()", "missing()", "null()", "check()"]	isna()	\N	1	4
q-test-39068856-8c6c-413c-8113-e3428738ecf3-MEDIUM-5	test-39068856-8c6c-413c-8113-e3428738ecf3-MEDIUM	Which method drops missing values?	mcq	["drop()", "dropna()", "remove()", "delete()"]	dropna()	\N	1	5
q-test-39068856-8c6c-413c-8113-e3428738ecf3-MEDIUM-6	test-39068856-8c6c-413c-8113-e3428738ecf3-MEDIUM	How do you select a column "Age"?	mcq	["df[\\"Age\\"]", "df(Age)", "df.select(\\"Age\\")", "df.get(\\"Age\\")"]	df["Age"]	\N	1	6
q-test-39068856-8c6c-413c-8113-e3428738ecf3-MEDIUM-7	test-39068856-8c6c-413c-8113-e3428738ecf3-MEDIUM	What does groupby() do?	mcq	["Groups data", "Sorts data", "Filters data", "Plots data"]	Groups data	\N	1	7
q-test-39068856-8c6c-413c-8113-e3428738ecf3-HARD-8	test-39068856-8c6c-413c-8113-e3428738ecf3-HARD	Which function gives statistical description?	mcq	["describe()", "stat()", "summary()", "info()"]	describe()	\N	1	8
q-test-39068856-8c6c-413c-8113-e3428738ecf3-HARD-9	test-39068856-8c6c-413c-8113-e3428738ecf3-HARD	How do you filter rows?	mcq	["df[df[\\"Age\\"] > 20]", "df.filter(\\"Age\\" > 20)", "df.where(\\"Age\\" > 20)", "df.select(\\"Age\\" > 20)"]	df[df["Age"] > 20]	\N	1	9
q-test-39068856-8c6c-413c-8113-e3428738ecf3-HARD-10	test-39068856-8c6c-413c-8113-e3428738ecf3-HARD	What is loc used for?	mcq	["Label-based indexing", "Integer-based indexing", "Sorting", "Merging"]	Label-based indexing	\N	1	10
q-test-33414997-9c16-420f-9e13-2fdc3f613ea0-EASY-1	test-33414997-9c16-420f-9e13-2fdc3f613ea0-EASY	What is the primary purpose of data visualization?	mcq	["To communicate insights", "To make data pretty", "To store data", "To clean data"]	To communicate insights	\N	1	1
q-test-33414997-9c16-420f-9e13-2fdc3f613ea0-EASY-2	test-33414997-9c16-420f-9e13-2fdc3f613ea0-EASY	Which chart type is best for showing trends over time?	mcq	["Line chart", "Pie chart", "Bar chart", "Scatter plot"]	Line chart	\N	1	2
q-test-33414997-9c16-420f-9e13-2fdc3f613ea0-EASY-3	test-33414997-9c16-420f-9e13-2fdc3f613ea0-EASY	What is a dashboard?	mcq	["A visual display of key metrics", "A database table", "A programming script", "A cloud server"]	A visual display of key metrics	\N	1	3
q-test-33414997-9c16-420f-9e13-2fdc3f613ea0-EASY-4	test-33414997-9c16-420f-9e13-2fdc3f613ea0-EASY	Which color palette is best for distinct categories?	mcq	["Qualitative", "Sequential", "Diverging", "Monochromatic"]	Qualitative	\N	1	4
q-test-33414997-9c16-420f-9e13-2fdc3f613ea0-MEDIUM-5	test-33414997-9c16-420f-9e13-2fdc3f613ea0-MEDIUM	What chart is best for part-to-whole comparisons?	mcq	["Pie chart", "Line chart", "Scatter plot", "Histogram"]	Pie chart	\N	1	5
q-test-33414997-9c16-420f-9e13-2fdc3f613ea0-MEDIUM-6	test-33414997-9c16-420f-9e13-2fdc3f613ea0-MEDIUM	What does "data-ink ratio" mean?	mcq	["Minimizing non-essential ink", "Using more color", "Printing costs", "Data density"]	Minimizing non-essential ink	\N	1	6
q-test-33414997-9c16-420f-9e13-2fdc3f613ea0-MEDIUM-7	test-33414997-9c16-420f-9e13-2fdc3f613ea0-MEDIUM	Which tool is widely used for BI visualization?	mcq	["Tableau", "Notepad", "Git", "Docker"]	Tableau	\N	1	7
q-test-33414997-9c16-420f-9e13-2fdc3f613ea0-HARD-8	test-33414997-9c16-420f-9e13-2fdc3f613ea0-HARD	What is a heatmap used for?	mcq	["Showing density or intensity", "Showing hierarchy", "Showing flow", "Showing structure"]	Showing density or intensity	\N	1	8
q-test-33414997-9c16-420f-9e13-2fdc3f613ea0-HARD-9	test-33414997-9c16-420f-9e13-2fdc3f613ea0-HARD	What is the "Z-pattern" in design?	mcq	["How eyes scan a page", "A chart type", "A sorting algorithm", "A database index"]	How eyes scan a page	\N	1	9
q-test-33414997-9c16-420f-9e13-2fdc3f613ea0-HARD-10	test-33414997-9c16-420f-9e13-2fdc3f613ea0-HARD	Which is misleading in visualizations?	mcq	["Truncating the Y-axis", "Labeling axes", "Using a legend", "Title"]	Truncating the Y-axis	\N	1	10
q-test-148aaa3c-c319-4b91-be36-c18b111c598e-EASY-1	test-148aaa3c-c319-4b91-be36-c18b111c598e-EASY	What is normalization?	mcq	["Organizing data to reduce redundancy", "Backing up data", "Deleting data", "Visualizing data"]	Organizing data to reduce redundancy	\N	1	1
q-test-148aaa3c-c319-4b91-be36-c18b111c598e-EASY-2	test-148aaa3c-c319-4b91-be36-c18b111c598e-EASY	What is a primary key?	mcq	["Unique identifier for a record", "The first column", "A password", "A backup key"]	Unique identifier for a record	\N	1	2
q-test-148aaa3c-c319-4b91-be36-c18b111c598e-EASY-3	test-148aaa3c-c319-4b91-be36-c18b111c598e-EASY	What is a foreign key?	mcq	["Link to another table's primary key", "A translation tool", "External password", "A duplicate key"]	Link to another table's primary key	\N	1	3
q-test-148aaa3c-c319-4b91-be36-c18b111c598e-EASY-4	test-148aaa3c-c319-4b91-be36-c18b111c598e-EASY	What is an ER diagram?	mcq	["Entity Relationship Diagram", "Error Report Diagram", "External Route Diagram", "Easy Read Diagram"]	Entity Relationship Diagram	\N	1	4
q-test-148aaa3c-c319-4b91-be36-c18b111c598e-MEDIUM-5	test-148aaa3c-c319-4b91-be36-c18b111c598e-MEDIUM	What is a star schema?	mcq	["Data mart schema with fact/dim tables", "A galaxy map", "A network topology", "A programming pattern"]	Data mart schema with fact/dim tables	\N	1	5
q-test-148aaa3c-c319-4b91-be36-c18b111c598e-MEDIUM-6	test-148aaa3c-c319-4b91-be36-c18b111c598e-MEDIUM	What is a one-to-many relationship?	mcq	["One record links to multiple records", "One record links to one record", "Many records link to many", "None of the above"]	One record links to multiple records	\N	1	6
q-test-148aaa3c-c319-4b91-be36-c18b111c598e-MEDIUM-7	test-148aaa3c-c319-4b91-be36-c18b111c598e-MEDIUM	What is denormalization?	mcq	["Adding redundancy for performance", "Cleaning data", "Deleting tables", "Sorting data"]	Adding redundancy for performance	\N	1	7
q-test-148aaa3c-c319-4b91-be36-c18b111c598e-HARD-8	test-148aaa3c-c319-4b91-be36-c18b111c598e-HARD	What is SQL?	mcq	["Structured Query Language", "Simple Question Language", "Standard Query List", "System Quality Level"]	Structured Query Language	\N	1	8
q-test-148aaa3c-c319-4b91-be36-c18b111c598e-HARD-9	test-148aaa3c-c319-4b91-be36-c18b111c598e-HARD	What is an attribute in data modeling?	mcq	["A property of an entity", "A table name", "A query", "A database"]	A property of an entity	\N	1	9
q-test-148aaa3c-c319-4b91-be36-c18b111c598e-HARD-10	test-148aaa3c-c319-4b91-be36-c18b111c598e-HARD	What represents an "Is-A" relationship?	mcq	["Inheritance/Subtyping", "Aggregation", "Composition", "Association"]	Inheritance/Subtyping	\N	1	10
q-test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-EASY-1	test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-EASY	What is AI?	mcq	["Simulation of human intelligence", "A robot", "A database", "A programming language"]	Simulation of human intelligence	\N	1	1
q-test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-EASY-2	test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-EASY	What is the Turing Test?	mcq	["Test for machine intelligence", "A math test", "A code quiz", "A hardware test"]	Test for machine intelligence	\N	1	2
q-test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-EASY-3	test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-EASY	What is Machine Learning?	mcq	["Subset of AI learning from data", "Subset of AI for robotics", "Just stats", "Hardware design"]	Subset of AI learning from data	\N	1	3
q-test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-EASY-4	test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-EASY	What is a Neural Network?	mcq	["Mimics biological neurons", "A computer network", "A web server", "A graph"]	Mimics biological neurons	\N	1	4
q-test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-MEDIUM-5	test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-MEDIUM	What is NLP?	mcq	["Natural Language Processing", "New Language Protocol", "Network Level Protocol", "None"]	Natural Language Processing	\N	1	5
q-test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-MEDIUM-6	test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-MEDIUM	What is Computer Vision?	mcq	["Computers understanding images", "A monitor", "A webcam", "Glasses"]	Computers understanding images	\N	1	6
q-test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-MEDIUM-7	test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-MEDIUM	What is Deep Learning?	mcq	["ML with many layers", "Learning deeply", "Reading books", "Advanced SQL"]	ML with many layers	\N	1	7
q-test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-HARD-8	test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-HARD	What is an expert system?	mcq	["Emulates human expert decision", "A smart user", "A dictionary", "A search engine"]	Emulates human expert decision	\N	1	8
q-test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-HARD-9	test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-HARD	What is reinforcement learning?	mcq	["Learning via rewards/penalties", "Learning by reading", "Learning by watching", "Learning by coding"]	Learning via rewards/penalties	\N	1	9
q-test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-HARD-10	test-ddeed26d-cf2c-4192-89ec-efe49a06e1f2-HARD	Who coined the term "Artificial Intelligence"?	mcq	["John McCarthy", "Alan Turing", "Elon Musk", "Bill Gates"]	John McCarthy	\N	1	10
q-test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-EASY-1	test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-EASY	Sample EASY question 1 for C?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-EASY-2	test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-EASY	Sample EASY question 2 for C?	mcq	["True", "False"]	True	\N	1	2
q-test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-EASY-3	test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-EASY	Sample EASY question 3 for C?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-MEDIUM-1	test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-MEDIUM	Sample MEDIUM question 1 for C?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-MEDIUM-2	test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-MEDIUM	Sample MEDIUM question 2 for C?	mcq	["True", "False"]	True	\N	1	2
q-test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-MEDIUM-3	test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-MEDIUM	Sample MEDIUM question 3 for C?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-HARD-2	test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-HARD	Sample HARD question 2 for C?	mcq	["True", "False"]	True	\N	1	2
q-test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-HARD-3	test-729b3b7e-4804-4eeb-a69b-3ad36d336ea5-HARD	Sample HARD question 3 for C?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-1001daa3-af50-4d62-a8e0-07b6bba31aff-EASY-1	test-1001daa3-af50-4d62-a8e0-07b6bba31aff-EASY	Sample EASY question 1 for C++?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-1001daa3-af50-4d62-a8e0-07b6bba31aff-EASY-2	test-1001daa3-af50-4d62-a8e0-07b6bba31aff-EASY	Sample EASY question 2 for C++?	mcq	["True", "False"]	True	\N	1	2
q-test-1001daa3-af50-4d62-a8e0-07b6bba31aff-EASY-3	test-1001daa3-af50-4d62-a8e0-07b6bba31aff-EASY	Sample EASY question 3 for C++?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-1001daa3-af50-4d62-a8e0-07b6bba31aff-MEDIUM-1	test-1001daa3-af50-4d62-a8e0-07b6bba31aff-MEDIUM	Sample MEDIUM question 1 for C++?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-1001daa3-af50-4d62-a8e0-07b6bba31aff-MEDIUM-2	test-1001daa3-af50-4d62-a8e0-07b6bba31aff-MEDIUM	Sample MEDIUM question 2 for C++?	mcq	["True", "False"]	True	\N	1	2
q-test-1001daa3-af50-4d62-a8e0-07b6bba31aff-MEDIUM-3	test-1001daa3-af50-4d62-a8e0-07b6bba31aff-MEDIUM	Sample MEDIUM question 3 for C++?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-1001daa3-af50-4d62-a8e0-07b6bba31aff-HARD-1	test-1001daa3-af50-4d62-a8e0-07b6bba31aff-HARD	Sample HARD question 1 for C++?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-1001daa3-af50-4d62-a8e0-07b6bba31aff-HARD-2	test-1001daa3-af50-4d62-a8e0-07b6bba31aff-HARD	Sample HARD question 2 for C++?	mcq	["True", "False"]	True	\N	1	2
q-test-1001daa3-af50-4d62-a8e0-07b6bba31aff-HARD-3	test-1001daa3-af50-4d62-a8e0-07b6bba31aff-HARD	Sample HARD question 3 for C++?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-8f5dd442-70c8-49f1-b867-cadec10e9412-EASY-1	test-8f5dd442-70c8-49f1-b867-cadec10e9412-EASY	Sample EASY question 1 for Go?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-8f5dd442-70c8-49f1-b867-cadec10e9412-EASY-2	test-8f5dd442-70c8-49f1-b867-cadec10e9412-EASY	Sample EASY question 2 for Go?	mcq	["True", "False"]	True	\N	1	2
q-test-8f5dd442-70c8-49f1-b867-cadec10e9412-EASY-3	test-8f5dd442-70c8-49f1-b867-cadec10e9412-EASY	Sample EASY question 3 for Go?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-8f5dd442-70c8-49f1-b867-cadec10e9412-MEDIUM-1	test-8f5dd442-70c8-49f1-b867-cadec10e9412-MEDIUM	Sample MEDIUM question 1 for Go?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-8f5dd442-70c8-49f1-b867-cadec10e9412-MEDIUM-2	test-8f5dd442-70c8-49f1-b867-cadec10e9412-MEDIUM	Sample MEDIUM question 2 for Go?	mcq	["True", "False"]	True	\N	1	2
q-test-8f5dd442-70c8-49f1-b867-cadec10e9412-MEDIUM-3	test-8f5dd442-70c8-49f1-b867-cadec10e9412-MEDIUM	Sample MEDIUM question 3 for Go?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-8f5dd442-70c8-49f1-b867-cadec10e9412-HARD-1	test-8f5dd442-70c8-49f1-b867-cadec10e9412-HARD	Sample HARD question 1 for Go?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-8f5dd442-70c8-49f1-b867-cadec10e9412-HARD-2	test-8f5dd442-70c8-49f1-b867-cadec10e9412-HARD	Sample HARD question 2 for Go?	mcq	["True", "False"]	True	\N	1	2
q-test-8f5dd442-70c8-49f1-b867-cadec10e9412-HARD-3	test-8f5dd442-70c8-49f1-b867-cadec10e9412-HARD	Sample HARD question 3 for Go?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-2c344fa7-edd0-44f9-966c-852055c44112-EASY-1	test-2c344fa7-edd0-44f9-966c-852055c44112-EASY	Sample EASY question 1 for Rust?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-2c344fa7-edd0-44f9-966c-852055c44112-EASY-2	test-2c344fa7-edd0-44f9-966c-852055c44112-EASY	Sample EASY question 2 for Rust?	mcq	["True", "False"]	True	\N	1	2
q-test-2c344fa7-edd0-44f9-966c-852055c44112-EASY-3	test-2c344fa7-edd0-44f9-966c-852055c44112-EASY	Sample EASY question 3 for Rust?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-2c344fa7-edd0-44f9-966c-852055c44112-MEDIUM-1	test-2c344fa7-edd0-44f9-966c-852055c44112-MEDIUM	Sample MEDIUM question 1 for Rust?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-2c344fa7-edd0-44f9-966c-852055c44112-MEDIUM-2	test-2c344fa7-edd0-44f9-966c-852055c44112-MEDIUM	Sample MEDIUM question 2 for Rust?	mcq	["True", "False"]	True	\N	1	2
q-test-2c344fa7-edd0-44f9-966c-852055c44112-MEDIUM-3	test-2c344fa7-edd0-44f9-966c-852055c44112-MEDIUM	Sample MEDIUM question 3 for Rust?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-2c344fa7-edd0-44f9-966c-852055c44112-HARD-1	test-2c344fa7-edd0-44f9-966c-852055c44112-HARD	Sample HARD question 1 for Rust?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-2c344fa7-edd0-44f9-966c-852055c44112-HARD-2	test-2c344fa7-edd0-44f9-966c-852055c44112-HARD	Sample HARD question 2 for Rust?	mcq	["True", "False"]	True	\N	1	2
q-test-2c344fa7-edd0-44f9-966c-852055c44112-HARD-3	test-2c344fa7-edd0-44f9-966c-852055c44112-HARD	Sample HARD question 3 for Rust?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-EASY-1	test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-EASY	Sample EASY question 1 for Feature Engineering?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-EASY-2	test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-EASY	Sample EASY question 2 for Feature Engineering?	mcq	["True", "False"]	True	\N	1	2
q-test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-EASY-3	test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-EASY	Sample EASY question 3 for Feature Engineering?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-MEDIUM-1	test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-MEDIUM	Sample MEDIUM question 1 for Feature Engineering?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-MEDIUM-2	test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-MEDIUM	Sample MEDIUM question 2 for Feature Engineering?	mcq	["True", "False"]	True	\N	1	2
q-test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-MEDIUM-3	test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-MEDIUM	Sample MEDIUM question 3 for Feature Engineering?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-HARD-1	test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-HARD	Sample HARD question 1 for Feature Engineering?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-HARD-2	test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-HARD	Sample HARD question 2 for Feature Engineering?	mcq	["True", "False"]	True	\N	1	2
q-test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-HARD-3	test-49bd7e04-5cb2-40bd-a703-0bbc6368703f-HARD	Sample HARD question 3 for Feature Engineering?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-EASY-1	test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-EASY	Sample EASY question 1 for NumPy?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-EASY-2	test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-EASY	Sample EASY question 2 for NumPy?	mcq	["True", "False"]	True	\N	1	2
q-test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-EASY-3	test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-EASY	Sample EASY question 3 for NumPy?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-MEDIUM-1	test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-MEDIUM	Sample MEDIUM question 1 for NumPy?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-MEDIUM-2	test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-MEDIUM	Sample MEDIUM question 2 for NumPy?	mcq	["True", "False"]	True	\N	1	2
q-test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-MEDIUM-3	test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-MEDIUM	Sample MEDIUM question 3 for NumPy?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-HARD-1	test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-HARD	Sample HARD question 1 for NumPy?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-HARD-2	test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-HARD	Sample HARD question 2 for NumPy?	mcq	["True", "False"]	True	\N	1	2
q-test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-HARD-3	test-8c9296d0-a351-4d5f-a9ca-242bdd8a9b0d-HARD	Sample HARD question 3 for NumPy?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-EASY-1	test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-EASY	Sample EASY question 1 for Scikit-learn?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-EASY-2	test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-EASY	Sample EASY question 2 for Scikit-learn?	mcq	["True", "False"]	True	\N	1	2
q-test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-EASY-3	test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-EASY	Sample EASY question 3 for Scikit-learn?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-MEDIUM-1	test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-MEDIUM	Sample MEDIUM question 1 for Scikit-learn?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-MEDIUM-2	test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-MEDIUM	Sample MEDIUM question 2 for Scikit-learn?	mcq	["True", "False"]	True	\N	1	2
q-test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-MEDIUM-3	test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-MEDIUM	Sample MEDIUM question 3 for Scikit-learn?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-HARD-1	test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-HARD	Sample HARD question 1 for Scikit-learn?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-HARD-2	test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-HARD	Sample HARD question 2 for Scikit-learn?	mcq	["True", "False"]	True	\N	1	2
q-test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-HARD-3	test-04d478b4-c1d0-4b0a-b75c-3b339c4fef8f-HARD	Sample HARD question 3 for Scikit-learn?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-2618e1cf-127d-4dd1-b772-77be1df7f091-EASY-1	test-2618e1cf-127d-4dd1-b772-77be1df7f091-EASY	Sample EASY question 1 for Deep Learning?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-2618e1cf-127d-4dd1-b772-77be1df7f091-EASY-2	test-2618e1cf-127d-4dd1-b772-77be1df7f091-EASY	Sample EASY question 2 for Deep Learning?	mcq	["True", "False"]	True	\N	1	2
q-test-2618e1cf-127d-4dd1-b772-77be1df7f091-EASY-3	test-2618e1cf-127d-4dd1-b772-77be1df7f091-EASY	Sample EASY question 3 for Deep Learning?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-2618e1cf-127d-4dd1-b772-77be1df7f091-MEDIUM-1	test-2618e1cf-127d-4dd1-b772-77be1df7f091-MEDIUM	Sample MEDIUM question 1 for Deep Learning?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-2618e1cf-127d-4dd1-b772-77be1df7f091-MEDIUM-2	test-2618e1cf-127d-4dd1-b772-77be1df7f091-MEDIUM	Sample MEDIUM question 2 for Deep Learning?	mcq	["True", "False"]	True	\N	1	2
q-test-2618e1cf-127d-4dd1-b772-77be1df7f091-MEDIUM-3	test-2618e1cf-127d-4dd1-b772-77be1df7f091-MEDIUM	Sample MEDIUM question 3 for Deep Learning?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-2618e1cf-127d-4dd1-b772-77be1df7f091-HARD-1	test-2618e1cf-127d-4dd1-b772-77be1df7f091-HARD	Sample HARD question 1 for Deep Learning?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-2618e1cf-127d-4dd1-b772-77be1df7f091-HARD-2	test-2618e1cf-127d-4dd1-b772-77be1df7f091-HARD	Sample HARD question 2 for Deep Learning?	mcq	["True", "False"]	True	\N	1	2
q-test-2618e1cf-127d-4dd1-b772-77be1df7f091-HARD-3	test-2618e1cf-127d-4dd1-b772-77be1df7f091-HARD	Sample HARD question 3 for Deep Learning?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-03064e4f-1205-4e67-98ca-b6373f0a4b55-EASY-1	test-03064e4f-1205-4e67-98ca-b6373f0a4b55-EASY	Sample EASY question 1 for Natural Language Processing?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-03064e4f-1205-4e67-98ca-b6373f0a4b55-EASY-2	test-03064e4f-1205-4e67-98ca-b6373f0a4b55-EASY	Sample EASY question 2 for Natural Language Processing?	mcq	["True", "False"]	True	\N	1	2
q-test-03064e4f-1205-4e67-98ca-b6373f0a4b55-EASY-3	test-03064e4f-1205-4e67-98ca-b6373f0a4b55-EASY	Sample EASY question 3 for Natural Language Processing?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-03064e4f-1205-4e67-98ca-b6373f0a4b55-MEDIUM-1	test-03064e4f-1205-4e67-98ca-b6373f0a4b55-MEDIUM	Sample MEDIUM question 1 for Natural Language Processing?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-03064e4f-1205-4e67-98ca-b6373f0a4b55-MEDIUM-2	test-03064e4f-1205-4e67-98ca-b6373f0a4b55-MEDIUM	Sample MEDIUM question 2 for Natural Language Processing?	mcq	["True", "False"]	True	\N	1	2
q-test-03064e4f-1205-4e67-98ca-b6373f0a4b55-MEDIUM-3	test-03064e4f-1205-4e67-98ca-b6373f0a4b55-MEDIUM	Sample MEDIUM question 3 for Natural Language Processing?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-03064e4f-1205-4e67-98ca-b6373f0a4b55-HARD-1	test-03064e4f-1205-4e67-98ca-b6373f0a4b55-HARD	Sample HARD question 1 for Natural Language Processing?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-03064e4f-1205-4e67-98ca-b6373f0a4b55-HARD-2	test-03064e4f-1205-4e67-98ca-b6373f0a4b55-HARD	Sample HARD question 2 for Natural Language Processing?	mcq	["True", "False"]	True	\N	1	2
q-test-03064e4f-1205-4e67-98ca-b6373f0a4b55-HARD-3	test-03064e4f-1205-4e67-98ca-b6373f0a4b55-HARD	Sample HARD question 3 for Natural Language Processing?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-45d8f8c2-703b-4905-8dff-e37e23726151-EASY-1	test-45d8f8c2-703b-4905-8dff-e37e23726151-EASY	Sample EASY question 1 for Computer Vision?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-45d8f8c2-703b-4905-8dff-e37e23726151-EASY-2	test-45d8f8c2-703b-4905-8dff-e37e23726151-EASY	Sample EASY question 2 for Computer Vision?	mcq	["True", "False"]	True	\N	1	2
q-test-45d8f8c2-703b-4905-8dff-e37e23726151-EASY-3	test-45d8f8c2-703b-4905-8dff-e37e23726151-EASY	Sample EASY question 3 for Computer Vision?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-45d8f8c2-703b-4905-8dff-e37e23726151-MEDIUM-1	test-45d8f8c2-703b-4905-8dff-e37e23726151-MEDIUM	Sample MEDIUM question 1 for Computer Vision?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-45d8f8c2-703b-4905-8dff-e37e23726151-MEDIUM-2	test-45d8f8c2-703b-4905-8dff-e37e23726151-MEDIUM	Sample MEDIUM question 2 for Computer Vision?	mcq	["True", "False"]	True	\N	1	2
q-test-45d8f8c2-703b-4905-8dff-e37e23726151-MEDIUM-3	test-45d8f8c2-703b-4905-8dff-e37e23726151-MEDIUM	Sample MEDIUM question 3 for Computer Vision?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-45d8f8c2-703b-4905-8dff-e37e23726151-HARD-1	test-45d8f8c2-703b-4905-8dff-e37e23726151-HARD	Sample HARD question 1 for Computer Vision?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-45d8f8c2-703b-4905-8dff-e37e23726151-HARD-2	test-45d8f8c2-703b-4905-8dff-e37e23726151-HARD	Sample HARD question 2 for Computer Vision?	mcq	["True", "False"]	True	\N	1	2
q-test-45d8f8c2-703b-4905-8dff-e37e23726151-HARD-3	test-45d8f8c2-703b-4905-8dff-e37e23726151-HARD	Sample HARD question 3 for Computer Vision?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-5a9e25a1-6da1-4288-8951-bc8060a9127e-EASY-1	test-5a9e25a1-6da1-4288-8951-bc8060a9127e-EASY	Sample EASY question 1 for Generative AI?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-5a9e25a1-6da1-4288-8951-bc8060a9127e-EASY-2	test-5a9e25a1-6da1-4288-8951-bc8060a9127e-EASY	Sample EASY question 2 for Generative AI?	mcq	["True", "False"]	True	\N	1	2
q-test-5a9e25a1-6da1-4288-8951-bc8060a9127e-EASY-3	test-5a9e25a1-6da1-4288-8951-bc8060a9127e-EASY	Sample EASY question 3 for Generative AI?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-5a9e25a1-6da1-4288-8951-bc8060a9127e-MEDIUM-1	test-5a9e25a1-6da1-4288-8951-bc8060a9127e-MEDIUM	Sample MEDIUM question 1 for Generative AI?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-5a9e25a1-6da1-4288-8951-bc8060a9127e-MEDIUM-2	test-5a9e25a1-6da1-4288-8951-bc8060a9127e-MEDIUM	Sample MEDIUM question 2 for Generative AI?	mcq	["True", "False"]	True	\N	1	2
q-test-5a9e25a1-6da1-4288-8951-bc8060a9127e-MEDIUM-3	test-5a9e25a1-6da1-4288-8951-bc8060a9127e-MEDIUM	Sample MEDIUM question 3 for Generative AI?	mcq	["Yes", "No"]	Yes	\N	1	3
q-test-5a9e25a1-6da1-4288-8951-bc8060a9127e-HARD-1	test-5a9e25a1-6da1-4288-8951-bc8060a9127e-HARD	Sample HARD question 1 for Generative AI?	mcq	["A", "B", "C", "D"]	A	\N	1	1
q-test-5a9e25a1-6da1-4288-8951-bc8060a9127e-HARD-2	test-5a9e25a1-6da1-4288-8951-bc8060a9127e-HARD	Sample HARD question 2 for Generative AI?	mcq	["True", "False"]	True	\N	1	2
q-test-5a9e25a1-6da1-4288-8951-bc8060a9127e-HARD-3	test-5a9e25a1-6da1-4288-8951-bc8060a9127e-HARD	Sample HARD question 3 for Generative AI?	mcq	["Yes", "No"]	Yes	\N	1	3
\.


--
-- Data for Name: user_credits; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.user_credits (id, user_id, credit_type, balance, updated_at) FROM stdin;
\.


--
-- Data for Name: user_skills; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.user_skills (id, user_id, skill_id, proficiency_level, source, is_verified, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_subscriptions; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.user_subscriptions (id, user_id, plan_id, razorpay_customer_id, razorpay_subscription_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: smartcareer
--

COPY public.users (id, email, password_hash, name, avatar_url, is_verified, verify_token, reset_token, reset_expires, created_at, updated_at, role, admin_for_institution_id, institution_id, target_job_role_id) FROM stdin;
167f1894-99c7-42f2-9cc5-1cdc1bff8cdb	admin@smartcareer.ai	$2a$12$i4e9gjrxK1fDya2hE7U/7Og15etq9wlD/Qu1FItgiWpUn3Cu4qWAK	System Administrator	\N	t	\N	\N	\N	2026-01-19 16:42:50.263	2026-01-19 16:42:50.263	ADMIN	\N	\N	\N
873ae090-8e26-4bfa-b9b7-e6b7c5688ee3	recruiter@techhunters.io	$2a$12$DwL2ekE77d.6Q09AGCIdoedgF.tWm/YY30YHqH78oG0ROxhysrwkS	Tech Recruiter	\N	t	\N	\N	\N	2026-01-19 16:42:50.576	2026-01-19 16:42:50.576	RECRUITER	\N	\N	\N
22222222-2222-2222-2222-222222222222	admin@demo.edu	$2a$10$yzPIuTiQqipJlJDwNMfKMOdaPhVxQMp.zxyI1TGVqsRbUUNx95fh2	Institution Admin	\N	t	\N	\N	\N	2026-01-19 16:46:10.68	2026-01-19 16:46:10.68	INSTITUTION_ADMIN	11111111-1111-1111-1111-111111111111	\N	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: ats_scores ats_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.ats_scores
    ADD CONSTRAINT ats_scores_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: credit_transactions credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_pkey PRIMARY KEY (id);


--
-- Name: institutions institutions_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_pkey PRIMARY KEY (id);


--
-- Name: interview_questions interview_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT interview_questions_pkey PRIMARY KEY (id);


--
-- Name: interview_sessions interview_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.interview_sessions
    ADD CONSTRAINT interview_sessions_pkey PRIMARY KEY (id);


--
-- Name: job_listings job_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.job_listings
    ADD CONSTRAINT job_listings_pkey PRIMARY KEY (id);


--
-- Name: job_role_cache job_role_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.job_role_cache
    ADD CONSTRAINT job_role_cache_pkey PRIMARY KEY (id);


--
-- Name: job_roles job_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.job_roles
    ADD CONSTRAINT job_roles_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: recruiter_jobs recruiter_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.recruiter_jobs
    ADD CONSTRAINT recruiter_jobs_pkey PRIMARY KEY (id);


--
-- Name: recruiters recruiters_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.recruiters
    ADD CONSTRAINT recruiters_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (id);


--
-- Name: saved_candidates saved_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.saved_candidates
    ADD CONSTRAINT saved_candidates_pkey PRIMARY KEY (id);


--
-- Name: skill_badges skill_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.skill_badges
    ADD CONSTRAINT skill_badges_pkey PRIMARY KEY (id);


--
-- Name: skill_tests skill_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.skill_tests
    ADD CONSTRAINT skill_tests_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: test_attempts test_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_pkey PRIMARY KEY (id);


--
-- Name: test_questions test_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_pkey PRIMARY KEY (id);


--
-- Name: user_credits user_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_pkey PRIMARY KEY (id);


--
-- Name: user_skills user_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: applications_user_id_job_id_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX applications_user_id_job_id_key ON public.applications USING btree (user_id, job_id);


--
-- Name: credit_transactions_user_id_credit_type_idx; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE INDEX credit_transactions_user_id_credit_type_idx ON public.credit_transactions USING btree (user_id, credit_type);


--
-- Name: institutions_domain_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX institutions_domain_key ON public.institutions USING btree (domain);


--
-- Name: job_listings_location_idx; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE INDEX job_listings_location_idx ON public.job_listings USING btree (location);


--
-- Name: job_listings_source_external_id_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX job_listings_source_external_id_key ON public.job_listings USING btree (source, external_id);


--
-- Name: job_listings_title_company_idx; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE INDEX job_listings_title_company_idx ON public.job_listings USING btree (title, company);


--
-- Name: job_role_cache_job_role_id_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX job_role_cache_job_role_id_key ON public.job_role_cache USING btree (job_role_id);


--
-- Name: job_roles_title_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX job_roles_title_key ON public.job_roles USING btree (title);


--
-- Name: recruiters_user_id_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX recruiters_user_id_key ON public.recruiters USING btree (user_id);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: saved_candidates_recruiter_id_candidate_id_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX saved_candidates_recruiter_id_candidate_id_key ON public.saved_candidates USING btree (recruiter_id, candidate_id);


--
-- Name: skill_badges_test_attempt_id_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX skill_badges_test_attempt_id_key ON public.skill_badges USING btree (test_attempt_id);


--
-- Name: skill_badges_user_id_skill_id_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX skill_badges_user_id_skill_id_key ON public.skill_badges USING btree (user_id, skill_id);


--
-- Name: skills_name_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX skills_name_key ON public.skills USING btree (name);


--
-- Name: subscription_plans_name_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX subscription_plans_name_key ON public.subscription_plans USING btree (name);


--
-- Name: user_credits_user_id_credit_type_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX user_credits_user_id_credit_type_key ON public.user_credits USING btree (user_id, credit_type);


--
-- Name: user_skills_user_id_skill_id_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX user_skills_user_id_skill_id_key ON public.user_skills USING btree (user_id, skill_id);


--
-- Name: user_subscriptions_user_id_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX user_subscriptions_user_id_key ON public.user_subscriptions USING btree (user_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: smartcareer
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_listings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: applications applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ats_scores ats_scores_resume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.ats_scores
    ADD CONSTRAINT ats_scores_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ats_scores ats_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.ats_scores
    ADD CONSTRAINT ats_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: courses courses_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: credit_transactions credit_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interview_questions interview_questions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT interview_questions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.interview_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interview_sessions interview_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.interview_sessions
    ADD CONSTRAINT interview_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_role_cache job_role_cache_job_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.job_role_cache
    ADD CONSTRAINT job_role_cache_job_role_id_fkey FOREIGN KEY (job_role_id) REFERENCES public.job_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recruiter_jobs recruiter_jobs_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.recruiter_jobs
    ADD CONSTRAINT recruiter_jobs_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.recruiters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recruiters recruiters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.recruiters
    ADD CONSTRAINT recruiters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: resumes resumes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saved_candidates saved_candidates_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.saved_candidates
    ADD CONSTRAINT saved_candidates_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.recruiters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_badges skill_badges_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.skill_badges
    ADD CONSTRAINT skill_badges_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_badges skill_badges_test_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.skill_badges
    ADD CONSTRAINT skill_badges_test_attempt_id_fkey FOREIGN KEY (test_attempt_id) REFERENCES public.test_attempts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: skill_badges skill_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.skill_badges
    ADD CONSTRAINT skill_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_tests skill_tests_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.skill_tests
    ADD CONSTRAINT skill_tests_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: test_attempts test_attempts_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.skill_tests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: test_attempts test_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: test_questions test_questions_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.skill_tests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_credits user_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_skills user_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_skills user_skills_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_admin_for_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_admin_for_institution_id_fkey FOREIGN KEY (admin_for_institution_id) REFERENCES public.institutions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_target_job_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smartcareer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_target_job_role_id_fkey FOREIGN KEY (target_job_role_id) REFERENCES public.job_roles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: smartcareer
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict jD4iJSKEf3yhFc68jreTxzvUzDRtBbEZSmtNlcRF2ySyslkU5Jgy7JhlcwL0DGC

