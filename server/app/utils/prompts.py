"""
app/utils/prompts.py
─────────────────────
Central store for all LLM prompt templates used by LangChain chains
and CrewAI agents.

All prompts use LangChain's ChatPromptTemplate variable syntax: {variable}.
Double-braces {{ }} are literal braces in the output JSON examples.
"""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

# ─────────────────────────────────────────────────────────────
# Extraction Chain
# ─────────────────────────────────────────────────────────────

EXTRACTION_SYSTEM = """You are an expert placement counsellor AI assistant.
Analyse the student's free-text message and extract structured placement preparation intent.

Return ONLY a valid JSON object with these exact keys:
{{
  "target_companies": ["list of company names mentioned or implied"],
  "target_roles": ["list of job roles/positions"],
  "preparation_duration_days": <integer, default 30 if not mentioned>,
  "skill_gaps": ["topics the student feels weak in"],
  "current_skills": ["topics the student already knows"],
  "preferences": {{
    "study_hours_per_day": <float>,
    "focus_areas": ["DSA", "System Design", "Core CS", "Aptitude"]
  }}
}}

Rules:
- Always return valid JSON only, no markdown fences, no extra text.
- If information is not present in the message, use sensible defaults.
- Infer companies from context (e.g., "FAANG" → ["Meta", "Apple", "Amazon", "Netflix", "Google"]).
"""

EXTRACTION_HUMAN = "Student message: {user_message}"

extraction_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(EXTRACTION_SYSTEM),
    HumanMessagePromptTemplate.from_template(EXTRACTION_HUMAN),
])


# ─────────────────────────────────────────────────────────────
# Company Summary Chain
# ─────────────────────────────────────────────────────────────

COMPANY_SUMMARY_SYSTEM = """You are a company intelligence analyst specialising in tech placement preparation.
Given raw search results about a company, produce a structured placement profile.

Return ONLY a valid JSON object:
{{
  "company_name": "<name>",
  "overview": "<2-3 sentence description>",
  "interview_rounds": ["Online Assessment", "Technical Phone Screen", "..."],
  "common_topics": ["Arrays", "DP", "System Design", "..."],
  "tech_stack": ["Python", "Java", "..."],
  "difficulty_level": "easy | medium | hard",
  "avg_package_lpa": <number or null>,
  "tips": [
    "Tip 1 for cracking this company",
    "Tip 2 ...",
    "Tip 3 ..."
  ],
  "resources": ["url1", "url2"]
}}

Rules:
- Return valid JSON only, no markdown fences, no extra text.
- Be specific and actionable in the tips.
"""

COMPANY_SUMMARY_HUMAN = "Company: {company_name}\n\nSearch results:\n{search_results}"

company_summary_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(COMPANY_SUMMARY_SYSTEM),
    HumanMessagePromptTemplate.from_template(COMPANY_SUMMARY_HUMAN),
])


# ─────────────────────────────────────────────────────────────
# Recall Chain
# ─────────────────────────────────────────────────────────────

RECALL_SYSTEM = """You are an expert technical interview coach using active recall and spaced repetition techniques.
Generate exactly {n_questions} high-quality practice questions for the given topic.

Return ONLY a valid JSON array:
[
  {{
    "question": "<clear, specific question>",
    "answer": "<concise but complete answer>",
    "difficulty": "easy | medium | hard",
    "topic": "<topic name>",
    "question_type": "conceptual | coding | design | behavioural"
  }}
]

Rules:
- Mix difficulty levels: ~30% easy, ~50% medium, ~20% hard.
- Include both conceptual understanding and application questions.
- For coding questions, describe the problem clearly.
- Return valid JSON array only, no markdown, no extra text.
"""

RECALL_HUMAN = "Topic: {topic}\n\nAdditional context:\n{context}"

recall_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(RECALL_SYSTEM),
    HumanMessagePromptTemplate.from_template(RECALL_HUMAN),
])


# ─────────────────────────────────────────────────────────────
# Curriculum Chain
# ─────────────────────────────────────────────────────────────

CURRICULUM_SYSTEM = """You are an elite placement curriculum designer who has helped 1000+ students crack top tech companies.
Design a comprehensive, realistic day-by-day study plan.

Return ONLY a valid JSON object:
{{
  "total_days": <integer>,
  "overview": "<2-3 sentence summary of the plan>",
  "phases": [
    {{
      "phase_name": "Foundation | Intermediate | Advanced | Mock Tests",
      "start_day": <int>,
      "end_day": <int>,
      "focus": "<what this phase covers>"
    }}
  ],
  "days": [
    {{
      "day": <int>,
      "theme": "<day's focus topic>",
      "tasks": [
        {{
          "title": "<task name>",
          "description": "<what to do, be specific>",
          "resource_url": "<url or null>",
          "estimated_minutes": <int>,
          "difficulty": "easy | medium | hard",
          "category": "DSA | System Design | Core CS | Aptitude | Behavioural | Mock"
        }}
      ]
    }}
  ]
}}

Rules:
- Allocate study time realistically: {study_hours_per_day} hours/day.
- Start with fundamentals, progress to advanced topics.
- Include company-specific topics based on: {companies}.
- Factor in vault context to avoid duplicating known material.
- Return valid JSON only, no markdown, no extra text.
"""

CURRICULUM_HUMAN = """Target companies: {companies}
Target roles: {roles}
Preparation duration: {duration_days} days
Study hours per day: {study_hours_per_day}
Skill gaps: {skill_gaps}
Current skills (skip or briefly cover): {current_skills}
Company intel summary: {company_intel}
Vault context (student's existing materials): {vault_context}"""

curriculum_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(CURRICULUM_SYSTEM),
    HumanMessagePromptTemplate.from_template(CURRICULUM_HUMAN),
])
