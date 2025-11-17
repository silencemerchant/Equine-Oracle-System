# Equine Oracle User Guide

## Purpose
Equine Oracle provides AI-powered horse racing predictions for New Zealand TAB races. You can browse live race feeds, analyze race data with auto-populated details, get win probability predictions with confidence scores, and track your prediction history to make informed betting decisions.

## Access
Login required for making predictions and viewing history. Free tier available with 5 predictions per day.

---

## Powered by Manus

Equine Oracle leverages cutting-edge technology to deliver accurate race predictions. The platform is built with **React 19** and **TypeScript** for a responsive frontend experience, **Express** and **tRPC 11** for type-safe API communication, and **MySQL/TiDB** for reliable data storage. The backend implements advanced machine learning algorithms including **LightGBM**, **XGBoost**, and **Random Forest** models trained on extensive historical race data. Premium tiers utilize ensemble prediction methods that combine multiple models for superior accuracy. The platform features **Manus OAuth** for secure authentication, **TAB NZ API integration** for live race feeds, and subscription management. Deployment runs on auto-scaling infrastructure with global CDN for fast, reliable access worldwide.

---

## Using Your Website

### Browsing Live Races

Click "Live Races" in the navigation menu to view today's race schedule from TAB NZ. The live feed displays race meetings grouped by track location, showing track conditions and weather. Scroll down to see all scheduled races with details including race number, name, track, distance, start time, race type, and current status. Each race card shows track condition with color coding (green for Good, orange for Soft, red for Heavy) and displays whether the race is Upcoming, Live, or Closed. Click "Select Race & Predict" on any race card to automatically populate the prediction form with that race's details.

### Making Predictions

After selecting a race from the live feed or clicking "Manual Entry," the prediction form opens with race details pre-filled if you came from the live feed. Enter the horse name you want to analyze, then verify or adjust the track (selected from dropdown of today's tracks), race type (Thoroughbred, Harness, or Greyhound), distance in meters, and race date. Optionally provide performance history including days since last race, winning streak, and losing streak for more accurate predictions. Click "Generate Prediction" to receive your AI-powered analysis. The system processes your input through machine learning models and displays win probability as a percentage along with a confidence rating. Premium and Elite subscribers receive ensemble predictions combining three different models for enhanced accuracy.

### Viewing History

Navigate to "History" from the top menu to see all your past predictions. Each prediction card shows the horse name, track, distance, race date, and the calculated win probability with a visual progress bar. Premium tier predictions display individual model scores from LightGBM, XGBoost, and Random Forest alongside the ensemble result. Use this history to analyze prediction patterns and track your betting performance over time.

### Managing Subscription

Click "Subscription" to view available plans and your current tier. The Free plan includes 5 predictions per day using the LightGBM model. Basic ($9.99/month) increases your limit to 50 predictions daily. Premium ($29.99/month) provides 500 predictions with ensemble predictions from three models plus advanced analytics. Elite ($99.99/month) offers unlimited predictions, full ensemble models, API access, and priority support. Your current plan is highlighted with an "Active" badge at the top of the subscription page.

---

## Managing Your Website

Access the Management UI from the chat interface to configure your website settings. Use the **Settings** panel to customize your website name and logo, adjust visibility controls, and manage notification preferences for the built-in notification system. The **Database** panel provides a visual interface for viewing and managing prediction records, subscription data, race information, and user information with full CRUD capabilities. Connection details are available in the bottom-left settings menu. The **Dashboard** panel displays real-time analytics including unique visitors and page views for your published site, along with status monitoring and visibility controls. Use the **Code** panel to browse the file structure and download all project files when needed.

---

## Next Steps

Talk to Manus AI anytime to request changes or add features. Start by browsing today's live races to see upcoming events, then select a race to make your first prediction with auto-populated details. Explore different subscription tiers to find the plan that matches your prediction volume needs and access advanced ensemble models for improved accuracy.
