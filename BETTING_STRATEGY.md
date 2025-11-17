# Equine Oracle Betting Strategy Guide

## Overview

The Equine Oracle prediction engine uses a **confidence-based betting strategy** to help determine when placing bets offers positive expected value. This document explains how the system works and how to use it to maximize returns while minimizing risk.

## Confidence Scoring System

The prediction engine calculates a confidence score (0-1) for each horse based on two key factors:

### 1. Prediction Strength (70% weight)
The model's normalized prediction score indicates how strongly the model favors this horse relative to others in the race. A higher normalized score means the model has greater confidence in that horse's ranking.

### 2. Score Separation (30% weight)
The gap between this horse's score and the next closest competitor indicates how decisive the prediction is. A larger gap means the model is more certain about the ranking order.

**Formula:**
```
Confidence = (0.7 × Normalized Score) + (0.3 × Score Separation)
```

## Confidence Levels

| Confidence Range | Level | Betting Recommendation |
|---|---|---|
| 0.85 - 1.00 | **VERY_HIGH** | Strong Buy - Excellent betting opportunity |
| 0.75 - 0.84 | **HIGH** | Buy - Good betting opportunity |
| 0.65 - 0.74 | **MODERATE** | Hold - Acceptable risk/reward |
| 0.55 - 0.64 | **LOW** | Wait - Marginal opportunity |
| 0.00 - 0.54 | **VERY_LOW** | Avoid - Poor expected value |

## Betting Signals

The system generates four types of signals based on the horse's rank and confidence score:

### STRONG_BUY (Signal for #1 ranked horse, Confidence ≥ 0.65)
- **Recommendation:** Place WIN bet
- **When to use:** Model shows clear winner with high confidence
- **Expected ROI:** 15-25% (for very high confidence)
- **Risk Level:** Low to Moderate

### BUY (Signal for #1-2 ranked horses, Confidence ≥ 0.55)
- **Recommendation:** Place PLACE or EXACTA bet
- **When to use:** Model shows strong top-2 contenders
- **Expected ROI:** 10-15% (for high confidence)
- **Risk Level:** Moderate

### HOLD (Signal for top-3 horses, Confidence ≥ 0.50)
- **Recommendation:** Consider for TRIFECTA or FIRST FOUR
- **When to use:** Model shows competitive top-3 but less certainty
- **Expected ROI:** 5-10% (for moderate confidence)
- **Risk Level:** Moderate to High

### WAIT (Signal for all horses, Confidence < 0.50)
- **Recommendation:** Insufficient confidence - wait for better odds
- **When to use:** Race is too unpredictable or odds don't justify the risk
- **Expected ROI:** Negative expected value
- **Risk Level:** High

## Race Difficulty Assessment

The system also classifies races based on prediction confidence spread:

| Race Type | Score Gap | Characteristics |
|---|---|---|
| **EASY** | > 0.30 | Clear winner, predictable outcome |
| **MODERATE** | 0.10 - 0.30 | Competitive race, some uncertainty |
| **DIFFICULT** | < 0.10 | Very close race, high unpredictability |

## Betting Decision Framework

### Step 1: Check Overall Recommendation
- **STRONG_BET:** Proceed to Step 2
- **BET:** Proceed to Step 2 with caution
- **CAUTIOUS_BET:** Verify odds before betting
- **HOLD:** Skip this race or wait for better information

### Step 2: Verify Confidence Threshold
Compare the top horse's confidence against your minimum threshold:
- **Conservative bettor:** Use 0.75 threshold (only VERY_HIGH confidence)
- **Moderate bettor:** Use 0.65 threshold (HIGH or VERY_HIGH)
- **Aggressive bettor:** Use 0.55 threshold (MODERATE or higher)

### Step 3: Assess Race Difficulty
- **EASY races:** Higher probability of model accuracy, consider larger bets
- **MODERATE races:** Standard bet sizing
- **DIFFICULT races:** Reduce bet size or skip entirely

### Step 4: Check Betting Odds
Even with high confidence, only place bets if the odds offer positive expected value:

**Expected Value Formula:**
```
EV = (Confidence × Potential Win) - ((1 - Confidence) × Bet Amount)
```

**Example:**
- Confidence: 0.75
- Bet: $100
- Potential Win: $200
- EV = (0.75 × $200) - (0.25 × $100) = $150 - $25 = **$125 positive EV**

## Recommended Bet Types by Confidence

| Confidence | Win Bet | Place Bet | Exacta | Trifecta | First Four |
|---|---|---|---|---|---|
| 0.85+ | ✓✓✓ | ✓✓ | ✓✓ | ✓ | - |
| 0.75-0.84 | ✓✓ | ✓✓✓ | ✓✓ | ✓ | - |
| 0.65-0.74 | ✓ | ✓✓ | ✓✓ | ✓✓ | ✓ |
| 0.55-0.64 | - | ✓ | ✓ | ✓✓ | ✓✓ |
| <0.55 | - | - | - | - | - |

**Legend:** ✓✓✓ = Highly recommended, ✓✓ = Recommended, ✓ = Consider, - = Avoid

## Risk Management

### Bankroll Management
- **Unit size:** Bet 1-2% of total bankroll per race
- **Daily limit:** Never risk more than 5-10% of bankroll in one day
- **Losing streak:** Stop betting after 3 consecutive losses

### Confidence-Based Stake Sizing
Adjust bet size based on confidence level:
- **VERY_HIGH (0.85+):** 2x base unit
- **HIGH (0.75-0.84):** 1.5x base unit
- **MODERATE (0.65-0.74):** 1x base unit
- **LOW (0.55-0.64):** 0.5x base unit
- **VERY_LOW (<0.55):** Skip or minimal bet

### Tracking Performance
Maintain detailed records of:
1. Confidence score vs. actual race outcome
2. Win rate by confidence level
3. ROI by race difficulty
4. Bet type performance

Use this data to calibrate your confidence threshold over time.

## Important Disclaimers

**The Equine Oracle system is a predictive tool, not a guaranteed winning system.** Key limitations include:

- **Model accuracy:** The LightGBM model achieves ~79% ROC-AUC on historical data, but future performance may differ
- **Data quality:** Predictions depend on the quality and timeliness of input data
- **Market factors:** Unexpected events (injuries, weather, jockey changes) can invalidate predictions
- **Odds variability:** Even accurate predictions lose money if odds don't reflect true probabilities
- **Regression to mean:** Short-term results may deviate significantly from expected value

**Always bet responsibly and within your means.** Never bet money you cannot afford to lose.

## API Usage Example

```typescript
// Get predictions
const predictions = await trpc.prediction.predictRanking.mutate([
  {
    horse_name: "Thunder",
    distance: 1400,
    days_since_last_race: 14,
    PREV_RACE_WON: 1,
    WIN_STREAK: 2,
    IMPLIED_PROBABILITY: 0.25,
    NORMALIZED_VOLUME: 0.15,
    MARKET_ACTIVITY_WINDOW_HOURS: 4.5,
  },
  // ... more horses
]);

// Get betting signals
const signals = await trpc.prediction.bettingSignals.query({
  predictions: predictions,
  confidenceThreshold: 0.65,
});

// Check recommendation
if (signals.overall_recommendation === "STRONG_BET") {
  // Place bets based on signals
  signals.signals.forEach(signal => {
    if (signal.signal === "STRONG_BUY") {
      console.log(`Place WIN bet on ${signal.horse_name}`);
    }
  });
}
```

## Conclusion

The Equine Oracle betting strategy combines machine learning predictions with disciplined risk management to identify high-value betting opportunities. Success requires:

1. **Consistent application** of the confidence-based framework
2. **Rigorous bankroll management** to survive inevitable losing streaks
3. **Continuous monitoring** of model performance and calibration
4. **Responsible betting** within your financial means

By following this strategy and tracking your results, you can develop a data-driven approach to horse racing that maximizes long-term profitability.
