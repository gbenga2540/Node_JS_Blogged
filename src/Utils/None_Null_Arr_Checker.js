module.exports = (check) => {
    return check === "" || check === null || check === undefined || check === [] || check === "[]";
}