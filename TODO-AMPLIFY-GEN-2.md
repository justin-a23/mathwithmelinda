# TODO: Migrate to Amplify Gen 2

**Status**: Planned for Summer 2026
**Hard deadline**: Done by Feb 2027 (90 days before AWS EOL on May 1, 2027)

## Why
- Amplify Gen 1 entered maintenance mode May 1, 2026
- Only critical bug fixes and security patches until May 1, 2027
- After EOL: no more updates of any kind
- New features and long-term support only on Gen 2

## Scope
- Rewrite `amplify/backend/api/mathwithmelinda/schema.graphql` as TypeScript Gen 2 schema
- Update all `client.graphql({...})` calls across the app (~200 touchpoints)
- Cognito setup migration (auth rules become code-first)
- Update Amplify CLI to Gen 2 in CI/build
- Test full data integrity: students, submissions, lessons, grades, messages, report cards

## Resources
- Migration guide: https://docs.amplify.aws/react/start/migrate-to-gen2/
- Feature comparison: https://docs.amplify.aws/react/start/migrate-to-gen2/#feature-comparison
- AWS Support if blocked

## When NOT to touch
- During active school year (Aug-May)
- During year-end reset
- When parents/students might need urgent access

## Best windows
- Summer 2026 (recommended — fresh tooling, fresh students in fall start on Gen 2)
- Winter break 2026-27 (fallback)
- Spring break 2027 (cutting it close)
