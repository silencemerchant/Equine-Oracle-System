# Equine Oracle - Testing Guide

## Overview
This guide covers all features and workflows in the Equine Oracle horse racing predictions website. Follow these steps to verify all functionality is working correctly.

---

## 1. Landing Page (Home)

**Location:** `/`

**Test Steps:**
1. Navigate to the home page
2. Verify the hero section displays with title "Predict Winners with Machine Learning"
3. Check that "View Live Races" button is visible and clickable
4. Verify "View Pricing" button links to subscription page
5. Check responsive design on mobile (hero should stack vertically)
6. Verify navigation bar shows "Live Races" link
7. If not authenticated, "Sign In" button should appear
8. If authenticated, "History" and "Subscription" buttons should appear

**Expected Behavior:**
- Premium dark theme with gold accents
- Smooth animations and transitions
- Clear call-to-action buttons
- Feature cards display with icons and descriptions

---

## 2. Live Races Feed

**Location:** `/live`

**Test Steps:**
1. Click "Live Races" from navigation
2. Verify page loads with "Today's Races" heading
3. Check that meetings are displayed in a grid
4. Each meeting card should show:
   - Meeting ID (e.g., "Meeting 1")
   - Meeting name (e.g., "Ellerslie")
   - Location
   - Number of races
   - Track condition with color coding
5. Below meetings, verify all races are listed
6. Each race card should show:
   - Race number (e.g., "Race 1") with primary color badge
   - Race status (Upcoming/Live/Closed)
   - Race name
   - Track, distance, start time
   - Race type, track condition, surface
   - Weather information
7. Click "Select Race & Predict" on any race
8. Verify you're redirected to prediction page with race details pre-populated

**Expected Behavior:**
- Meetings load quickly
- Races are organized clearly
- Color-coded track conditions (Green=Good, Orange=Soft, Red=Heavy)
- Clicking a race navigates to prediction form with auto-populated data

---

## 3. Prediction Form (Simplified Workflow)

**Location:** `/predict`

**Test Steps:**

### Step 1: Meeting Selection
1. Page should display "Select & Predict" heading
2. First step shows "1. Select Meeting" with numbered circle
3. Dropdown should list all available meetings
4. Select a meeting (e.g., "Ellerslie (8 races)")
5. Verify races for that meeting load in Step 2

### Step 2: Race Selection
1. After selecting a meeting, Step 2 becomes active
2. Circle changes from gray to gold/primary color
3. Dropdown shows all races for selected meeting
4. Each race shows: "Race X - 1200m @ 14:00"
5. Select a race
6. Verify horses for that race load in Step 3

### Step 3: Horse Selection
1. After selecting a race, Step 3 becomes active
2. Circle changes from gray to gold/primary color
3. Dropdown shows all horses in the race
4. Each horse shows: runner number, name, and barrier
5. Select a horse
6. Verify "Generate Prediction" button becomes enabled

### Submission
1. Click "Generate Prediction" button
2. Button should show loading state with spinner
3. After processing, should redirect to History page
4. Success toast should appear

**Expected Behavior:**
- Cascading selectors work smoothly
- Each step is clearly numbered and labeled
- Disabled steps show grayed-out styling
- Form prevents submission until all fields selected
- Loading state provides visual feedback

---

## 4. Prediction History

**Location:** `/history`

**Test Steps:**
1. Click "History" from navigation (requires authentication)
2. Page should display "Your Predictions" heading
3. Each prediction card should show:
   - Horse name
   - Track and distance
   - Race date
   - Win probability as percentage
   - Visual progress bar
4. For Premium/Elite subscribers:
   - Individual model scores (LightGBM, XGBoost, Random Forest)
   - Ensemble prediction result
5. Verify predictions are sorted by date (newest first)
6. Check responsive design - cards should stack on mobile

**Expected Behavior:**
- Predictions load from database
- Confidence scores display clearly
- Visual progress bars show win probability
- Subscription tier affects detail level shown
- Empty state message if no predictions exist

---

## 5. Subscription Management

**Location:** `/subscription`

**Test Steps:**
1. Click "Subscription" from navigation
2. Page should display all four subscription tiers:
   - **Free:** 5 predictions/day, LightGBM model
   - **Basic:** $9.99/month, 50 predictions/day
   - **Premium:** $29.99/month, 500 predictions/day, ensemble models
   - **Elite:** $99.99/month, unlimited predictions, API access
3. Current subscription should be highlighted with "Active" badge
4. Each tier should show features list
5. Click "Upgrade" or "Downgrade" buttons
6. Verify subscription changes in database
7. Check that prediction limits are enforced

**Expected Behavior:**
- Tiers display with clear pricing
- Current tier is visually distinct
- Upgrade/downgrade works smoothly
- Feature differences are clear
- Rate limiting enforced on API

---

## 6. Authentication Flow

**Test Steps:**
1. From home page, click "Sign In"
2. Should redirect to Manus OAuth login
3. After login, should redirect back to home
4. Navigation should show "History" and "Subscription" instead of "Sign In"
5. Click "Subscription" to verify authenticated access
6. From any page, logout should clear session
7. After logout, "Sign In" button should reappear

**Expected Behavior:**
- OAuth flow completes successfully
- Session persists across page navigation
- Protected routes require authentication
- Logout clears session properly

---

## 7. Responsive Design

**Test on Multiple Devices:**

### Desktop (1920px+)
- All content visible without scrolling (except long lists)
- Navigation spreads horizontally
- Cards display in multi-column grids
- Forms have optimal width

### Tablet (768px - 1024px)
- Navigation may stack
- Cards display in 2-column grid
- Touch targets are large enough
- Forms are readable

### Mobile (375px - 480px)
- Navigation collapses to hamburger menu (if implemented)
- Cards stack vertically
- Buttons are touch-friendly (44px+ height)
- Text is readable without zooming
- Dropdowns work smoothly

**Expected Behavior:**
- Layout adapts smoothly at breakpoints
- No horizontal scrolling
- Touch interactions work properly
- Text remains readable

---

## 8. Error Handling

**Test Cases:**

### Network Errors
1. Disable internet connection
2. Try to load live races
3. Should display mock data gracefully
4. No error messages should appear to user

### Invalid Selections
1. Try to submit prediction form without selecting all fields
2. Should show validation error
3. Button should remain disabled

### Database Errors
1. Check server logs for any database connection issues
2. Verify all CRUD operations work (create, read, update)

**Expected Behavior:**
- Graceful fallbacks to mock data
- Clear error messages to users
- No console errors
- App remains functional

---

## 9. Performance

**Test Steps:**
1. Open browser DevTools (F12)
2. Go to Performance tab
3. Record page load
4. Check metrics:
   - First Contentful Paint (FCP) < 2s
   - Largest Contentful Paint (LCP) < 3s
   - Cumulative Layout Shift (CLS) < 0.1
5. Check Network tab:
   - Total bundle size reasonable
   - No failed requests
   - Images optimized

**Expected Behavior:**
- Pages load quickly
- Smooth scrolling and interactions
- No layout shifts
- Efficient asset loading

---

## 10. Accessibility

**Test Steps:**
1. Use keyboard navigation (Tab key)
2. All interactive elements should be reachable
3. Check color contrast ratios
4. Verify focus indicators are visible
5. Test with screen reader (if available)

**Expected Behavior:**
- Full keyboard navigation support
- Clear focus indicators
- Sufficient color contrast
- Semantic HTML structure

---

## Summary Checklist

- [ ] Landing page displays correctly
- [ ] Live races feed loads and displays meetings/races
- [ ] Prediction form cascading selectors work
- [ ] Predictions can be created and saved
- [ ] Prediction history displays correctly
- [ ] Subscription tiers display and can be changed
- [ ] Authentication flow works
- [ ] Responsive design on all devices
- [ ] Error handling works gracefully
- [ ] Performance metrics are good
- [ ] Accessibility standards met

---

## Known Issues & Workarounds

### TAB API Errors
- **Issue:** TAB API returns 400 Bad Request in development
- **Workaround:** App falls back to mock data automatically
- **Resolution:** In production, ensure API credentials are properly configured

### Browser Compatibility
- **Tested on:** Chrome, Firefox, Safari (latest versions)
- **Known issues:** None

---

## Support

For issues or questions, contact the development team or check the project documentation.
