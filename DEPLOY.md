# Deploy Language Studio for phone use

## Goal
The local Windows server is useful for development, but the phone version should ultimately run from an HTTPS URL so it works anywhere without keeping the PC on.

## GitHub Pages path
This repository includes a Pages workflow:
`.github/workflows/pages.yml`

When repository/account settings allow GitHub Pages:
1. Open repository Settings.
2. Open Pages.
3. Choose GitHub Actions as the deployment source if requested.
4. Run/push the main branch.
5. Open the generated Pages URL on the phone.

All app asset paths are relative so the site can run below a repository path.

## Until HTTPS deployment is enabled
Use:
- `RUN-LAN-WINDOWS.bat` for testing on the same Wi-Fi.
- **Thiết bị & dữ liệu** to export/import progress between devices.

## Data model
Current learning state is stored in browser localStorage under:
`interactiveEnglishBook:v2`

The JSON backup feature wraps this state with version metadata.

## Later cloud sync
For true PC ↔ phone automatic synchronization, add:
- authentication
- a user profile
- cloud database storage for progress and saved vocabulary
- conflict-safe sync

Do not store service keys in client-side JavaScript or commit secrets to Git.
