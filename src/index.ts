

import { app } from "./app.js";
import { connectDB } from "./db/index.js";

const PORT = process.env.PORT || 5004

console.log("server is starting")

connectDB().catch((err) => console.log(err)).then(() => {

    app.listen(PORT, () => {
        console.log("Server running at PORT dffdsfdsfsa: ", process.env.PORT);
    }).on("error", (error) => {
        // gracefully handle errorddd
        throw new Error(error.message);
    });

})


