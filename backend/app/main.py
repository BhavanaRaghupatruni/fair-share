from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import deposits, events, expenses, groups


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Fair Share API",
    description="Pre-funded group wallet expense management API",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(groups.router, prefix="/api")
app.include_router(deposits.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
