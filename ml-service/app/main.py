from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.config import settings
from app.services.risk_calculator import model_manager
from app.api.predict import router as predict_router
from app.api.explain import router as explain_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load trained scikit-learn model pipeline once into memory
    try:
        model_manager.load_model()
    except Exception as e:
        print(f"[ML Service Startup Warning] Model loading failed: {e}")
    yield
    # Shutdown cleanup if any
    print("[ML Service] Application shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Register endpoints
app.include_router(predict_router)
app.include_router(explain_router)



@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "migraine-ml-service",
        "model_loaded": model_manager.is_loaded
    }
