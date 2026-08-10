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

EXTRACTION_SYSTEM = """Extract placement intent from the student's message. Return ONLY compact JSON:
{{
  "target_companies":[],
  "target_roles":[],
  "interview_date":null,
  "preparation_duration_days":14,
  "process_rounds":[],
  "skill_gaps":[],
  "current_skills":[],
  "preferences":{{"study_hours_per_day":4,"focus_areas":["DSA","System Design"]}}
}}
Return valid JSON only. No markdown. No extra text."""

EXTRACTION_HUMAN = "Student message: {user_message}"

extraction_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(EXTRACTION_SYSTEM),
    HumanMessagePromptTemplate.from_template(EXTRACTION_HUMAN),
])


# ─────────────────────────────────────────────────────────────
# Company Summary Chain
# ─────────────────────────────────────────────────────────────

COMPANY_SUMMARY_SYSTEM = """Summarise a company's placement profile from search results. Return ONLY compact JSON:
{{
  "company_name":"",
  "overview":"1-2 sentences about the company.",
  "common_topics":[],
  "tech_stack":[],
  "past_interview_experiences":[],
  "tips":[]
}}
Max 3 items per list. Return valid JSON only. No markdown."""

COMPANY_SUMMARY_HUMAN = "Company: {company_name}\n\nSearch results:\n{search_results}"

company_summary_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(COMPANY_SUMMARY_SYSTEM),
    HumanMessagePromptTemplate.from_template(COMPANY_SUMMARY_HUMAN),
])


# ─────────────────────────────────────────────────────────────
# Recall Chain
# ─────────────────────────────────────────────────────────────

RECALL_SYSTEM = """Generate exactly {n_questions} practice questions for the topic. Return ONLY a JSON array:
[{{"question":"","answer":"","difficulty":"medium","topic":"","question_type":"conceptual"}}]
Keep answers under 2 sentences. Return valid JSON only. No markdown."""

RECALL_HUMAN = "Topic: {topic}\n\nAdditional context:\n{context}"

recall_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(RECALL_SYSTEM),
    HumanMessagePromptTemplate.from_template(RECALL_HUMAN),
])


# ─────────────────────────────────────────────────────────────
# Curriculum Chain
# ─────────────────────────────────────────────────────────────

CURRICULUM_SYSTEM = """Create a {duration_days}-day placement study plan for {companies}, starting from Day {start_day} to Day {end_day}. Return ONLY compact JSON with this exact structure:
{{
  "title": "Company Role Master Curriculum",
  "total_days": {duration_days},
  "days": [
    {{
      "day": {start_day},
      "title": "Day {start_day} — Topic Focus",
      "date": "Day {start_day}",
      "focus_topics": ["DSA", "Core CS"],
      "tasks": [
        {{
          "task_id": "d{start_day}_1",
          "title": "Task title",
          "type": "coding",
          "difficulty": "Medium",
          "estimated_minutes": 90,
          "status": "pending",
          "priority": "high"
        }}
      ]
    }}
  ]
}}

Rules:
- task type must be one of: "coding", "aptitude", "core"
- difficulty must be one of: "Easy", "Medium", "Hard"
- status must always be "pending"
- priority must be one of: "high", "medium", "low"
- task_id must follow pattern: d{{day}}_{{index}} e.g. d{start_day}_1, d{start_day}_2
- Generate EXACTLY {duration_days} days starting from {start_day} to {end_day}. 3-4 tasks per day.
- Return valid JSON only. No markdown. No extra text."""

CURRICULUM_HUMAN = """Companies: {companies} | Roles: {roles} | Days: {duration_days} | Hours/day: {study_hours_per_day}
Interview Rounds: {process_rounds}
Skill gaps: {skill_gaps} | Current skills: {current_skills}"""

curriculum_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(CURRICULUM_SYSTEM),
    HumanMessagePromptTemplate.from_template(CURRICULUM_HUMAN),
])
