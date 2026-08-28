from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Numeric, JSON, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    username = Column(String, unique=True)
    full_name = Column(String)
    avatar_url = Column(String)
    daily_streak = Column(Integer, default=0)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    daily_goal_xp = Column(Integer, default=50)
    speaking_score = Column(Integer, default=0)
    grammar_score = Column(Integer, default=0)
    vocabulary_score = Column(Integer, default=0)
    pronunciation_score = Column(Integer, default=0)
    confidence_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    daily_plans = relationship("DailyPlan", back_populates="profile", cascade="all, delete-orphan")
    speaking_sessions = relationship("SpeakingSession", back_populates="profile", cascade="all, delete-orphan")
    reading_sessions = relationship("ReadingSession", back_populates="profile", cascade="all, delete-orphan")
    writing_sessions = relationship("WritingSession", back_populates="profile", cascade="all, delete-orphan")
    listening_sessions = relationship("ListeningSession", back_populates="profile", cascade="all, delete-orphan")
    user_vocabulary = relationship("UserVocabulary", back_populates="profile", cascade="all, delete-orphan")
    grammar_progress = relationship("GrammarProgress", back_populates="profile", cascade="all, delete-orphan")
    mistakes = relationship("MistakeNotebook", back_populates="profile", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="profile", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="profile", cascade="all, delete-orphan")
    conversations = relationship("ConversationHistory", back_populates="profile", cascade="all, delete-orphan")
    interview_reports = relationship("InterviewReport", back_populates="profile", cascade="all, delete-orphan")
    group_discussion_reports = relationship("GroupDiscussionReport", back_populates="profile", cascade="all, delete-orphan")
    weekly_reports = relationship("WeeklyReport", back_populates="profile", cascade="all, delete-orphan")


class DailyPlan(Base):
    __tablename__ = "daily_plans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=datetime.date.today, nullable=False)
    reading_practice = Column(JSON)
    speaking_practice = Column(JSON)
    writing_practice = Column(JSON)
    listening_practice = Column(JSON)
    grammar_lesson = Column(JSON)
    vocabulary_lesson = Column(JSON)
    daily_challenge = Column(JSON)
    completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="daily_plans")


class SpeakingSession(Base):
    __tablename__ = "speaking_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    audio_url = Column(String)
    transcript = Column(String)
    grammar_score = Column(Integer)
    fluency_score = Column(Integer)
    confidence_score = Column(Integer)
    vocabulary_score = Column(Integer)
    speaking_speed = Column(Integer) # WPM
    pause_analysis = Column(JSON)
    naturalness = Column(Integer)
    suggested_corrections = Column(JSON) # JSON list
    improved_version = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="speaking_sessions")


class ReadingSession(Base):
    __tablename__ = "reading_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    article_title = Column(String)
    article_content = Column(String)
    category = Column(String)
    transcript = Column(String)
    speed = Column(Integer) # WPM
    pronunciation_score = Column(Integer)
    accuracy_score = Column(Integer)
    comprehension_score = Column(Integer)
    mcqs = Column(JSON)
    user_answers = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="reading_sessions")


class WritingSession(Base):
    __tablename__ = "writing_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False) # essay, email, paragraph, story, resume, cover_letter
    prompt = Column(String)
    user_input = Column(String, nullable=False)
    grammar_score = Column(Integer)
    vocabulary_score = Column(Integer)
    tone_score = Column(Integer)
    readability_score = Column(Integer)
    corrected_text = Column(String)
    analysis = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="writing_sessions")


class ListeningSession(Base):
    __tablename__ = "listening_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    audio_type = Column(String, nullable=False) # podcast, news, conversation
    title = Column(String, nullable=False)
    audio_url = Column(String)
    transcript = Column(String)
    questions = Column(JSON, nullable=False)
    user_answers = Column(JSON, nullable=False)
    score = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="listening_sessions")


class Vocabulary(Base):
    __tablename__ = "vocabulary"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    word = Column(String, unique=True, nullable=False)
    meaning = Column(String, nullable=False)
    ipa = Column(String)
    synonyms = Column(JSON, default=[])
    antonyms = Column(JSON, default=[])
    example_sentence = Column(String)
    difficulty = Column(String, default="Medium")

    user_vocabularies = relationship("UserVocabulary", back_populates="vocab_item", cascade="all, delete-orphan")


class UserVocabulary(Base):
    __tablename__ = "user_vocabulary"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    word_id = Column(UUID(as_uuid=True), ForeignKey("vocabulary.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="learning", nullable=False) # learning, mastered
    review_count = Column(Integer, default=0, nullable=False)
    last_reviewed = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    bookmarked = Column(Boolean, default=False, nullable=False)

    profile = relationship("Profile", back_populates="user_vocabulary")
    vocab_item = relationship("Vocabulary", back_populates="user_vocabularies")


class GrammarProgress(Base):
    __tablename__ = "grammar_progress"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    lesson_key = Column(String, nullable=False) # tenses, articles, prepositions, voice, etc.
    status = Column(String, default="in_progress", nullable=False) # in_progress, completed
    quiz_score = Column(Integer)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="grammar_progress")


class MistakeNotebook(Base):
    __tablename__ = "mistake_notebook"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False) # grammar, vocabulary, pronunciation
    original_text = Column(String, nullable=False)
    corrected_text = Column(String, nullable=False)
    explanation = Column(String, nullable=False)
    context_sentence = Column(String)
    reviewed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="mistakes")


class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    badge_url = Column(String)
    xp_reward = Column(Integer, default=50, nullable=False)

    user_achievements = relationship("UserAchievement", back_populates="achievement", cascade="all, delete-orphan")


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(UUID(as_uuid=True), ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    unlocked_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False) # daily_reminder, weekly_report, etc.
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="notifications")


class ConversationHistory(Base):
    __tablename__ = "conversation_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(UUID(as_uuid=True), nullable=False)
    role = Column(String, nullable=False) # user, assistant
    mode = Column(String, nullable=False)
    content = Column(String, nullable=False)
    grammatical_corrections = Column(JSON)
    vocabulary_suggestions = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="conversations")


class InterviewReport(Base):
    __tablename__ = "interview_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False) # hr, technical, behavioral, campus, communication
    questions_answers = Column(JSON, nullable=False)
    grammar_score = Column(Integer)
    confidence_score = Column(Integer)
    vocabulary_score = Column(Integer)
    star_score = Column(Integer)
    communication_score = Column(Integer)
    report_summary = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="interview_reports")


class GroupDiscussionReport(Base):
    __tablename__ = "group_discussion_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String, nullable=False)
    history = Column(JSON, nullable=False)
    participation_score = Column(Integer)
    leadership_score = Column(Integer)
    confidence_score = Column(Integer)
    grammar_score = Column(Integer)
    idea_quality_score = Column(Integer)
    communication_score = Column(Integer)
    report_summary = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="group_discussion_reports")


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    strengths = Column(JSON, default=[])
    weaknesses = Column(JSON, default=[])
    study_plan = Column(JSON, default=[])
    recommended_practice = Column(JSON, default=[])
    cefr_level = Column(String)
    ielts_speaking_band = Column(Numeric(3, 1))
    placement_readiness = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="weekly_reports")
