# Assumptions

- Current local repo path is the active workspace folder under `C:\Users\jacks\Code`.
- Public product name is `Aussies First Home`.
- Internal package name is `aussies-first-home`.
- Demo mode is enabled when `DATABASE_URL` is missing or `USE_MEMORY_DB=true`.
- `ENABLE_ALT_HOME_HERO` controls an alternate homepage hero treatment.
- `ENABLE_ALT_ONBOARDING_RESULTS` controls an alternate onboarding result card treatment.
- `ENABLE_MONTH1_REPORT_EXPORTS` remains off by default because PDF export is a Month 1 item.
- Real scheme thresholds and tax tables should be reviewed against official sources before production launch.
