from sklearn.base import BaseEstimator, TransformerMixin


class MigraineFeatureEngineer(
    BaseEstimator,
    TransformerMixin
):

    def fit(self, X, y=None):
        return self

    def transform(self, X):

        X = X.copy()

        X["stress_sleep_ratio"] = (
            X["stress_level"] /
            (X["sleep_hours"] + 1)
        )

        X["screen_stress"] = (
            X["screen_time"] *
            X["stress_level"]
        )

        X["hydration_sleep"] = (
            X["hydration_level"] *
            X["sleep_hours"]
        )

        X["sleep_deficit"] = (
            7 - X["sleep_hours"]
        ).clip(lower=0)

        X["hydration_deficit"] = (
            3 - X["hydration_level"]
        ).clip(lower=0)

        X["stress_mood_interaction"] = (
            X["stress_level"] *
            (6 - X["mood_level"])
        )

        X["screen_sleep_ratio"] = (
            X["screen_time"] /
            (X["sleep_hours"] + 1)
        )

        return X
