module.exports = ({ email }) => {
    const validator = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return validator.test(email);
};
