# JobPilot Agent — معماری ایجنت (LangGraph)

## ۱. اصل طراحی
قلب محصول یک **Stateful Agent** است که با LangGraph مدیریت می‌شود.  
ایجنت تصمیم‌گیرنده است: چه سوالی بپرسد، کدام آگهی را پیشنهاد دهد، چه تغییری در رزومه اعمال کند و چه زمانی نتیجه نهایی را تحویل دهد.

## ۲. State اصلی ایجنت (Pydantic Model)

```python
class AgentState(TypedDict):
    user_id: str
    messages: Annotated[list, add_messages]
    profile: dict                    # مهارت‌ها، سطح، ترجیحات، حقوق، لوکیشن
    resume: dict                     # ساختار رزومه فعلی
    job_matches: list[dict]          # آگهی‌های فعلی + امتیاز تناسب + توضیح
    feedback_history: list[dict]     # بازخوردهای کاربر
    current_phase: str               # "gathering_info" | "matching" | "refining" | "final"
    next_action: str                 # تصمیم ایجنت برای مرحله بعد
```

## ۳. گراف اصلی (Nodes)

```
START
  │
  ▼
[gather_info]  ←→  (اگر اطلاعات ناقص باشد دوباره سوال می‌پرسد)
  │
  ▼
[analyze_profile]
  │
  ▼
[search_and_match]  ←  RAG ساده روی آگهی‌ها + LLM برای توضیح تناسب
  │
  ▼
[present_matches]
  │
  ▼
[handle_feedback]  ←→  (حلقه بازخورد)
  │
  ▼
[update_resume_or_search]
  │
  ▼
[finalize] → END
```

## ۴. ابزارهای ایجنت (Tools)
- `update_user_profile(fields: dict)`
- `search_jobs(query: str, filters: dict)`
- `explain_match(job: dict, profile: dict) → str`
- `improve_resume(section: str, feedback: str)`
- `generate_final_package()`

## ۵. مدل‌های زبانی
- Provider: OpenAI (gpt-4o-mini) یا Anthropic (claude-3-5-haiku) — طبق قوانین مسابقه local LLM ممنوع است.
- Embedding: text-embedding-3-small برای RAG روی آگهی‌ها (مجاز است).

## ۶. مدیریت هزینه و کیفیت
- هر فراخوانی LLM لاگ می‌شود (توکن ورودی/خروجی + هزینه تقریبی).
- در UI به کاربر نمایش داده می‌شود که «هزینه بررسی این مرحله» چقدر بوده (برای شفافیت).

## ۷. تست‌پذیری ایجنت
- Unit test برای هر Node
- Integration test برای جریان کامل با mock LLM
- Scenario test: ۳ پروفایل مختلف → نتیجه قابل پیش‌بینی

---
**وضعیت:** تأیید شده | تاریخ: ۱۴۰۴/۰۷/۱۱
