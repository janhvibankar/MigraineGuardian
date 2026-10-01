from sklearn.base import BaseEstimator, TransformerMixin


class MigraineFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Model A Feature Engineer.
    Transforms 5 raw lifestyle inputs into 11 model features (5 raw + 6 domain engineered).
    """

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()

        # 6 Domain-Engineered Lifestyle Features
        X["sleep_deviation"] = (X["sleep_hours"] - 8.0).abs()
        X["low_sleep"] = (X["sleep_hours"] < 6.5).astype(int)
        X["high_screen_time"] = (X["screen_time"] >= 8.0).astype(int)
        X["low_hydration"] = (X["hydration_level"] <= 2).astype(int)
        X["stress_mood_interaction"] = X["stress_level"] * (6 - X["mood_level"])
        X["sleep_screen_interaction"] = X["sleep_hours"] * X["screen_time"]

        return X
