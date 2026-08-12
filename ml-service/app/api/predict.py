from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.services.risk_calculator import model_manager
from app.services.shap_explainer import shap_explainer_service
from app.services.recommendation_engine import recommendation_engine

router = APIRouter()


class LatestLogInput(BaseModel):
    sleep_hours: float = Field(..., description="Sleep duration in hours (0-24)")
    sleep_quality: float = Field(..., description="Sleep quality rating (1-5)")
    daily_stress: float = Field(..., description="Perceived daily stress rating (0-10)")
    mood: float = Field(..., description="Mood rating (1-5)")
    screen_time: float = Field(..., description="Screen time in hours (0-24)")
    hydration: float = Field(..., description="Fluid intake in Liters (0-20)")


class BaselineStatsInput(BaseModel):
    avg_sleep: Optional[float] = Field(None, description="Average baseline sleep hours")
    avg_stress: Optional[float] = Field(None, description="Average baseline stress rating")
    pss_score: Optional[float] = Field(None, description="Perceived Stress Scale baseline score (0-40)")


class PredictRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    latest_log: LatestLogInput
    baseline_stats: Optional[BaselineStatsInput] = None
    recent_episodes_count_7d: int = Field(0, description="Count of migraine episodes in last 7 days")


class FeatureAttribution(BaseModel):
    feature: str = Field(..., description="Original model feature name")
    label: str = Field(..., description="Human-readable feature label")
    shap_value: float = Field(..., description="Additive SHAP contribution value")
    direction: str = Field(..., description="Risk direction: increases_risk | decreases_risk")
    importance: float = Field(..., description="Absolute SHAP importance magnitude")


class ElevatedFactor(BaseModel):
    factor: str = Field(..., description="Name of factor (e.g., Sleep, Stress)")
    value: str = Field(..., description="Current value string")
    comparison: str = Field(..., description="Comparison string against baseline or standard")
    description: str = Field(..., description="Descriptive sentence")
    statusType: str = Field(..., description="Status type: alert | warning | stable")


class FocusArea(BaseModel):
    title: str = Field(..., description="Focus area title")
    description: str = Field(..., description="Actionable non-alarmist description")


class XAiOutput(BaseModel):
    method: str = Field("SHAP", description="XAI method used")
    features: List[FeatureAttribution] = Field(default_factory=list)


class PredictResponse(BaseModel):
    score: float = Field(..., description="Migraine risk score (0-100 probability percentage)")
    level: str = Field(..., description="Risk level category: Low | Moderate | High")
    elevatedFactors: Optional[List[ElevatedFactor]] = Field(None, description="Factor breakdown with status tags")
    xai: Optional[XAiOutput] = Field(None, description="SHAP feature attribution explanations")
    focusAreas: Optional[List[FocusArea]] = Field(None, description="Prioritized wellness focus areas")


@router.post("/predict", response_model=PredictResponse, status_code=status.HTTP_200_OK)
async def predict_migraine_risk(request: PredictRequest):
    if not model_manager.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML Model is not loaded. Error: {model_manager.load_error}"
        )

    try:
        raw_features = {
            "sleep_hours": request.latest_log.sleep_hours,
            "mood_level": request.latest_log.mood,
            "stress_level": request.latest_log.daily_stress,
            "hydration_level": request.latest_log.hydration,
            "screen_time": request.latest_log.screen_time,
        }

        score, level = model_manager.predict_risk(raw_features)

        baseline_dict = request.baseline_stats.model_dump() if request.baseline_stats else None
        latest_dict = request.latest_log.model_dump()

        explanation = shap_explainer_service.explain(
            raw_features=raw_features,
            latest_log=latest_dict,
            baseline_stats=baseline_dict,
            recent_episodes_count_7d=request.recent_episodes_count_7d,
        )

        focus_areas = recommendation_engine.generate_focus_areas(
            risk_score=score,
            risk_level=level,
            shap_features=explanation.get("features", []),
            latest_log=latest_dict,
            baseline_stats=baseline_dict,
        )

        return PredictResponse(
            score=score,
            level=level,
            elevatedFactors=explanation.get("elevatedFactors"),
            xai=XAiOutput(
                method="SHAP",
                features=explanation.get("features", [])
            ),
            focusAreas=focus_areas,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )
