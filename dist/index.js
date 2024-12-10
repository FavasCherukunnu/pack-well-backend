import { app } from "./app.js";
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log("Server running at PORT dffdsfdsfsa: ", process.env.PORT);
}).on("error", (error) => {
    // gracefully handle errorddd
    throw new Error(error.message);
});
