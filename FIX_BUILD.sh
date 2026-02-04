# Run these commands in your terminal to fix the build:

# Remove the conflicting [slug] folder from git
git rm -rf "src/app/dashboard/courses/[slug]"

# Commit and push
git commit -m "fix: remove conflicting [slug] folder"
git push
