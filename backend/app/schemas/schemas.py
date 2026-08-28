from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from uuid import UUID

# Profiles
class ProfileBase(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileUpdate(ProfileBase):
    daily_streak: Optional[int] = None
    xp: Optional[int] = None
    level: Optional[int] = None
    daily_goal_xp: Optional[int] = None

class ProfileResponse(BaseModel):
    id: UUID
    username: Optional[str]
    full_name: Optional[str]
    avatar_url: Optional[str]
    daily_streak: int
    xp: int
    level: int
    daily_goal_xp: int
    speaking_score: int
    grammar_score: int
    vocabulary_score: int
    pronunciation_score: int
    confidence_score: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Daily Plans
class DailyPlanResponse(BaseModel):
    id: UUID
    profile_id: UUID
    date: date
    reading_practice: Optional[Dict[str, Any]]
    speaking_practice: Optional[Dict[str, Any]]
    writing_practice: Optional[Dict[str, Any]]
    listening_practice: Optional[Dict[str, Any]]
    grammar_lesson: Optional[Dict[str, Any]]
    vocabulary_lesson: Optional[Dict[str, Any]]
    daily_challenge: Optional[Dict[str, Any]]
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Speaking Practice
class SpeakingSessionCreate(BaseModel):
    transcript: Optional[str] = None

class SpeakingSessionResponse(BaseModel):
    id: UUID
    audio_url: Optional[str]
    transcript: Optional[str]
    grammar_score: Optional[int]
    fluency_score: Optional[int]
    confidence_score: Optional[int]
    vocabulary_score: Optional[int]
    speaking_speed: Optional[int]
    pause_analysis: Optional[Dict[str, Any]]
    naturalness: Optional[int]
    suggested_corrections: Optional[List[Any]]
    improved_version: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Reading Sessions
class ReadingSessionCreate(BaseModel):
    article_title: str
    article_content: str
    category: str
    transcript: str
    speed: int
    pronunciation_score: int
    accuracy_score: int
    comprehension_score: int
    mcqs: Optional[List[Any]] = None
    user_answers: Optional[Dict[str, Any]] = None

class ReadingSessionResponse(ReadingSessionCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Writing Sessions
class WritingSessionCreate(BaseModel):
    type: str # essay, email, paragraph, story, resume, cover_letter
    prompt: str
    user_input: str

class WritingSessionResponse(BaseModel):
    id: UUID
    type: str
    prompt: Optional[str]
    user_input: str
    grammar_score: Optional[int]
    vocabulary_score: Optional[int]
    tone_score: Optional[int]
    readability_score: Optional[int]
    corrected_text: Optional[str]
    analysis: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

# Listening Practice
class ListeningSessionCreate(BaseModel):
    audio_type: str
    title: str
    audio_url: Optional[str] = None
    transcript: str
    questions: List[Any]
    user_answers: Dict[str, Any]
    score: int

class ListeningSessionResponse(ListeningSessionCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Vocabulary
class VocabularyBase(BaseModel):
    word: str
    meaning: str
    ipa: Optional[str] = None
    synonyms: Optional[List[str]] = []
    antonyms: Optional[List[str]] = []
    example_sentence: Optional[str] = None
    difficulty: Optional[str] = "Medium"

class VocabularyResponse(VocabularyBase):
    id: UUID

    class Config:
        from_attributes = True

class UserVocabularyUpdate(BaseModel):
    status: Optional[str] = None # learning, mastered
    bookmarked: Optional[bool] = None

class UserVocabularyResponse(BaseModel):
    id: UUID
    profile_id: UUID
    word_id: UUID
    status: str
    review_count: int
    last_reviewed: datetime
    bookmarked: bool
    vocab_item: VocabularyResponse

    class Config:
        from_attributes = True

class VocabularyQuizSubmit(BaseModel):
    word_id: UUID
    correct: bool

# Grammar Progress
class GrammarProgressUpdate(BaseModel):
    lesson_key: str
    status: str # in_progress, completed
    quiz_score: Optional[int] = None

class GrammarProgressResponse(BaseModel):
    id: UUID
    profile_id: UUID
    lesson_key: str
    status: str
    quiz_score: Optional[int]
    updated_at: datetime

    class Config:
        from_attributes = True

# Mistake Notebook
class MistakeNotebookCreate(BaseModel):
    type: str # grammar, vocabulary, pronunciation
    original_text: str
    corrected_text: str
    explanation: str
    context_sentence: Optional[str] = None

class MistakeNotebookResponse(MistakeNotebookCreate):
    id: UUID
    reviewed: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Achievements
class AchievementResponse(BaseModel):
    id: UUID
    name: str
    description: str
    badge_url: Optional[str]
    xp_reward: int

    class Config:
        from_attributes = True

class UserAchievementResponse(BaseModel):
    id: UUID
    profile_id: UUID
    achievement_id: UUID
    unlocked_at: datetime
    achievement: AchievementResponse

    class Config:
        from_attributes = True

# Notifications
class NotificationResponse(BaseModel):
    id: UUID
    profile_id: UUID
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Conversation Partner / Chat
class ChatMessageCreate(BaseModel):
    session_id: UUID
    content: str
    mode: str # casual, travel, etc.

class ChatMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    grammatical_corrections: Optional[Dict[str, Any]]
    vocabulary_suggestions: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

# Interview Reports
class InterviewSessionSubmit(BaseModel):
    type: str # hr, technical, behavioral, campus, communication
    questions_answers: List[Dict[str, Any]]

class InterviewReportResponse(BaseModel):
    id: UUID
    type: str
    questions_answers: List[Dict[str, Any]]
    grammar_score: Optional[int]
    confidence_score: Optional[int]
    vocabulary_score: Optional[int]
    star_score: Optional[int]
    communication_score: Optional[int]
    report_summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Group Discussions
class GroupDiscussionSubmit(BaseModel):
    topic: str
    history: List[Dict[str, Any]]

class GroupDiscussionReportResponse(BaseModel):
    id: UUID
    topic: str
    history: List[Dict[str, Any]]
    participation_score: Optional[int]
    leadership_score: Optional[int]
    confidence_score: Optional[int]
    grammar_score: Optional[int]
    idea_quality_score: Optional[int]
    communication_score: Optional[int]
    report_summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Weekly Reports
class WeeklyReportResponse(BaseModel):
    id: UUID
    start_date: date
    end_date: date
    strengths: List[str]
    weaknesses: List[str]
    study_plan: List[str]
    recommended_practice: List[str]
    cefr_level: Optional[str]
    ielts_speaking_band: Optional[float]
    placement_readiness: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Public Speaking
class PublicSpeakingAnalysisRequest(BaseModel):
    text: str

class PublicSpeakingAnalysisResponse(BaseModel):
    grammar_score: int
    confidence_score: int
    speaking_speed: int
    vocabulary_richness: int
    repeated_words: List[Dict[str, Any]]
    filler_words: List[Dict[str, Any]]
    suggestions: List[str]
