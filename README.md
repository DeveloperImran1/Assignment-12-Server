## Website Name: TouristBook

A dynamic website for exploring and booking tourist spots with detailed information and secure user authentication. Users can find and book their favorite tourist destinations.

## Credential:

**Moderator or TourGuide Email, Password**
**Email: moderator@moderator.com**
**Password: aaaaaaA**

**Admin Email and password**
**Email:** admin@admin.com
**Password:** aaaaaaA

## Live Site URL:
Visit the live site at [TouristBook Live](https://touristbook.netlify.app/)

## Features and Characteristics:

- **Secure User Authentication:** Ensure user data protection and privacy with secure login and logout functionalities.
- **Spot Listings with Images:** Browse various tourist spots, each accompanied by high-quality images showcasing the destination.
- **Comprehensive Spot Details:** Each tourist spot page provides detailed information including descriptions, attractions, and historical significance.
- **Transparent Pricing:** Display transparent pricing for tour packages, allowing users to choose options that fit their budget.
- **Tour Guide Assignment:** Automatically assign a knowledgeable tour guide to enhance the travel experience when a user selects a spot.
- **Seamless Payment Methods:** Offer seamless and secure payment methods for easy and safe tour bookings.
- **User Reviews:** Allow users to leave reviews and ratings after visiting a spot, helping others make informed decisions.
- **Community Section:** Engage in a vibrant community section where users can share posts, stories, and travel experiences.
- **Interactive Community Engagement:** Comment, like, and share community posts to foster a social and interactive platform.
- **Responsive Support:** Provide users with the ability to contact the TouristBook support team via phone call for inquiries, assistance, or feedback, ensuring a responsive and user-friendly service.

## How to Start This Application:
1. **Clone the Repositories:**
    ```sh
    # Client Side:
    git clone https://github.com/DeveloperImran1/TouristBook-client.git
    cd Assignment-11-Client
    ```
    ```sh
    # Server Side:
    git clone https://github.com/DeveloperImran1/TouristBook-Server.git
    cd Assignment-12-Server
    ```
2. **Install Dependencies:**
    ```sh
    npm install
    ```
3. **Start the Development Server:**
    ```sh
    nodemon index.js
    ```
4. **Build for Production:**
    ```sh
    npm run build
    ```
5. **Deploy to Firebase:**
    ```sh
    firebase deploy
    ```

## Client Side Github Link:
<a href="https://github.com/DeveloperImran1/TouristBook-client">Client Code</a>

## Dependencies

- **Frontend:**
  - React: A JavaScript library for building user interfaces.
  - React Router: Declarative routing for React applications.
  - Axios: Promise-based HTTP client for the browser and Node.js.
  - React Query: Hooks for fetching, caching, and updating asynchronous data in React.
  - SweetAlert2: Beautiful, responsive, customizable replacement for JavaScript's popup boxes.
  - React-Hot-Toast: Beautiful, responsive, customizable replacement for JavaScript's notification/alert.
  - Tailwind CSS: A utility-first CSS framework for rapid UI development.
  - Headless UI: Unstyled, fully accessible UI components for React.

- **Backend:**
  - Express: Fast, unopinionated, minimalist web framework for Node.js.
  - MongoDB: NoSQL database for storing application data.
  - Mongoose: Elegant MongoDB object modeling for Node.js.
  - Cors: Middleware for enabling Cross-Origin Resource Sharing.
  - Dotenv: Module to load environment variables from a `.env` file.

## Additional Information

- **Environment Variables:**
  - Create a `.env.local` file in the root of your client project and add the following variables:
    ```plaintext
    VITE_APIKEY=Your firebase config file
    VITE_AUTHDOMAIN=Your firebase config file
    VITE_PROJECTID=Your firebase config file
    VITE_STORAGEBUCKET=Your firebase config file
    VITE_MESSAGINGSENDERID=Your firebase config file
    VITE_APPID=Your firebase config file
    VITE_SERVER='http://localhost:5000'
    VITE_IMG_KEY=your imageBB Api key
    ```
  - Create a `.env` file in the root of your server project and add the following variables:
    ```plaintext
    DB_USER=your database username in MongoDB
    DB_PASS=your database password in MongoDB
    ```

- **Folder Structure:**
  - `client/`: Contains the React frontend code.
  - `server/`: Contains the Express backend code.

## Contributing

If you'd like to contribute to this project, please fork the repository and use a feature branch. Pull requests are welcome.

## License

This project is open-source and available under the [MIT License](LICENSE).
