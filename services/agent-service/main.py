"""
GETEDIL Agent Service - Lightweight Job Matching Agent
Optimized for Render.com Free Tier (512MB RAM)
Handles: Job posting detection → Skills matching → Push notifications
"""

import os
import json
import asyncio
import asyncpg
import logging
from typing import Dict, List, Set, Optional, Any
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from asyncpg.pool import Pool
import httpx
from collections import defaultdict
import hashlib
import time

# ============================================
# CONFIGURATION (Render Environment Variables)
# ============================================

SUPABASE_DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/getedil")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
REDIS_URL = os.getenv("REDIS_URL", None)  # Optional, for caching
NOTIFICATION_WEBHOOK = os.getenv("NOTIFICATION_WEBHOOK", "")

# Performance tuning for 512MB RAM
MAX_CONNECTIONS = int(os.getenv("DB_POOL_SIZE", "5"))  # Small pool for memory
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "50"))  # Process 50 jobs at a time
SKILLS_CACHE_TTL = int(os.getenv("SKILLS_CACHE_TTL", "300"))  # 5 minutes
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "10"))  # Seconds between polls

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC MODELS
# ============================================

class JobPosting(BaseModel):
    id: str
    title: str
    description: str
    required_skills: List[str]
    employer_id: str
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    
class UserProfile(BaseModel):
    id: str
    full_name: str
    skills: List[str]
    fcm_token: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

class MatchResult(BaseModel):
    job_id: str
    user_id: str
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]

class NotificationPayload(BaseModel):
    user_id: str
    title: str
    body: str
    data: Dict[str, Any]
    fcm_token: Optional[str] = None

# ============================================
# DATABASE POOL MANAGER (Memory Optimized)
# ============================================

class DatabaseManager:
    def __init__(self, dsn: str, min_size: int = 2, max_size: int = 5):
        self.dsn = dsn
        self.min_size = min_size
        self.max_size = max_size
        self.pool: Optional[Pool] = None
        self._last_job_check = datetime.min
        self._processed_jobs: Set[str] = set()
        
    async def initialize(self):
        """Create connection pool with conservative settings for 512MB RAM"""
        try:
            self.pool = await asyncpg.create_pool(
                self.dsn,
                min_size=self.min_size,
                max_size=self.max_size,
                max_queries=50000,
                max_inactive_connection_lifetime=300,  # 5 minutes
                command_timeout=10,  # 10 seconds
                # SSL required for Supabase
                ssl='require'
            )
            logger.info(f"Database pool created: min={self.min_size}, max={self.max_size}")
            
            # Test connection
            async with self.pool.acquire() as conn:
                await conn.execute("SELECT 1")
                logger.info("Database connection verified")
                
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise
    
    async def close(self):
        """Gracefully close connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database pool closed")
    
    @asynccontextmanager
    async def transaction(self):
        """Transaction context manager"""
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                yield conn
    
    async def fetch_new_jobs(self, limit: int = 50) -> List[JobPosting]:
        """Fetch unprocessed job postings using LISTEN/NOTIFY or polling"""
        try:
            async with self.pool.acquire() as conn:
                # Get jobs created in last 5 minutes that haven't been processed
                rows = await conn.fetch("""
                    SELECT 
                        j.id,
                        j.title,
                        j.description,
                        j.required_skills,
                        j.employer_id,
                        j.location,
                        j.salary_min,
                        j.salary_max
                    FROM job_listings j
                    WHERE j.status = 'active'
                    AND j.created_at > $1
                    AND j.id NOT IN (
                        SELECT job_id FROM job_notification_log 
                        WHERE created_at > NOW() - INTERVAL '24 hours'
                    )
                    ORDER BY j.created_at DESC
                    LIMIT $2
                """, datetime.utcnow() - timedelta(minutes=30), limit)
                
                jobs = []
                for row in rows:
                    job = JobPosting(
                        id=str(row['id']),
                        title=row['title'],
                        description=row['description'],
                        required_skills=row['required_skills'] or [],
                        employer_id=str(row['employer_id']),
                        location=row['location'],
                        salary_min=row['salary_min'],
                        salary_max=row['salary_max']
                    )
                    jobs.append(job)
                    
                logger.info(f"Fetched {len(jobs)} new jobs")
                return jobs
                
        except Exception as e:
            logger.error(f"Failed to fetch new jobs: {e}")
            return []
    
    async def find_matching_users(self, required_skills: List[str], limit: int = 100) -> List[UserProfile]:
        """Find users whose skills match job requirements"""
        if not required_skills:
            return []
        
        try:
            async with self.pool.acquire() as conn:
                # Convert skills to SQL array literal
                skills_array = '{' + ','.join(f'"{skill}"' for skill in required_skills) + '}'
                
                # Find users with at least one matching skill
                rows = await conn.fetch("""
                    SELECT 
                        p.id,
                        p.full_name,
                        p.skills,
                        p.fcm_token,
                        p.email,
                        p.phone
                    FROM profiles p
                    WHERE p.is_active = true
                    AND p.skills && $1::text[]
                    AND p.notification_preferences->>'job_alerts' = 'true'
                    ORDER BY p.trust_score DESC
                    LIMIT $2
                """, required_skills, limit)
                
                users = []
                for row in rows:
                    user = UserProfile(
                        id=str(row['id']),
                        full_name=row['full_name'],
                        skills=row['skills'] or [],
                        fcm_token=row['fcm_token'],
                        email=row['email'],
                        phone=row['phone'],
                        is_active=True
                    )
                    users.append(user)
                    
                return users
                
        except Exception as e:
            logger.error(f"Failed to find matching users: {e}")
            return []
    
    async def log_notification(self, job_id: str, user_id: str, match_score: float, matched_skills: List[str]):
        """Log notification to prevent duplicates and track analytics"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO job_notification_log (
                        job_id, user_id, match_score, matched_skills, sent_at
                    ) VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (job_id, user_id) DO NOTHING
                """, job_id, user_id, match_score, matched_skills)
                
        except Exception as e:
            logger.error(f"Failed to log notification: {e}")
    
    async def get_processed_jobs(self, since: datetime) -> Set[str]:
        """Get set of already processed job IDs"""
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT DISTINCT job_id 
                    FROM job_notification_log 
                    WHERE created_at > $1
                """, since)
                return {str(row['job_id']) for row in rows}
                
        except Exception as e:
            logger.error(f"Failed to get processed jobs: {e}")
            return set()

# ============================================
# SKILLS MATCHING ENGINE (Lightweight)
# ============================================

class SkillsMatcher:
    """Memory-efficient skills matching with caching"""
    
    def __init__(self, cache_ttl: int = 300):
        self.cache: Dict[str, tuple] = {}  # {user_id: (skills_set, timestamp)}
        self.cache_ttl = cache_ttl
        
    def calculate_match_score(self, required_skills: List[str], user_skills: List[str]) -> tuple:
        """Calculate match score and return matched/missing skills"""
        if not required_skills:
            return 1.0, [], []
        
        required_set = set(s.lower().strip() for s in required_skills)
        user_set = set(s.lower().strip() for s in user_skills)
        
        matched = required_set.intersection(user_set)
        missing = required_set - user_set
        
        # Jaccard similarity for score
        if not required_set:
            score = 0.0
        else:
            score = len(matched) / len(required_set)
        
        return score, list(matched), list(missing)
    
    def get_cached_skills(self, user_id: str) -> Optional[Set[str]]:
        """Get cached user skills if not expired"""
        if user_id in self.cache:
            skills_set, timestamp = self.cache[user_id]
            if (datetime.utcnow() - timestamp).seconds < self.cache_ttl:
                return skills_set
            else:
                del self.cache[user_id]
        return None
    
    def cache_skills(self, user_id: str, skills: List[str]):
        """Cache user skills"""
        self.cache[user_id] = (set(s.lower().strip() for s in skills), datetime.utcnow())
        
        # LRU cleanup if cache too large (limit to 1000 users)
        if len(self.cache) > 1000:
            # Remove oldest 20%
            items_to_remove = sorted(
                self.cache.items(), 
                key=lambda x: x[1][1]
            )[:200]
            for user_id, _ in items_to_remove:
                del self.cache[user_id]

# ============================================
# NOTIFICATION SERVICE (Async)
# ============================================

class NotificationService:
    """Send push notifications via multiple channels"""
    
    def __init__(self, webhook_url: str = None):
        self.webhook_url = webhook_url
        self.client = httpx.AsyncClient(timeout=5.0)
        
    async def send_notification(self, notification: NotificationPayload):
        """Send notification to user via FCM or webhook"""
        try:
            # Priority: FCM > Webhook > Email (fallback)
            if notification.fcm_token:
                await self._send_fcm(notification)
            elif self.webhook_url:
                await self._send_webhook(notification)
            else:
                logger.warning(f"No delivery channel for user {notification.user_id}")
                
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
    
    async def _send_fcm(self, notification: NotificationPayload):
        """Send via Firebase Cloud Messaging"""
        # Implement FCM v1 API here
        # For now, use webhook as fallback
        await self._send_webhook(notification)
    
    async def _send_webhook(self, notification: NotificationPayload):
        """Send via webhook (for Render.com free tier)"""
        try:
            response = await self.client.post(
                self.webhook_url,
                json=notification.dict(),
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            logger.info(f"Notification sent to {notification.user_id}")
            
        except httpx.TimeoutException:
            logger.error(f"Timeout sending notification to {notification.user_id}")
        except Exception as e:
            logger.error(f"Webhook failed: {e}")
    
    async def close(self):
        await self.client.aclose()

# ============================================
# MAIN AGENT SERVICE
# ============================================

class JobMatchingAgent:
    """Main orchestration agent for job matching"""
    
    def __init__(self, db: DatabaseManager, matcher: SkillsMatcher, notifier: NotificationService):
        self.db = db
        self.matcher = matcher
        self.notifier = notifier
        self.is_running = False
        self._task = None
        
    async def start(self):
        """Start the background agent loop"""
        self.is_running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Job matching agent started")
        
    async def stop(self):
        """Stop the agent gracefully"""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Job matching agent stopped")
    
    async def _run_loop(self):
        """Main processing loop"""
        consecutive_errors = 0
        
        while self.is_running:
            try:
                # Fetch new jobs
                jobs = await self.db.fetch_new_jobs(limit=BATCH_SIZE)
                
                if jobs:
                    logger.info(f"Processing {len(jobs)} new jobs")
                    
                    # Process each job
                    for job in jobs:
                        await self._process_job(job)
                    
                    consecutive_errors = 0
                else:
                    # No new jobs, idle log every 5 minutes
                    if int(time.time()) % 300 == 0:
                        logger.debug("No new jobs found, waiting...")
                
                # Wait before next poll
                await asyncio.sleep(POLL_INTERVAL)
                
            except Exception as e:
                consecutive_errors += 1
                logger.error(f"Loop error (count={consecutive_errors}): {e}")
                
                # Exponential backoff on errors
                backoff = min(60, 2 ** consecutive_errors)
                await asyncio.sleep(backoff)
    
    async def _process_job(self, job: JobPosting):
        """Process a single job posting"""
        try:
            # Find matching users
            users = await self.db.find_matching_users(
                job.required_skills, 
                limit=100
            )
            
            if not users:
                logger.info(f"No matching users for job {job.id}")
                return
            
            # Score each user
            matches = []
            for user in users:
                score, matched, missing = self.matcher.calculate_match_score(
                    job.required_skills,
                    user.skills
                )
                
                # Only notify if match score >= 0.3 (at least 30% skills match)
                if score >= 0.3:
                    matches.append(MatchResult(
                        job_id=job.id,
                        user_id=user.id,
                        match_score=score,
                        matched_skills=matched,
                        missing_skills=missing
                    ))
                    
                    # Send notification
                    await self._send_job_notification(job, user, score, matched, missing)
                    
                    # Log notification
                    await self.db.log_notification(job.id, user.id, score, matched)
            
            logger.info(f"Job {job.id}: Found {len(matches)} matches out of {len(users)} users")
            
        except Exception as e:
            logger.error(f"Failed to process job {job.id}: {e}")
    
    async def _send_job_notification(self, job: JobPosting, user: UserProfile, 
                                      score: float, matched: List[str], missing: List[str]):
        """Send job notification to user"""
        # Create personalized message
        title = f"New Job Match: {job.title}"
        
        if score >= 0.8:
            body = f"Excellent match! You have {len(matched)}/{len(job.required_skills)} required skills. Apply now!"
        elif score >= 0.5:
            body = f"Good match! You match {len(matched)} skills. Consider upskilling in {', '.join(missing[:2])}."
        else:
            body = f"Potential opportunity: {job.title}. Check if you're interested!"
        
        # Add salary info if available
        if job.salary_min and job.salary_max:
            body += f" Salary: {job.salary_min:,.0f} - {job.salary_max:,.0f} ETB"
        elif job.salary_min:
            body += f" Starting from {job.salary_min:,.0f} ETB"
        
        notification = NotificationPayload(
            user_id=user.id,
            title=title,
            body=body,
            data={
                "job_id": job.id,
                "job_title": job.title,
                "match_score": score,
                "matched_skills": matched,
                "missing_skills": missing,
                "type": "job_alert"
            },
            fcm_token=user.fcm_token
        )
        
        await self.notifier.send_notification(notification)

# ============================================
# FASTAPI APPLICATION
# ============================================

# Global instances
db_manager: Optional[DatabaseManager] = None
agent: Optional[JobMatchingAgent] = None
matcher: Optional[SkillsMatcher] = None
notifier: Optional[NotificationService] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown"""
    global db_manager, agent, matcher, notifier
    
    # Startup
    logger.info("Starting GETEDIL Agent Service...")
    
    # Initialize components
    db_manager = DatabaseManager(SUPABASE_DB_URL, min_size=2, max_size=MAX_CONNECTIONS)
    await db_manager.initialize()
    
    matcher = SkillsMatcher(cache_ttl=SKILLS_CACHE_TTL)
    notifier = NotificationService(NOTIFICATION_WEBHOOK)
    
    agent = JobMatchingAgent(db_manager, matcher, notifier)
    await agent.start()
    
    yield
    
    # Shutdown
    logger.info("Shutting down GETEDIL Agent Service...")
    if agent:
        await agent.stop()
    if db_manager:
        await db_manager.close()
    if notifier:
        await notifier.close()

# Create FastAPI app
app = FastAPI(
    title="GETEDIL Agent Service",
    description="Job Matching Agent for Ethiopian Super-App",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint for Render.com"""
    if not db_manager or not db_manager.pool:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        async with db_manager.pool.acquire() as conn:
            await conn.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "memory_optimized": True
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.get("/metrics")
async def get_metrics():
    """Get agent metrics (for monitoring)"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    return {
        "is_running": agent.is_running,
        "cache_size": len(matcher.cache) if matcher else 0,
        "pool_size": db_manager.pool.get_size() if db_manager and db_manager.pool else 0,
        "pool_free": db_manager.pool.get_free_size() if db_manager and db_manager.pool else 0
    }

@app.post("/trigger/manual/{job_id}")
async def manual_trigger(job_id: str, background_tasks: BackgroundTasks):
    """Manually trigger job matching (for testing)"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    # Fetch specific job
    jobs = await db_manager.fetch_new_jobs(limit=1)
    matching_jobs = [j for j in jobs if j.id == job_id]
    
    if not matching_jobs:
        raise HTTPException(status_code=404, detail="Job not found or already processed")
    
    # Process in background
    background_tasks.add_task(agent._process_job, matching_jobs[0])
    
    return {"status": "processing", "job_id": job_id}

@app.post("/sync/now")
async def force_sync():
    """Force immediate job processing"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    # Run one iteration
    jobs = await db_manager.fetch_new_jobs(limit=BATCH_SIZE)
    for job in jobs:
        await agent._process_job(job)
    
    return {"status": "completed", "jobs_processed": len(jobs)}

# ============================================
# MAIN ENTRY POINT
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    # Run with optimized settings for 512MB RAM
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        workers=1,  # Single worker for memory efficiency
        loop="asyncio",
        limit_concurrency=10,
        backlog=64,
        timeout_keep_alive=5,
        log_level="info"
    )
