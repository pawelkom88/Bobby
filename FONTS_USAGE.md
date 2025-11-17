# 🎨 Bobby Fonts Usage Guide

Bobby uses two Google Fonts for a playful, accessible, and readable design.

## 📋 Font Stack

### **League Gothic** 🎪
- **Purpose**: Bold, playful headings
- **Aesthetic**: Cartoon-style, eye-catching
- **Applied to**: All `<h1>` to `<h6>` tags automatically
- **Weight**: 400 (only)
- **Use**: Titles, headlines, large display text

### **Source Sans 3** 📖
- **Purpose**: Readable body text
- **Aesthetic**: Clean, modern, accessible
- **Applied to**: Body, paragraphs, regular text
- **Weights**: 200–900 (full range) + italics
- **Use**: Paragraphs, UI text, instructions, labels

---

## 🎯 Automatic Application

No need to do anything - these fonts are **applied automatically**:

```jsx
<h1>Emergency Training</h1>        // Uses League Gothic
<p>Select an age group to begin.</p> // Uses Source Sans 3
```

---

## 🔧 Utility Classes

### **Font Weights** (Source Sans 3)

```jsx
<p className="font-light">Light text (200)</p>
<p className="font-regular">Regular text (400)</p>
<p className="font-semibold">Semi-bold text (600)</p>
<p className="font-bold">Bold text (700)</p>
<p className="font-extrabold">Extra bold text (800)</p>
<p className="font-italic">Italic text</p>
```

### **Font Family Classes**

```jsx
// Explicit League Gothic
<h2 className="league-gothic">My Heading</h2>

// Explicit Source Sans 3 variants
<p className="source-sans-3">Regular body text</p>
<p className="source-sans-3-light">Light body text</p>
<p className="source-sans-3-bold">Bold body text</p>

// Semantic names
<p className="body-text-regular">Regular body</p>
<p className="body-text-bold">Bold body</p>
```

---

## ♿ Accessibility Classes

### **Dyslexia-Friendly Font**

```jsx
<p className="dyslexia-font">
  This text uses OpenDyslexic font for better readability.
</p>
```

Falls back to Source Sans 3 if OpenDyslexic isn't available.

### **High Contrast Mode**

```jsx
<div className="high-contrast">
  <h1>Enhanced Contrast Text</h1>
  <p>Maximum visibility for users with vision impairments.</p>
</div>
```

---

## 🎨 CSS Variables

Access fonts directly via CSS variables:

```css
/* In your CSS */
body {
  font-family: var(--font-family-body);     /* Source Sans 3 */
}

h1 {
  font-family: var(--font-family-heading); /* League Gothic */
}
```

---

## 📊 Best Practices

✅ **Do**:
- Use `<h1>` to `<h6>` tags for headings (auto League Gothic)
- Use semantic HTML for paragraphs, labels, etc.
- Combine weight classes with League Gothic for emphasis
- Provide dyslexia-friendly alternative in settings

❌ **Avoid**:
- Using League Gothic for body text (harder to read in large blocks)
- Overusing font weight variations in headings
- Forgetting accessibility classes in user-configurable UI

---

## 🚀 Performance

All fonts load from Google CDN with:
- ✅ Preconnect for faster loading
- ✅ display=swap to prevent layout shifts
- ✅ Optical sizing auto-enabled
- ✅ Font smoothing for cross-browser consistency

---

## 📐 Font Metrics

### **League Gothic**
```
Font family: 'League Gothic', sans-serif
Weight: 400
Optical sizing: auto
Variation settings: 'wdth' 100
Letter spacing: 0.05em (in headings)
```

### **Source Sans 3**
```
Font family: 'Source Sans 3', sans-serif
Weights: 200, 300, 400, 500, 600, 700, 800, 900
Italics: Available for all weights
Optical sizing: auto
```

---

## 🎪 Examples for Bobby

### Emergency Training Screen

```jsx
<h1 className="league-gothic">EMERGENCY TRAINING</h1>
<p className="body-text-regular">Select an emergency situation below:</p>

<div>
  <h2 className="league-gothic">Fire Safety</h2>
  <p className="source-sans-3">Learn what to do in case of fire.</p>
</div>

<button className="font-bold">Start Training</button>
```

### Accessibility Settings

```jsx
<h2>Display Settings</h2>
<label>
  <input type="checkbox" /> Dyslexia-friendly font
</label>
<p className="dyslexia-font">Preview text in OpenDyslexic</p>

<label>
  <input type="checkbox" /> High contrast mode
</label>
<div className="high-contrast">
  <p>Preview in high contrast</p>
</div>
```

### Completion Screen

```jsx
<h1 className="league-gothic font-extrabold">🎉 EXCELLENT WORK!</h1>
<p className="font-semibold">You completed the training.</p>
<p className="font-light">Come back tomorrow for more practice.</p>
```

---

## 🔗 Resources

- [League Gothic](https://fonts.google.com/specimen/League+Gothic) - Google Fonts
- [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) - Google Fonts
- [Font Best Practices](../FONTS_BEST_PRACTICES.md)

---

**Start using these fonts in your components - they're ready to go!** 🎨

