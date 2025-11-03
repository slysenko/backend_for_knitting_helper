import Mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 3000;
const { connect, connection } = Mongoose;

try {
    await connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/knittingHelper");
    console.log("Connection is successfully established");
} catch (error) {
    console.log("Connection failed with error: ", error);
    process.exit(1);
}
connection.on("error", (err) => {
    console.log("oops, something happened along the way!");
    console.log("The error: ", err);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
