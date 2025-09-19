# HOA Nexus - Overlay & Modal Design System

## Overview
This document defines the design patterns for user interface components in the HOA Nexus application, specifically distinguishing between **Overlays** and **Modals**.

## Core Architecture

### Base Layer: Community Information
- **Component**: `InformationContainer` (Community Info, Resident Info, Amenities tabs)
- **Purpose**: The persistent base layer that users always return to
- **State**: Always loaded and maintained in the background
- **Navigation**: Users can switch between tabs (Community Info, Resident Info, Amenities)

### Overlay System
- **Purpose**: Full-screen focused tools that temporarily replace the base layer
- **Behavior**: One overlay active at a time
- **Navigation**: "Back to Community" button returns to base layer
- **State**: Overlays are independent tools that don't affect base layer state

### Modal System
- **Purpose**: Small, focused dialogs for quick actions or confirmations
- **Behavior**: Can appear over any layer (base or overlay)
- **Navigation**: Close button or backdrop click
- **State**: Temporary, doesn't affect main application state

## Component Classification

### Overlays (Full-Screen Tools)
**When to use**: Complex workflows that need full screen space
- ✅ **Directory** - Stakeholder management (Lookup, Add New)
- ✅ **Reports** - Report generation and viewing
- ✅ **Management** - Administrative tools
- ✅ **Settings** - Application configuration
- ✅ **Analytics** - Data visualization and insights

**Characteristics**:
- Full screen coverage
- Dedicated header with "Back to Community" button
- Complex forms or data tables
- Multi-step workflows
- Rich interactions

### Modals (Focused Dialogs)
**When to use**: Quick actions, confirmations, or focused forms
- ✅ **Edit Forms** - Quick edits to existing data
- ✅ **Delete Confirmations** - "Are you sure?" dialogs
- ✅ **Quick Add** - Simple forms (single field additions)
- ✅ **Notifications** - Success/error messages
- ✅ **Help/Info** - Contextual help dialogs

**Characteristics**:
- Centered on screen
- Backdrop overlay
- Limited to essential fields
- Single-purpose actions
- Quick interactions

## Implementation Pattern

### State Management
```typescript
// App-level state
interface AppState {
  currentOverlay: 'directory' | 'reports' | 'management' | 'settings' | null;
  overlayParams: Record<string, any>; // For passing data to overlays
  selectedCommunity: Community | null;
  communityTab: number; // Preserve tab state
}
```

### Navigation Flow
```
Community Info (Base Layer)
    ↓ [Directory Button]
Directory Overlay
    ↓ [Back to Community]
Community Info (Base Layer) ← Returns to same tab
    ↓ [Reports Button]
Reports Overlay
    ↓ [Back to Community]
Community Info (Base Layer) ← Returns to same tab
```

### Component Structure
```
App
├── Header (Menu Navigation)
├── InformationContainer (Base Layer)
│   ├── Tab Navigation (Community Info, Resident Info, Amenities)
│   └── Tab Content
└── OverlayContainer (Conditional)
    ├── Directory Overlay
    ├── Reports Overlay
    └── Management Overlay
```

## Design Principles

### 1. Context Preservation
- **Community selection** is always maintained
- **Tab selection** is preserved when returning from overlays
- **Search/filter state** is maintained within overlays
- **Form data** is preserved during overlay navigation

### 2. Clear Navigation
- **Overlays**: Always have a "Back to Community" button
- **Modals**: Always have a close button (X) and backdrop click
- **Breadcrumbs**: Show current location in overlay headers
- **Consistent styling**: Same button styles across all components

### 3. Performance Optimization
- **Lazy loading**: Overlays load only when needed
- **State management**: Efficient state updates without unnecessary re-renders
- **Memory management**: Clean up overlay state when switching overlays

### 4. User Experience
- **Predictable behavior**: Same navigation patterns across all overlays
- **Visual feedback**: Clear indication of current state
- **Keyboard navigation**: Support for ESC key to close modals/overlays
- **Responsive design**: Works on all screen sizes

## Current Implementation Status

### ✅ Completed
- **Directory Overlay**: Full stakeholder management system
- **Base Layer**: Community Information with tabs
- **Navigation**: Menu system with Directory dropdown

### 🔄 In Progress
- **Overlay System**: Converting Directory to true overlay
- **Back Navigation**: "Back to Community" button implementation

### 📋 Planned
- **Reports Overlay**: Report generation and viewing
- **Management Overlay**: Administrative tools
- **Settings Overlay**: Application configuration
- **Modal System**: Edit forms and confirmations

## Decision Matrix

| Feature | Overlay | Modal | Reason |
|---------|---------|-------|---------|
| Stakeholder Directory | ✅ | ❌ | Complex list with search/filters |
| Add New Stakeholder | ✅ | ❌ | Multi-field form, needs space |
| Edit Stakeholder | ❌ | ✅ | Quick edit, limited fields |
| Delete Confirmation | ❌ | ✅ | Simple yes/no decision |
| Report Generation | ✅ | ❌ | Complex forms and data display |
| Quick Settings | ❌ | ✅ | Simple toggle switches |
| Help Documentation | ❌ | ✅ | Read-only content |

## Future Considerations

### Scalability
- **Overlay Stack**: Support for nested overlays if needed
- **State Management**: Consider Redux/Zustand for complex state
- **Performance**: Virtual scrolling for large data sets
- **Caching**: Cache overlay data for better performance

### Accessibility
- **Screen Readers**: Proper ARIA labels and roles
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling in overlays
- **Color Contrast**: Ensure accessibility standards

### Mobile Responsiveness
- **Touch Gestures**: Swipe to close overlays
- **Responsive Layouts**: Optimize for mobile screens
- **Performance**: Lazy load components on mobile
- **Offline Support**: Cache data for offline use

---

*This document should be updated as new features are added and patterns evolve.*
