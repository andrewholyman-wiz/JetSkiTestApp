# Civitas Studio — Interactive 3D Small City Designer

A high-performance Three.js + Vite interactive 3D small-city designer built for hardened Kubernetes deployment and secured end-to-end with **Wiz**.

## Features
- **Auto-Connecting Streets:** Car streets (with lanes, zebra crosswalks, streetlamps, and animated traffic) and **Car-Free Pedestrian Streets** (cobblestone/brick/sandstone paving, cycle tracks, bollards at car-road borders, and animated cyclists, walkers & dog walkers).
- **Customizable High-Rises & Density:** Dedicated **Residential High-Rises (10–60 stories)**, **Office High-Rises (4–60 stories)**, **Apartments (2–24 stories)**, Townhouses, and Shops — all with interactive **Low / Med / High / Ultra density** controls that dynamically reshape lot coverage, twin-tower/slab massing, facade bay rhythm, and live resident/job capacity.
- **Real-Time Rendering & Performance:** Morning/Day/Dusk/Night illumination, Iso/Street/Plan camera presets, Fast/Balanced/High quality presets with live FPS/draw-call counter, Undo/Redo, JSON Export/Import, and PNG Snapshots.
- **Security Hardening:** Multi-stage Docker build producing a minimal non-root (`UID 101`) Nginx container with `readOnlyRootFilesystem: true`, Pod Security Standards (`restricted`), WizCLI IaC + Container Image scanning, and **Nginx HTTP Basic Authentication** backed by Kubernetes Secret `demo-app/civitas-basic-auth` (zero credentials stored in Git or the container image).

## Local Development
```bash
npm install
npm run dev
```
