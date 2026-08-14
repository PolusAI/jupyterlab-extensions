# Testing the Copy Snippet Feature

Guide for reviewers testing the **Copy snippet** button in the `jupyter-dataset` Datasets sidebar.

- **Feature issue:** [PolusAI/jupyterlab-extensions#54](https://github.com/PolusAI/jupyterlab-extensions/issues/54)
- **Depends on:** [PR #53](https://github.com/PolusAI/jupyterlab-extensions/pull/53) (adds the `jupyter-dataset` extension)
- **Review scope:** Only these files implement Copy snippet:
  - `src/index.ts`
  - `style/base.css`

---

## What you are testing

1. Open the **Datasets** sidebar in JupyterLab.
2. Select a dataset.
3. Click **Copy snippet**.
4. Paste into any notebook cell and run.

Expected clipboard content (pandas format):

```python
from notebooks_data import Dataset

loaded_dataset = Dataset.get("Test_Dataset").read_table(format="pandas")
loaded_dataset.head()
```

Notes:

- Copy snippet works when a **dataset is selected** (notebook selection is **not** required).
- `.head()` is included for `pandas` only; `numpy` format omits it.

---

## Option A — Local testing (recommended first)

Fastest path. No Notebooks Hub required.

### Prerequisites

- Python 3.10+
- Node.js and npm
- Repos cloned:
  - `jupyterlab-extensions/jupyter-dataset` (this directory)

### One-time setup

```bash
cd ~/Projects/jupyterlab-extensions/jupyter-dataset

python3 -m venv .venv
source .venv/bin/activate

# Old pip can fail on editable install — upgrade first
python -m pip install --upgrade pip setuptools wheel
pip install -e ".[test]"
pip install jupyterlab
npm install
npm run build
```

### Create local sample datasets

The extension reads datasets from `JUPYTER_DATASET_ROOT` (defaults to `.sample-datasets/`). Each dataset is a **folder** containing CSV/TSV/Parquet/JSON files:

```bash
mkdir -p .sample-datasets/Test_Dataset .sample-datasets/education

cat > .sample-datasets/Test_Dataset/data.csv <<'EOF'
id,name,value
1,alpha,10.5
2,beta,22.0
3,gamma,8.75
EOF

cp education.csv .sample-datasets/education/education.csv
```

(`.sample-datasets/` is gitignored — create this locally on each machine.)

### Start JupyterLab

```bash
./run-jupyterlab-test.sh
```

This script:

1. Runs `npm install` and `npm run build`
2. Links the frontend with `jupyter labextension develop`
3. Enables the server extension
4. Starts JupyterLab with `JUPYTER_DATASET_ROOT=.sample-datasets`

### Local test checklist

- [ ] Left sidebar shows **Datasets**
- [ ] Click **Refresh** → status shows datasets loaded
- [ ] `Test_Dataset` tile appears
- [ ] Click **Test_Dataset** → **Copy snippet** button becomes enabled (blue)
- [ ] Click **Copy snippet** → success message in status area
- [ ] Paste into a new notebook cell → snippet matches expected format above
- [ ] Run the cell → data loads without error

---

## Option B — Notebooks Hub testing (full integration)

Use this to test in the same environment users will eventually have in production.

### Prerequisites

- Docker Desktop running
- Node.js ≥ 22
- Both repos cloned:
  - `~/Projects/notebooks-hub`
  - `~/Projects/jupyterlab-extensions/jupyter-dataset`

### 1. Build the extension

```bash
cd ~/Projects/jupyterlab-extensions/jupyter-dataset
source .venv/bin/activate   # or create venv as in Option A
npm run build
```

The `polusai/notebook` image does **not** include `jupyter-dataset` yet. You must install the extension into the running JupyterLab container (see step 5).

### 2. Configure Notebooks Hub env files

```bash
cd ~/Projects/notebooks-hub

cp deploy/Compose/.env.example deploy/Compose/.env
cp packages/API/.env.example packages/API/.env
```

Edit `packages/API/.env` and replace `<repo-root>` with your actual path, for example:

```
MODULE_LOCATION='/Users/you/Projects/notebooks-hub/deploy/Compose/Volumes/modules'
NOTEBOOK_LOCATION='/Users/you/Projects/notebooks-hub/packages/API/opt/notebooks'
GROUP_LOCATION='/Users/you/Projects/notebooks-hub/deploy/Compose/Volumes/groups'
DATASET_LOCATION='/Users/you/Projects/notebooks-hub/deploy/Compose/Volumes/datasets'
SECRETS_LOCATION='/Users/you/Projects/notebooks-hub/deploy/Compose/Volumes/secrets'
```

Install dependencies once:

```bash
npm install
```

### 3. Start Notebooks Hub (3 terminals)

All commands from `~/Projects/notebooks-hub`.

**Terminal 1 — infrastructure**

```bash
bash deploy/Compose/launch-notebooks-hub.sh -m dev
```

Wait until OpenFGA init succeeds.

**Terminal 2 — API**

```bash
npm run start:api
```

**Terminal 3 — UI**

```bash
npm run start:ui
```

Open http://localhost:4200

### 4. Log in

The UI requires OIDC auth. Two approaches:

#### Approach A — Keycloak mode (official)

From `notebooks-hub` repo root:

```bash
bash deploy/Compose/launch-notebooks-hub.sh -m node      # first time only
bash deploy/Compose/launch-notebooks-hub.sh -m keycloak
```

Then log in at http://localhost:4200 with:

- **Username:** `polusUser1`
- **Password:** `password1`

See [notebooks-hub deploy/Compose/README.md](https://github.com/PolusAI/notebooks-hub/blob/main/deploy/Compose/README.md#keycloak--local-stack--keycloak).

#### Approach B — Dev mode + Keycloak sidecar

If using `-m dev`, blank `SERVICES_AUTH_*` in `.env` causes login failures (`Invalid OIDC issuer URL: undefined`). Add Keycloak manually:

```bash
cd ~/Projects/notebooks-hub/deploy/Compose
docker compose --env-file .env \
  -f ./Projects/docker-compose.notebooks-hub.yml \
  -f ./Projects/docker-compose.notebooks-hub-keycloak.yml \
  -p notebooks-hub --profile keycloak up -d keycloak
```

Set these in `packages/API/.env`:

```
SERVICES_AUTH_URL='http://localhost:8082/realms'
SERVICES_AUTH_BROWSER_URL='http://localhost:8082'
SERVICES_AUTH_TENANT='realm'
SERVICES_AUTH_CLIENT_ID='client'
SERVICES_AUTH_CLIENT_SECRET=''
SERVICES_AUTH_REDIRECT_URL='http://localhost:4200'
```

Restart the API (`npm run start:api`), then log in with `polusUser1` / `password1`.

### 5. Launch JupyterLab with a dataset attached

1. In Notebooks Hub UI → **Servers**
2. **Launch** a JupyterLab server
3. When prompted, **attach a dataset** (e.g. `Test_dataset`)
4. Open the JupyterLab tab from Hub

### 6. Install the extension into the running container

The base notebook image does not ship with `jupyter-dataset`. Use the local install helper (gitignored, lives next to this file):

```bash
cd ~/Projects/jupyterlab-extensions/jupyter-dataset
./install-into-notebooks-hub.sh
```

This script:

1. Finds the running `jupyter-*` container
2. Copies and `pip install`s the extension
3. Enables server + lab extensions
4. Restarts the container

Then **hard-refresh** JupyterLab in the browser (`Cmd+Shift+R`).

> **Important:** Stopping and relaunching JupyterLab from Hub creates a **new container** from the base image. Re-run `./install-into-notebooks-hub.sh` after each relaunch until the extension is baked into the notebook image.

### 7. Ensure datasets are visible in the sidebar

The extension reads from `JUPYTER_DATASET_ROOT` (default: `/opt/datasets`). In Hub, datasets should be bind-mounted when you attach them at server launch.

**Known dev-mode issue:** `DATASETS_HOST_PATH` is exported by the launch script but may not reach the JupyterHub container in `-m dev`, so `/opt/datasets` can be empty even when a dataset is attached in the UI.

**Workaround — copy test data into the container:**

```bash
# Find your container
docker ps --filter "name=jupyter-"

CONTAINER=<your-jupyter-container-name>

# Create dataset folder and copy a CSV
docker exec -u root "$CONTAINER" mkdir -p /opt/datasets/Test_dataset
docker cp ~/Projects/jupyterlab-extensions/jupyter-dataset/.sample-datasets/Test_Dataset/data.csv \
  "$CONTAINER:/opt/datasets/Test_dataset/data.csv"

docker exec "$CONTAINER" ls -la /opt/datasets/Test_dataset/
```

Alternatively, place files under:

```
notebooks-hub/deploy/Compose/Volumes/datasets/<dataset-id>/data.csv
```

Then relaunch the server (and re-install the extension if the container was recreated).

### 8. Hub test checklist

- [ ] Log in to http://localhost:4200
- [ ] Launch JupyterLab server with a dataset attached
- [ ] Run `./install-into-notebooks-hub.sh` and hard-refresh
- [ ] **Datasets** appears in the left sidebar
- [ ] Click **Refresh** — no HTML/404 error in the status area
- [ ] Dataset tile appears (e.g. `Test_dataset`)
- [ ] Select dataset → **Copy snippet** enabled
- [ ] Copy → paste → run in notebook

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|--------|--------------|-----|
| Sidebar empty / "No datasets found" | No data under dataset root | Create `.sample-datasets/` locally, or copy CSVs to `/opt/datasets/<name>/` in Hub |
| Status shows raw HTML / 404 | Server extension routes not loaded | Re-run `install-into-notebooks-hub.sh`, restart container, relaunch JupyterLab from Hub |
| Login fails / OIDC error | Auth not configured in dev mode | Use Keycloak mode or set `SERVICES_AUTH_*` (see step 4) |
| Copy snippet button disabled | No dataset selected | Click a dataset tile first |
| "Copy snippet" text looks broken | Old labextension build cached | Rebuild (`npm run build`), reinstall extension, hard-refresh browser |
| Extension missing after Hub relaunch | New container from base image | Re-run `./install-into-notebooks-hub.sh` |
| `pip install` fails with dynamic `description` error | Old pip version | `python -m pip install --upgrade pip setuptools wheel` |
| API fails on start | `<repo-root>` placeholders in `.env` | Replace with absolute paths in `packages/API/.env` |

---

## Quick reference — URLs and credentials

| Service | URL |
|---------|-----|
| Notebooks Hub UI | http://localhost:4200 |
| Notebooks Hub API | http://localhost:8002 |
| JupyterHub | http://localhost:8000 |
| Keycloak (if used) | http://localhost:8082 |

| Credential | Value |
|------------|-------|
| Keycloak test user | `polusUser1` / `password1` |

---

