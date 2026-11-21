# TARSCO Robotics Club Platform

The official digital platform for the TARSCO Robotics Club (TRC), Tarkwa, Ghana.

## Technology
- Node.js and Express
- Static HTML, CSS and JavaScript frontend
- LowDB JSON data store
- JWT authentication and bcrypt password hashing
- Multer uploads

## Local setup
1. Install Node.js 18 or later.
2. Copy `.env.example` to `.env` and set a strong `JWT_SECRET`.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

The first run creates the local database and seeds the initial administrator account. Change the default credentials and set a secure JWT secret before making the platform public.

## Brand direction
TRC uses the club crest's forest-green, gold and white palette. The UI is designed around the motto **Innovate. Build. Inspire.** Existing learning, project, event and community areas are retained as the platform is expanded.
