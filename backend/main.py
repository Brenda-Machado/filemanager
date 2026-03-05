"""
File Manager - main.py
"""

from fastapi import FastAPI
from database import Base, engine

import models

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get('/health')
def health():
    return {'status': 'ok'}