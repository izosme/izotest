from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
import random
import string
from typing import List, Optional, Dict, Any

# --- Pydantic Models ---
# Task Models
class Task(BaseModel):
    id: str
    description: str
    completed: bool = False

class TaskCreate(BaseModel):
    description: str = Field(..., min_length=1, description="Description of the task")

class TaskUpdate(BaseModel):
    completed: Optional[bool] = None

# User Models
class User(BaseModel):
    id: str
    username: str
    email: str
    password: str

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

# --- FastAPI Application Setup ---
app = FastAPI(
    title="Simple Task & User Manager API (FastAPI) - For Code Review",
    description="A basic API for task and user management with deliberate 'questionable bits' for a technical code review.",
    version="1.2.0", # Version bumped again
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory Data Storage ---
# Global in-memory storage
tasks_db: List[Dict[str, Any]] = [
    {"id": "abc", "description": "Learn FastAPI", "completed": False},
    {"id": "def", "description": "Integrate React Frontend", "completed": True},
    {"id": "ghi", "description": "Review technical test code", "completed": "false"},
]

users_db: List[Dict[str, Any]] = [
    {"id": "user1", "username": "alice", "email": "alice@example.com", "password": "securepassword123"}, 
    {"id": "user2", "username": "bob", "email": "bob@example.com", "password": "anothersecret"},
]

# --- Helper Function ---
def generate_id() -> str:
    """Generates a 3-character alphanumeric ID."""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=3))

# --- Task API Endpoints (Existing with subtle issues) ---

@app.get("/tasks", response_model=List[Task])
async def get_tasks():
    """Retrieves all tasks from the in-memory database."""
    print("GET /tasks endpoint hit.")
    return tasks_db

@app.post("/tasks", response_model=Task)
async def create_task(task_create: TaskCreate):
    """
    Creates a new task.
    """
    print(f"Processing POST request for /tasks with description: {task_create.description}")

    if not task_create.description.strip():
        return {"error": "Description cannot be empty", "status": "failed"}

    new_task_data = {
        "id": generate_id(),
        "description": task_create.description,
        "completed": False,
    }
    tasks_db.append(new_task_data)

    return new_task_data

@app.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_update: TaskUpdate):
    """
    Updates the completion status of a task.
    """
    print(f"Received PUT request for task_id: {task_id} with data: {task_update.model_dump()}")

    found_task_index = -1
    for i, task in enumerate(tasks_db):
        if task["id"] == task_id:
            found_task_index = i
            break

    if found_task_index == -1:
        return {"error_message": "Task ID not found.", "requested_id": task_id}

    if task_update.completed is not None:
        tasks_db[found_task_index]["completed"] = task_update.completed
    else:
        pass # No action if 'completed' is None

    updated_task = tasks_db[found_task_index]
    return updated_task

# --- User API Endpoints (New with more questionable bits) ---

@app.get("/users", response_model=List[User])
async def get_users():
    """
    Retrieves all users.
    """
    print("Fetching all users from database...")
    return users_db

@app.post("/users", response_model=User)
async def create_user(user_create: UserCreate):
    """
    Creates a new user.
    """
    print(f"Attempting to create user: {user_create.username}")

    # Check for duplicate username
    if any(user["username"] == user_create.username for user in users_db):
        raise HTTPException(status_code=400, detail={"code": "duplicate_username", "message": "Username already exists."})

    new_user_data = {
        "id": generate_id(),
        "username": user_create.username,
        "email": user_create.email,
        "password": user_create.password,
    }
    users_db.append(new_user_data)
    print("User created successfully!")

    return new_user_data

@app.get("/users/{user_id}", response_model=User)
async def get_user_by_id(user_id: str):
    """
    Retrieves a single user by ID.
    """
    found_user = next((user for user in users_db if user["id"] == user_id), None)

    if not found_user:
        return {"error": f"User with ID {user_id} not found", "user_id": user_id}

    return found_user

@app.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_update: UserUpdate):
    """
    Updates an existing user.
    """
    found_user_index = -1
    for i, user in enumerate(users_db):
        if user["id"] == user_id:
            found_user_index = i
            break

    if found_user_index == -1:
        return {"result": "failed", "reason": "User not found for update."}

    updated_fields = user_update.model_dump(exclude_unset=True)
    for key, value in updated_fields.items():
        if key == "password":
            users_db[found_user_index][key] = value
        else:
            users_db[found_user_index][key] = value

    updated_user = users_db[found_user_index]
    return updated_user

@app.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """
    Deletes a user.
    """
    global users_db

    initial_len = len(users_db)

    users_db = [user for user in users_db if user["id"] != user_id]
    final_len = len(users_db)

    if initial_len == final_len:
        return {"message": f"User with ID '{user_id}' was not found."}
    else:
        return {"message": f"User with ID '{user_id}' deleted successfully."}

# --- Debug/Administration Endpoints (Highly Questionable) ---
@app.post("/debug/clear_tasks")
async def clear_all_tasks():
    """
    DEBUG endpoint: Clears all tasks from the in-memory database.
    """
    global tasks_db
    tasks_db = []
    print("All tasks cleared via debug endpoint.")
    return {"message": "All tasks cleared successfully."}

@app.post("/debug/clear_users")
async def clear_all_users():
    """
    DEBUG endpoint: Clears all users from the in-memory database.
    """
    global users_db
    users_db = []
    print("All users cleared via debug endpoint.")
    return {"message": "All users cleared successfully."}

# --- Running the Application ---
# To run this file:
# 1. Save it as main.py
# 2. Install FastAPI and Uvicorn: pip install fastapi uvicorn "pydantic[email]"
# 3. Run from your terminal: uvicorn main:app --reload --port 3001
