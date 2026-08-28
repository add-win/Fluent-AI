-- =============================================================================
-- FLUENTAI SUPABASE FRESH DATABASE SETUP & RESET SCRIPT (PERSONAL EDITION)
-- =============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project -> Go to "SQL Editor" on the left menu.
-- 3. Click "+ New query", paste this entire script, and click "Run".
-- =============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables for a clean start (in dependency order)
DROP TABLE IF EXISTS weekly_reports CASCADE;
DROP TABLE IF EXISTS group_discussion_reports CASCADE;
DROP TABLE IF EXISTS interview_reports CASCADE;
DROP TABLE IF EXISTS conversation_history CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS mistake_notebook CASCADE;
DROP TABLE IF EXISTS grammar_progress CASCADE;
DROP TABLE IF EXISTS user_vocabulary CASCADE;
DROP TABLE IF EXISTS vocabulary CASCADE;
DROP TABLE IF EXISTS listening_sessions CASCADE;
DROP TABLE IF EXISTS writing_sessions CASCADE;
DROP TABLE IF EXISTS reading_sessions CASCADE;
DROP TABLE IF EXISTS speaking_sessions CASCADE;
DROP TABLE IF EXISTS daily_plans CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Create Tables

-- Table: profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    username VARCHAR UNIQUE,
    full_name VARCHAR,
    avatar_url VARCHAR,
    daily_streak INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    daily_goal_xp INTEGER DEFAULT 50,
    speaking_score INTEGER DEFAULT 0,
    grammar_score INTEGER DEFAULT 0,
    vocabulary_score INTEGER DEFAULT 0,
    pronunciation_score INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: daily_plans
CREATE TABLE daily_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reading_practice JSONB,
    speaking_practice JSONB,
    writing_practice JSONB,
    listening_practice JSONB,
    grammar_lesson JSONB,
    vocabulary_lesson JSONB,
    daily_challenge JSONB,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: speaking_sessions
CREATE TABLE speaking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    audio_url VARCHAR,
    transcript TEXT,
    grammar_score INTEGER,
    fluency_score INTEGER,
    confidence_score INTEGER,
    vocabulary_score INTEGER,
    speaking_speed INTEGER,
    pause_analysis JSONB,
    naturalness INTEGER,
    suggested_corrections JSONB,
    improved_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: reading_sessions
CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    article_title VARCHAR,
    article_content TEXT,
    category VARCHAR,
    transcript TEXT,
    speed INTEGER,
    pronunciation_score INTEGER,
    accuracy_score INTEGER,
    comprehension_score INTEGER,
    mcqs JSONB,
    user_answers JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: writing_sessions
CREATE TABLE writing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    prompt TEXT,
    user_input TEXT NOT NULL,
    grammar_score INTEGER,
    vocabulary_score INTEGER,
    tone_score INTEGER,
    readability_score INTEGER,
    corrected_text TEXT,
    analysis JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: listening_sessions
CREATE TABLE listening_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    audio_type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    audio_url VARCHAR,
    transcript TEXT,
    questions JSONB NOT NULL,
    user_answers JSONB NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: vocabulary
CREATE TABLE vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR UNIQUE NOT NULL,
    meaning TEXT NOT NULL,
    ipa VARCHAR,
    synonyms JSONB DEFAULT '[]'::jsonb,
    antonyms JSONB DEFAULT '[]'::jsonb,
    example_sentence TEXT,
    difficulty VARCHAR DEFAULT 'Medium'
);

-- Table: user_vocabulary
CREATE TABLE user_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    word_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
    status VARCHAR NOT NULL DEFAULT 'learning',
    review_count INTEGER NOT NULL DEFAULT 0,
    last_reviewed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    bookmarked BOOLEAN NOT NULL DEFAULT FALSE
);

-- Table: grammar_progress
CREATE TABLE grammar_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_key VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'in_progress',
    quiz_score INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: interview_reports
CREATE TABLE interview_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    questions_answers JSONB NOT NULL,
    grammar_score INTEGER,
    confidence_score INTEGER,
    vocabulary_score INTEGER,
    star_score INTEGER,
    communication_score INTEGER,
    report_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: group_discussion_reports
CREATE TABLE group_discussion_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic VARCHAR NOT NULL,
    history JSONB NOT NULL,
    participation_score INTEGER,
    leadership_score INTEGER,
    confidence_score INTEGER,
    grammar_score INTEGER,
    idea_quality_score INTEGER,
    communication_score INTEGER,
    report_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: weekly_reports
CREATE TABLE weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    study_plan JSONB DEFAULT '[]'::jsonb,
    recommended_practice JSONB DEFAULT '[]'::jsonb,
    cefr_level VARCHAR,
    ielts_speaking_band NUMERIC(3, 1),
    placement_readiness VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR UNIQUE NOT NULL,
    description TEXT NOT NULL,
    badge_url VARCHAR,
    xp_reward INTEGER NOT NULL DEFAULT 50
);

-- Table: user_achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Seed Starter Data

-- Initial Personal Profile (Matching PERSONAL_USER_ID)
INSERT INTO profiles (
    id, username, full_name, avatar_url, daily_streak, xp, level,
    speaking_score, grammar_score, vocabulary_score, pronunciation_score, confidence_score
) VALUES (
    '79b9176f-0638-425b-8118-f3f6255c7121',
    'personal',
    'Personal User',
    '',
    1,
    100,
    1,
    70,
    70,
    70,
    70,
    75
) ON CONFLICT (id) DO NOTHING;

-- Initial Achievements
INSERT INTO achievements (name, description, xp_reward) VALUES
('First Steps', 'Complete your first speaking or practice session.', 50),
('Smooth Talker', 'Achieve a Speaking score of 80+ in an assessment.', 100),
('Grammar Guru', 'Complete 5 grammar exercises with high accuracy.', 75),
('Word Collector', 'Add 20 new vocabulary words to your learning list.', 60),
('Interview Ready', 'Complete a full mock interview session.', 120)
ON CONFLICT (name) DO NOTHING;
