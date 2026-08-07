# Testing Checklist - Issue #200 Implementation

## Quick Start Testing (5 minutes)

### Setup
1. ✅ Ensure server is running (`npm start` or `node server.js`)
2. ✅ Log in to admin dashboard
3. ✅ Navigate to Profile tab

### Basic Test
```
Bio:    "machine learning engineer python"
Skills: "python tensorflow deep learning"
```
Expected: Suggestions appear (AI & Machine Learning, Data Science, etc.)

---

## Comprehensive Test Suite

### Test 1: Real-Time Suggestions ⏱️
**Objective**: Verify suggestions update as user types

**Steps**:
1. Clear bio and skills fields
2. Type in bio field: "p" → "ph" → "pho" → "phot" → "photo" (one letter at a time)
3. Watch suggestions panel
4. Verify suggestions update after 300ms debounce

**Expected Results**:
- ✓ No suggestions shown for "p"
- ✓ Suggestions appear for "photo" (Photography category)
- ✓ UI remains responsive (no freezing)
- ✓ Only 1 API call total on save (not per keystroke)

---

### Test 2: Duplicate Prevention 🚫
**Objective**: Ensure same interest can't be added twice

**Steps**:
1. Type bio: "photography"
2. Click "Photography" suggestion → Added to interests
3. Click "Photography" suggestion again (if still visible)
4. Verify no duplicate appears

**Expected Results**:
- ✓ "Photography" appears in "Your Interests"
- ✓ Clicking again has no effect
- ✓ Suggestion may disappear (filtered from suggestions when selected)

---

### Test 3: Remove Interests 🗑️
**Objective**: Verify interest removal functionality

**Steps**:
1. Click 3-4 suggestion chips to add them
2. Click X button on first interest tag
3. Verify interest removed immediately
4. Verify suggestions may reappear (if still matching input)

**Expected Results**:
- ✓ Tag removed from "Your Interests"
- ✓ Suggestions update in real-time
- ✓ No console errors

---

### Test 4: Save & Persistence 💾
**Objective**: Verify interests are saved to database

**Steps**:
1. Add interests: "Web Development", "Open Source", "Entrepreneurship"
2. Enter skills: "javascript react node"
3. Click "Save Changes" button
4. Wait for success toast
5. Refresh page (F5)
6. Go back to Profile tab
7. Verify interests still there

**Expected Results**:
- ✓ Green success toast appears
- ✓ Profile preview updates
- ✓ Interests persist after refresh
- ✓ Skills field still populated

**DevTools Network Check**:
- Open DevTools (F12) → Network tab
- Click "Save Changes"
- Find PUT `/api/profile` request
- Click it, go to "Payload" tab
- Verify contains:
  ```json
  {
    "skills": "javascript react node",
    "interests": ["Web Development", "Open Source", "Entrepreneurship"]
  }
  ```

---

### Test 5: Empty Input Handling 🔍
**Objective**: Verify system handles empty input gracefully

**Steps**:
1. Clear both bio and skills fields
2. Watch suggestions panel
3. Type just spaces: "     " in bio
4. Type special characters: "!@#$%"

**Expected Results**:
- ✓ Empty input → no suggestions (or "No suggestions yet" message)
- ✓ Spaces only → no suggestions
- ✓ Special chars → handled gracefully
- ✓ No console errors

---

### Test 6: Paste Events 📋
**Objective**: Verify suggestions work with pasted content

**Steps**:
1. Copy this text:
   ```
   I'm a full-stack web developer with expertise in JavaScript, React, Node.js,
   and cloud deployment on AWS. I also love open-source contributions.
   ```
2. Click in bio field
3. Paste text (Ctrl+V)
4. Watch suggestions appear

**Expected Results**:
- ✓ Suggestions appear after paste
- ✓ Multiple matching categories shown
- ✓ No delay/lag during paste
- ✓ No duplicate suggestions

---

### Test 7: Mobile Responsiveness 📱
**Objective**: Verify layout works on small screens

**Steps (using DevTools)**:
1. Open DevTools (F12)
2. Click device emulation icon
3. Select "iPhone 12" (390px width)
4. Test in Profile tab:
   - Type in bio
   - Add interests
   - Verify chips wrap correctly
   - Verify buttons/tags are touchable (>44px height)

**Expected Results**:
- ✓ Chips wrap to next line (no overflow)
- ✓ Text is readable
- ✓ Remove buttons are clickable
- ✓ No horizontal scroll
- ✓ Suggestion chips are tap-able

---

### Test 8: Edge Cases & Performance 🔧
**Objective**: Verify system stability under stress

**Test 8A: Very Long Input**
- Paste 2000+ character bio
- Type multiple times
- Expected: UI stays responsive, no crash

**Test 8B: Rapid Typing**
- Type: "python python python python javascript javascript"
- Hold down key for 3 seconds
- Expected: Suggestions update once, not for every keystroke

**Test 8C: Many Interests**
- Add 20+ interests (keep clicking suggestions)
- Expected: All display, no overflow, no lag

**Test 8D: Special Characters**
- Bio: "C++ C# F# Obj-C @angular #hashtag"
- Expected: Handled correctly, no console errors

---

### Test 9: Cross-Browser Testing 🌐

**Chrome/Edge (Chromium)**:
- [ ] Suggestions work
- [ ] Mobile emulation works
- [ ] DevTools shows correct API requests
- [ ] No console warnings

**Firefox**:
- [ ] All features work
- [ ] Styling looks correct
- [ ] Responsive design works

**Safari (if available)**:
- [ ] Click events work
- [ ] Animations smooth
- [ ] No layout shifts

---

### Test 10: Accessibility ♿
**Objective**: Verify WCAG compliance

**Steps**:
1. Use keyboard only (no mouse)
   - Tab through form fields
   - Use Space/Enter to interact with chips
   - Verify focus states visible

2. Check color contrast
   - Suggestion chips should be readable
   - Text should have sufficient contrast with background

3. Screen reader test (if available)
   - Labels should be clear
   - Buttons should be announced correctly

**Expected Results**:
- ✓ Keyboard navigation works
- ✓ Focus indicator visible
- ✓ No keyboard traps
- ✓ Labels associated with inputs
- ✓ Good color contrast (WCAG AA standard)

---

## Integration Tests

### Test 11: API Integration
**Objective**: Verify backend correctly saves/loads data

**Steps**:
1. Add interests and save
2. Open DevTools → Application/Storage
3. Check cookies (should have `conn_token`)
4. Make curl request (in terminal):
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/profile
   ```
5. Verify response includes interests

**Expected Results**:
- ✓ API returns 200 status
- ✓ Response includes interests array
- ✓ Response includes skills field
- ✓ Data matches what was saved

---

### Test 12: Public Profile Display
**Objective**: Verify interests display on public profile

**Steps**:
1. Add interests to profile and save
2. Get your username (from sidebar)
3. Go to `/u/your-username` or click "View My Page"
4. Open DevTools → Network tab
5. Check GET `/api/u/:username/profile` response

**Expected Results**:
- ✓ API response includes interests
- ✓ API response includes skills
- ✓ Response status 200

---

## Regression Testing

### Test 13: Existing Functionality Not Broken
**Objective**: Ensure new code doesn't break existing features

**Steps**:
1. **Test Profile Save Without Interests**:
   - Don't add any interests
   - Save profile
   - Expected: Works without errors

2. **Test Old Profiles (No Interests)**:
   - Create new account
   - Don't use interests feature
   - Save normally
   - Expected: No errors

3. **Test All Profile Fields**:
   - Name: ✓
   - Bio: ✓
   - Skills: ✓ (NEW)
   - Avatar: ✓
   - Socials: ✓
   - Interests: ✓ (NEW)

4. **Test Other Sections**:
   - Links section: ✓
   - Categories: ✓
   - Themes: ✓
   - Settings: ✓
   - Analytics: ✓

---

## Performance Benchmarks

### Expected Performance Metrics

| Metric | Target | Test Method |
|--------|--------|------------|
| Suggestion Time | <300ms | Type and measure response |
| Render Time | <50ms | DevTools Performance tab |
| Memory Usage | <5MB | DevTools Memory tab |
| CPU Usage | <10% | During typing |
| API Response | <500ms | Network tab |
| Initial Load | <3s | DevTools Lighthouse |

---

## Bug Report Template

If issues found, document as:

```markdown
**Test Case**: [Test number and name]
**Steps to Reproduce**:
1. ...
2. ...
3. ...

**Expected Behavior**: ...
**Actual Behavior**: ...
**Screenshot**: [If applicable]
**Console Errors**: [Any error messages]
**Browser/Device**: [Chrome 120, iPhone 12, etc.]
**Severity**: [Critical/High/Medium/Low]
```

---

## Sign-Off Checklist

- [ ] All 13 tests pass
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Cross-browser compatible
- [ ] Accessibility verified
- [ ] Performance acceptable
- [ ] Data persists correctly
- [ ] No regressions detected
- [ ] Code reviewed
- [ ] Ready for production

---

## Success Criteria

✅ **PASS** if:
- Suggestions generate correctly
- Duplicates prevented
- Interests save/load properly
- UI looks good on all devices
- No console errors
- Mobile responsive
- All 13 tests pass
- No existing features broken

❌ **FAIL** if:
- Suggestions don't appear
- Duplicates not prevented
- Data doesn't persist
- Broken styling
- Console errors
- API failures
- Any test fails
- Regression detected

---

## Debug Commands

**Check if script loaded**:
```javascript
// In browser console
console.log(window.InterestRecommender);
// Should output object with methods
```

**Test recommendation engine directly**:
```javascript
window.InterestRecommender.generateInterestSuggestions(
  "machine learning python",
  "data science tensorflow"
)
// Should return array of categories
```

**Check saved interests**:
```javascript
// In admin.js context
console.log(getSelectedInterests());
// Should return array of selected interests
```

**Monitor API calls**:
```
DevTools → Network tab
Filter: /api/profile
```

---

## Performance Profiling

**To measure rendering performance**:
1. DevTools → Performance tab
2. Click Record
3. Type in bio field (3-4 seconds)
4. Click Stop
5. Check timeline for:
   - Long tasks (>50ms)
   - Layout thrashing
   - Unnecessary repaints

---

**Test Suite Completed! 🎉**

Expected time to complete all tests: **30-45 minutes**

For questions, refer to `IMPLEMENTATION_REPORT.md`
