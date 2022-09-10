module.exports = (check) => {
    if (Array.isArray(check)) {
        return check;
    } else {
        return [];
    }
};