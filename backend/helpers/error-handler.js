function errorHandler(err, req, res, next) {
    console.log("Path: ", req.path);

    if (err.name === "UnauthorizedError") {
        return res.status(401).json({ message: "The user is not authorized" });
    }

    if (err.name === "ValidationError") {
        return res.status(401).json(err);
    }

    return res.status(500).json(err);
}

module.exports = errorHandler;
