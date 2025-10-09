# Cleanup Plan for Ananta Cable Platform

## Files to Delete

### 1. **Migration Documentation Files** (Completed phases - archived info)
These are milestone documentation files from the SvelteKit migration. Keep the final summary but remove intermediate phases:

**DELETE:**
- `SVELTEKIT_PHASE_3_COMPLETE.md`
- `SVELTEKIT_PHASE_4_COMPLETE.md`
- `SVELTEKIT_PHASE_5_COMPLETE.md`
- `SVELTEKIT_PHASE_6_TESTING.md`
- `SVELTEKIT_PHASE_7_CLEANUP.md`
- `SVELTEKIT_PHASE_8_DOCUMENTATION.md`
- `docs/SVELTEKIT_PHASE_1_COMPLETE.md`
- `docs/SVELTEKIT_PHASE_2_COMPLETE.md`

**KEEP:**
- `SVELTEKIT_MIGRATION_COMPLETE.md` - Final summary of migration
- `STEP_11_CONTRACTS_SDK_COMPLETE.md` - SDK documentation

**Reason**: Keep final summaries, remove intermediate phase docs.

### 2. **Temporary Fix Documentation**
These document specific bugs/fixes that are now resolved:

**DELETE:**
- `REBUILD_COMPLETE.md` - Container rebuild steps (one-time fix)
- `PORT_BINDING_FIX.md` - Docker networking fix (resolved)
- `FIX_404_ERROR.md` - Home page link fix (resolved)
- `VERIFICATION.md` - One-time verification steps

**KEEP:**
- `DRAWING_GENERATION_GUIDE.md` - Ongoing user guide
- `TESTING_GUIDE.md` - Ongoing testing reference
- `VISUALIZE_CHANGES.md` - Ongoing development guide
- `PORTAL_VS_CONSOLE_EXPLANATION.md` - Architecture documentation
- `API_TEST_REFERENCE.md` - Ongoing API reference
- `PORTAL_RENDER_VERIFICATION.md` - Testing reference

**Reason**: Keep ongoing guides, remove one-time fix documentation.

### 3. **GitLeaks Reports** (Security scan artifacts)
**DELETE:**
- `gitleaks-report.json` (9.3 MB!)
- `gitleaks-report-final.json`
- `gitleaks-report-source.json`

**Reason**: These are one-time security scan reports. They should not be committed to the repo.

### 4. **Python Cache Files**
**DELETE:**
- `services/drc/__pycache__/` (entire directory with .pyc files)
- `.pytest_cache/`

**Reason**: Python bytecode cache files - should be in .gitignore and not committed.

### 5. **Ad-hoc Test Scripts**
**DELETE:**
- `test-render-api.ps1`
- `test-services.ps1`
- `test-simple.yaml`
- `test.yaml`

**Reason**: Ad-hoc test scripts that should be replaced by proper test suites in the codebase.

### 6. **Old Startup Scripts**
**DELETE:**
- `start.bat`
- `start.py`
- `stop.bat`
- `stop.py`

**Reason**: Use `docker-compose` or `Taskfile.yml` instead for consistency.

### 7. **One-off Check Scripts**
**DELETE:**
- `check-db.js`

**Reason**: Appears to be a one-off debugging script.

### 8. **Implementation Complete Files** (in subdirectories)
**DELETE:**
- `services/renderer/IMPLEMENTATION_COMPLETE.md`
- `docs/integration/IMPLEMENTATION-COMPLETE.md`

**Reason**: Implementation details are in the main READMEs.

---

## Files to Keep

### ✅ **Active User Documentation**
- `DRAWING_GENERATION_GUIDE.md` - How to use drawing feature
- `TESTING_GUIDE.md` - Testing procedures
- `VISUALIZE_CHANGES.md` - Development workflow
- `PORTAL_VS_CONSOLE_EXPLANATION.md` - Architecture overview
- `API_TEST_REFERENCE.md` - API testing reference
- `PORTAL_RENDER_VERIFICATION.md` - Render testing guide

### ✅ **Migration Summary Documentation**
- `SVELTEKIT_MIGRATION_COMPLETE.md` - Final migration summary
- `STEP_11_CONTRACTS_SDK_COMPLETE.md` - SDK implementation summary

### ✅ **All README.md Files**
- Project READMEs in all subdirectories
- Service-specific documentation

### ✅ **Configuration Files**
- All Docker-related files (Dockerfile.*, docker-compose.yml)
- All config files (.eslintrc, .prettierrc, etc.)
- Package management (package.json, pnpm-*.yaml)
- Environment files (.env.example)

### ✅ **Docs Directory**
Keep most documentation in `docs/`:
- `docs/DEPLOYMENT.md`
- `docs/MIGRATION_NOTES.md`
- `docs/PORTAL_ARCHITECTURE.md`
- `docs/SVELTEKIT_MIGRATION_PLAN.md`
- `docs/adr/` (Architecture Decision Records)
- `docs/api/` (API documentation)
- `docs/playbooks/`
- `docs/runbooks/`
- `docs/testing/`
- `docs/integration/`

**Remove from docs/:**
- `docs/SVELTEKIT_PHASE_1_COMPLETE.md`
- `docs/SVELTEKIT_PHASE_2_COMPLETE.md`
- `docs/integration/IMPLEMENTATION-COMPLETE.md`

---

## Summary

### Files to Delete (13 files)
1. `SVELTEKIT_PHASE_3_COMPLETE.md`
2. `SVELTEKIT_PHASE_4_COMPLETE.md`
3. `SVELTEKIT_PHASE_5_COMPLETE.md`
4. `SVELTEKIT_PHASE_6_TESTING.md`
5. `SVELTEKIT_PHASE_7_CLEANUP.md`
6. `SVELTEKIT_PHASE_8_DOCUMENTATION.md`
7. `REBUILD_COMPLETE.md`
8. `PORT_BINDING_FIX.md`
9. `FIX_404_ERROR.md`
10. `VERIFICATION.md`
11. `docs/SVELTEKIT_PHASE_1_COMPLETE.md`
12. `docs/SVELTEKIT_PHASE_2_COMPLETE.md`
13. `services/renderer/IMPLEMENTATION_COMPLETE.md`
14. `docs/integration/IMPLEMENTATION-COMPLETE.md`

Plus: GitLeaks reports, Python cache, test scripts, old startup scripts

### Files to Keep (8 important .md files)
1. ✅ `DRAWING_GENERATION_GUIDE.md`
2. ✅ `TESTING_GUIDE.md`
3. ✅ `VISUALIZE_CHANGES.md`
4. ✅ `PORTAL_VS_CONSOLE_EXPLANATION.md`
5. ✅ `API_TEST_REFERENCE.md`
6. ✅ `PORTAL_RENDER_VERIFICATION.md`
7. ✅ `SVELTEKIT_MIGRATION_COMPLETE.md`
8. ✅ `STEP_11_CONTRACTS_SDK_COMPLETE.md`

Plus: All READMEs and docs/ directory files (except phase docs)

---

## Cleanup Script

See `CLEANUP_SCRIPT_REVISED.ps1` for automated cleanup.
