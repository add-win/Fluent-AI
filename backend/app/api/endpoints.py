import datetime
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
import json
import uuid
from uuid import UUID

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import schemas_db as models
from ..schemas import schemas
from ..services import gemini_service, whisper_service

router = APIRouter()

# Gamification Helper
def award_xp(db: Session, profile_id: str, xp_amount: int, trigger_event: str) -> models.Profile:
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id).first()
    if not profile:
        return None
        
    old_level = profile.level
    profile.xp += xp_amount
    
    # 1 level per 500 XP
    new_level = (profile.xp // 500) + 1
    if new_level > old_level:
        profile.level = new_level

    db.commit()
    db.refresh(profile)
    return profile


# --- Profile Endpoints ---

@router.get("/profile", response_model=schemas.ProfileResponse)
def get_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.Profile).filter(models.Profile.id == current_user["id"]).first()
    if not profile:
        # Create profile dynamically if Postgres trigger missed it
        profile = models.Profile(
            id=current_user["id"],
            username=current_user["email"].split("@")[0],
            full_name="",
            avatar_url="",
            xp=100,
            level=1,
            daily_streak=1
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=schemas.ProfileResponse)
def update_profile(
    profile_update: schemas.ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.id == current_user["id"]).first()
    if not profile:
         raise HTTPException(status_code=404, detail="Profile not found")
         
    for key, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, key, value)
        
    profile.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


# --- Dashboard Endpoint ---

@router.get("/dashboard")
def get_dashboard_summary(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_id = current_user["id"]
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id).first()
    if not profile:
        profile = models.Profile(
            id=profile_id,
            username="Personal User",
            speaking_score=70,
            grammar_score=70,
            vocabulary_score=70,
            pronunciation_score=70,
            confidence_score=70,
            xp=100,
            level=1,
            daily_streak=1
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # Calculate average scores
    avg_scores = db.query(
        func.avg(models.SpeakingSession.grammar_score).label("speaking_grammar"),
        func.avg(models.SpeakingSession.fluency_score).label("speaking_fluency"),
        func.avg(models.SpeakingSession.confidence_score).label("speaking_confidence"),
        func.avg(models.SpeakingSession.vocabulary_score).label("speaking_vocab"),
        func.avg(models.SpeakingSession.naturalness).label("speaking_natural")
    ).filter(models.SpeakingSession.profile_id == profile_id).first()

    avg_writing = db.query(
        func.avg(models.WritingSession.grammar_score).label("writing_grammar"),
        func.avg(models.WritingSession.vocabulary_score).label("writing_vocab")
    ).filter(models.WritingSession.profile_id == profile_id).first()

    # Dynamic average calculations or default to profile values
    speaking_avg = int((
        (avg_scores.speaking_grammar or 70) + 
        (avg_scores.speaking_fluency or 70) + 
        (avg_scores.speaking_confidence or 70) + 
        (avg_scores.speaking_vocab or 70)
    ) / 4) if avg_scores.speaking_grammar else profile.speaking_score or 65

    grammar_avg = int(avg_scores.speaking_grammar or 70) if avg_scores.speaking_grammar else profile.grammar_score or 60
    vocab_avg = int(avg_scores.speaking_vocab or 70) if avg_scores.speaking_grammar else profile.vocabulary_score or 60
    confidence_avg = int(avg_scores.speaking_confidence or 75) if avg_scores.speaking_grammar else profile.confidence_score or 70
    
    # Update profile aggregates slowly
    profile.speaking_score = speaking_avg
    profile.grammar_score = grammar_avg
    profile.vocabulary_score = vocab_avg
    profile.confidence_score = confidence_avg
    db.commit()

    # Get achievements
    achievements = db.query(models.UserAchievement).filter(models.UserAchievement.profile_id == profile_id).all()
    
    # Streaks and XP progress
    # Let's count recent activities for weekly charts
    weekly_chart = []
    today = datetime.date.today()
    for i in range(7):
        day = today - datetime.timedelta(days=6-i)
        # Check if speaking, reading, writing occurred on 'day'
        ss_count = db.query(models.SpeakingSession).filter(
            models.SpeakingSession.profile_id == profile_id,
            func.date(models.SpeakingSession.created_at) == day
        ).count()
        ws_count = db.query(models.WritingSession).filter(
            models.WritingSession.profile_id == profile_id,
            func.date(models.WritingSession.created_at) == day
        ).count()
        rs_count = db.query(models.ReadingSession).filter(
            models.ReadingSession.profile_id == profile_id,
            func.date(models.ReadingSession.created_at) == day
        ).count()
        
        weekly_chart.append({
            "name": day.strftime("%a"),
            "Speaking Sessions": ss_count,
            "Writing Sessions": ws_count,
            "Reading Sessions": rs_count,
        })

    return {
        "profile": {
            "username": profile.username,
            "full_name": profile.full_name,
            "avatar_url": profile.avatar_url,
            "level": profile.level,
            "xp": profile.xp,
            "daily_streak": profile.daily_streak,
            "daily_goal_xp": profile.daily_goal_xp,
            "scores": {
                "speaking": speaking_avg,
                "grammar": grammar_avg,
                "vocabulary": vocab_avg,
                "pronunciation": profile.pronunciation_score or 65,
                "confidence": confidence_avg
            }
        },
        "weekly_chart": weekly_chart,
        "unlocked_achievements_count": len(achievements)
    }


# --- AI Personal Coach & Daily Plans ---

@router.get("/daily-plan", response_model=schemas.DailyPlanResponse)
def get_daily_plan(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_id = current_user["id"]
    today = datetime.date.today()
    
    # Check if a plan already exists for today
    plan = db.query(models.DailyPlan).filter(
        models.DailyPlan.profile_id == profile_id,
        models.DailyPlan.date == today
    ).first()
    
    if not plan:
        # Load profile to adjust difficulty
        profile = db.query(models.Profile).filter(models.Profile.id == profile_id).first()
        level = "Intermediate"
        if profile.level > 10:
            level = "Advanced"
        elif profile.level < 3:
            level = "Beginner"
            
        print(f"Generating personal daily plan for level: {level}")
        content = gemini_service.generate_daily_plan(level)
        
        plan = models.DailyPlan(
            profile_id=profile_id,
            date=today,
            reading_practice=content.get("reading_practice"),
            speaking_practice=content.get("speaking_practice"),
            writing_practice=content.get("writing_practice"),
            listening_practice=content.get("listening_practice"),
            grammar_lesson=content.get("grammar_lesson"),
            vocabulary_lesson=content.get("vocabulary_lesson"),
            daily_challenge=content.get("daily_challenge"),
            completed=False
        )
        db.add(plan)
        
        # Add the vocabulary words generated in the plan to global vocab database
        vocab_list = content.get("vocabulary_lesson", {}).get("words", [])
        for v in vocab_list:
            word = v.get("word")
            # If word is new, insert into global list
            exist_word = db.query(models.Vocabulary).filter(models.Vocabulary.word == word).first()
            if not exist_word:
                new_v = models.Vocabulary(
                    word=word,
                    meaning=v.get("meaning"),
                    ipa=v.get("ipa"),
                    synonyms=v.get("synonyms", []),
                    antonyms=v.get("antonyms", []),
                    example_sentence=v.get("example_sentence"),
                    difficulty=level
                )
                db.add(new_v)
                db.flush()
                # Create user vocab entry
                uv = models.UserVocabulary(profile_id=profile_id, word_id=new_v.id)
                db.add(uv)
            else:
                # Map to user if not mapped
                uv_exist = db.query(models.UserVocabulary).filter(
                    models.UserVocabulary.profile_id == profile_id,
                    models.UserVocabulary.word_id == exist_word.id
                ).first()
                if not uv_exist:
                    uv = models.UserVocabulary(profile_id=profile_id, word_id=exist_word.id)
                    db.add(uv)
        
        db.commit()
        db.refresh(plan)
        
    return plan

@router.post("/daily-plan/complete")
def complete_daily_plan(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_id = current_user["id"]
    today = datetime.date.today()
    
    plan = db.query(models.DailyPlan).filter(
        models.DailyPlan.profile_id == profile_id,
        models.DailyPlan.date == today
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="No daily plan found for today.")
        
    if not plan.completed:
        plan.completed = True
        # award XP for completing the daily study challenge
        award_xp(db, profile_id, 150, "Completed Daily Study Plan")
        
        # update streak
        profile = db.query(models.Profile).filter(models.Profile.id == profile_id).first()
        profile.daily_streak += 1
        db.commit()
        
    return {"message": "Daily plan marked complete!", "streak": profile.daily_streak}


# --- Speech to Text ---

@router.post("/stt")
def speech_to_text(
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    if not file:
        raise HTTPException(status_code=400, detail="Missing audio file.")
    try:
        audio_bytes = file.file.read()
        text = whisper_service.transcribe_audio(audio_bytes, file.content_type)
        return {"transcript": text, "text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech transcription error: {str(e)}")


# --- Speaking Evaluator ---

@router.post("/speaking/evaluate", response_model=schemas.SpeakingSessionResponse)
def evaluate_speaking(
    file: Optional[UploadFile] = File(None),
    transcript: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    text = transcript

    if file and hasattr(file, "file") and getattr(file, "filename", None):
        try:
            audio_bytes = file.file.read()
            if audio_bytes and len(audio_bytes) > 0:
                mime = getattr(file, "content_type", "audio/webm") or "audio/webm"
                text = whisper_service.transcribe_audio(audio_bytes, mime)
                print(f"Transcribed Audio successfully: {text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Speech transcription error: {str(e)}")

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Could not capture speech audio. Please speak clearly into the microphone.")


    # Call Gemini analysis
    analysis = gemini_service.analyze_speech(text)
    
    # Store session details in db
    session = models.SpeakingSession(
        profile_id=profile_id,
        transcript=text,
        grammar_score=analysis.get("grammar_score", 70),
        fluency_score=analysis.get("fluency_score", 70),
        confidence_score=analysis.get("confidence_score", 70),
        vocabulary_score=analysis.get("vocabulary_score", 70),
        speaking_speed=analysis.get("speaking_speed", 120),
        pause_analysis=analysis.get("pause_analysis", {}),
        naturalness=analysis.get("naturalness", 70),
        suggested_corrections=analysis.get("suggested_corrections", []),
        improved_version=analysis.get("improved_version", text)
    )
    db.add(session)
    
    # Award XP
    award_xp(db, profile_id, 40, "Speech practice session")
    db.commit()
    db.refresh(session)
    return session


# --- Pronunciation Trainer ---

@router.post("/pronunciation/evaluate")
def evaluate_pronunciation(
    target_word: str = Form(...),
    file: Optional[UploadFile] = File(None),
    transcript: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    spoken_text = transcript

    if file:
        try:
            audio_bytes = file.file.read()
            spoken_text = whisper_service.transcribe_audio(audio_bytes, file.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Speech transcription error: {str(e)}")

    if not spoken_text:
        raise HTTPException(status_code=400, detail="Microphone audio missing.")

    # Call Gemini phonetics comparator
    res = gemini_service.analyze_pronunciation(target_word, spoken_text)
    
    # Update profile pronunciation score
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id).first()
    if res.get("is_correct", False):
        profile.pronunciation_score = min(profile.pronunciation_score + 2, 100)
        award_xp(db, profile_id, 20, f"Correct Pronunciation of: {target_word}")
    else:
        # Save to mistake notebook as pronunciation error
        mistake = models.MistakeNotebook(
            profile_id=profile_id,
            type="pronunciation",
            original_text=spoken_text,
            corrected_text=target_word,
            explanation=res.get("comparison_details", ""),
            context_sentence=f"Tried pronouncing: {target_word}",
            reviewed=False
        )
        db.add(mistake)
        award_xp(db, profile_id, 10, f"Practice pronunciation of: {target_word}")
        
    db.commit()
    return res


# --- Vocabulary Builder ---

@router.get("/vocabulary", response_model=List[schemas.UserVocabularyResponse])
def get_user_vocabulary(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.UserVocabulary).filter(
        models.UserVocabulary.profile_id == current_user["id"]
    ).all()

@router.post("/vocabulary/generate", response_model=List[schemas.VocabularyResponse])
def generate_new_words(
    count: int = 5,
    difficulty: str = "Medium",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    raw_words = gemini_service.generate_vocabulary_words(count, difficulty)
    
    inserted_words = []
    for w in raw_words:
        word = w.get("word")
        # Check if already exists in global list
        exist = db.query(models.Vocabulary).filter(models.Vocabulary.word == word).first()
        if not exist:
            exist = models.Vocabulary(
                word=word,
                meaning=w.get("meaning"),
                ipa=w.get("ipa"),
                synonyms=w.get("synonyms", []),
                antonyms=w.get("antonyms", []),
                example_sentence=w.get("example_sentence"),
                difficulty=difficulty
            )
            db.add(exist)
            db.flush()
            
        # Associate to user vocabulary progress
        user_vocab_exist = db.query(models.UserVocabulary).filter(
            models.UserVocabulary.profile_id == profile_id,
            models.UserVocabulary.word_id == exist.id
        ).first()
        if not user_vocab_exist:
            uv = models.UserVocabulary(profile_id=profile_id, word_id=exist.id)
            db.add(uv)
            
        inserted_words.append(exist)
        
    db.commit()
    return inserted_words

@router.put("/vocabulary/{word_id}", response_model=schemas.UserVocabularyResponse)
def update_vocabulary_word(
    word_id: UUID,
    vocab_update: schemas.UserVocabularyUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    uv = db.query(models.UserVocabulary).filter(
        models.UserVocabulary.profile_id == current_user["id"],
        models.UserVocabulary.word_id == word_id
    ).first()
    
    if not uv:
        raise HTTPException(status_code=404, detail="Word mapping not found for user.")
        
    if vocab_update.status:
        uv.status = vocab_update.status
    if vocab_update.bookmarked is not None:
        uv.bookmarked = vocab_update.bookmarked
        
    uv.last_reviewed = datetime.datetime.utcnow()
    db.commit()
    db.refresh(uv)
    return uv

@router.post("/vocabulary/quiz")
def submit_vocabulary_quiz(
    quiz_result: schemas.VocabularyQuizSubmit,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    uv = db.query(models.UserVocabulary).filter(
        models.UserVocabulary.profile_id == profile_id,
        models.UserVocabulary.word_id == quiz_result.word_id
    ).first()
    
    if not uv:
        raise HTTPException(status_code=404, detail="Word entry not found.")
        
    uv.review_count += 1
    uv.last_reviewed = datetime.datetime.utcnow()
    
    xp_award = 15 if quiz_result.correct else 5
    if quiz_result.correct:
        # If successfully answered multiple times, mark as mastered
        if uv.review_count >= 3:
            uv.status = "mastered"
    else:
        # Reset mastering count or add vocabulary mistake
        uv.status = "learning"
        vocab = db.query(models.Vocabulary).filter(models.Vocabulary.id == quiz_result.word_id).first()
        mistake = models.MistakeNotebook(
            profile_id=profile_id,
            type="vocabulary",
            original_text=vocab.word,
            corrected_text=vocab.meaning,
            explanation="Failed quiz recollection.",
            context_sentence=vocab.example_sentence,
            reviewed=False
        )
        db.add(mistake)
        
    award_xp(db, profile_id, xp_award, f"Vocabulary Quiz Review for {uv.vocab_item.word if uv.vocab_item else 'word'}")
    db.commit()
    return {"status": uv.status, "review_count": uv.review_count, "xp_rewarded": xp_award}


# --- Grammar Coach ---

@router.get("/grammar", response_model=List[schemas.GrammarProgressResponse])
def get_grammar_progress(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.GrammarProgress).filter(models.GrammarProgress.profile_id == current_user["id"]).all()

@router.post("/grammar/quiz", response_model=schemas.GrammarProgressResponse)
def submit_grammar_quiz(
    progress_update: schemas.GrammarProgressUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    
    gp = db.query(models.GrammarProgress).filter(
        models.GrammarProgress.profile_id == profile_id,
        models.GrammarProgress.lesson_key == progress_update.lesson_key
    ).first()
    
    if not gp:
        gp = models.GrammarProgress(
            profile_id=profile_id,
            lesson_key=progress_update.lesson_key
        )
        db.add(gp)
        db.flush()
        
    gp.status = progress_update.status
    if progress_update.quiz_score is not None:
        gp.quiz_score = progress_update.quiz_score
        
    gp.updated_at = datetime.datetime.utcnow()
    
    # Award XP
    xp_award = 100 if progress_update.status == "completed" else 20
    award_xp(db, profile_id, xp_award, f"Grammar lesson: {progress_update.lesson_key}")
    db.commit()
    db.refresh(gp)
    return gp


# --- Reading Practice ---

@router.get("/reading/generate")
def generate_reading_practice(category: str = "Technology"):
    # Generate static article + questions using AI
    return gemini_service.generate_reading_article(category)

@router.post("/reading/evaluate", response_model=schemas.ReadingSessionResponse)
def evaluate_reading_aloud(
    session_data: schemas.ReadingSessionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    
    session = models.ReadingSession(
        profile_id=profile_id,
        article_title=session_data.article_title,
        article_content=session_data.article_content,
        category=session_data.category,
        transcript=session_data.transcript,
        speed=session_data.speed,
        pronunciation_score=session_data.pronunciation_score,
        accuracy_score=session_data.accuracy_score,
        comprehension_score=session_data.comprehension_score,
        mcqs=session_data.mcqs,
        user_answers=session_data.user_answers
    )
    db.add(session)
    
    # Award XP
    xp_award = 50 + (session_data.comprehension_score * 10)
    award_xp(db, profile_id, xp_award, "Reading Aloud session & quiz")
    db.commit()
    db.refresh(session)
    return session


# --- Listening Practice ---

@router.post("/listening/evaluate", response_model=schemas.ListeningSessionResponse)
def evaluate_listening_session(
    session_data: schemas.ListeningSessionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    
    session = models.ListeningSession(
        profile_id=profile_id,
        audio_type=session_data.audio_type,
        title=session_data.title,
        audio_url=session_data.audio_url,
        transcript=session_data.transcript,
        questions=session_data.questions,
        user_answers=session_data.user_answers,
        score=session_data.score
    )
    db.add(session)
    
    # Award XP
    xp_award = 30 + (session_data.score * 10)
    award_xp(db, profile_id, xp_award, f"Listening comprehension: {session_data.title}")
    db.commit()
    db.refresh(session)
    return session


# --- Writing Coach ---

@router.post("/writing/evaluate", response_model=schemas.WritingSessionResponse)
def evaluate_writing(
    submission: schemas.WritingSessionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    
    # Analyze text
    res = gemini_service.analyze_writing(submission.type, submission.prompt, submission.user_input)
    
    session = models.WritingSession(
        profile_id=profile_id,
        type=submission.type,
        prompt=submission.prompt,
        user_input=submission.user_input,
        grammar_score=res.get("grammar_score", 70),
        vocabulary_score=res.get("vocabulary_score", 70),
        tone_score=res.get("tone_score", 70),
        readability_score=res.get("readability_score", 70),
        corrected_text=res.get("corrected_text", submission.user_input),
        analysis=res.get("analysis", {})
    )
    db.add(session)
    
    # Extract grammar errors to mistake notebook
    grammar_details = res.get("analysis", {}).get("grammar_details", [])
    for error in grammar_details:
        mistake = models.MistakeNotebook(
            profile_id=profile_id,
            type="grammar",
            original_text=error.get("mistake"),
            corrected_text=error.get("correction"),
            explanation=error.get("rule"),
            context_sentence=submission.user_input,
            reviewed=False
        )
        db.add(mistake)
        
    # Award XP
    award_xp(db, profile_id, 80, f"Writing session ({submission.type})")
    db.commit()
    db.refresh(session)
    return session


# --- AI Chat / Conversation Partner ---

@router.post("/conversations/message", response_model=schemas.ChatMessageResponse)
def send_chat_message(
    msg: schemas.ChatMessageCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    
    # Get conversation history
    history = db.query(models.ConversationHistory).filter(
        models.ConversationHistory.profile_id == profile_id,
        models.ConversationHistory.session_id == msg.session_id
    ).order_by(models.ConversationHistory.created_at.asc()).all()
    
    # Save user message
    user_msg = models.ConversationHistory(
        profile_id=profile_id,
        session_id=msg.session_id,
        role="user",
        mode=msg.mode,
        content=msg.content
    )
    db.add(user_msg)
    
    # Prep history for AI (convert to simple role/content pairs)
    formatted_history = []
    for h in history:
        formatted_history.append({"role": h.role, "content": h.content})
        
    # Call Gemini for reply and feedback
    coach_feedback = gemini_service.chat_reply(formatted_history, msg.content, msg.mode)
    
    # Save assistant message with evaluations
    ai_msg = models.ConversationHistory(
        profile_id=profile_id,
        session_id=msg.session_id,
        role="assistant",
        mode=msg.mode,
        content=coach_feedback.get("reply", "Understood. Tell me more!"),
        grammatical_corrections=coach_feedback.get("grammatical_corrections"),
        vocabulary_suggestions=coach_feedback.get("vocabulary_suggestions")
    )
    db.add(ai_msg)
    
    # Save mistakes to Notebook if user made grammatical errors
    grammar_meta = coach_feedback.get("grammatical_corrections", {})
    if grammar_meta.get("mistakes_found", False):
        mistake = models.MistakeNotebook(
            profile_id=profile_id,
            type="grammar",
            original_text=msg.content,
            corrected_text=grammar_meta.get("feedback", ""),
            explanation="Mistake detected in conversation chat.",
            context_sentence=msg.content,
            reviewed=False
        )
        db.add(mistake)
        
    # Award small XP for chatting
    award_xp(db, profile_id, 10, "Conversation message sent")
    db.commit()
    db.refresh(ai_msg)
    return ai_msg

@router.get("/conversations/history")
def get_conversations(
    session_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.ConversationHistory).filter(
        models.ConversationHistory.profile_id == current_user["id"],
        models.ConversationHistory.session_id == session_id
    ).order_by(models.ConversationHistory.created_at.asc()).all()


# --- Mock Interview ---

@router.post("/interviews/evaluate", response_model=schemas.InterviewReportResponse)
def evaluate_interview(
    submission: schemas.InterviewSessionSubmit,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    
    # Call Gemini analysis
    res = gemini_service.analyze_interview(submission.type, submission.questions_answers)
    
    report = models.InterviewReport(
        profile_id=profile_id,
        type=submission.type,
        questions_answers=submission.questions_answers,
        grammar_score=res.get("grammar_score", 70),
        confidence_score=res.get("confidence_score", 70),
        vocabulary_score=res.get("vocabulary_score", 70),
        star_score=res.get("star_score", 60),
        communication_score=res.get("communication_score", 70),
        report_summary=res.get("report_summary", "")
    )
    db.add(report)
    
    # Award big XP
    award_xp(db, profile_id, 200, f"Completed Mock Interview: {submission.type}")
    db.commit()
    db.refresh(report)
    return report

@router.get("/interviews/reports", response_model=List[schemas.InterviewReportResponse])
def get_interview_reports(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.InterviewReport).filter(
        models.InterviewReport.profile_id == current_user["id"]
    ).order_by(models.InterviewReport.created_at.desc()).all()


# --- Group Discussion ---

@router.post("/group-discussions/evaluate", response_model=schemas.GroupDiscussionReportResponse)
def evaluate_group_discussion(
    submission: schemas.GroupDiscussionSubmit,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    
    res = gemini_service.analyze_group_discussion(submission.topic, submission.history)
    
    report = models.GroupDiscussionReport(
        profile_id=profile_id,
        topic=submission.topic,
        history=submission.history,
        participation_score=res.get("participation_score", 70),
        leadership_score=res.get("leadership_score", 70),
        confidence_score=res.get("confidence_score", 70),
        grammar_score=res.get("grammar_score", 70),
        idea_quality_score=res.get("idea_quality_score", 70),
        communication_score=res.get("communication_score", 70),
        report_summary=res.get("report_summary", "")
    )
    db.add(report)
    
    # Award big XP
    award_xp(db, profile_id, 200, f"Group Discussion Session: {submission.topic}")
    db.commit()
    db.refresh(report)
    return report


# --- Public Speaking Trainer ---

@router.post("/public-speaking/evaluate", response_model=schemas.PublicSpeakingAnalysisResponse)
def evaluate_public_speaking(
    submission: schemas.PublicSpeakingAnalysisRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    
    res = gemini_service.analyze_public_speaking(submission.text)
    
    # Award XP
    award_xp(db, profile_id, 100, "Analyzed Public Speech draft")
    return res


# --- Mistake Notebook ---

@router.get("/mistakes", response_model=List[schemas.MistakeNotebookResponse])
def get_mistakes(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.MistakeNotebook).filter(
        models.MistakeNotebook.profile_id == current_user["id"]
    ).order_by(models.MistakeNotebook.created_at.desc()).all()

@router.post("/mistakes/{mistake_id}/review")
def review_mistake(
    mistake_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mistake = db.query(models.MistakeNotebook).filter(
        models.MistakeNotebook.id == mistake_id,
        models.MistakeNotebook.profile_id == current_user["id"]
    ).first()
    
    if not mistake:
        raise HTTPException(status_code=404, detail="Mistake not found.")
        
    mistake.reviewed = True
    award_xp(db, current_user["id"], 10, "Reviewed mistake in mistake notebook")
    db.commit()
    return {"message": "Mistake marked as reviewed"}


# --- Weekly Reports ---

@router.get("/weekly-reports")
def get_weekly_reports(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_id = current_user["id"]
    
    # Fetch recent reports
    reports = db.query(models.WeeklyReport).filter(
        models.WeeklyReport.profile_id == profile_id
    ).order_by(models.WeeklyReport.created_at.desc()).all()
    
    return reports

@router.post("/weekly-reports/generate", response_model=schemas.WeeklyReportResponse)
def generate_weekly_coach_report(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_id = current_user["id"]
    
    # Gather logs from last 7 days
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    
    speaking = db.query(models.SpeakingSession).filter(
        models.SpeakingSession.profile_id == profile_id,
        models.SpeakingSession.created_at >= seven_days_ago
    ).all()
    
    writing = db.query(models.WritingSession).filter(
        models.WritingSession.profile_id == profile_id,
        models.WritingSession.created_at >= seven_days_ago
    ).all()
    
    reading = db.query(models.ReadingSession).filter(
        models.ReadingSession.profile_id == profile_id,
        models.ReadingSession.created_at >= seven_days_ago
    ).all()
    
    # Map logs into simplified structure for Gemini analysis
    summary = {
        "speaking_sessions_count": len(speaking),
        "speaking_average_fluency": float(sum(s.fluency_score for s in speaking) / len(speaking)) if speaking else 70,
        "writing_sessions_count": len(writing),
        "reading_sessions_count": len(reading)
    }
    
    analysis = gemini_service.generate_weekly_report(summary)
    
    report = models.WeeklyReport(
        profile_id=profile_id,
        start_date=(datetime.date.today() - datetime.timedelta(days=7)),
        end_date=datetime.date.today(),
        strengths=analysis.get("strengths", []),
        weaknesses=analysis.get("weaknesses", []),
        study_plan=analysis.get("study_plan", []),
        recommended_practice=analysis.get("recommended_practice", []),
        cefr_level=analysis.get("cefr_level", "B2"),
        ielts_speaking_band=analysis.get("ielts_speaking_band", 6.5),
        placement_readiness=analysis.get("placement_readiness", "Needs Improvement")
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


# --- Notifications (No-op in Personal Mode) ---

@router.get("/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications():
    return []

@router.put("/notifications/read")
def mark_all_notifications_read():
    return {"message": "All notifications marked read"}

