# City and Timezone Information API

---

![image](./img/US_City_Map_API_tndsqa.png)

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
- Database connection has to also be established

#### Postgres connection pattern
A connection string for a PostgreSQL database typically follows this pattern:

```
postgres://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

Here’s a breakdown of each component in the connection string:

- **postgres://**: This is the scheme that indicates the database type (PostgreSQL in this case).
- **USERNAME**: The username you use to access your PostgreSQL database.
- **PASSWORD**: The password for the specified username.
- **HOST**: The hostname where your PostgreSQL server is running. This could be `localhost` if the server is running on your local machine, or it could be an IP address or domain name for remote servers.
- **PORT**: The port number on which your PostgreSQL server is listening. The default port for PostgreSQL is `5432`.
- **DATABASE_NAME**: The name of the specific database you want to connect to.

### Example
Suppose you have the following database credentials:
- Username: `user123`
- Password: `securePassword`
- Host: `db.example.com`
- Port: `5432`
- Database name: `mydatabase`

Your connection string would look like this:
```
postgres://user123:securePassword@db.example.com:5432/mydatabase
```

### Usage in Node.js
In a Node.js application, you might use this connection string with a library like `pg` to connect to your PostgreSQL database. It's common to store your connection string as an environment variable to keep your credentials secure. For example:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL // Assuming DATABASE_URL is your environment variable
});

// Now you can use pool to query your database
```

### Security Note
It's important to keep your database credentials secure. Do not hard-code them in your application's source code. Instead, use environment variables or a secure secrets management system to store them, especially if your codebase is version-controlled or shared with others.

### Installation
1. Clone the repository to your local machine.
   ```
   git clone https://github.com/ovokpus/us-city-api.git
   ```
2. Navigate to the project directory.
   ```
   cd ./us-city-api
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



