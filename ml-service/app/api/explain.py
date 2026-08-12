from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.services.risk_calculator import model_manager
from app.services.shap_explainer import shap_explainer_service
from app.services.recommendation_engine import recommendation_engine
from app.api.predict import PredictRequest, FeatureAttribution, ElevatedFactor, FocusArea

router = APIRouter()


class DetailedXAiOutput(BaseModel):
    method: str = Field("SHAP", description="XAI method used")
    features: List[FeatureAttribution] = Field(default_factory=list)
    risk_increasing_factors: List[FeatureAttribution] = Field(default_factory=list)
    risk_decreasing_factors: List[FeatureAttribution] = Field(default_factory=list)


class ExplainResponse(BaseModel):
    score: float = Field(..., description="Migraine risk score (0-100 probability percentage)")
    level: str = Field(..., description="Risk level category: Low | Moderate | High")
    xai: DetailedXAiOutput
    elevatedFactors: List[ElevatedFactor] = Field(default_factory=list)
    focusAreas: List[FocusArea] = Field(default_factory=list)


@router.post("/explain", response_model=ExplainResponse, status_code=status.HTTP_200_OK)
async def explain_migraine_risk(request: PredictRequest):
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

        return ExplainResponse(
            score=score,
            level=level,
            xai=DetailedXAiOutput(
                method="SHAP",
                features=explanation.get("features", []),
                risk_increasing_factors=explanation.get("risk_increasing_factors", []),
                risk_decreasing_factors=explanation.get("risk_decreasing_factors", []),
            ),
            elevatedFactors=explanation.get("elevatedFactors", []),
            focusAreas=focus_areas,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explanation error: {str(e)}"
        )
