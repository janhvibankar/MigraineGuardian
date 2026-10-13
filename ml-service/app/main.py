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



from fastapi.responses import JSONResponse

@app.get("/health")
async def health_check(check_inference: bool = False):
    """
    Liveness + readiness check.
    Returns model_loaded=True only when the trained .pkl pipeline is in memory
    and the service is ready to accept /predict requests.
    If check_inference=True, runs a lightweight dry-run prediction to verify pipeline execution.
    """
    is_healthy = model_manager.is_loaded
    inference_verified = None
    inference_error = None

    if check_inference and is_healthy:
        try:
            sample_features = {
                "sleep_hours": 7.5,
                "mood_level": 4.0,
                "stress_level": 4.0,
                "hydration_level": 2.0,
                "screen_time": 6.0,
            }
            model_manager.predict_risk(sample_features)
            inference_verified = True
        except Exception as e:
            inference_verified = False
            inference_error = str(e)
            is_healthy = False

    return JSONResponse(
        status_code=200 if is_healthy else 503,
        content={
            "status": "ok" if is_healthy else "degraded",
            "service": "migraine-ml-service",
            "model_loaded": model_manager.is_loaded,
            "model_load_error": model_manager.load_error if not model_manager.is_loaded else None,
            "experimental_model_loaded": model_manager.is_experimental_loaded,
            "inference_verified": inference_verified,
            "inference_error": inference_error,
        }
    )
