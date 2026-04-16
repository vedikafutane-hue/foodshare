# Design Brief — FoodShare

**Purpose**: Food waste reduction platform connecting donors, NGOs, agents, and admins. Clean, accessible, warm, hopeful. Role-driven visual coding accelerates user navigation.

## Tone
Empowering, practical, immediate impact. Anti-charity-guilt; pro-action. Editorial tone via Fraunces display type signals "real solutions, not generic."

## Color Palette — Light Mode

| Token               | OKLCH              | Role/Use                   |
|---------------------|-------------------|----------------------------|
| **Primary**         | 0.62 0.2 141      | Donor (emerald green)      |
| **Secondary**       | 0.60 0.19 262     | NGO (trust blue)           |
| **Accent**          | 0.65 0.24 50      | Agent (action orange)      |
| **Destructive**     | 0.56 0.23 22      | Warnings, rejections       |
| **Background**      | 0.98 0 0          | Page canvas                |
| **Card**            | 0.99 0 0          | Content containers         |
| **Foreground**      | 0.16 0 0          | Body text                  |
| **Muted**           | 0.92 0 0          | Secondary text, borders    |
| **Border**          | 0.88 0 0          | Dividers, outlines         |

## Color Palette — Dark Mode

| Token               | OKLCH              | Role/Use                   |
|---------------------|-------------------|----------------------------|
| **Primary**         | 0.72 0.19 141     | Donor (bright emerald)     |
| **Secondary**       | 0.68 0.18 262     | NGO (bright blue)          |
| **Accent**          | 0.74 0.23 50      | Agent (bright orange)      |
| **Background**      | 0.13 0 0          | Page canvas                |
| **Card**            | 0.17 0 0          | Content containers         |
| **Foreground**      | 0.96 0 0          | Body text                  |

## Typography

| Use           | Font              | Scale          | Weight    |
|---------------|-------------------|----------------|-----------|
| **Headings**  | Fraunces (serif)  | 32px–48px     | 700–900   |
| **Body**      | Nunito (sans)     | 14px–18px     | 400–600   |
| **Code/Data** | JetBrains Mono    | 12px–14px     | 400–700   |

## Structural Zones

| Zone       | Treatment                                    | Purpose                            |
|-----------|----------------------------------------------|------------------------------------|
| Header    | Elevated card (border-b), primary accent left border | Role nav, branding                 |
| Dashboard | Card grid on muted bg (0.92 0 0)            | Role-specific content              |
| Footer    | Muted bg (0.92 0 0), border-t               | Links, legal                       |
| Forms     | White cards, input contrast on input tokens | Donation capture, minimal friction |

## Shape Language
- **Radius**: 0.375rem (soft, modern)
- **Buttons**: Large, accessible (px-6 py-3, 18px+ text)
- **Density**: Mobile-first generous spacing, expand on desktop
- **Shadows**: Single layer (shadow-sm), no glow

## Button Patterns

- **.btn-primary**: Green (Donor), large, dominant CTA
- **.btn-secondary**: Blue (NGO), secondary actions
- **.btn-accent**: Orange (Agent), logistics/task CTAs
- **Active state**: scale-95 + 0.3s transition

## Role Badges

- **.role-donor**: Left border emerald (0.62 0.2 141)
- **.role-ngo**: Left border blue (0.60 0.19 262)
- **.role-agent**: Left border orange (0.65 0.24 50)

## Signature Detail
Role-specific color coding on card left borders + header accent bar. Users see their role immediately on any page. Reinforces social-impact mission: "Your role matters. Your action counts."

## Constraints
- No gradient clutter, no glow effects
- All colors must pass WCAG AA+ in light and dark
- Large buttons always visible on mobile (min 48px tap target)
- Minimal form steps accelerate donation capture

