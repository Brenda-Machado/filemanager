"""
File Manager - main.py
"""

from fastapi import FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import auth as auth_router

import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="File Manager API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)

@app.get('/health')
def health():
    return {'status': 'ok'}