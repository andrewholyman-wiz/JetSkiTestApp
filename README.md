# Civitas Studio — Interactive 3D Small City Designer

A high-performance Three.js + Vite interactive 3D small-city designer built for hardened Kubernetes deployment and secured end-to-end with **Wiz**.

## Features
- **Auto-Connecting Streets:** Car streets (with lanes, zebra crosswalks, streetlamps, and animated traffic) and **Car-Free Pedestrian Streets** (cobblestone/brick/sandstone paving, cycle tracks, bollards at car-road borders, and animated cyclists, walkers & dog walkers).
- **Customizable High-Rises & Density:** Dedicated **Residential High-Rises (10–60 stories)**, **Office High-Rises (4–60 stories)**, **Apartments (2–24 stories)**, Townhouses, and Shops — all with interactive **Low / Med / High / Ultra density** controls that dynamically reshape lot coverage, twin-tower/slab massing, facade bay rhythm, and live resident/job capacity.
- **Real-Time Rendering & Performance:** Morning/Day/Dusk/Night illumination, Iso/Street/Plan camera presets, Fast/Balanced/High quality presets with live FPS/draw-call counter, Undo/Redo, JSON Export/Import, and PNG Snapshots.
- **Parking, Transit & Retail Expansion:** Multi-level **Parking Structures (2–10 levels)** with open decks, solar canopies, rooftop parks, and illuminated `P` signage; paintable **Surface Parking Lots** (standard, EV fast-charger, tree-island eco); **Major Grocery Stores** (supermarket, organic market hall, supercenter); **Standalone Retail** (retail strip, big-box, department store, pharmacy drive-thru, bistro diner); **EV Hub & Service Stations**; and **Transit & Mobility Hubs** (Metro, BRT, bike-share).
- **Security Hardening:** Multi-stage Docker build producing a minimal non-root (`UID 101`) Nginx container (`civitas`) with `readOnlyRootFilesystem: true`, Pod Security Standards (`restricted`), WizCLI IaC + Container Image scanning, and **Nginx HTTP Basic Authentication** backed by Kubernetes Secret `demo-app/civitas-basic-auth` (zero credentials stored in Git or the container image).

## Local Development
```bash
npm install
npm run dev
```

## CI/CD & Wiz Code-to-Cloud (GitHub Actions)
The workflow in `.github/workflows/ci-cd.yml` runs on pushes/PRs to `main` and manual dispatch:
1. **WizCLI Repo / IaC Scan** — scans source code, IaC (`k8s/deployment.yaml`), secrets, and SAST.
2. **Build, Push & WizCLI Container Scan** — builds with Docker Buildx, embeds OCI manifest annotations (`org.opencontainers.image.source` Dockerfile permalink + `org.opencontainers.image.revision`), pushes to GHCR (or GCP Artifact Registry once configured), scans the pulled registry digest with `wizcli scan container-image --dockerfile Dockerfile`, and tags the digest with `wizcli tag --digest=...`.
3. **Deploy to GKE** — automatically activates once GCP/GKE variables are set, deploying the immutable digest-pinned image.

### Repository Secrets & Variables
| Kind | Name | Purpose |
| :--- | :--- | :--- |
| Secret | `WIZ_CLIENT_ID`, `WIZ_CLIENT_SECRET` | Wiz Service Account for WizCLI scanning & C2C digest tagging |
| Variable (GCP TBD) | `GCP_ARTIFACT_REGISTRY` | Switches image pushes from GHCR to Artifact Registry (e.g. `us-central1-docker.pkg.dev/<project>/<repo>`) |
| Variable (GCP TBD) | `GCP_PROJECT_ID`, `GKE_CLUSTER`, `GKE_LOCATION` | Enables digest-pinned deployment to GKE |
| Variable / Secret (GCP TBD) | `GCP_WIF_PROVIDER` + `GCP_WIF_SERVICE_ACCOUNT` (or secret `GCP_SA_KEY`) | Authenticates GitHub Actions to GCP |
