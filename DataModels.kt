package com.horseracepredictorapp.data.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Data models for the Horse Race Predictor API
 */

@JsonClass(generateAdapter = true)
data class PredictionRequest(
    @Json(name = "horse_name")
    val horseName: String,
    val track: String,
    @Json(name = "race_type")
    val raceType: String,
    val distance: Int,
    val date: String,
    @Json(name = "days_since_last_race")
    val daysSinceLastRace: Int,
    @Json(name = "winning_streak")
    val winningStreak: Int,
    @Json(name = "losing_streak")
    val losingStreak: Int
)

@JsonClass(generateAdapter = true)
data class ModelPrediction(
    val prediction: Int,
    val probability: Double,
    val confidence: Double
)

@JsonClass(generateAdapter = true)
data class EnsemblePrediction(
    val prediction: Int,
    val probability: Double,
    val confidence: Double
)

@JsonClass(generateAdapter = true)
data class PredictionResponse(
    val input: PredictionRequest,
    val predictions: Map<String, ModelPrediction>,
    val ensemble: EnsemblePrediction,
    val timestamp: String,
    @Json(name = "model_version")
    val modelVersion: String
)

@JsonClass(generateAdapter = true)
data class BatchPredictionRequest(
    val races: List<PredictionRequest>
)

@JsonClass(generateAdapter = true)
data class BatchPredictionResult(
    @Json(name = "horse_name")
    val horseName: String,
    val prediction: Int,
    val probability: Double,
    val status: String,
    val error: String? = null
)

@JsonClass(generateAdapter = true)
data class BatchPredictionResponse(
    val results: List<BatchPredictionResult>,
    val timestamp: String
)

@JsonClass(generateAdapter = true)
data class ModelInfo(
    val models: List<String>,
    @Json(name = "feature_count")
    val featureCount: Int,
    val features: List<String>,
    val timestamp: String
)

@JsonClass(generateAdapter = true)
data class HealthCheckResponse(
    val status: String,
    val timestamp: String
)

@JsonClass(generateAdapter = true)
data class ApiError(
    val error: String
)

// UI Models for display
data class RaceInfo(
    val id: String,
    val horseName: String,
    val track: String,
    val raceType: String,
    val distance: Int,
    val date: String,
    val daysSinceLastRace: Int,
    val winningStreak: Int,
    val losingStreak: Int
)

data class PredictionDisplay(
    val raceInfo: RaceInfo,
    val prediction: PredictionResponse,
    val savedAt: Long = System.currentTimeMillis()
)

// User and subscription models
@JsonClass(generateAdapter = true)
data class User(
    val id: String,
    val email: String,
    @Json(name = "api_key")
    val apiKey: String,
    @Json(name = "subscription_tier")
    val subscriptionTier: String,
    @Json(name = "created_at")
    val createdAt: String
)

@JsonClass(generateAdapter = true)
data class SubscriptionInfo(
    val tier: String,
    @Json(name = "renewal_date")
    val renewalDate: String,
    @Json(name = "is_active")
    val isActive: Boolean,
    val features: List<String>
)

