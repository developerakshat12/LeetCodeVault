# LeetCodeVault Setup Guide

## 🚀 Project Overview
LeetCodeVault is a full-stack app for managing, tracking, and reviewing your LeetCode solutions. It supports syncing with GitHub using the LeetHub browser extension, so your solutions and questions are automatically posted to a connected GitHub repository.

---

## 🛠️ Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Git**
- **GitHub account**
- **LeetHub browser extension** ([Chrome Web Store](https://chrome.google.com/webstore/detail/leethub/)
  or [GitHub](https://github.com/QasimWani/LeetHub))

---

## ⚡ Quick Start

### 1. **Clone the Repository**
```sh
git clone https://github.com/your-username/LeetCodeVault.git
cd LeetCodeVault
```

### 2. **Install Dependencies**
```sh
npm install
```

### 3. **Configure Environment Variables**
- Copy `.env.example` to `.env` and set your MongoDB URI:
  ```sh
  cp .env.example .env
  # Edit .env and set MONGODB_URI
  ```
- Example for local MongoDB:
  ```env
  MONGODB_URI=mongodb://localhost:27017/leetcodevault
  ```
- Example for MongoDB Atlas:
  ```env
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leetcodevault
  ```

### 4. **Seed the Database (Optional)**
```sh
npm run seed
```

### 5. **Start the App**
```sh
npm run dev
```

---

## 🔗 LeetHub + GitHub Integration

### 1. **Set Up a GitHub Repository for LeetHub**
- Create a new public or private repo on GitHub (e.g., `leetcode-solutions`)
- Copy the repo URL (e.g., `https://github.com/your-username/leetcode-solutions.git`)

### 2. **Install LeetHub Extension**
- [Chrome Web Store](https://chrome.google.com/webstore/detail/leethub/)
- [LeetHub GitHub Repo](https://github.com/QasimWani/LeetHub)

### 3. **Connect LeetHub to Your GitHub Repo**
- Open LeetCode in your browser
- Click the LeetHub extension icon
- Authorize with GitHub and select your repo (e.g., `leetcode-solutions`)
- LeetHub will automatically push your accepted solutions and question descriptions to the repo

### 4. **Sync with LeetCodeVault**
- In your LeetCodeVault app, set your GitHub repo URL and (optionally) a GitHub token in your user profile/settings
- The app will fetch your solutions and questions from the connected repo using the GitHub API
- Duplicate detection and solution management are handled automatically

---

## 📝 Example Workflow
1. Solve a problem on LeetCode
2. LeetHub pushes your solution and question to your GitHub repo
3. LeetCodeVault fetches and displays your synced solutions
4. Manage, review, and annotate your solutions in LeetCodeVault

---

## 💡 Tips
- Use a dedicated repo for LeetHub to keep your solutions organized
- You can use a GitHub personal access token for private repos (set in LeetCodeVault settings)
- The app supports both manual and GitHub-synced solutions

---

## 📚 Resources
- [LeetHub Extension](https://github.com/QasimWani/LeetHub)
- [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## 🛠️ Troubleshooting
- If you have issues with MongoDB connection, check your `.env` and network/firewall settings
- For LeetHub sync issues, ensure the extension is authorized and the repo is selected
- For GitHub API rate limits, use a personal access token

---


## © 2025 LeetCodeVault
