from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: str  # On Track, At Risk, Delayed, Completed
    completedThisWeek: str = ""
    risks: str = ""
    escalation: str = ""
    plannedNextWeek: str = ""
    bugsCount: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    name: str
    status: str = "On Track"
    completedThisWeek: str = ""
    risks: str = ""
    escalation: str = ""
    plannedNextWeek: str = ""
    bugsCount: int = 0

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    completedThisWeek: Optional[str] = None
    risks: Optional[str] = None
    escalation: Optional[str] = None
    plannedNextWeek: Optional[str] = None
    bugsCount: Optional[int] = None

class CalendarEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # ISO date string YYYY-MM-DD
    title: str
    description: str = ""
    projectId: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CalendarEventCreate(BaseModel):
    date: str
    title: str
    description: str = ""
    projectId: Optional[str] = None


# Project Routes
@api_router.post("/projects", response_model=Project)
async def create_project(input: ProjectCreate):
    project_dict = input.model_dump()
    project_obj = Project(**project_dict)
    
    doc = project_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.projects.insert_one(doc)
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    
    for project in projects:
        if isinstance(project.get('createdAt'), str):
            project['createdAt'] = datetime.fromisoformat(project['createdAt'])
    
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if isinstance(project.get('createdAt'), str):
        project['createdAt'] = datetime.fromisoformat(project['createdAt'])
    
    return project

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, input: ProjectUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    updated_project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if isinstance(updated_project.get('createdAt'), str):
        updated_project['createdAt'] = datetime.fromisoformat(updated_project['createdAt'])
    
    return updated_project

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    result = await db.projects.delete_one({"id": project_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Project deleted successfully"}


# Calendar Event Routes
@api_router.post("/events", response_model=CalendarEvent)
async def create_event(input: CalendarEventCreate):
    event_dict = input.model_dump()
    event_obj = CalendarEvent(**event_dict)
    
    doc = event_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.events.insert_one(doc)
    return event_obj

@api_router.get("/events", response_model=List[CalendarEvent])
async def get_events():
    events = await db.events.find({}, {"_id": 0}).to_list(1000)
    
    for event in events:
        if isinstance(event.get('createdAt'), str):
            event['createdAt'] = datetime.fromisoformat(event['createdAt'])
    
    return events

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    result = await db.events.delete_one({"id": event_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Event deleted successfully"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()