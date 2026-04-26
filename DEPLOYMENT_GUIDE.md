# Smart Bus Tracker - Render Deployment Guide (Full Stack)

Since you want to deploy **both** on Render, we will use a **Web Service** for the backend and a **Static Site** for the frontend.

---

## 1. Backend Deployment (Web Service)

1.  **Login** to [Render](https://render.com) → click **"New +"** → **"Web Service"**.
2.  Connect your GitHub repository.
3.  **App Settings**:
    *   **Name**: `bus-tracker-backend`
    *   **Region**: Nearest to you (e.g., Singapore or Oregon)
    *   **Root Directory**: `backend`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    *   `PORT`: `10000`
    *   `MONGODB_URI`: *Your MongoDB connection string*
    *   `JWT_SECRET`: *A secure random string*
    *   `FRONTEND_URL`: `https://bus-tracker-frontend.onrender.com` (Use your actual frontend URL here)

---

## 2. Frontend Deployment (Static Site)

1.  **Click "New +"** on your Render dashboard → select **"Static Site"**.
2.  Connect the same GitHub repository.
3.  **App Settings**:
    *   **Name**: `bus-tracker-frontend`
    *   **Root Directory**: `frontend`
    *   **Build Command**: `npm run build`
    *   **Publish Directory**: `dist`
4.  **Important: Environment Variables**:
    *   Add `VITE_API_URL`: `https://bus-tracker-backend.onrender.com` (Your actual backend URL)
5.  **Redirects/Rewrites (Important for React Router)**:
    Under the **Redirects/Rewrites** tab, add a rule:
    *   **Source**: `/*`
    *   **Destination**: `/index.html`
    *   **Action**: `Rewrite` 
    *(This prevents 404 errors when you refresh pages like /login)*

---

## 3. Finishing Up
1.  Verify the backend logs show "Connected to MongoDB".
2.  Open the Frontend URL and try to login.
3.  If any feature (like Login or Sockets) fails, check that the `FRONTEND_URL` on the Backend matches your frontend URL **exactly** (including https:// and no trailing slash).
