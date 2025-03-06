# MERN-fitness-app 

This project is a full-stack application that allows users to enter a workout record and saves it on a remote MONGOdb atlas cluster. The app also orders and filters the workouts by date. 

## Live Application

You can access the live application here: [MERN-fitness-app](https://mern-fitness-app-production.up.railway.app/)

## Project Structure

```
MERN-fitness-app /
├── frontend/     # React frontend
├── backend/      # Express.js backend
├── .env          # Environment variables
└── railway.json  # Railway deployment configuration
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.x recommended)
- npm (comes with Node.js)
- [express.js](https://expressjs.com/)
- mongoDB for visual studio(visual studio extension)
- [react.js] (https://react.dev/learn/installation)
- [nodemon](npm install nodemon)
- [date-picker](npm install react-datepicker)
- [recharts](npm install recharts)

## Setup

1. Clone the repository:
   ```bash
   git clone https://https://github.com/Nightfall2318/MERN-fitness-app.git
   cd MERN-fitness-app
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   cd frontend && npm install
   cd ../server && npm install


## Running the Application Locally

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to use the application.

