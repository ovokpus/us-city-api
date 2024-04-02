# City and Timezone Information API

---

![image](../img/US_City_Map_API_tndsqa.png)

---

## Overview
This Node.js application serves as a backend service providing detailed information on cities and timezones. Utilizing a PostgreSQL database, the API offers endpoints for retrieving city details, population distribution, and current times across different timezones. Designed with modularity and scalability in mind, this service caters to applications requiring geographical data and time synchronization features.

## Features
- **List Cities**: Retrieve information on cities, including names and IDs.
- **Find Nearest City**: Given latitude and longitude coordinates, find the nearest city.
- **City Population Distribution**: Get the distribution of cities based on population ranges.
- **Timezone Information**: Fetch the current time across various global timezones.

## Technologies
- **Node.js**: For the runtime environment.
- **Express**: Used to set up the server and API routes.
- **PostgreSQL**: Acts as the primary database to store city and timezone data.
- **pg**: A client library for interacting with PostgreSQL from Node.js.
- **Intl**: For handling internationalization and timezone calculations.

## Getting Started
### Prerequisites
- Node.js installed on your system.
- PostgreSQL database set up and accessible.

### Installation
1. Clone the repository to your local machine.
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory.
   ```
   cd <project-directory>
   ```
3. Install the required npm packages.
   ```
   npm install
   ```
4. Set up your environment variables in a `.env` file, including your database connection string.
   ```
   DATABASE_URL=<your-database-connection-string>
   ```

### Running the Application
Start the server using npm:
```
npm start
```

## API Endpoints
| Endpoint                  | Description                                      |
|---------------------------|--------------------------------------------------|
| `GET /city`               | Lists all cities.                                |
| `GET /city/find?lat=&lng=`| Finds the nearest city to the provided coordinates. |
| `GET /state`              | Provides population distribution among states.   |
| `GET /state?page_num=&page_size=`    | Provides population distribution among states with paginated results.   |
| `GET /time`               | Lists current times across various timezones.    |
| `GET /time`               | Lists current times across various timezones.    |

## Contributing
Contributions to enhance the functionality or efficiency of this API are welcome. Please follow the standard fork-and-pull request workflow.

## License
This project is licensed under the [MIT License](LICENSE).

## Contact
For any queries or further information, please reach out to [your-email@example.com].

---



