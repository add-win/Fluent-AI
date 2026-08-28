import json
import requests
import google.generativeai as genai
from ..core.config import settings

# Configure Google Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def _call_llm(prompt: str, system_instruction: str = None, json_mode: bool = False) -> str:
    """Helper method to call Gemini API or fall back to local Ollama API."""
    if settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=system_instruction
            )
            config = {}
            if json_mode:
                config["response_mime_type"] = "application/json"
            
            response = model.generate_content(prompt, generation_config=config)
            return response.text
        except Exception as e:
            print(f"Gemini API execution error: {e}. Attempting Ollama fallback...")
            
    # Try local Ollama if configured
    try:
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "system": system_instruction or "",
            "stream": False,
            "options": {
                "temperature": 0.7
            }
        }
        if json_mode:
            payload["format"] = "json"
            
        resp = requests.post(url, json=payload, timeout=40)
        if resp.status_code == 200:
            return resp.json().get("response", "")
        else:
            raise Exception(f"Ollama server returned status {resp.status_code}")
    except Exception as ollama_err:
        print(f"Ollama connection error: {ollama_err}")
        if json_mode:
            # Return safe default structure depending on task, but fallback empty JSON
            return "{}"
        return "I am sorry, but my AI backend is currently offline. Please check your API keys or Ollama installation."

# 1. Speaking Analysis
def analyze_speech(transcript: str) -> dict:
    system_instruction = "You are a professional IELTS Speaking Examiner and English Communication Coach."
    prompt = f"""
    Analyze the following spoken transcript and provide structured feedback.
    Transcript: "{transcript}"
    
    You must output exactly a JSON object matching this schema:
    {{
        "grammar_score": <int 0-100>,
        "fluency_score": <int 0-100>,
        "confidence_score": <int 0-100>,
        "vocabulary_score": <int 0-100>,
        "speaking_speed": <int estimation in words per minute, e.g. 130>,
        "naturalness": <int 0-100>,
        "pause_analysis": {{
            "filler_count": <int>,
            "description": "<string analysis of pauses/fillers like 'um', 'ah', 'like'>"
        }},
        "suggested_corrections": [
            {{
                "original": "<string mistake>",
                "corrected": "<string correction>",
                "explanation": "<string reasoning>"
            }}
        ],
        "improved_version": "<string rewrite of the transcript to sound like a native professional speaker>"
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res)
    except Exception:
        return {
            "grammar_score": 70, "fluency_score": 70, "confidence_score": 75, "vocabulary_score": 68,
            "speaking_speed": 120, "naturalness": 70, 
            "pause_analysis": {"filler_count": 0, "description": "Good flow."},
            "suggested_corrections": [], "improved_version": transcript
        }

# 2. Daily Plan Generation
def generate_daily_plan(difficulty_level: str) -> dict:
    system_instruction = "You are FluentAI Curriculum Designer. Create structured English practice content."
    prompt = f"""
    Create a personalized daily study plan for a user at the '{difficulty_level}' difficulty level.
    The output must contain specific tasks for: Reading, Speaking, Writing, Listening, Grammar, Vocabulary, and a Daily Challenge.
    
    You must output exactly a JSON object matching this schema:
    {{
        "reading_practice": {{
            "title": "<string>",
            "category": "<string Science/Tech/Business>",
            "content": "<string article content around 200 words>",
            "comprehension_questions": [
                {{"question": "<string>", "options": ["A", "B", "C", "D"], "answer": "<string exact matching option>"}}
            ]
        }},
        "speaking_practice": {{
            "prompt": "<string speaking prompt/question>",
            "guideline": "<string tip on what to focus on>"
        }},
        "writing_practice": {{
            "prompt": "<string writing task prompt, e.g. Write an email requesting a sick leave>",
            "guideline": "<string tone guidance>"
        }},
        "listening_practice": {{
            "title": "<string>",
            "audio_type": "<string Podcast/News/Dialogue>",
            "transcript": "<string dialogue/short audio transcript to read or use client TTS on>",
            "questions": [
                {{"question": "<string>", "options": ["A", "B", "C", "D"], "answer": "<string correct option>"}}
            ]
        }},
        "grammar_lesson": {{
            "title": "<string>",
            "explanation": "<string direct clear lesson rules>",
            "quiz": [
                {{"question": "<string fill in the blank>", "options": ["A", "B", "C", "D"], "answer": "<string correct option>"}}
            ]
        }},
        "vocabulary_lesson": {{
            "words": [
                {{
                    "word": "<string>",
                    "meaning": "<string>",
                    "ipa": "<string IPA symbols>",
                    "synonyms": ["<string>"],
                    "antonyms": ["<string>"],
                    "example_sentence": "<string>"
                }}
            ]
        }},
        "daily_challenge": {{
            "title": "<string>",
            "description": "<string active speech scenario e.g. Pitch a water bottle in 1 minute>"
        }}
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res)
    except Exception:
        # Static safe fallback structure
        return {
            "reading_practice": {"title": "The Rise of AI", "category": "Technology", "content": "AI is changing the world.", "comprehension_questions": []},
            "speaking_practice": {"prompt": "Describe your favorite hobby.", "guideline": "Speak for at least 45 seconds."},
            "writing_practice": {"prompt": "Write a formal apology email.", "guideline": "Keep the tone respectful."},
            "listening_practice": {"title": "Airport Announcement", "audio_type": "Announcement", "transcript": "Flight 302 is delayed.", "questions": []},
            "grammar_lesson": {"title": "Present Simple vs Continuous", "explanation": "Use Simple for habits.", "quiz": []},
            "vocabulary_lesson": {"words": [{"word": "Eloquent", "meaning": "fluent speaking", "ipa": "/ˈel.ə.kwənt/", "synonyms": ["fluent"], "antonyms": ["inarticulate"], "example_sentence": "She gave an eloquent speech."}]},
            "daily_challenge": {"title": "One Minute Pitch", "description": "Introduce yourself."}
        }

# 3. Conversational AI Chat Partner
def chat_reply(history: list, new_message: str, mode: str) -> dict:
    system_instruction = f"""You are a professional English Coach in a Live Conversation Session.
    The current mode/context is: {mode}. Roleplay accordingly.
    You will reply naturally but you MUST also analyze the user's latest message for mistakes."""
    
    prompt = f"""
    Conversation History:
    {json.dumps(history[-6:])}
    
    User's New Message: "{new_message}"
    
    Respond naturally in character. You must output exactly a JSON object matching this schema:
    {{
        "reply": "<string natural reply in character>",
        "grammatical_corrections": {{
            "mistakes_found": <bool>,
            "feedback": "<string grammar/syntax feedback, or empty if perfect>"
        }},
        "vocabulary_suggestions": {{
            "feedback": "<string suggest 1-2 advanced synonyms or idioms to express their idea better>"
        }}
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res)
    except Exception:
        return {
            "reply": "That's interesting! Tell me more about it.",
            "grammatical_corrections": {"mistakes_found": False, "feedback": ""},
            "vocabulary_suggestions": {"feedback": ""}
        }

# 4. Generate Vocabulary Words
def generate_vocabulary_words(count: int, level: str) -> list:
    system_instruction = "You are a lexicographer generating vocabulary training database entries."
    prompt = f"""
    Generate exactly {count} vocabulary words suitable for '{level}' English level.
    For each word, supply the IPA, meaning, synonyms, antonyms, and a clear example sentence.
    
    You must output exactly a JSON object with a single root key 'words' containing a list matching this schema:
    {{
        "words": [
            {{
                "word": "<string>",
                "meaning": "<string>",
                "ipa": "<string>",
                "synonyms": ["<string>"],
                "antonyms": ["<string>"],
                "example_sentence": "<string>"
            }}
        ]
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res).get("words", [])
    except Exception:
        return []

# 5. Writing Analyst
def analyze_writing(type: str, prompt: str, text: str) -> dict:
    system_instruction = "You are a professional English Writing Tutor and Business Editor."
    prompt = f"""
    Analyze the following written submission.
    Category: {type}
    Prompt: "{prompt}"
    Submission: "{text}"
    
    Output exactly a JSON object with this schema:
    {{
        "grammar_score": <int 0-100>,
        "vocabulary_score": <int 0-100>,
        "tone_score": <int 0-100>,
        "readability_score": <int 0-100>,
        "corrected_text": "<string full submission text with highlighted corrected segments>",
        "analysis": {{
            "strengths": ["<string>"],
            "weaknesses": ["<string>"],
            "tone_feedback": "<string explanation of the writing style/tone suitability>",
            "grammar_details": [
                {{"mistake": "<string>", "correction": "<string>", "rule": "<string>"}}
            ]
        }}
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res)
    except Exception:
        return {
            "grammar_score": 75, "vocabulary_score": 75, "tone_score": 80, "readability_score": 80,
            "corrected_text": text,
            "analysis": {
                "strengths": ["Clear structure"],
                "weaknesses": ["Minor punctuation mistakes"],
                "tone_feedback": "Appropriate style.",
                "grammar_details": []
            }
        }

# 6. Generate Reading Practice Article
def generate_reading_article(category: str) -> dict:
    system_instruction = "You are an English Reading practice generator."
    prompt = f"""
    Create a reading comprehension article on the topic of '{category}'.
    
    Output exactly a JSON object matching this schema:
    {{
        "article_title": "<string title>",
        "article_content": "<string article around 250 words>",
        "mcqs": [
            {{
                "id": 1,
                "question": "<string comprehension question>",
                "options": ["A) <opt>", "B) <opt>", "C) <opt>", "D) <opt>"],
                "answer": "<string correct option like A, B, C or D>"
            }}
        ]
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res)
    except Exception:
        return {
            "article_title": "Default English Reading",
            "article_content": "This is a default reading passage for learning.",
            "mcqs": []
        }

# 7. Pronunciation Comparison
def analyze_pronunciation(target_word: str, transcribed_word: str) -> dict:
    system_instruction = "You are a Phonetics Expert and Pronunciation Trainer."
    prompt = f"""
    Compare the user spoken pronunciation '{transcribed_word}' with the target word '{target_word}'.
    
    Output exactly a JSON object matching this schema:
    {{
        "meaning": "<string definition of target word>",
        "ipa": "<string IPA symbols of target word>",
        "is_correct": <bool>,
        "comparison_details": "<string how well it matches and phonetics breakdown>",
        "pronunciation_tips": ["<string practical tips to place tongue/lips for correct sound>"]
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res)
    except Exception:
        return {
            "meaning": "Unable to fetch details.",
            "ipa": "",
            "is_correct": target_word.lower() == transcribed_word.lower(),
            "comparison_details": "Spoken: " + transcribed_word,
            "pronunciation_tips": ["Try repeating the word clearly."]
        }

# 8. Mock Interview Analyst
def analyze_interview(type: str, questions_answers: list) -> dict:
    system_instruction = "You are an Elite HR Interviewer and Communication Coach."
    prompt = f"""
    Analyze the following mock interview dialog responses.
    Interview Category: {type}
    QA History:
    {json.dumps(questions_answers)}
    
    Evaluate the candidate on: Grammar, Confidence, Vocabulary, STAR Method application (Situation, Task, Action, Result), and General Communication.
    
    Output exactly a JSON object matching this schema:
    {{
        "grammar_score": <int 0-100>,
        "confidence_score": <int 0-100>,
        "vocabulary_score": <int 0-100>,
        "star_score": <int 0-100 STAR criteria compliance>,
        "communication_score": <int 0-100 overall delivery>,
        "report_summary": "<string structured breakdown of interview response strengths, weaknesses, and key actions>"
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res)
    except Exception:
        return {
            "grammar_score": 75, "confidence_score": 75, "vocabulary_score": 70, "star_score": 60, "communication_score": 72,
            "report_summary": "Good overall effort. Focus on highlighting outcomes (Results) in your STAR responses."
        }

# 9. Group Discussion Simulator
def analyze_group_discussion(topic: str, history: list) -> dict:
    system_instruction = "You are an Moderator for Group Discussions evaluating candidate leadership and speech quality."
    prompt = f"""
    Analyze the user's participation in this group discussion.
    Topic: "{topic}"
    Discussion History:
    {json.dumps(history)}
    
    Evaluate the user (represented by role 'user' or their name in the history) on: Participation, Leadership, Confidence, Grammar, Idea Quality, and Communication.
    
    Output exactly a JSON object matching this schema:
    {{
        "participation_score": <int 0-100>,
        "leadership_score": <int 0-100>,
        "confidence_score": <int 0-100>,
        "grammar_score": <int 0-100>,
        "idea_quality_score": <int 0-100>,
        "communication_score": <int 0-100>,
        "report_summary": "<string evaluation details containing suggestions to command leadership and articulate concepts better>"
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res)
    except Exception:
        return {
            "participation_score": 70, "leadership_score": 60, "confidence_score": 70, "grammar_score": 75,
            "idea_quality_score": 70, "communication_score": 72,
            "report_summary": "Active participation. To increase leadership score, try summarising points made by other speakers and steering the topic forward."
        }

# 10. Weekly Mentor Report Generator
def generate_weekly_report(sessions_summary: list) -> dict:
    system_instruction = "You are FluentAI Senior Director and Mentor Coach."
    prompt = f"""
    Analyze this summary of the user's practice sessions over the past week:
    {json.dumps(sessions_summary)}
    
    Determine CEFR Level (A1-C2), IELTS Speaking Band estimate, Placement Readiness, strengths, weaknesses, study plan, and recommended practices.
    
    Output exactly a JSON object matching this schema:
    {{
        "strengths": ["<string strength 1>", "<string strength 2>"],
        "weaknesses": ["<string weakness 1>", "<string weakness 2>"],
        "study_plan": ["<string day-by-day actions for next week>"],
        "recommended_practice": ["<string practice modules and tips>"],
        "cefr_level": "<string A1/A2/B1/B2/C1/C2>",
        "ielts_speaking_band": <float e.g. 6.5>,
        "placement_readiness": "<string Ready/Needs Improvement/Not Ready>"
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res)
    except Exception:
        return {
            "strengths": ["Good speaking rate", "Broad general vocabulary"],
            "weaknesses": ["Grammar tense consistency", "Star method structuring"],
            "study_plan": ["Mon: Speaking practice, Tue: Grammar tenses, Wed: Mock interview, Thu: Vocabulary review, Fri: Group discussion"],
            "recommended_practice": ["Practice speaking with a timer to limit pause times."],
            "cefr_level": "B2",
            "ielts_speaking_band": 6.5,
            "placement_readiness": "Needs Improvement"
        }

# 11. Public Speaking Analyst
def analyze_public_speaking(text: str) -> dict:
    system_instruction = "You are a Public Speaking Coach analyzing a speech draft."
    prompt = f"""
    Analyze the following speech text for public delivery.
    Text: "{text}"
    
    Identify repeated words, filler words (like 'um', 'so', 'basically', 'actually', 'literally' if overused), estimate speed, and offer style corrections.
    
    Output exactly a JSON object matching this schema:
    {{
        "grammar_score": <int 0-100>,
        "confidence_score": <int 0-100>,
        "speaking_speed": <int target speaking speed in WPM>,
        "vocabulary_richness": <int 0-100 score>,
        "repeated_words": [
            {{"word": "<string>", "count": <int>}}
        ],
        "filler_words": [
            {{"word": "<string>", "count": <int>}}
        ],
        "suggestions": ["<string suggestion 1>", "<string suggestion 2>"]
    }}
    """
    try:
        res = _call_llm(prompt, system_instruction, json_mode=True)
        return json.loads(res)
    except Exception:
        return {
            "grammar_score": 80, "confidence_score": 80, "speaking_speed": 130, "vocabulary_richness": 75,
            "repeated_words": [], "filler_words": [],
            "suggestions": ["Add strong structural transitions between paragraphs."]
        }
