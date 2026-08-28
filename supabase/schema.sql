-- Supabase Schema for FluentAI - Personal English Communication Coach

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    daily_streak INT DEFAULT 0,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    daily_goal_xp INT DEFAULT 50,
    speaking_score INT DEFAULT 0,
    grammar_score INT DEFAULT 0,
    vocabulary_score INT DEFAULT 0,
    pronunciation_score INT DEFAULT 0,
    confidence_score INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger to automatically create a profile when a user registers in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url, xp, level, daily_streak)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
        100, -- welcome bonus XP
        1,
        0
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Table: daily_plans
CREATE TABLE IF NOT EXISTS public.daily_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    reading_practice JSONB,
    speaking_practice JSONB,
    writing_practice JSONB,
    listening_practice JSONB,
    grammar_lesson JSONB,
    vocabulary_lesson JSONB,
    daily_challenge JSONB,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: speaking_sessions
CREATE TABLE IF NOT EXISTS public.speaking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    audio_url TEXT,
    transcript TEXT,
    grammar_score INT,
    fluency_score INT,
    confidence_score INT,
    vocabulary_score INT,
    speaking_speed INT, -- WPM
    pause_analysis JSONB,
    naturalness INT,
    suggested_corrections JSONB, -- JSON array of mistakes/corrections
    improved_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: reading_sessions
CREATE TABLE IF NOT EXISTS public.reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    article_title TEXT,
    article_content TEXT,
    category TEXT,
    transcript TEXT,
    speed INT, -- WPM
    pronunciation_score INT,
    accuracy_score INT,
    comprehension_score INT,
    mcqs JSONB,
    user_answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: writing_sessions
CREATE TABLE IF NOT EXISTS public.writing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- essay, email, paragraph, story, resume, cover_letter
    prompt TEXT,
    user_input TEXT NOT NULL,
    grammar_score INT,
    vocabulary_score INT,
    tone_score INT,
    readability_score INT,
    corrected_text TEXT,
    analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: listening_sessions
CREATE TABLE IF NOT EXISTS public.listening_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    audio_type TEXT NOT NULL, -- podcast, news, conversation
    title TEXT NOT NULL,
    audio_url TEXT,
    transcript TEXT,
    questions JSONB NOT NULL,
    user_answers JSONB NOT NULL,
    score INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: vocabulary (Global word bank)
CREATE TABLE IF NOT EXISTS public.vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT UNIQUE NOT NULL,
    meaning TEXT NOT NULL,
    ipa TEXT,
    synonyms JSONB DEFAULT '[]'::jsonb,
    antonyms JSONB DEFAULT '[]'::jsonb,
    example_sentence TEXT,
    difficulty TEXT DEFAULT 'Medium' -- Beginner, Intermediate, Advanced
);

-- Table: user_vocabulary (User mappings for vocabulary builder)
CREATE TABLE IF NOT EXISTS public.user_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    word_id UUID REFERENCES public.vocabulary(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'learning' NOT NULL, -- learning, mastered
    review_count INT DEFAULT 0 NOT NULL,
    last_reviewed TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    bookmarked BOOLEAN DEFAULT FALSE NOT NULL,
    UNIQUE (profile_id, word_id)
);

-- Table: grammar_progress
CREATE TABLE IF NOT EXISTS public.grammar_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_key TEXT NOT NULL, -- tenses, articles, prepositions, voice, etc.
    status TEXT DEFAULT 'in_progress' NOT NULL, -- in_progress, completed
    quiz_score INT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (profile_id, lesson_key)
);

-- Table: mistake_notebook
CREATE TABLE IF NOT EXISTS public.mistake_notebook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- grammar, vocabulary, pronunciation
    original_text TEXT NOT NULL,
    corrected_text TEXT NOT NULL,
    explanation TEXT NOT NULL,
    context_sentence TEXT,
    reviewed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: achievements
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    badge_url TEXT,
    xp_reward INT DEFAULT 50 NOT NULL
);

-- Table: user_achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (profile_id, achievement_id)
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- daily_reminder, weekly_report, vocabulary_reminder, speaking_reminder
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: conversation_history
CREATE TABLE IF NOT EXISTS public.conversation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_id UUID NOT NULL,
    role TEXT NOT NULL, -- user, assistant
    mode TEXT NOT NULL, -- casual, travel, college, interview, office, public_speaking, group_discussion, storytelling, debate
    content TEXT NOT NULL,
    grammatical_corrections JSONB,
    vocabulary_suggestions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: interview_reports
CREATE TABLE IF NOT EXISTS public.interview_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- hr, technical, behavioral, campus, communication
    questions_answers JSONB NOT NULL,
    grammar_score INT,
    confidence_score INT,
    vocabulary_score INT,
    star_score INT, -- STAR method usage score
    communication_score INT,
    report_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: group_discussion_reports
CREATE TABLE IF NOT EXISTS public.group_discussion_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    topic TEXT NOT NULL,
    history JSONB NOT NULL,
    participation_score INT,
    leadership_score INT,
    confidence_score INT,
    grammar_score INT,
    idea_quality_score INT,
    communication_score INT,
    report_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: weekly_reports
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    study_plan JSONB DEFAULT '[]'::jsonb,
    recommended_practice JSONB DEFAULT '[]'::jsonb,
    cefr_level TEXT,
    ielts_speaking_band NUMERIC(3, 1),
    placement_readiness TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed basic achievements
INSERT INTO public.achievements (name, description, badge_url, xp_reward) VALUES
('First Steps', 'Complete your first practice session.', 'badge_first_steps.png', 50),
('Word Smith', 'Learn 25 vocabulary words.', 'badge_wordsmith.png', 100),
('Grammar Guru', 'Complete all grammar challenges.', 'badge_grammar_guru.png', 150),
('Smooth Talker', 'Achieve a Speaking score of 80+.', 'badge_smooth_talker.png', 200),
('Streak Master', 'Maintain a 7-day practice streak.', 'badge_streak_master.png', 250)
ON CONFLICT (name) DO NOTHING;

-- RLS (Row Level Security) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_notebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_discussion_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Users can read their own profiles" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read/write their own daily plans" ON public.daily_plans FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users can read/write their own speaking sessions" ON public.speaking_sessions FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users can read/write their own reading sessions" ON public.reading_sessions FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users can read/write their own writing sessions" ON public.writing_sessions FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users can read/write their own listening sessions" ON public.listening_sessions FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Vocabulary table is readable by everyone" ON public.vocabulary FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read/write their own vocabulary progress" ON public.user_vocabulary FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Users can read/write their own grammar progress" ON public.grammar_progress FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users can read/write their own mistakes" ON public.mistake_notebook FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Achievements are readable by everyone" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read their own achievements" ON public.user_achievements FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Users can read/write their own notifications" ON public.notifications FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users can read/write their own conversations" ON public.conversation_history FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Users can read/write their own interview reports" ON public.interview_reports FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users can read/write their own group discussion reports" ON public.group_discussion_reports FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users can read/write their own weekly reports" ON public.weekly_reports FOR ALL USING (auth.uid() = profile_id);
