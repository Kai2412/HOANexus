# Navigation System Structure

## Overview
This document explains the new navigation system implementation. The system supports two modes:
1. **Default Mode**: Original tab-based navigation (Community Info, Resident Info, Amenities tabs)
2. **Navigation Mode**: New sidebar-based navigation with hierarchical sections

## Component Structure

### 1. Navigation Configuration (`frontend/src/config/navigationConfig.tsx`)
**Purpose**: Central configuration file that defines all navigation sections and items.

**Key Exports**:
- `navigationConfig`: Array of navigation sections
- `NavigationSection`: Interface for sections (Community Info, Residents, Amenities)
- `NavigationItem`: Interface for items within sections (General, Fees, etc.)
- Helper functions: `findNavigationItem()`, `findNavigationSection()`

**Current Structure**:
```
Community Info
  └─ General
Residents
  └─ Resident Info
Amenities
  └─ Amenities
```

### 2. NavigationSidebar Component (`frontend/src/components/NavigationSidebar/`)
**Purpose**: Displays the hierarchical sidebar navigation.

**Props**:
- `selectedItemId`: Currently selected navigation item ID
- `onItemSelect`: Callback when item is clicked
- `userRole`: For future role-based filtering

**Features**:
- Collapsible sections (expand/collapse)
- Active item highlighting
- Role-based visibility (prepared for future)

### 3. ContentDisplayArea Component (`frontend/src/components/ContentDisplayArea/`)
**Purpose**: Wrapper that displays the selected navigation item's content.

**Props**:
- `selectedItemId`: ID of the item to display
- `selectedCommunity`: Current community

**Behavior**:
- Looks up the component from `navigationConfig`
- Renders the appropriate component
- Shows placeholder if no item selected

### 4. Menus Component (Updated)
**New Feature**: Added "Community Info" button

**New Props**:
- `onCommunityInfoClick`: Callback when Community Info button is clicked

**Behavior**:
- Clicking "Community Info" enters navigation mode
- Other buttons work as before (overlays)

### 5. InformationContainer Component (Updated)
**New Feature**: Supports both navigation modes

**New Props**:
- `navigationMode`: Boolean to enable sidebar mode
- `onExitNavigationMode`: Callback to exit navigation mode

**Behavior**:
- If `navigationMode = true`: Shows sidebar + content area
- If `navigationMode = false`: Shows original tabs (default)
- Overlays still work in both modes

### 6. App.tsx (Updated)
**New State**:
- `isNavigationMode`: Tracks if navigation mode is active

**New Handlers**:
- `handleCommunityInfoClick()`: Enters navigation mode
- `handleExitNavigationMode()`: Exits navigation mode

## How It Works

### Entering Navigation Mode
1. User clicks "Community Info" button in menu
2. `handleCommunityInfoClick()` sets `isNavigationMode = true`
3. `InformationContainer` detects navigation mode
4. Renders `NavigationSidebar` + `ContentDisplayArea` instead of tabs

### Navigation Flow
1. Sidebar shows all sections (Community Info, Residents, Amenities)
2. User clicks a section to expand/collapse
3. User clicks an item (e.g., "General")
4. `onItemSelect` updates `selectedNavigationItemId`
5. `ContentDisplayArea` looks up the component and renders it

### Exiting Navigation Mode
- Clicking any other menu button (Directory, Forms, etc.) exits navigation mode
- Overlays take precedence over navigation mode

## File Locations

```
frontend/src/
├── config/
│   └── navigationConfig.tsx          # Navigation structure definition
├── components/
│   ├── NavigationSidebar/
│   │   ├── NavigationSidebar.tsx    # Sidebar component
│   │   └── index.ts
│   ├── ContentDisplayArea/
│   │   ├── ContentDisplayArea.tsx    # Content wrapper
│   │   └── index.ts
│   ├── Menus/
│   │   └── Menus.tsx                 # Updated with Community Info button
│   └── InformationContainer/
│       └── InformationContainer.tsx  # Updated to support both modes
└── App.tsx                            # Updated with navigation mode state
```

## Adding New Navigation Items

To add a new navigation item:

1. **Create the component** (if it doesn't exist)
2. **Update `navigationConfig.tsx`**:
   ```typescript
   {
     id: 'fees',
     label: 'Community Fees',
     component: CommunityFees, // Import at top
     requiredRole: ['Manager', 'Basic Employee']
   }
   ```
3. **Add to appropriate section's `items` array**
4. **That's it!** The sidebar will automatically show it

## Future Enhancements

- Role-based visibility (currently prepared, not active)
- Breadcrumbs
- Search/filter in sidebar
- Favorites/pinned items
- Back button to exit navigation mode
- Remember last viewed item

## Testing Checklist

- [ ] Community Info button appears in menu
- [ ] Clicking Community Info shows sidebar
- [ ] Sidebar sections expand/collapse
- [ ] Clicking "General" shows CommunityInfo component
- [ ] Clicking other menu buttons exits navigation mode
- [ ] Overlays still work when navigation mode is active
- [ ] Original tabs still work when navigation mode is off

