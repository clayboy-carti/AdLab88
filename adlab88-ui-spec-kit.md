# ADLAB 88 --- UI Specification Kit

This document defines the structural UI system for building AdLab 88
consistently.

------------------------------------------------------------------------

## Layout Grid

Base Layout: - 16:9 desktop-first - Left fixed sidebar (240px--280px
width) - Main content container max width: 1200px - 24px base spacing
unit

Spacing Scale: - 4px micro spacing - 8px tight spacing - 16px standard
spacing - 24px section spacing - 48px major section break

------------------------------------------------------------------------

## Borders & Corners

-   1px--2px solid #111111 borders
-   No rounded corners
-   No shadows (unless extremely subtle and structural)
-   Square geometry only

------------------------------------------------------------------------

## Sidebar System

Background: #1F3A32\
Text: #F3ECDC\
Active Item: Rust background (#B55233) with black text

Typography: - Uppercase monospace - 14--16px - Tight letter spacing

Logo: - ADLAB 88 - Monospace uppercase - Thin rust underline

------------------------------------------------------------------------

## Header System

Page Title: - Uppercase monospace - 28--36px - Rust underline accent
(2px thick)

Subtext: - Sans-serif - 14--16px - Graphite color

------------------------------------------------------------------------

## Card System

Card Container: - Thin black border - Background: Warm Paper - Internal
padding: 16--24px - Sharp edges only

Card Hierarchy: 1. Title (Monospace uppercase) 2. Data / Image 3.
Metadata (small uppercase) 4. Action button

------------------------------------------------------------------------

## Buttons

Primary Button: - Background: Rust (#B55233) - Border: 1px solid
#111111 - Text: Uppercase monospace - No gradient - No shadow

Secondary Button: - Background: Transparent - Border: 1px solid
#111111 - Text: Uppercase monospace

------------------------------------------------------------------------

## Input Fields

-   1px black border
-   White or Warm Paper fill
-   Square corners
-   Monospace labels
-   8--12px internal padding

Dropdown: - Same structure - Simple ▼ symbol - No rounded styling

------------------------------------------------------------------------

## Data Visualization

Charts: - Line color: Rust (#B55233) - Secondary comparison: Deep Forest
(#1F3A32) - Minimal axis labels - No animated gradients

Progress Bars: - Black border - Forest fill - Square edges

------------------------------------------------------------------------

## Iconography

-   Thin line icons only
-   Monochrome
-   No emoji style
-   No 3D shading
-   No filled cartoon icons

------------------------------------------------------------------------

## Visual Density Rules

AdLab 88 favors restraint over decoration.

-   Limit accent colors per screen to 2
-   Avoid excessive shapes
-   No floating abstract blobs
-   Subtle grid only
-   Use whitespace intentionally

------------------------------------------------------------------------

## Interaction States

Hover: - Slight background darken (5--8%) - No glow - No animated bounce

Active: - 1px thicker border - Rust highlight indicator

------------------------------------------------------------------------

## Engineering Standard

Every UI component should feel:

-   Precise
-   Intentional
-   Structured
-   Software-first
-   Data-driven

If it feels decorative, simplify it. If it feels trendy, reduce it. If
it feels playful, sharpen it.

AdLab 88 is an experiment engine. The interface reflects that
discipline.
