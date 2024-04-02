const app = require("./src/app");

const PORT = process.env.PORT;

app.listen(PORT, (error) => {
  if(!error)
      console.log("Server is Successfully Running, and App is listening on port "+ PORT)
  else 
      console.log("Error occurred, server can't start", error);
  }
);