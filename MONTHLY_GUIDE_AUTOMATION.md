# Monthly Guide Automation System

## Overview

The Monthly Guide Automation System allows you to easily update astronomical content for each month by providing a URL from High Point Scientific or manually entering guide information.

## How to Use

### Access the Admin Interface

1. Navigate to `/admin` in your browser
2. You'll see the Monthly Guide Administration panel

### Option 1: URL Import (Recommended)

1. Select **URL Import** mode
2. Paste a High Point Scientific URL (e.g., monthly "What's in the Sky" articles)
3. Click **Import Guide**
4. The system will automatically:
   - Extract celestial objects from the content
   - Create database entries for each object
   - Update the monthly guide with proper descriptions
   - Add objects to the "Featured Objects This Month" section

### Option 2: Manual Entry

1. Select **Manual Entry** mode
2. Fill in the required fields:
   - Month and Year
   - Hemisphere (Northern/Southern/Both)
   - Headline (e.g., "June 2025: Summer Sky Highlights")
   - Guide Content (detailed description with observing tips)
   - Video URL (optional YouTube embed)
3. Click **Create Guide**

## What Happens After Update

1. **Monthly Guide Section** displays the new content with featured objects
2. **Celestial Objects** become available with "Add to Observe" functionality
3. **Object Cards** show detailed information, viewing tips, and observing data
4. **Users** can add featured objects directly to their observation lists

## Example Workflow

### For June 2025 (Already Completed):
- Source: High Point Scientific June 2025 guide
- Objects Added: Mars, Regulus, M13, M102, Graffias, IC 4665
- Features: Mars-Regulus conjunction details, Hercules Cluster tips, etc.

### For July 2025 (Next Month):
1. Find High Point Scientific July 2025 guide URL
2. Go to `/admin`
3. Paste URL and click Import
4. System automatically updates all content

## Technical Details

- **Database**: Objects stored with proper coordinates, magnitudes, viewing tips
- **Images**: Automatic image selection based on object type
- **Filtering**: Objects filterable by type, hemisphere, and month
- **Integration**: Seamless connection with existing observation system

## Files Created

- `server/scripts/updateMonthlyGuide.ts` - Core automation script
- `client/src/pages/Admin.tsx` - Admin interface
- API endpoints for processing URLs and manual entries

## Command Line Usage (Alternative)

You can also run the script directly:

```bash
cd server
tsx scripts/updateMonthlyGuide.ts "https://example-url.com"
```

This provides the same functionality as the web interface but through command line.