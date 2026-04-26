# Smart Bus Tracker - Deployment Guide

For the best performance and ease of use, we will deploy the **Frontend on Vercel** and the **Backend on Render**.

---

## 1. Backend Deployment (Render)

1.  **Login** to [Render](https://render.com) → click **"New +"** → **"Web Service"**.
2.  Connect your GitHub repository.
3.  **App Settings**:
    *   **Name**: `bus-tracker-backend`
    *   **Root Directory**: `backend`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    *   `PORT`: `10000`
    *   `MONGODB_URI`: *Your MongoDB connection string*
    *   `JWT_SECRET`: *A secure random string*
    *   `FRONTEND_URL`: `https://YOUR-Vercel-URL.vercel.app` (Update this AFTER you deploy to Vercel)

---

## 2. Frontend Deployment (Vercel)

1.  **Login** to [Vercel](https://vercel.com) → click **"Add New"** → **"Project"**.
2.  Import your GitHub repository.
3.  **Project Settings**:
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: `frontend`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
4.  **Environment Variables**:
    *   Add `VITE_API_URL`: `https://bus-tracker-backend.onrender.com` (Your actual Render backend URL)

---

## 3. Important: Post-Deployment Steps
1.  **CORS Setup**: Once Vercel gives you your frontend URL (e.g., `https://track-my-bus.vercel.app`), go back to your **Render Backend Environment Variables** and update `FRONTEND_URL` to match it exactly.
2.  **Verify**: If the dashboard/login works, your setup is complete!
